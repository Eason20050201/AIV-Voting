import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getEventById,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} from "../services/votingService";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import VerificationVoteCard from "../components/VerificationVoteCard";
import { toast } from "react-hot-toast";
import { tallyOnChainVotes } from "../utils/tally";
import { updateEventStatus } from "../services/votingService";
import "./ManageVotesPage.css";

const ManageVotesPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tallyResult, setTallyResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventData, requestsData] = await Promise.all([
          getEventById(eventId),
          getPendingVerifications(eventId),
        ]);
        setEvent(eventData);
        setRequests(requestsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  const handleApprove = async (requestId) => {
    try {
      await approveVerification(requestId);
      setRequests(requests.filter((r) => r._id !== requestId));
      toast.success("Identity Verified!");
    } catch (error) {
      toast.error("Failed to verify: " + error.message);
    }
  };

  const handleReject = async (requestId) => {
    try {
      await rejectVerification(requestId);
      setRequests(requests.filter((r) => r._id !== requestId));
      toast.success("Request Rejected");
    } catch (error) {
      toast.error("Failed to reject: " + error.message);
    }
  };

  const handleOnChainTally = async () => {
    if (!event.onChainId) {
      toast.error("This event is not on-chain.");
      return;
    }

    if (!event.organizerKeys?.encryption?.private) {
      toast.error("Missing Private Key for decryption.");
      return;
    }

    setScanning(true);
    toast.loading("Scanning Tangle for votes...", { id: "scan" });

    try {
      const result = await tallyOnChainVotes(event, {
        encryptionPrivateKey: event.organizerKeys.encryption.private,
      });

      setTallyResult(result);
      toast.success(`Scan Complete! Found ${result.total} valid votes.`, {
        id: "scan",
      });
    } catch (e) {
      console.error(e);
      toast.error("Tally Failed: " + e.message, { id: "scan" });
    } finally {
      setScanning(false);
    }
  };

  const handleEndEvent = async () => {
    if (
      !window.confirm(
        "Are you sure you want to END this event? This will trigger a final tally and publish the results."
      )
    )
      return;

    try {
      let finalResults = tallyResult;

      // If we haven't scanned yet, or we want to ensure freshness, let's scan now.
      // But maybe user already scanned.
      // Let's force a scan to be safe and accurate.
      setScanning(true);
      toast.loading("Performing final tally...", { id: "end-scan" });

      try {
        const result = await tallyOnChainVotes(event, {
          encryptionPrivateKey: event.organizerKeys.encryption.private,
        });
        finalResults = result;
      } catch (e) {
        console.error("Final tally failed", e);
        toast.error("Final tally failed: " + e.message, { id: "end-scan" });
        setScanning(false);
        return; // Abort ending if tally fails? Or ask confirmation? Abort is safer.
      }

      // Now send status + results
      await updateEventStatus(eventId, "ended", finalResults.tally);

      setEvent({ ...event, status: "ended", tallyResults: finalResults.tally });
      setTallyResult(finalResults);

      toast.success("Event ended and results published!", { id: "end-scan" });
    } catch (err) {
      toast.error("Failed to end event: " + err.message, { id: "end-scan" });
    } finally {
      setScanning(false);
    }
  };

  if (loading) return <div className="loading-container">Loading...</div>;
  if (!event) return <div className="error-container">Event not found</div>;

  return (
    <div className="manage-votes-container">
      <div className="manage-header">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
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
                marginBottom: "1rem",
                display: "block",
              }}
            >
              ← Back
            </button>
            <h1>Manage Votes: {event.title}</h1>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <p style={{ margin: 0 }}>
                Review and verify pending votes from voters.
              </p>
              <Badge
                variant={event.status === "ongoing" ? "success" : "neutral"}
              >
                {event.status.toUpperCase()}
              </Badge>
            </div>
          </div>

          {event.status === "ongoing" && (
            <Button variant="danger" onClick={handleEndEvent}>
              End Voting
            </Button>
          )}
        </div>
      </div>

      <div
        className="glass-panel"
        style={{ padding: "1.5rem", marginBottom: "2rem" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>
              ⛓️ On-Chain Tally
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
              Scan the IOTA Tangle to count encrypted votes directly.
            </p>
          </div>
          <Button
            onClick={handleOnChainTally}
            disabled={scanning || event.status === "ended"}
          >
            {scanning
              ? "Scanning..."
              : event.status === "ended"
              ? "Event Ended"
              : "Start On-Chain Scan"}
          </Button>
        </div>

        {tallyResult && (
          <div
            style={{
              background: "rgba(0,0,0,0.2)",
              padding: "1rem",
              borderRadius: "8px",
            }}
          >
            <h3
              style={{
                fontSize: "1rem",
                marginBottom: "0.5rem",
                color: "#4ade80",
              }}
            >
              ✅ Tally Results ({tallyResult.total} Total)
            </h3>
            <div style={{ display: "grid", gap: "8px" }}>
              {Object.entries(tallyResult.tally).map(([cid, count]) => {
                const candidate = event.candidates.find((c) => c.id === cid);
                return (
                  <div
                    key={cid}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "8px",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "4px",
                    }}
                  >
                    <span>
                      {candidate ? candidate.name : `Candidate ${cid}`}
                    </span>
                    <span style={{ fontWeight: "bold" }}>{count} Votes</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <p>No pending verification requests.</p>
        </div>
      ) : (
        <div className="votes-list">
          {requests.map((request) => (
            <VerificationVoteCard
              key={request._id}
              vote={request}
              onVerify={() => handleApprove(request._id)}
              onReject={() => handleReject(request._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageVotesPage;
