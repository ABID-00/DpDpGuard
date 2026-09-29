const express = require('express');
const router = express.Router();
const {
  getAllGaps,
  createGap,
  getGapById,
  updateGap,
  updateGapStatus,
  getGapStats,
  deleteGap
} = require('../controllers/gapController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAllGaps);
router.post('/', auth, createGap);
router.get('/stats', auth, getGapStats);
router.get('/:id', auth, getGapById);
router.put('/:id', auth, updateGap);
router.patch('/:id/status', auth, updateGapStatus);
router.delete('/:id', auth, deleteGap);

module.exports = router;
