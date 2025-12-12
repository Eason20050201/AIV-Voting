import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getEventById,
  castVote,
  getVoteStatus,
} from "../services/votingService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CandidateCard from "../components/CandidateCard";
import "./VotingPage.css";

import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { useCurrentAccount } from "@iota/dapp-kit";

const VotingPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [identityData, setIdentityData] = useState({
    realName: "",
    idNumber: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [voteStatus, setVoteStatus] = useState(null); // 'pending', 'verified', 'rejected', or null

  useEffect(() => {
    const fetchEventAndStatus = async () => {
      try {
        const [eventData, statusData] = await Promise.all([
          getEventById(id),
          user?.role === "voter"
            ? getVoteStatus(id)
            : Promise.resolve({ status: null }),
        ]);

        setEvent(eventData);
        if (statusData?.status) {
          setVoteStatus(statusData.status);
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndStatus();
  }, [id, user]);

  const handleVoteClick = () => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    if (user.role === "organizer") {
      toast.error("Organizers cannot vote");
      return;
    }

    if (!currentAccount) {
      toast.error("Please connect your wallet to vote");
      return;
    }

    if (event?.status !== "ongoing") {
      toast.error("Voting is closed for this event");
      return;
    }

    if (voteStatus) {
      toast.error(`You have already voted. Status: ${voteStatus}`);
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
        identityData,
      });
      toast.success(
        "Vote submitted successfully! Waiting for organizer verification."
      );
      setShowIdentityModal(false);

      // Update local state immediately
      setVoteStatus("pending");

      // Refresh event data to show updated counts or status if needed
      const data = await getEventById(id);
      setEvent(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getButtonText = () => {
    if (user?.role === "organizer") return "Organizers Cannot Vote";
    if (voteStatus === "pending") return "Vote Pending";
    if (voteStatus === "verified") return "Vote Verified";
    if (voteStatus === "rejected") return "Resubmit Vote";
    if (event?.status !== "ongoing") return "Voting Closed";
    return "Submit Vote";
  };

  const isButtonDisabled = () => {
    if (user?.role === "organizer") return true;
    if (voteStatus && voteStatus !== "rejected") return true; // Disable if voted AND not rejected

    if (event?.status !== "ongoing") return true;
    if (!selectedCandidate) return true;
    return false;
  };

  if (loading)
    return <div className="loading-container">Loading voting details...</div>;
  if (!event)
    return (
      <div className="error-container">
        Event not found.{" "}
        <Link to={user?.role === "organizer" ? "/my-created" : "/"}>
          Go Back
        </Link>
      </div>
    );

  return (
    <div className="voting-page-container">
      <div className="voting-content glass-panel">
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
            fontFamily: "inherit",
          }}
        >
          ← Back
        </button>

        <header className="voting-header">
          <Badge>
            {event.status === "ongoing"
              ? "Active"
              : event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </Badge>

          <h1 className="voting-title">{event.title}</h1>
          <p className="voting-description">{event.description}</p>

          <div className="voting-meta">
            <span>🗳️ Total Verified Votes: {event.votes}</span>
            <span>
              🕒 Ends: {event.endDate ? event.endDate.replace("T", " ") : ""}
            </span>
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
            disabled={isButtonDisabled()}
            variant={
              voteStatus === "verified"
                ? "success"
                : voteStatus === "pending"
                ? "warning"
                : voteStatus === "rejected"
                ? "danger"
                : "primary"
            }
          >
            {getButtonText()}
          </Button>
        </div>
      </div>

      {showIdentityModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Identity Verification</h2>
            <p>
              The organizer requires identity information to valid your vote.
            </p>
            <form onSubmit={handleIdentitySubmit}>
              <div className="form-group">
                <label>Real Name</label>
                <input
                  type="text"
                  required
                  value={identityData.realName}
                  onChange={(e) =>
                    setIdentityData({
                      ...identityData,
                      realName: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>ID Number</label>
                <input
                  type="text"
                  required
                  value={identityData.idNumber}
                  onChange={(e) =>
                    setIdentityData({
                      ...identityData,
                      idNumber: e.target.value,
                    })
                  }
                  className="form-input"
                />
              </div>
              <div className="modal-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowIdentityModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Confirm Vote"}
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
