const mongoose = require('mongoose');

const controlSchema = new mongoose.Schema({
  controlId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Security', 'Access', 'Data Management', 'Retention', 'Vendor Assurance', 'Governance'],
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    index: true
  },
  status: {
    type: String,
    enum: ['Evidence Verified', 'Needs Review', 'Potential Gap', 'Evidence Not Available'],
    default: 'Evidence Not Available'
  },
  evidenceCount: {
    type: Number,
    default: 0
  },
  totalAssets: {
    type: Number,
    default: 0
  },
  verifiedAssets: {
    type: Number,
    default: 0
  },
  lastReviewed: Date,
  associatedAssets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  }],
  weightage: {
    type: Number,
    default: 1,
    min: 0.5,
    max: 2
  },
  criticality: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  owner: String,
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
controlSchema.index({ organization: 1, category: 1 });

module.exports = mongoose.model('Control', controlSchema);
