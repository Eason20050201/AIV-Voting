const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Vote = require('../model/Vote');
const Event = require('../model/Event');
const VerificationRequest = require('../model/VerificationRequest');
const { Ed25519Keypair } = require('@iota/iota-sdk/keypairs/ed25519');

// Load EA Keypair
const EA_SECRET_KEY = process.env.EA_SECRET_KEY;
if (!EA_SECRET_KEY) {
    console.error('CRITICAL: EA_SECRET_KEY not found in environment variables.');
}
const eaKeypair = EA_SECRET_KEY ? Ed25519Keypair.fromSecretKey(EA_SECRET_KEY) : null;

// @route   GET /api/votes/event/:eventId/rejected-wallets
router.get('/event/:eventId/rejected-wallets', auth, async (req, res) => {
    try {
        const votes = await Vote.find({
            event: req.params.eventId,
            status: 'rejected',
            walletAddress: { $exists: true, $ne: null }
        }).select('walletAddress');

        const addresses = votes.map(v => v.walletAddress);
        res.json(addresses);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   POST /api/votes
// @desc    Cast a vote
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { eventId, candidateId, identityData, walletAddress } = req.body;

    // Check if user is a voter
    if (req.user.role !== 'voter') {
      return res.status(403).json({ msg: 'Organizers cannot vote' });
    }

    // Verify User has been verified by Organizer
    const verification = await VerificationRequest.findOne({
        event: eventId,
        voter: req.user.id,
        status: 'verified'
    });

    if (!verification) {
        return res.status(403).json({ msg: 'You have not been verified for this event.' });
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

    // Check if duplicate ID number used in this event (excluding rejected votes)
    const duplicateIdContext = await Vote.findOne({
        event: eventId,
        'identityData.idNumber': identityData.idNumber,
        status: { $ne: 'rejected' } // Ignore rejected votes
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
      console.log('Found existing vote:', existingVote);
      console.log('Strict equality check (rejected):', existingVote.status === 'rejected');
      
      if (existingVote.status === 'rejected') {
          console.log('Deleting rejected vote to allow re-vote');
          // Allow re-vote: Delete the rejected vote
          await Vote.deleteOne({ _id: existingVote._id });
      } else {
          console.log('Vote exists and is not rejected. Status:', existingVote.status);
          return res.status(400).json({ msg: 'You have already voted in this event', status: existingVote.status });
      }
    }

    const newVote = new Vote({
      event: eventId,
      voter: req.user.id,
      candidateId,
      identityData, // { realName, idNumber }
      walletAddress,
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

