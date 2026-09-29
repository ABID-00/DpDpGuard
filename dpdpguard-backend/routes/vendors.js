const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Vendor = require('../models/Vendor');
const { v4: uuidv4 } = require('uuid');

router.get('/', auth, async (req, res, next) => {
  try {
    const vendors = await Vendor.find({ organization: req.organization })
      .sort({ createdAt: -1 });
    res.json({ success: true, count: vendors.length, data: vendors });
  } catch (error) {
    next(error);
  }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const vendorId = `VEND-${uuidv4().substring(0, 8).toUpperCase()}`;
    const vendor = await Vendor.create({
      ...req.body,
      vendorId,
      organization: req.organization
    });
    res.status(201).json({ success: true, message: 'Vendor created', data: vendor });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not found' });
    }
    res.json({ success: true, data: vendor });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Vendor updated', data: vendor });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
