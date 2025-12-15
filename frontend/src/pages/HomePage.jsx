import React, { useState, useEffect } from "react";
import VotingCard from "../components/VotingCard";
import { getEvents, getVotedEvents } from "../services/votingService";
import { useAuth } from "../context/AuthContext";
import "./HomePage.css";

const HomePage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("urgent");
  const { user } = useAuth();
  const [userVotesMap, setUserVotesMap] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, votedEventsData] = await Promise.all([
          getEvents(),
          user?.role === "voter" ? getVotedEvents() : Promise.resolve([]),
        ]);

        setEvents(eventsData);

        if (votedEventsData.length > 0) {
          const map = {};
          votedEventsData.forEach((event) => {
            // event._id is the event ID because getVotedEvents returns event objects enriched with vote data
            // Wait, let's verify if getVotedEvents returns what we expect or if we need to adjust.
            // votingService says: calls /votes/mine, then maps: { ...vote.event, myVoteStatus: ... }
            // So the items in votedEventsData ARE the events.
            if (event._id) {
              map[event._id] = event.myVoteStatus;
            }
          });
          setUserVotesMap(map);
        } else {
          setUserVotesMap({});
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getSortedEvents = () => {
    const sorted = [...events];
    switch (sortBy) {
      case "urgent":
        // Sort by endDate: ascending (closest date first)
        // This combines "Urgent" and "Ending Soonest" into one robust date-based sort
        return sorted.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
      case "popular":
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
                  voteStatus={userVotesMap[event._id || event.id]}
                  onChainId={event.onChainId}
                  organizerKeys={event.organizerKeys}
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
