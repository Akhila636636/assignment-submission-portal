const express = require('express');
const Assignment = require('../models/Assignment');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ─── GET /api/assignments ─────────────────────────────────────────────────────
// Students: all assignments (to know what to submit)
// Lecturers: only their own assignments
// Admin: all assignments
router.get('/', async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'lecturer') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'student') {
      const Section = require('../models/Section');
      const section = await Section.findOne({ students: req.user._id });
      if (section) {
        query.section = section._id;
      } else {
        // If student is not in a section, they see no assignments
        return res.json([]);
      }
    }

    const assignments = await Assignment.find(query)
      .populate('createdBy', 'fullName email')
      .populate('section', 'name')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ message: 'Server error fetching assignments.' });
  }
});

// ─── GET /api/assignments/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('section', 'name');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    res.json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── POST /api/assignments ────────────────────────────────────────────────────
router.post('/', requireRole('lecturer'), async (req, res) => {
  try {
    const { title, instructions, deadline, section } = req.body;

    if (!title || !instructions || !deadline || !section) {
      return res.status(400).json({ message: 'Title, instructions, section, and deadline are required.' });
    }

    const assignment = await Assignment.create({
      title,
      instructions,
      deadline: new Date(deadline),
      createdBy: req.user._id,
      section,
    });

    const populated = await assignment.populate([{ path: 'createdBy', select: 'fullName email' }, { path: 'section', select: 'name' }]);
    res.status(201).json(populated);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ message: 'Server error creating assignment.' });
  }
});

// ─── PATCH /api/assignments/:id ───────────────────────────────────────────────
router.patch('/:id', requireRole('lecturer'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    // Lecturers can only edit their own assignments
    if (assignment.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own assignments.' });
    }

    const { title, instructions, deadline } = req.body;
    if (title) assignment.title = title;
    if (instructions) assignment.instructions = instructions;
    if (deadline) assignment.deadline = new Date(deadline);

    await assignment.save();
    res.json(assignment);
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ message: 'Server error updating assignment.' });
  }
});

// ─── DELETE /api/assignments/:id ──────────────────────────────────────────────
router.delete('/:id', requireRole(['lecturer', 'admin']), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    if (
      req.user.role === 'lecturer' &&
      assignment.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'You can only delete your own assignments.' });
    }

    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting assignment.' });
  }
});

module.exports = router;
