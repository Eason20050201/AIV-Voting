import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEventsByCreator } from "../services/votingService";
import { useAuth } from "../context/AuthContext";
import VotingCard from "../components/VotingCard";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import "./MyVotingsPage.css";

const MyCreatedVotingsPage = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyEvents = async () => {
      if (user) {
        try {
          const data = await getEventsByCreator(user.username);
          setEvents(data);
        } catch (error) {
          console.error("Failed to fetch created events:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMyEvents();
  }, [user]);

  if (loading)
    return <div className="loading-container">Loading your events...</div>;

  return (
    <div className="my-votings-container">
      <div className="my-votings-header">
        <h1 className="my-votings-title">My Created Votings</h1>
        <p className="my-votings-subtitle">
          Manage the voting events you have created
        </p>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <p>You haven't created any voting events yet.</p>
          <Link to="/create" className="create-link-btn">
            Create Your First Voting
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
              applies={event.pendingCount}
              endDate={event.endDate}
              onChainId={event.onChainId}
              organizerKeys={event.organizerKeys}
            >
              <div style={{ display: "flex", gap: "10px" }}>
                <Link
                  to={`/manage-votes/${event._id || event.id}`}
                  style={{ flex: 1 }}
                >
                  <Button variant="secondary" size="sm" fullWidth>
                    Manage
                  </Button>
                </Link>
                <Link to={`/vote/${event._id || event.id}`} style={{ flex: 1 }}>
                  <Button variant="outline" size="sm" fullWidth>
                    View
                  </Button>
                </Link>
              </div>
            </VotingCard>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCreatedVotingsPage;
