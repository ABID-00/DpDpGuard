const express = require('express');
const router = express.Router();
const {
  getAllControls,
  getControlById,
  updateControl,
  getControlStats
} = require('../controllers/controlController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAllControls);
router.get('/stats', auth, getControlStats);
router.get('/:id', auth, getControlById);
router.put('/:id', auth, updateControl);

module.exports = router;
