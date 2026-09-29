const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Report = require('../models/Report');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, async (req, res, next) => {
  try {
    const reports = await Report.find({ organization: req.organization })
      .sort({ reportGeneratedDate: -1 });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const reportId = `RPT-${uuidv4().substring(0, 8).toUpperCase()}`;
    const report = await Report.create({
      ...req.body,
      reportId,
      organization: req.organization,
      generatedBy: req.user.id
    });
    res.status(201).json({ success: true, message: 'Report created', data: report });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
