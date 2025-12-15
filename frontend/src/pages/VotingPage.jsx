import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getEventById,
  castVote,
  getVoteStatus,
  signEligibility,
} from "../services/votingService";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import CandidateCard from "../components/CandidateCard";
import "./VotingPage.css";

import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
} from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import { encryptVote } from "../utils/crypto";
import naclUtil from "tweetnacl-util";

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

    if (voteStatus && voteStatus !== "rejected") {
      toast.error(`You have already voted. Status: ${voteStatus}`);
      return;
    }

    // Open modal to get identity data
    setShowIdentityModal(true);
  };

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Get current config
      const packageId = import.meta.env.VITE_PACKAGE_ID;

      // PREFER Event-Specific Key, fallback to Global Env Key
      let eaPublicKey = event.organizerKeys?.encryption?.public;
      if (!eaPublicKey) {
        console.warn("Event has no encryption key, falling back to ENV");
        eaPublicKey = import.meta.env.VITE_EA_PUBLIC_KEY_X25519;
      }

      if (!packageId || !eaPublicKey) {
        throw new Error(
          "Missing Voting Configuration (PackageID or Public Key)"
        );
      }

      if (!event.onChainId) {
        // Fallback or Error?
        // For now, let's assume if it exists we use it, otherwise error or plain DB vote?
        // Let's enforce it for this 'Encrypted Voting' demo.
        // Note: If you want to support legacy events, you can add a check here.
        throw new Error(
          "This event is not configured for on-chain voting (Missing onChainId)."
        );
      }

      // 2. Request Eligibility Signature from Backend
      // We need to call the new endpoint explicitly
      const signResponse = await signEligibility({
        eventId: id,
        voterAddress: currentAccount.address,
        identityData,
      });
      const { signature } = signResponse;

      // 3. Encrypt Vote
      // candidateId is a number/string. Ensure we send what the contract expects.
      // vote_test.js sent { candidate_id: 1 }.
      // Our candidates have IDs like "1", "2".
      const voteContent = { candidate_id: Number(selectedCandidate) };
      const encryptedVote = encryptVote(voteContent, eaPublicKey);

      // 4. Construct Transaction
      console.log("--- constructing vote transaction ---");
      console.log("Event OnChainID:", event.onChainId);
      console.log("Encrypted Vote (len):", encryptedVote.length);
      console.log("Signature (len):", naclUtil.decodeBase64(signature).length);

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::vote_event::vote`,
        arguments: [
          tx.object(event.onChainId),
          tx.pure.vector("u8", encryptedVote),
          tx.pure.vector("u8", Array.from(naclUtil.decodeBase64(signature))),
        ],
      });

      // 5. Submit to IOTA
      console.log("Submitting transaction to wallet...");
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      console.log("Transaction Submitted! Digest:", result.digest);
      console.log("Transaction Effects:", result);

      // 6. Record in Backend (Hybrid)
      // If chain success, we record it in DB so UI updates nicely
      await castVote({
        eventId: id,
        candidateId: selectedCandidate,
        identityData,
        walletAddress: currentAccount.address,
      });

      toast.success(
        "Vote submitted securely to the Tangle! Waiting for verification."
      );
      setShowIdentityModal(false);

      // Update local state immediately
      setVoteStatus("pending");

      // Refresh event data to show updated counts or status if needed
      const data = await getEventById(id);
      setEvent(data);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Vote submission failed");
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

        {/* Technical Details Section */}
        <div
          className="technical-details"
          style={{
            marginBottom: "2rem",
            padding: "1rem",
            background: "rgba(0, 0, 0, 0.2)",
            borderRadius: "0.75rem",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <h3
            style={{ marginBottom: "1rem", fontSize: "1rem", color: "#94a3b8" }}
          >
            🔐 Blockchain & Security Details
          </h3>

          <div
            style={{
              display: "grid",
              gap: "0.5rem",
              fontSize: "0.85rem",
              fontFamily: "monospace",
            }}
          >
            <div>
              <span style={{ color: "#64748b" }}>On-Chain ID:</span>
              <div
                style={{
                  wordBreak: "break-all",
                  color: "#e2e8f0",
                  marginTop: "0.25rem",
                }}
              >
                {event.onChainId || "Not on-chain"}
              </div>
            </div>

            {event.organizerKeys?.encryption && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ color: "#64748b" }}>
                  Encryption Key (X25519):
                </span>
                <div
                  style={{
                    wordBreak: "break-all",
                    color: "#e2e8f0",
                    marginTop: "0.25rem",
                  }}
                >
                  {event.organizerKeys.encryption.public}
                </div>
              </div>
            )}

            {event.organizerKeys?.signing && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ color: "#64748b" }}>
                  Signing Key (RSA-Blind Public):
                </span>
                <div
                  style={{
                    wordBreak: "break-all",
                    color: "#e2e8f0",
                    marginTop: "0.25rem",
                    fontSize: "0.75rem",
                    maxHeight: "150px",
                    overflowY: "auto",
                    background: "rgba(0,0,0,0.2)",
                    padding: "8px",
                    borderRadius: "4px",
                  }}
                >
                  {(() => {
                    try {
                      const jwk = JSON.parse(
                        event.organizerKeys.signing.public
                      );
                      return (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div>
                            <span
                              style={{ color: "#94a3b8", marginRight: "4px" }}
                            >
                              Modulus (n):
                            </span>
                            {jwk.n}
                          </div>
                          <div>
                            <span
                              style={{ color: "#94a3b8", marginRight: "4px" }}
                            >
                              Exponent (e):
                            </span>
                            {jwk.e}
                          </div>
                        </div>
                      );
                    } catch (e) {
                      return event.organizerKeys.signing.public;
                    }
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

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
