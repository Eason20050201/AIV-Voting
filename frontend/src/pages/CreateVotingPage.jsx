import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEvent } from "../services/votingService";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import "./CreateVotingPage.css";
import Button from "../components/ui/Button";
import { useCurrentAccount } from "@iota/dapp-kit";

const CreateVotingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentAccount = useCurrentAccount();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    candidates: [
      { id: Date.now(), name: "", description: "" },
      { id: Date.now() + 1, name: "", description: "" },
    ],
  });

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
    try {
      await createEvent({
        ...formData,
        creatorId: user.username, // Use logged in user's username
      });
      toast.success("Event created successfully!");
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

        <form onSubmit={handleSubmit} className="voting-form">
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
