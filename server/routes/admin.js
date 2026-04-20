const express = require('express');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Submission = require('../models/Submission');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');

// All admin routes require auth + admin role
router.use(requireAuth);
router.use(requireRole('admin'));

// ─── GET /api/admin/users ─────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// ─── POST /api/admin/users ────────────────────────────────────────────────────
router.post('/users', async (req, res) => {
  try {
    const { fullName, email, password, role, department } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({ message: 'Full name, email, password, and role are required.' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      department: department || 'Computer Science & Engineering',
    });

    res.status(201).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
    });
  } catch (err) {
    console.error('Admin create user error:', err);
    res.status(500).json({ message: 'Server error creating user.' });
  }
});

// ─── PUT /api/admin/users/:id ─────────────────────────────────────────────────
router.put('/users/:id', async (req, res) => {
  try {
    const { fullName, role, department } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (fullName) user.fullName = fullName;
    if (role) user.role = role;
    if (department) user.department = department;

    await user.save();
    res.json({ message: 'User updated.', user: { id: user._id, fullName: user.fullName, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error updating user.' });
  }
});

// ─── DELETE /api/admin/users/:id ─────────────────────────────────────────────
router.delete('/users/:id', async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

// ─── POST /api/admin/archive ──────────────────────────────────────────────────
// Moves all pending/graded submissions to 'archived' status
router.post('/archive', async (req, res) => {
  try {
    const result = await Submission.updateMany(
      { status: { $in: ['pending', 'graded'] } },
      { $set: { status: 'archived' } }
    );

    res.json({
      message: `Archive complete. ${result.modifiedCount} submissions archived.`,
      archivedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('Archive error:', err);
    res.status(500).json({ message: 'Server error during archive.' });
  }
});

// ─── POST /api/admin/purge ────────────────────────────────────────────────────
// Permanently deletes all PDF files for archived submissions
// The project title + abstract remain in the database forever
router.post('/purge', async (req, res) => {
  try {
    const archivedSubmissions = await Submission.find({
      status: 'archived',
      pdfFilename: { $ne: null },
    });

    let deletedCount = 0;
    let failedCount = 0;

    for (const sub of archivedSubmissions) {
      const filePath = path.join(uploadsDir, sub.pdfFilename);
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
        sub.pdfFilename = null;
        await sub.save();
      } catch (fileErr) {
        console.error(`Failed to delete file: ${sub.pdfFilename}`, fileErr);
        failedCount++;
      }
    }

    res.json({
      message: `Purge complete. ${deletedCount} PDF(s) deleted. ${failedCount} failure(s).`,
      deletedCount,
      failedCount,
    });
  } catch (err) {
    console.error('Purge error:', err);
    res.status(500).json({ message: 'Server error during purge.' });
  }
});

module.exports = router;
