import React, { useState, useEffect } from 'react';
import VotingCard from '../components/VotingCard';
import { getEvents } from '../services/votingService';
import './HomePage.css';

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('urgent');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error("Failed to fetch events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const getSortedEvents = () => {
    const sorted = [...events];
    switch (sortBy) {
      case 'urgent':
        // Sort by endDate: ascending (closest date first)
        // This combines "Urgent" and "Ending Soonest" into one robust date-based sort
        return sorted.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
      case 'popular':
        // Sort by votes: descending
        return sorted.sort((a, b) => b.votes - a.votes);
      default:
        return sorted;
    }
  };

  const sortedEvents = getSortedEvents();

  return (
    <div className="home-container">
      <div className="content-wrapper">
        <h1 className="home-title">
          Welcome to <span className="gradient-text">AIVoting</span>
        </h1>
        <p className="home-subtitle">
          Secure, transparent, and efficient voting for your organization.
        </p>

        <div className="events-section">
          <div className="section-header">
            <h2 className="section-title">Active Votes</h2>
            <div className="sort-controls">
              <span className="sort-label">Sort by:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select glass-panel"
              >
                <option value="urgent">🔥 Urgent</option>
                <option value="popular">🗳️ Popular</option>
              </select>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-state">Loading events...</div>
          ) : (
            <div className="events-grid">
              {sortedEvents.map((event) => (
                <VotingCard 
                  key={event._id || event.id}
                  id={event._id || event.id}
                  title={event.title}
                  description={event.description}
                  status={event.status}
                  votes={event.votes}
                  endDate={event.endDate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
