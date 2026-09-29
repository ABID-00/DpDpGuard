const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  vendorId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  service: String,
  dataProcessed: [String],
  processingPurpose: String,
  processingActivities: [String],
  contactPerson: String,
  email: String,
  phone: String,
  website: String,
  address: String,
  evidence: {
    type: String,
    enum: ['Available', 'Not Available', 'Needs Review'],
    default: 'Needs Review'
  },
  assuranceStatus: {
    type: String,
    enum: ['Assured', 'Needs Review', 'Potential Gap', 'Not Assessed'],
    default: 'Not Assessed'
  },
  lastReview: Date,
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  contractStatus: {
    type: String,
    enum: ['Signed', 'Pending', 'Expired', 'Not Required'],
    default: 'Pending'
  },
  dataProcessingAgreement: Boolean,
  dpaSignedDate: Date,
  certifications: [String],
  complianceLevel: String,
  reviewPeriod: {
    type: String,
    enum: ['Quarterly', 'Semi-Annual', 'Annual', 'As Needed'],
    default: 'Annual'
  },
  notes: String,
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
vendorSchema.index({ organization: 1, assuranceStatus: 1 });
vendorSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Vendor', vendorSchema);
