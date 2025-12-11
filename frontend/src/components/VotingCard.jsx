import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Badge from './ui/Badge';
import Button from './ui/Button';
import './VotingCard.css';

const VotingCard = ({ id, title, description, status, votes, endDate, children }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleVoteClick = () => {
    navigate(`/vote/${id}`);
  };

  const displayStatus = status === 'ongoing' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="event-card glass-panel">
      <Badge>{displayStatus}</Badge>
      
      <h3 className="event-title">{title}</h3>
      <p className="event-description">{description}</p>
      
      <div className="event-meta">
        <span>🗳️ {votes || 0} votes</span>
        <span>🕒 Ends {endDate}</span>
      </div>
      
      <div className="vote-button-wrapper">
        {children ? children : (
            <Button fullWidth onClick={handleVoteClick}>Vote Now</Button>
        )}
      </div>
    </div>
  );
};

export default VotingCard;
