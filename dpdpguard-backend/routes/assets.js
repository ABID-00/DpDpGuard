const express = require('express');
const router = express.Router();
const {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
  getAssetStats
} = require('../controllers/assetController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAllAssets);
router.post('/', auth, createAsset);
router.get('/stats', auth, getAssetStats);
router.get('/:id', auth, getAssetById);
router.put('/:id', auth, updateAsset);
router.delete('/:id', auth, deleteAsset);

module.exports = router;
