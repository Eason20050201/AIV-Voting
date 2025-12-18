import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getEventById,
  castVote,
  getVoteStatus,
  requestVerification,
  checkVerificationStatus,
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
  const [voteStatus, setVoteStatus] = useState(null); // 'pending', 'verified', 'rejected', or null (Vote Status)
  const [verificationStatus, setVerificationStatus] = useState(null); // 'pending', 'verified', 'rejected' (Identity Status)
  const [eligibilitySignature, setEligibilitySignature] = useState(null);
  const [verifiedIdentityData, setVerifiedIdentityData] = useState(null);

  useEffect(() => {
    const fetchEventAndStatus = async () => {
      try {
        const [eventData, statusData, verificationData] = await Promise.all([
          getEventById(id),
          user?.role === "voter"
            ? getVoteStatus(id)
            : Promise.resolve({ status: null }),
          user?.role === "voter"
            ? checkVerificationStatus(id)
            : Promise.resolve({ status: null }),
        ]);

        setEvent(eventData);
        if (statusData?.status) {
          setVoteStatus(statusData.status);
        }
        if (verificationData?.status) {
          setVerificationStatus(verificationData.status);
          setVerifiedIdentityData(verificationData.identityData);

          if (
            verificationData.status === "verified" &&
            verificationData.signature
          ) {
            // Attempt to Unblind
            const invBase64 = localStorage.getItem(`blind_inv_${id}`);
            if (invBase64) {
              try {
                const { RSABSSA } = await import("@cloudflare/blindrsa-ts");
                const suite = RSABSSA.SHA384.PSS.Randomized();
                const organizerPubJwk = JSON.parse(
                  eventData.organizerKeys.signing.public
                );
                const publicDetails = await crypto.subtle.importKey(
                  "jwk",
                  organizerPubJwk,
                  { name: "RSA-PSS", hash: "SHA-384" },
                  true,
                  ["verify"]
                );

                // We need currentAccount address for the message
                if (!currentAccount?.address) {
                  console.warn("Cannot unblind yet: Wallet not connected");
                  return;
                }

                const message = new TextEncoder().encode(
                  currentAccount.address
                );
                const inv = naclUtil.decodeBase64(invBase64);

                // Get blind signature from response (Base64 -> Uint8Array)
                const blindSignature = naclUtil.decodeBase64(
                  verificationData.signature
                );

                const unblindedSig = await suite.finalize(
                  publicDetails,
                  message,
                  blindSignature,
                  inv
                );

                console.log("Unblinded Signature Successfully!");
                setEligibilitySignature(unblindedSig);
              } catch (e) {
                console.error("Unblind error", e);
                // If finalize fails (e.g. Inv invalid), we might need to reset?
                // For now just log it.User might need to re-verify if they lost the Factor.
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch event data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndStatus();
  }, [id, user, currentAccount]);

  const handleCandidateSelect = (candidateId) => {
    // Prevent selection if not verified
    if (verificationStatus !== "verified") {
      toast.error("Please verify before voting.");
      return;
    }
    setSelectedCandidate(candidateId);
  };

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

    // Check Verification Status
    if (verificationStatus === "pending") {
      toast(
        "Your identity verification is pending approval by the organizer.",
        { icon: "⏳" }
      );
      return;
    }

    if (verificationStatus === "verified") {
      // Proceed to vote
      handleCastVoteTransaction();
      return;
    }

    if (verificationStatus === "rejected") {
      toast.error(
        "Your previous verification request was rejected. Please update your details."
      );
      // Fall through to open modal
    }

    if (voteStatus && voteStatus !== "rejected") {
      toast.error(`You have already voted. Status: ${voteStatus}`);
      return;
    }

    // If not verified, open modal
    setShowIdentityModal(true);
  };

  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();

  const handleIdentitySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID;
      const eaPublicKey = event.organizerKeys?.encryption?.public;

      if (!packageId || !eaPublicKey) {
        throw new Error("Missing Voting Configuration");
      }

      console.log("--- Starting Identity Request Flow ---");
      const { RSABSSA } = await import("@cloudflare/blindrsa-ts");
      const suite = RSABSSA.SHA384.PSS.Randomized();

      // Get Event's Public Signing Key
      const organizerPubJwk = JSON.parse(event.organizerKeys.signing.public);
      const publicDetails = await crypto.subtle.importKey(
        "jwk",
        organizerPubJwk,
        { name: "RSA-PSS", hash: "SHA-384" },
        true,
        ["verify"]
      );

      // A. Prepare Message (Voter Address)
      const message = new TextEncoder().encode(currentAccount.address);

      // B. Blind
      const { blindedMsg, inv } = await suite.blind(publicDetails, message);

      // Save 'inv' to LocalStorage for later unblinding
      const invBase64 = naclUtil.encodeBase64(inv);
      localStorage.setItem(`blind_inv_${id}`, invBase64);

      // C. Request Verification from Backend
      await requestVerification(
        id,
        identityData,
        naclUtil.encodeBase64(blindedMsg)
      );

      toast.success("Verification Requested! Waiting for Organizer approval.");
      setVerificationStatus("pending");
      setShowIdentityModal(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Verification request failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCastVoteTransaction = async () => {
    if (!eligibilitySignature || !verifiedIdentityData) {
      toast.error(
        "Missing verification signature. Please verify identity first."
      );
      return;
    }

    setSubmitting(true);
    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID;
      const eaPublicKey = event.organizerKeys?.encryption?.public;

      // 3. Encrypt Vote
      const voteContent = { candidate_id: Number(selectedCandidate) };
      const encryptedVote = encryptVote(voteContent, eaPublicKey);

      // 4. Construct Transaction
      console.log("--- constructing vote transaction ---");
      console.log("Event OnChainID:", event.onChainId);
      console.log("Encrypted Vote (len):", encryptedVote.length);
      console.log("Signature (len):", eligibilitySignature.length);

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::vote_event::vote`,
        arguments: [
          tx.object(event.onChainId),
          tx.pure.vector("u8", encryptedVote),
          tx.pure.vector(
            "u8",
            Array.from(new Uint8Array(eligibilitySignature))
          ),
        ],
      });

      // 5. Submit to IOTA
      console.log("Submitting transaction to wallet...");
      const result = await signAndExecuteTransaction({
        transaction: tx,
      });
      console.log("Transaction Submitted! Digest:", result.digest);

      // 6. Record in Backend (Hybrid)
      await castVote({
        eventId: id,
        candidateId: selectedCandidate,
        identityData: verifiedIdentityData,
        walletAddress: currentAccount.address,
      });

      toast.success(
        "Vote submitted securely to the Tangle! Waiting for verification."
      );

      // Clear sensitive data after successful vote
      setEligibilitySignature(null);
      setVerifiedIdentityData(null);

      // Update local state immediately
      setVoteStatus("pending");

      // Refresh event data
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
    if (voteStatus) return "Vote Submitted"; // Any vote status implies completion
    if (event?.status !== "ongoing") return "Voting Closed";

    if (verificationStatus === "pending") return "Verification Pending";
    if (verificationStatus === "verified") return "Cast Vote";
    if (verificationStatus === "rejected") return "Re-verify Identity";

    return "Verify Identity";
  };

  const isButtonDisabled = () => {
    if (user?.role === "organizer") return true;
    if (voteStatus) return true;

    if (event?.status !== "ongoing") return true;

    if (verificationStatus === "pending") return true;

    if (verificationStatus === "verified") {
      if (!selectedCandidate) return true;
      // Also check if we have the signature?
      // if (!eligibilitySignature) return true; // Maybe loading?
      return false;
    }

    // For "Verify Identity" or "Re-verify", enabled
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

        {/* Results Section (Only if ENDED) */}
        {event.status === "ended" && (
          <div
            className="results-section"
            style={{ marginBottom: "2rem" }}
          >
            <h2 style={{ color: "#4ade80", marginTop: 0 }}>
              Official Results
            </h2>
            <div className="results-grid">
              {event.candidates?.map((candidate) => {
                // Use tallyResults if available (Official On-Chain), else fallback to DB count
                const officialCount = event.tallyResults
                  ? event.tallyResults[candidate.id]
                  : candidate.voteCount;
                return (
                  <div
                    key={candidate.id}
                    className="result-card"
                    style={{
                      padding: "1rem",
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: "8px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
                        {candidate.name}
                      </h3>
                      <p
                        style={{ margin: 0, opacity: 0.7, fontSize: "0.9rem" }}
                      >
                        {candidate.description}
                      </p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: "#4ade80",
                        }}
                      >
                        {officialCount || 0}
                      </span>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          display: "block",
                          opacity: 0.7,
                        }}
                      >
                        Votes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Technical Details Section */}

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

            {event.status === "ended" && event.organizerKeys?.encryption?.private && (
              <div style={{ marginTop: "0.5rem" }}>
                <span style={{ color: "#ef4444" }}>
                  Decryption Key (X25519 Secret):
                </span>
                <div
                  style={{
                    wordBreak: "break-all",
                    color: "#fca5a5",
                    marginTop: "0.25rem",
                    fontFamily: "monospace",
                  }}
                >
                  {event.organizerKeys.encryption.private}
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

        {!voteStatus && event.status === "ongoing" && (
          <div className="candidates-section">
            <h2>Cast Your Vote</h2>

            <div className="candidates-grid">
              {event.candidates?.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={selectedCandidate === candidate.id}
                  onSelect={handleCandidateSelect}
                />
              ))}
            </div>
          </div>
        )}

        {/* Show Vote Status / Actions (Only if NOT ended or already voted) */}
        {(event.status === "ongoing" || voteStatus) && (
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
        )}
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
                  {submitting ? "Verifying..." : "Verify Identity"}
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
