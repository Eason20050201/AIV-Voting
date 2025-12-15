import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/votingService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "./CreateVotingPage.css";
import Button from "../components/ui/Button";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useIotaClient,
} from "@iota/dapp-kit";
import { Transaction } from "@iota/iota-sdk/transactions";
import nacl from "tweetnacl";
import naclUtil from "tweetnacl-util";
import { RSABSSA } from "@cloudflare/blindrsa-ts";

const CreateVotingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const client = useIotaClient();
  const [loading, setLoading] = useState(false);

  const initialFormState = {
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    candidates: [
      { id: Date.now(), name: "", description: "" },
      { id: Date.now() + 1, name: "", description: "" },
    ],
  };

  const [formData, setFormData] = useState(initialFormState);

  // Force reset on mount to prevent stale state from navigation history
  useEffect(() => {
    setFormData(initialFormState);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      candidates: prev.candidates.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      ),
    }));
  };

  const addCandidate = () => {
    setFormData((prev) => ({
      ...prev,
      candidates: [
        ...prev.candidates,
        { id: Date.now(), name: "", description: "" },
      ],
    }));
  };

  const removeCandidate = (id) => {
    if (formData.candidates.length <= 2) {
      alert("You need at least 2 candidates!");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      candidates: prev.candidates.filter((c) => c.id !== id),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentAccount) {
      toast.error("Please connect your wallet to create an event.");
      return;
    }

    // Validation
    if (
      !formData.title ||
      !formData.description ||
      !formData.startDate ||
      !formData.endDate
    ) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Date Validation
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      toast.error("Start date cannot be in the past.");
      return;
    }

    if (end < start) {
      toast.error("End date must be after start date.");
      return;
    }

    const isValidCandidates = formData.candidates.every((c) => c.name);
    if (!isValidCandidates) {
      toast.error("Please fill in Name for all candidates.");
      return;
    }

    setLoading(true);
    let onChainId = null;

    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID;
      if (!packageId) {
        throw new Error("Missing Package ID configuration");
      }

      // --- 1. Create Vote Event (On-Chain) ---
      const tx = new Transaction();
      // create_vote_event returns the Object
      tx.moveCall({
        target: `${packageId}::vote_event::create_vote_event`,
        arguments: [],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true },
      });
      console.log("Creation TX Result:", result);

      // Robustness: If wallet doesn't return effects, fetch them
      let effects = result.effects;
      let objectChanges = result.objectChanges;

      if (!effects || !objectChanges) {
        console.log("Effects missing, fetching transaction...");
        const txBlock = await client.waitForTransaction({
          digest: result.digest,
          options: { showEffects: true, showObjectChanges: true },
        });
        effects = txBlock.effects;
        objectChanges = txBlock.objectChanges;
      }

      if (effects?.status?.status !== "success") {
        throw new Error(
          `Failed to create event on-chain: ${
            effects?.status?.error || "Unknown error"
          }`
        );
      }

      // Extract Object ID
      const created = objectChanges?.find(
        (c) => c.type === "created" && c.objectType.includes("VoteEvent")
      );
      if (!created) {
        throw new Error("VoteEvent object not found in transaction results");
      }
      onChainId = created.objectId;
      console.log("Created On-Chain Event ID:", onChainId);

      // --- 2. Add Info (Title, Desc) ---
      // We do this in a separate transaction or same?
      // For simplicity/safety on gas limits, separate might be safer but slower.
      // Let's try to batch them if possible, but we need the object ID first which comes from the first TX.
      // So we must wait.

      const txInfo = new Transaction();
      txInfo.moveCall({
        target: `${packageId}::vote_event::add_vote_info`,
        arguments: [
          txInfo.object(onChainId),
          txInfo.pure.string(formData.title),
          txInfo.pure.string(formData.description),
        ],
      });

      // --- 3. Add Candidates ---
      // We can batch candidate additions into the SAME transaction as add_vote_info
      for (const candidate of formData.candidates) {
        // Note: candidates on chain need a name (vector<u8>)
        txInfo.moveCall({
          target: `${packageId}::vote_event::add_candidate`,
          arguments: [
            txInfo.object(onChainId),
            txInfo.pure.string(candidate.name),
          ],
        });
      }

      await signAndExecuteTransaction({
        transaction: txInfo,
      });

      // --- 4. Generate Organizer Keys (Double Key System) ---
      console.log("Generating Organizer Keys...");

      // A. Encryption Keys (X25519)
      const encKeyPair = nacl.box.keyPair();
      const encPublic = naclUtil.encodeBase64(encKeyPair.publicKey);
      const encPrivate = naclUtil.encodeBase64(encKeyPair.secretKey);

      // B. Signing Keys (RSA-Blind)
      // Note: RSABSSA uses Web Crypto API
      const suite = RSABSSA.SHA384.PSS.Randomized();
      const rsaKeyPair = await RSABSSA.SHA384.generateKey({
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
        modulusLength: 2048,
      });

      // Export RSA keys to store in DB (JWK format)
      const rsaPub = await window.crypto.subtle.exportKey(
        "jwk",
        rsaKeyPair.publicKey
      );
      const rsaPriv = await window.crypto.subtle.exportKey(
        "jwk",
        rsaKeyPair.privateKey
      );

      const organizerKeys = {
        encryption: {
          public: encPublic,
          private: encPrivate,
        },
        signing: {
          public: JSON.stringify(rsaPub),
          private: JSON.stringify(rsaPriv),
        },
      };

      // --- 5. Save to Database ---
      await createEvent({
        ...formData,
        creatorId: user.username,
        onChainId: onChainId,
        organizerKeys: organizerKeys,
      });

      toast.success("Event created successfully on-chain!");
      navigate("/my-created");
    } catch (error) {
      console.error("Failed to create event:", error);
      toast.error(
        "Failed to create event: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  // Get current date and time in YYYY-MM-DDTHH:mm format for min attributes
  const getCurrentDateTimeString = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const currentDateTimeString = getCurrentDateTimeString();

  // Validation Checkers
  const isStartDateInvalid =
    formData.startDate && formData.startDate < currentDateTimeString;
  const isEndDateInvalid =
    formData.startDate &&
    formData.endDate &&
    formData.endDate < formData.startDate;

  return (
    <div className="create-voting-container">
      <div className="create-voting-content glass-panel">
        <h1 className="page-title">Create New Voting</h1>

        <form
          onSubmit={handleSubmit}
          className="voting-form"
          autoComplete="off"
        >
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., Annual Team Building"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe what this vote is about..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="startDate">Start Date & Time</label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="form-input"
              style={isStartDateInvalid ? { borderColor: "#ef4444" } : {}}
              required
              min={currentDateTimeString}
            />
            {isStartDateInvalid && (
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                Start Date cannot be in the past
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="endDate">End Date & Time</label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="form-input"
              style={isEndDateInvalid ? { borderColor: "#ef4444" } : {}}
              required
              min={formData.startDate || currentDateTimeString}
            />
            {isEndDateInvalid && (
              <span
                style={{
                  color: "#ef4444",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                }}
              >
                End Date must be after Start Date
              </span>
            )}
          </div>

          <div className="candidates-section">
            <h2 className="section-subtitle">Candidates / Options</h2>
            <div className="candidate-list">
              {formData.candidates.map((candidate, index) => (
                <div key={candidate.id} className="candidate-item">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Name / Option"
                      value={candidate.name}
                      onChange={(e) =>
                        handleCandidateChange(
                          candidate.id,
                          "name",
                          e.target.value
                        )
                      }
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Short Description"
                      value={candidate.description}
                      onChange={(e) =>
                        handleCandidateChange(
                          candidate.id,
                          "description",
                          e.target.value
                        )
                      }
                      className="form-input"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCandidate(candidate.id)}
                    className="remove-btn"
                    title="Remove Candidate"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={addCandidate}
              className="add-candidate-btn"
            >
              + Add Another Candidate
            </Button>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate("/my-created")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Voting"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVotingPage;
