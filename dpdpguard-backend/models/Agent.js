const mongoose = require('mongoose');
const crypto = require('crypto');

const agentSchema = new mongoose.Schema({
  agentId: {
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
  hostname: {
    type: String,
    required: true,
    trim: true
  },
  asset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  os: String,
  osVersion: String,
  version: {
    type: String,
    default: '1.0.0'
  },
  status: {
    type: String,
    enum: ['Online', 'Offline', 'Update Required'],
    default: 'Offline'
  },
  lastCheckIn: Date,
  registrationToken: {
    type: String,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(32).toString('hex')
  },
  evidenceFrequency: {
    type: Number,
    default: 300 // 5 minutes in seconds
  },
  isEnabled: {
    type: Boolean,
    default: true
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastEvidenceSubmission: Date,
  totalEvidenceSubmissions: {
    type: Number,
    default: 0
  },
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
agentSchema.index({ organization: 1, status: 1 });
agentSchema.index({ apiKey: 1 });

module.exports = mongoose.model('Agent', agentSchema);
