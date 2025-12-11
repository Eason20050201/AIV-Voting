import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getEventById, castVote } from '../services/votingService';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import CandidateCard from '../components/CandidateCard';
import './VotingPage.css';

import { useAuth } from '../context/AuthContext';

const VotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityData, setIdentityData] = useState({ realName: '', idNumber: '' });
  const [submitting, setSubmitting] = useState(false);

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

  const handleVoteClick = () => {
    if (!user) {
      alert("Please login to vote");
      return;
    }
    // Open modal to get identity data
    setShowIdentityModal(true);
  };

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
        await castVote({
            eventId: id,
            candidateId: selectedCandidate,
            identityData
        });
        alert('Vote submitted successfully! Waiting for organizer verification.');
        setShowIdentityModal(false);
        // Refresh event data to show updated counts or status if needed
        const data = await getEventById(id);
        setEvent(data);
    } catch (error) {
        alert(error.message);
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Loading voting details...</div>;
  if (!event) return <div className="error-container">Event not found. <Link to="/">Go Home</Link></div>;

  return (
    <div className="voting-page-container">
      <div className="voting-content glass-panel">
        <Link to="/" className="back-link">← Back to Events</Link>
        
        <header className="voting-header">
          <Badge>{event.status === 'ongoing' ? 'Active' : event.status.charAt(0).toUpperCase() + event.status.slice(1)}</Badge>

          <h1 className="voting-title">{event.title}</h1>
          <p className="voting-description">{event.description}</p>
          
          <div className="voting-meta">
            <span>🗳️ Total Verified Votes: {event.votes}</span>
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
            onClick={handleVoteClick}
            disabled={!selectedCandidate}
          >
            Submit Vote
          </Button>
        </div>
      </div>

      {showIdentityModal && (
          <div className="modal-overlay">
              <div className="modal-content glass-panel">
                  <h2>Identity Verification</h2>
                  <p>The organizer requires identity information to valid your vote.</p>
                  <form onSubmit={handleIdentitySubmit}>
                      <div className="form-group">
                          <label>Real Name</label>
                          <input 
                              type="text" 
                              required 
                              value={identityData.realName}
                              onChange={e => setIdentityData({...identityData, realName: e.target.value})}
                              className="form-input"
                          />
                      </div>
                      <div className="form-group">
                          <label>ID Number</label>
                          <input 
                              type="text" 
                              required 
                              value={identityData.idNumber}
                              onChange={e => setIdentityData({...identityData, idNumber: e.target.value})}
                              className="form-input"
                          />
                      </div>
                      <div className="modal-actions">
                          <Button type="button" variant="ghost" onClick={() => setShowIdentityModal(false)}>Cancel</Button>
                          <Button type="submit" disabled={submitting}>
                              {submitting ? 'Submitting...' : 'Confirm Vote'}
                          </Button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default VotingPage;
