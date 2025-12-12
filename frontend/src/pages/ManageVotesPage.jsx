import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getEventById,
  getPendingVotes,
  evaluateVote,
} from "../services/votingService";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import VerificationVoteCard from "../components/VerificationVoteCard";
import { toast } from "react-hot-toast";
import "./ManageVotesPage.css";

const ManageVotesPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, votesData] = await Promise.all([
          getEventById(eventId),
          getPendingVotes(eventId),
        ]);
        setEvent(eventData);
        setVotes(votesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleEvaluate = async (voteId, status) => {
    try {
      await evaluateVote(voteId, status);
      // Remove the vote from the list
      setVotes(votes.filter((v) => v._id !== voteId));
      toast.success(`Vote ${status} successfully`);
    } catch (error) {
      toast.error("Failed to update vote status: " + error.message);
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!event) return <div className="error-container">Event not found</div>;

  return (
    <div className="manage-votes-container">
      <div className="manage-header">
        <button
          onClick={() => navigate(-1)}
          className="back-link"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "inherit",
            color: "inherit",
            padding: 0,
          }}
        >
          ← Back
        </button>
        <h1>Manage Votes: {event.title}</h1>
        <p>Review and verify pending votes from voters.</p>
      </div>

      {votes.length === 0 ? (
        <div className="empty-state">
          <p>No pending votes to verify.</p>
        </div>
      ) : (
        <div className="votes-list">
          {votes.map((vote) => (
            <VerificationVoteCard
              key={vote._id}
              vote={vote}
              onVerify={(id) => handleEvaluate(id, "verified")}
              onReject={(id) => handleEvaluate(id, "rejected")}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageVotesPage;
