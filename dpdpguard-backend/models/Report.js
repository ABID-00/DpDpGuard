const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
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
  type: {
    type: String,
    enum: [
      'DPDP Readiness',
      'Asset Assurance',
      'Control Assessment',
      'Gap Analysis',
      'Vendor Assurance',
      'Action Plan',
      'Evidence History',
      'Executive Summary'
    ],
    required: true
  },
  title: String,
  assessmentDate: Date,
  reportGeneratedDate: {
    type: Date,
    default: Date.now
  },
  readinessScore: Number,
  totalAssets: Number,
  verifiedAssets: Number,
  assetsNeedingReview: Number,
  potentialGaps: Number,
  totalControls: Number,
  verifiedControls: Number,
  totalGaps: Number,
  openGaps: Number,
  resolutionRate: Number,
  summary: String,
  findings: [String],
  recommendations: [String],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  fileUrl: String,
  status: {
    type: String,
    enum: ['Draft', 'Generated', 'Reviewed', 'Archived'],
    default: 'Generated'
  },
  confidential: {
    type: Boolean,
    default: false
  },
  expiryDate: Date,
  tags: [String],
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
reportSchema.index({ organization: 1, type: 1 });
reportSchema.index({ reportGeneratedDate: -1 });

module.exports = mongoose.model('Report', reportSchema);
