import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getEventById } from '../data/mockData';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CandidateCard from '../components/CandidateCard';
import './VotingPage.css';

const VotingPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const data = await getEventById(id);
        setEvent(data);
      } catch (error) {
        console.error("Failed to fetch event:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  if (loading) return <div className="loading-container">Loading voting details...</div>;
  if (!event) return <div className="error-container">Event not found. <Link to="/">Go Home</Link></div>;

  return (
    <div className="voting-page-container">
      <div className="voting-content glass-panel">
        <Link to="/" className="back-link">← Back to Events</Link>
        
        <header className="voting-header">
          <Badge>{event.status}</Badge>

          <h1 className="voting-title">{event.title}</h1>
          <p className="voting-description">{event.description}</p>
          
          <div className="voting-meta">
            <span>🗳️ Total Votes: {event.votes}</span>
            <span>🕒 Ends: {event.endDate}</span>
          </div>
        </header>

        <div className="candidates-section">
          <h2>Cast Your Vote</h2>
          
          <div className="candidates-grid">
            {event.candidates?.map((candidate) => (
              <CandidateCard 
                key={candidate.id}
                candidate={candidate}
                isSelected={selectedCandidate === candidate.id}
                onSelect={setSelectedCandidate}
              />
            ))}
          </div>
        </div>

        <div className="voting-actions">
          <Button 
            onClick={() => alert(`Voted for candidate ${selectedCandidate}`)}
            disabled={!selectedCandidate}
          >
            Submit Vote
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VotingPage;
