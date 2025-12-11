const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Event = require('../model/Event');
const User = require('../model/User');
const Vote = require('../model/Vote'); // Use Vote to calculate counts

// @route   POST /api/events
// @desc    Create a new event
// @access  Private (Organizer only)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, endDate, candidates } = req.body;

    // Check if user is organizer
    if (req.user.role !== 'organizer') {
      return res.status(403).json({ msg: 'Not authorized to create events' });
    }

    const newEvent = new Event({
      title,
      description,
      endDate,
      candidates,
      creator: req.user.id
    });

    const event = await newEvent.save();
    res.json(event);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/events/created
// @desc    Get events created by the logged in organizer
// @access  Private
router.get('/created', auth, async (req, res) => {
    try {
        if (req.user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        const events = await Event.find({ creator: req.user.id }).sort({ createdAt: -1 });
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    // Get verified vote counts for each candidate
    const votes = await Vote.aggregate([
      { $match: { event: event._id, status: 'verified' } },
      { $group: { _id: '$candidateId', count: { $sum: 1 } } }
    ]);
    
    // Map votes to candidates
    const eventObj = event.toObject();
    eventObj.votes = 0; // Total verified votes
    
    // Update candidate vote counts in response
    eventObj.candidates = eventObj.candidates.map(candidate => {
       const voteData = votes.find(v => v._id === candidate.id);
       const count = voteData ? voteData.count : 0;
       
       // Update total votes
       eventObj.votes += count;
       
       return { ...candidate, voteCount: count };
    });

    res.json(eventObj);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
