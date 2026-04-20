const express = require('express');
const Section = require('../models/Section');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const sections = await Section.find().sort({ name: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching sections' });
  }
});

module.exports = router;
