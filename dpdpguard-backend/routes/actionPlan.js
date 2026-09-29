const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ActionPlan = require('../models/ActionPlan');

router.get('/', auth, async (req, res, next) => {
  try {
    const actions = await ActionPlan.find({ organization: req.organization })
      .sort({ dueDate: 1, priority: 1 });
    res.json({ success: true, data: actions });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const action = await ActionPlan.findById(req.params.id);
    if (!action) {
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    res.json({ success: true, data: action });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const action = await ActionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Action updated', data: action });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
