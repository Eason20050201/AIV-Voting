const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  voter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateId: {
    type: String,
    required: true
  },
  identityData: {
    realName: {
      type: String,
      required: true
    },
    idNumber: {
      type: String,
      required: true
    }
  },
  walletAddress: {
    type: String, 
    required: false // Optional for backward compatibility
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate voting per event
voteSchema.index({ event: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('Vote', voteSchema);
