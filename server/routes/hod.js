const express = require('express');
const bcrypt = require('bcryptjs');
const Section = require('../models/Section');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('hod'));

// ─── GET /api/hod/sections ────────────────────────────────────────────────────
router.get('/sections', async (req, res) => {
  try {
    const sections = await Section.find({ hod: req.user._id })
      .populate('lecturers', 'fullName email')
      .populate('students', 'fullName email');
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching sections.' });
  }
});

// ─── POST /api/hod/sections ───────────────────────────────────────────────────
router.post('/sections', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Section name is required.' });

    const newSection = await Section.create({
      name,
      hod: req.user._id,
      lecturers: [],
      students: []
    });

    res.status(201).json(newSection);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Section name already exists.' });
    res.status(500).json({ message: 'Server error creating section.' });
  }
});

// ─── POST /api/hod/sections/:id/students ──────────────────────────────────────
router.post('/sections/:id/students', async (req, res) => {
  try {
    const { rollNumbers } = req.body; // e.g. "20071A0512, 20071A0513"
    if (!rollNumbers) return res.status(400).json({ message: 'Roll numbers are required.' });

    const section = await Section.findOne({ _id: req.params.id, hod: req.user._id });
    if (!section) return res.status(404).json({ message: 'Section not found.' });

    const rolls = rollNumbers.split(',').map(r => r.trim().toUpperCase()).filter(r => r);
    const addedStudents = [];

    const defaultPassword = await bcrypt.hash('Vnrvjiet@123', 12);

    for (const roll of rolls) {
      const email = `${roll}@vnrvjiet.in`.toLowerCase();
      let user = await User.findOne({ email });

      if (!user) {
        user = await User.create({
          fullName: `Student ${roll}`,
          email,
          password: defaultPassword,
          role: 'student'
        });
      }

      if (!section.students.includes(user._id)) {
        section.students.push(user._id);
        addedStudents.push(user);
      }
    }

    await section.save();

    res.json({ message: `Successfully added ${addedStudents.length} students.`, section });
  } catch (err) {
    console.error('Bulk add students error:', err);
    res.status(500).json({ message: 'Server error adding students.' });
  }
});

module.exports = router;
