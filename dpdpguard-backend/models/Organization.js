const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true
  },
  industry: {
    type: String,
    enum: ['Educational Institution', 'Healthcare', 'Finance', 'IT Services', 'Manufacturing', 'Government', 'Other'],
    required: true
  },
  organizationType: {
    type: String,
    required: true
  },
  approximateAssets: {
    type: Number,
    default: 0
  },
  primaryDataTypes: [String],
  adminUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  registrationKey: {
    type: String,
    unique: true,
    required: true,
    default: () => uuidv4()
  },
  agentRegistrationKey: {
    type: String,
    unique: true,
    default: () => uuidv4()
  },
  logo: String,
  description: String,
  website: String,
  contactEmail: String,
  contactPhone: String,
  address: String,
  isActive: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('Organization', organizationSchema);
