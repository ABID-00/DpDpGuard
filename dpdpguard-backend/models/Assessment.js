const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  assessmentId: {
    type: String,
    required: true,
    unique: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['Draft', 'In Progress', 'Completed', 'Archived'],
    default: 'Draft'
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  readinessScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  responses: [{
    questionId: String,
    category: String,
    question: String,
    answer: String,
    evidence: String,
    status: String,
    answered: { type: Date, default: Date.now }
  }],
  categoryScores: {
    security: { type: Number, default: 0 },
    accessControl: { type: Number, default: 0 },
    dataManagement: { type: Number, default: 0 },
    retention: { type: Number, default: 0 },
    vendorAssurance: { type: Number, default: 0 }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  currentStep: {
    type: Number,
    default: 1
  },
  totalSteps: {
    type: Number,
    default: 7
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
assessmentSchema.index({ organization: 1, status: 1 });

module.exports = mongoose.model('Assessment', assessmentSchema);
