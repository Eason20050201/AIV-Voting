const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  id: {
    type: String, // Use String (or timestamp) as ID to match frontend mock
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  voteCount: {
    type: Number,
    default: 0
  }
});

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  endDate: {
    type: String, // Storing as YYYY-MM-DD string as per frontend input
    required: true
  },
  candidates: [candidateSchema],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'ended'],
    default: 'ongoing'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Event', eventSchema);
