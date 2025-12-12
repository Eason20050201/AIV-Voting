const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vote = require('../model/Vote');
const Event = require('../model/Event');

// @route   POST /api/votes
// @desc    Cast a vote
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, candidateId, identityData } = req.body;

    // Check if user is a voter
    if (req.user.role !== 'voter') {
      return res.status(403).json({ msg: 'Organizers cannot vote' });
    }

    // Check if event exists and is ongoing
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    if (event.status !== 'ongoing') {
      return res.status(400).json({ msg: 'Voting is not currently active for this event' });
    }

    // Check if candidate exists in the event
    const validCandidate = event.candidates.find(c => c.id === candidateId);
    if (!validCandidate) {
        return res.status(400).json({ msg: 'Invalid candidate' });
    }

    // Check if duplicate ID number used in this event
    const duplicateIdContext = await Vote.findOne({
        event: eventId,
        'identityData.idNumber': identityData.idNumber
    });
    
    if (duplicateIdContext) {
        return res.status(400).json({ msg: 'This ID number has already been used for voting in this event' });
    }

    // Check if already voted
    const existingVote = await Vote.findOne({
      event: eventId,
      voter: req.user.id
    });

    if (existingVote) {
      if (existingVote.status === 'rejected') {
          // Allow re-vote: Delete the rejected vote
          await Vote.deleteOne({ _id: existingVote._id });
      } else {
          return res.status(400).json({ msg: 'You have already voted in this event', status: existingVote.status });
      }
    }

    const newVote = new Vote({
      event: eventId,
      voter: req.user.id,
      candidateId,
      identityData, // { realName, idNumber }
      status: 'pending' // Default to pending
    });

    const vote = await newVote.save();
    res.json(vote);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/votes/mine
// @desc    Get all votes by the logged in user
// @access  Private
router.get('/mine', auth, async (req, res) => {
    try {
        const votes = await Vote.find({ voter: req.user.id })
            .populate('event')
            .sort({ createdAt: -1 });
        res.json(votes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/votes/event/:eventId/pending
// @desc    Get pending votes for an event (Organizer only)
// @access  Private
router.get('/event/:eventId/pending', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) return res.status(404).json({ msg: 'Event not found' });

    // Check authorization (Must be creator of the event)
    if (event.creator.toString() !== req.user.id) {
       return res.status(403).json({ msg: 'Not authorized' });
    }

    const votes = await Vote.find({ 
      event: req.params.eventId, 
      status: 'pending' 
    }).populate('voter', 'username'); 

    res.json(votes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PATCH /api/votes/:id/evaluate
// @desc    Verify or Reject a vote
// @access  Private
router.patch('/:id/evaluate', auth, async (req, res) => {
  try {
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
       return res.status(400).json({ msg: 'Invalid status' });
    }

    const vote = await Vote.findById(req.params.id);
    if (!vote) return res.status(404).json({ msg: 'Vote not found' });

    // Verify ownership
    const event = await Event.findById(vote.event);
    if (event.creator.toString() !== req.user.id) {
       return res.status(403).json({ msg: 'Not authorized' });
    }

    vote.status = status;
    if (status === 'verified') {
        vote.verifiedAt = Date.now();
    }
    
    await vote.save();

    res.json(vote);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/votes/status/:eventId
// @desc    Get current user's vote status for an event
// @access  Private
router.get('/status/:eventId', auth, async (req, res) => {
  try {
    const vote = await Vote.findOne({ 
      event: req.params.eventId, 
      voter: req.user.id 
    });

    if (!vote) {
      return res.json({ status: null });
    }

    res.json({ status: vote.status });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
