const Assessment = require('../models/Assessment');
const { v4: uuidv4 } = require('uuid');

exports.getAllAssessments = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { organization: req.organization };

    if (status) query.status = status;

    const assessments = await Assessment.find(query)
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: assessments.length,
      data: assessments
    });
  } catch (error) {
    next(error);
  }
};

exports.createAssessment = async (req, res, next) => {
  try {
    const assessmentId = `ASS-${uuidv4().substring(0, 8).toUpperCase()}`;

    const assessment = await Assessment.create({
      assessmentId,
      organization: req.organization,
      createdBy: req.user.id,
      status: 'Draft'
    });

    res.status(201).json({
      success: true,
      message: 'Assessment created',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssessmentById = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    if (assessment.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized access'
      });
    }

    res.json({
      success: true,
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAssessmentResponse = async (req, res, next) => {
  try {
    const { responses } = req.body;

    const assessment = await Assessment.findByIdAndUpdate(
      req.params.id,
      {
        responses,
        status: 'In Progress',
        completionPercentage: Math.ceil((responses.length / 50) * 100) // Assuming ~50 questions
      },
      { new: true }
    );

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    res.json({
      success: true,
      message: 'Assessment updated',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

exports.submitAssessment = async (req, res, next) => {
  try {
    const assessment = await Assessment.findById(req.params.id);

    if (!assessment) {
      return res.status(404).json({
        success: false,
        error: 'Assessment not found'
      });
    }

    if (assessment.responses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Assessment has no responses'
      });
    }

    // Calculate scores
    const categoryScores = calculateScores(assessment.responses);
    const readinessScore = calculateReadinessScore(categoryScores);

    assessment.status = 'Completed';
    assessment.completionPercentage = 100;
    assessment.completedAt = new Date();
    assessment.categoryScores = categoryScores;
    assessment.readinessScore = readinessScore;

    await assessment.save();

    res.json({
      success: true,
      message: 'Assessment submitted',
      data: assessment
    });
  } catch (error) {
    next(error);
  }
};

const calculateScores = (responses) => {
  const categories = {};

  responses.forEach(response => {
    if (!categories[response.category]) {
      categories[response.category] = { total: 0, count: 0 };
    }

    let score = 0;
    if (response.answer === 'Yes' || response.status === 'Evidence Available') {
      score = 100;
    } else if (response.answer === 'Partially') {
      score = 50;
    }

    categories[response.category].total += score;
    categories[response.category].count += 1;
  });

  const scores = {};
  for (const [cat, data] of Object.entries(categories)) {
    const normalizedCat = cat.toLowerCase();
    scores[normalizedCat] = Math.round(data.total / data.count);
  }

  return scores;
};

const calculateReadinessScore = (categoryScores) => {
  const weights = {
    security: 0.25,
    accesscontrol: 0.20,
    datamanagement: 0.20,
    retention: 0.15,
    vendorassurance: 0.20
  };

  let totalScore = 0;
  for (const [category, score] of Object.entries(categoryScores)) {
    const normalizedCat = category.toLowerCase().replace(/\s+/g, '');
    totalScore += score * (weights[normalizedCat] || 0.2);
  }

  return Math.round(totalScore);
};
