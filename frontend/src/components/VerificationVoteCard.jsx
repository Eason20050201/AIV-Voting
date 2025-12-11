import React from 'react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import './VerificationVoteCard.css';

const VerificationVoteCard = ({ vote, onVerify, onReject }) => {
  return (
    <div className="verification-card glass-panel-light">
      <div className="voter-header">
        <div className="voter-avatar">
          {vote.voter.username.charAt(0).toUpperCase()}
        </div>
        <div className="voter-details">
          <h3>{vote.voter.username}</h3>
          <span className="vote-time">Submitted recently</span>
        </div>
        <Badge className="status-badge">Pending Review</Badge>
      </div>

      <div className="identity-grid">
        <div className="identity-item">
          <label>Real Name</label>
          <div className="identity-value">{vote.identityData.realName}</div>
        </div>
        <div className="identity-item">
          <label>ID Number</label>
          <div className="identity-value">{vote.identityData.idNumber}</div>
        </div>
      </div>

      <div className="card-actions">
        <Button 
            variant="ghost" 
            className="reject-btn"
            onClick={() => onReject(vote._id)}
        >
            Reject
        </Button>
        <Button 
            variant="primary"
            className="verify-btn"
            onClick={() => onVerify(vote._id)}
        >
            Verify Identity
        </Button>
      </div>
    </div>
  );
};

export default VerificationVoteCard;
