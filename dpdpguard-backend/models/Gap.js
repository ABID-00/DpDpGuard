const mongoose = require('mongoose');

const gapSchema = new mongoose.Schema({
  gapId: {
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
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Verification', 'Resolved', 'Deferred'],
    default: 'Open'
  },
  affectedAssets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  affectedAssetsCount: {
    type: Number,
    default: 0
  },
  relatedControl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Control'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: Date,
  recommendedAction: String,
  evidence: String,
  remediationSteps: [String],
  severity: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  estimatedEffort: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
gapSchema.index({ organization: 1, status: 1 });
gapSchema.index({ priority: 1 });

module.exports = mongoose.model('Gap', gapSchema);
