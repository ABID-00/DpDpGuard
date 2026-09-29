const mongoose = require('mongoose');

const actionPlanSchema = new mongoose.Schema({
  actionId: {
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
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Verification', 'Resolved'],
    default: 'Open'
  },
  relatedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  relatedControl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Control'
  },
  relatedGap: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gap'
  },
  ownerUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ownerName: String,
  dueDate: Date,
  assignedTo: String,
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  completionDate: Date,
  estimatedEffort: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  successCriteria: String,
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for faster queries
actionPlanSchema.index({ organization: 1, status: 1 });
actionPlanSchema.index({ dueDate: 1 });

module.exports = mongoose.model('ActionPlan', actionPlanSchema);
