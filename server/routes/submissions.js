const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
router.use(requireAuth);

// ─── Multer Configuration ─────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    // Unique name: userId_assignmentId_timestamp.pdf
    const unique = `${req.user._id}_${Date.now()}`;
    cb(null, `${unique}.pdf`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are accepted.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ─── GET /api/submissions ─────────────────────────────────────────────────────
// Student: their own submissions only
// Lecturer: all submissions for their assignments
// Admin: all submissions
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
    } else if (req.user.role === 'lecturer') {
      query.lecturer = req.user._id;
    }

    const submissions = await Submission.find(query)
      .populate('student', 'fullName email')
      .populate('assignment', 'title deadline')
      .populate('lecturer', 'fullName email')
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (err) {
    console.error('Get submissions error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── GET /api/submissions/archive ────────────────────────────────────────────
// All logged-in users can browse archived metadata (no PDF links returned)
router.get('/archive', async (req, res) => {
  try {
    const archived = await Submission.find({ status: 'archived' })
      .populate('student', 'fullName')
      .populate('assignment', 'title')
      .select('projectTitle abstract student assignment submittedAt')
      .sort({ submittedAt: -1 });

    res.json(archived);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching archive.' });
  }
});

// ─── GET /api/submissions/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'fullName email')
      .populate('assignment', 'title deadline instructions')
      .populate('lecturer', 'fullName email');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Access control: student (owner), lecturer (assigned), or admin
    const isOwner = submission.student._id.toString() === req.user._id.toString();
    const isLecturer = submission.lecturer._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isLecturer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/submissions ────────────────────────────────────────────────────
// Student submits (or resubmits before deadline)
router.post(
  '/',
  requireRole('student'),
  upload.single('pdf'),
  async (req, res) => {
    try {
      const { assignmentId, projectTitle, abstract } = req.body;

      if (!assignmentId || !projectTitle || !abstract) {
        // Clean up uploaded file if validation fails
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Assignment ID, project title, and abstract are required.' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'PDF file is required.' });
      }

      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Assignment not found.' });
      }

      // Enforce deadline
      if (new Date() > new Date(assignment.deadline)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'The deadline for this assignment has passed.' });
      }

      // Check if student already submitted — if so, delete old PDF and update
      const existing = await Submission.findOne({
        assignment: assignmentId,
        student: req.user._id,
      });

      if (existing) {
        // Delete old PDF file if it exists
        if (existing.pdfFilename) {
          const oldPath = path.join(uploadsDir, existing.pdfFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        existing.projectTitle = projectTitle;
        existing.abstract = abstract;
        existing.pdfFilename = req.file.filename;
        existing.submittedAt = new Date();
        existing.grade = null;
        existing.status = 'pending';
        await existing.save();

        return res.json({ message: 'Submission updated successfully.', submission: existing });
      }

      // New submission
      const submission = await Submission.create({
        assignment: assignmentId,
        student: req.user._id,
        lecturer: assignment.createdBy,
        projectTitle,
        abstract,
        pdfFilename: req.file.filename,
      });

      res.status(201).json({ message: 'Submission successful.', submission });
    } catch (err) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      console.error('Submission error:', err);
      res.status(500).json({ message: 'Server error during submission.' });
    }
  }
);

// ─── PATCH /api/submissions/:id/grade ────────────────────────────────────────
router.patch('/:id/grade', requireRole('lecturer'), async (req, res) => {
  try {
    const { grade } = req.body;

    if (!grade || grade.trim() === '') {
      return res.status(400).json({ message: 'Grade is required.' });
    }

    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found.' });
    }

    // Only the assigned lecturer can grade
    if (submission.lecturer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You are not the assigned lecturer for this submission.' });
    }

    submission.grade = grade.trim();
    submission.status = 'graded';
    await submission.save();

    res.json({ message: 'Grade saved.', submission });
  } catch (err) {
    console.error('Grade error:', err);
    res.status(500).json({ message: 'Server error saving grade.' });
  }
});

module.exports = router;
