import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './ui/Badge';
import Button from './ui/Button';
import './VotingCard.css';

const VotingCard = ({ id, title, description, status, votes, endDate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleVoteClick = () => {
    // Check if user is logged in AND verified
    if (user?.kycStatus === 'verified') {
      navigate(`/vote/${id}`);
    } else {
      // If not logged in OR not verified, send to verification page.
      // 1. If not logged in -> ProtectedRoute intercepts -> Login -> Verify Page -> Vote Page
      // 2. If logged in but not verified -> Verify Page -> Vote Page
      navigate(`/verify?redirect=/vote/${id}`);
    }
  };

  return (
    <div className="event-card glass-panel">
      <Badge>{status}</Badge>
      
      <h3 className="event-title">{title}</h3>
      <p className="event-description">{description}</p>
      
      <div className="event-meta">
        <span>🗳️ {votes} votes</span>
        <span>🕒 Ends {endDate}</span>
      </div>
      
      <div className="vote-button-wrapper">
        <Button fullWidth onClick={handleVoteClick}>Vote Now</Button>
      </div>
    </div>
  );
};

export default VotingCard;
