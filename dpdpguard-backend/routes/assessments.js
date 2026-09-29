const express = require('express');
const router = express.Router();
const {
  getAllAssessments,
  createAssessment,
  getAssessmentById,
  updateAssessmentResponse,
  submitAssessment
} = require('../controllers/assessmentController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getAllAssessments);
router.post('/', auth, createAssessment);
router.get('/:id', auth, getAssessmentById);
router.put('/:id', auth, updateAssessmentResponse);
router.post('/:id/submit', auth, submitAssessment);

module.exports = router;
