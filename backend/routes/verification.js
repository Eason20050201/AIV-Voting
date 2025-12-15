const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const VerificationRequest = require('../model/VerificationRequest');
const Vote = require('../model/Vote');
const Event = require('../model/Event');

// @route   POST /api/verification/request
// @desc    Submit identity verification request
// @access  Private (Voter)
router.post('/request', auth, async (req, res) => {
    try {
        const { eventId, identityData, blindedMessage } = req.body;

        if (req.user.role !== 'voter') {
            return res.status(403).json({ msg: 'Only voters can request verification' });
        }

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ msg: 'Event not found' });
        if (event.status !== 'ongoing') {
            return res.status(400).json({ msg: 'Voting is not active' });
        }

        // Check if request already exists
        let request = await VerificationRequest.findOne({
            event: eventId,
            voter: req.user.id
        });

        if (request) {
            if (request.status === 'rejected') {
                // Allow re-submission if rejected (effectively resetting)
                 // NOTE: Update logic -> overwrite
                 request.identityData = identityData;
                 request.blindedMessage = blindedMessage;
                 request.status = 'pending';
                 request.signature = null;
                 request.createdAt = Date.now();
                 await request.save();
                 return res.json(request);
            } else {
                return res.status(400).json({ msg: 'Verification request already exists' });
            }
        }

        // Check ID duplicity (globally for this event, excluding rejected)
        const duplicateId = await VerificationRequest.findOne({
            event: eventId,
            'identityData.idNumber': identityData.idNumber,
            status: { $ne: 'rejected' },
            voter: { $ne: req.user.id } // Exclude self if re-submitting (though processed above)
        });

         // Also check Vote collection for legacy compatibility or if they somehow voted already?
         // Actually, let's keep it simple: check verified requests.
        
        if (duplicateId) {
             return res.status(400).json({ msg: 'ID Number already used in a pending or verified request' });
        }
        
        // Create new request
        request = new VerificationRequest({
            event: eventId,
            voter: req.user.id,
            identityData,
            blindedMessage
        });

        await request.save();
        res.json(request);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/verification/pending/:eventId
// @desc    Get pending requests for an event
// @access  Private (Organizer)
router.get('/pending/:eventId', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        if (event.creator.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const requests = await VerificationRequest.find({
            event: req.params.eventId,
            status: 'pending'
        }).populate('voter', 'username');

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH /api/verification/approve/:id
// @desc    Approve verification and generate blind signature
// @access  Private (Organizer)
router.patch('/approve/:id', auth, async (req, res) => {
    try {
        const request = await VerificationRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        const event = await Event.findById(request.event);
        if (event.creator.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ msg: `Request is already ${request.status}` });
        }

        // Generate Blind Signature
        // 1. Get Private Key
        if (!event.organizerKeys?.signing?.private) {
            return res.status(500).json({ msg: 'Event signing configuration missing' });
        }

        // 2. Prepare Crypto
        const { RSABSSA } = await import('@cloudflare/blindrsa-ts');
        if (!globalThis.crypto) {
             const { webcrypto } = require('node:crypto');
             globalThis.crypto = webcrypto;
        }

        // 3. Import Key
        const privateKeyJson = JSON.parse(event.organizerKeys.signing.private);
        const privateKey = await crypto.subtle.importKey(
            "jwk",
            privateKeyJson,
            { name: "RSA-PSS", hash: "SHA-384" },
            true,
            ["sign"]
        );

        // 4. Sign
        const blindedMsgUint8 = new Uint8Array(Buffer.from(request.blindedMessage, 'base64'));
        const suite = RSABSSA.SHA384.PSS.Randomized();
        const signature = await suite.blindSign(privateKey, blindedMsgUint8);
        const signatureBase64 = Buffer.from(signature).toString('base64');

        // 5. Update Request
        request.status = 'verified';
        request.signature = signatureBase64;
        await request.save();

        res.json(request);

    } catch (err) {
        console.error("Approval Error:", err);
        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   PATCH /api/verification/reject/:id
// @desc    Reject verification request
// @access  Private (Organizer)
router.patch('/reject/:id', auth, async (req, res) => {
    try {
        const request = await VerificationRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ msg: 'Request not found' });

        const event = await Event.findById(request.event);
        if (event.creator.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        request.status = 'rejected';
        request.signature = null; // Ensure no signature
        await request.save();

        res.json(request);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/verification/status/:eventId
// @desc    Check status for current user
// @access  Private (Voter)
router.get('/status/:eventId', auth, async (req, res) => {
    try {
        const request = await VerificationRequest.findOne({
            event: req.params.eventId,
            voter: req.user.id
        });

        if (!request) {
            return res.json({ status: null });
        }

        res.json({
            status: request.status,
            signature: request.signature,
            identityData: request.identityData
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
