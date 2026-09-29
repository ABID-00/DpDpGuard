const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Server', 'PC', 'ERP', 'Database', 'File Server', 'Cloud', 'Other'],
    required: true
  },
  os: String,
  osVersion: String,
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent'
  },
  lastCheckIn: Date,
  assuranceStatus: {
    type: String,
    enum: ['Evidence Verified', 'Needs Review', 'Potential Gap', 'Evidence Not Available'],
    default: 'Evidence Not Available'
  },
  priority: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  evidence: [{
    type: String,
    enum: ['Encryption', 'Access Control', 'Logging', 'Monitoring', 'Backup']
  }],
  relatedControls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Control'
  }],
  ipAddress: String,
  macAddress: String,
  location: String,
  owner: String,
  description: String,
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
assetSchema.index({ organization: 1, type: 1 });
assetSchema.index({ organization: 1, assuranceStatus: 1 });

module.exports = mongoose.model('Asset', assetSchema);
