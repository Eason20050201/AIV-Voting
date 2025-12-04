import React from 'react';
import { Link } from 'react-router-dom';
import Badge from './ui/Badge';
import Button from './ui/Button';
import './VotingCard.css';

const VotingCard = ({ id, title, description, status, votes, endDate }) => {
  return (
    <div className="event-card glass-panel">
      <Badge>{status}</Badge>
      
      <h3 className="event-title">{title}</h3>
      <p className="event-description">{description}</p>
      
      <div className="event-meta">
        <span>🗳️ {votes} votes</span>
        <span>🕒 Ends {endDate}</span>
      </div>
      
      <Link to={`/vote/${id}`} className="vote-button-link">
        <Button fullWidth>Vote Now</Button>
      </Link>
    </div>
  );
};

export default VotingCard;
