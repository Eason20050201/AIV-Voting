const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
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
  blindedMessage: {
    type: String, // Base64 encoded
    required: true
  },
  signature: {
    type: String, // Base64 encoded, initially null
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one active request per event/voter
verificationRequestSchema.index({ event: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);
