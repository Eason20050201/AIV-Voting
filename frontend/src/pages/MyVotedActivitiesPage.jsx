import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getVotedEvents } from '../services/votingService';
import { useAuth } from '../context/AuthContext';
import VotingCard from '../components/VotingCard';
import './MyVotingsPage.css';

const MyVotedActivitiesPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVotedEvents = async () => {
      if (user) {
        try {
          const data = await getVotedEvents(user.username);
          setEvents(data);
        } catch (error) {
          console.error("Failed to fetch voted events:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchVotedEvents();
  }, [user]);

  if (loading) return <div className="loading-container">Loading your activities...</div>;

  return (
    <div className="my-votings-container">
      <div className="my-votings-header">
        <h1 className="my-votings-title">My Voted Activities</h1>
        <p className="my-votings-subtitle">View the events you have participated in</p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>You haven't participated in any voting events yet.</p>
          <Link to="/" className="create-link-btn">
            Browse Votings
          </Link>
        </div>
      ) : (
        <div className="my-votings-grid">
          {events.map((event) => (
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
  );
};

export default MyVotedActivitiesPage;
