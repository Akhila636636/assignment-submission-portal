const express = require('express');
const path = require('path');
const fs = require('fs');
const Submission = require('../models/Submission');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');

// ─── GET /api/files/:filename ─────────────────────────────────────────────────
// Streams PDF to the browser ONLY for:
//   - The student who submitted it
//   - The lecturer assigned to grade it
//   - An admin
router.get('/:filename', requireAuth, async (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename — reject path traversal attempts
    const safeName = path.basename(filename);
    const filePath = path.join(uploadsDir, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found or has been purged.' });
    }

    // Look up which submission owns this file
    const submission = await Submission.findOne({ pdfFilename: safeName });
    if (!submission) {
      return res.status(404).json({ message: 'No submission record for this file.' });
    }

    const userId = req.user._id.toString();
    const isOwner = submission.student.toString() === userId;
    const isLecturer = submission.lecturer.toString() === userId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isLecturer && !isAdmin) {
      return res.status(403).json({ message: 'Access denied. You do not have permission to view this file.' });
    }

    // Stream the PDF inline (renders in browser, no forced download)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('File serve error:', err);
    res.status(500).json({ message: 'Server error serving file.' });
  }
});

module.exports = router;
