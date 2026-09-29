const express = require('express');
const router = express.Router();
const { getDashboard, getReadinessTrend } = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getDashboard);
router.get('/trend', auth, getReadinessTrend);

module.exports = router;
