const express = require('express');
const router = express.Router();
const { getScoring } = require('../controllers/scoringController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getScoring);

module.exports = router;