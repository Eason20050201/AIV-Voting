import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import "./VotingCard.css";

const VotingCard = ({
  id,
  title,
  description,
  status,
  votes,
  applies,
  endDate,
  voteStatus,
  children,
  onChainId,
  organizerKeys,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleVoteClick = () => {
    navigate(`/vote/${id}`);
  };

  const displayStatus =
    status === "ongoing"
      ? "Active"
      : status.charAt(0).toUpperCase() + status.slice(1);

  const getButtonContent = () => {
    if (user?.role === "organizer") {
      return "View Details";
    }
    if (voteStatus === "pending") return "Vote Pending";
    if (voteStatus === "verified") return "Vote Verified";
    if (voteStatus === "rejected") return "Resubmit Vote";
    if (status !== "ongoing") return "View Results"; // Or "Voting Closed"
    return "Vote Now";
  };

  const isButtonDisabled = () => {
    if (user?.role === "organizer") return false; // Organizer can view
    if (voteStatus) return true; // Already voted
    if (status !== "ongoing") return false; // Allowed to view closed/results? Actually let's just let them click to see
    return false;
  };

  // Customizing default click behavior depending on status
  const handleClick = () => {
    // Always navigate to detail page currently, as that's where results/status/etc are shown
    // Even if button says "Vote Pending", clicking it should probably just take you to the page to see the status trace?
    // Or if disabled, it does nothing?
    // Step 68 code used `fullWidth onClick={handleVoteClick}`.
    // If we want it to be disabled (unclickable), we pass `disabled`.
    // If we want it to be "View Details" (clickable), we pass `disabled={false}`.

    // If voteStatus is present, maybe we still want to let them click to see the event details?
    // But the request was "Vote now changed to status". Usually implies a non-interactive label or disabled button.
    // However, navigating to the page is harmless and useful.
    // Let's keep it clickable but visually different?
    // Or if the user explicit asked for "Vote now button changed to show his status", it usually implies the action is done.
    // Let's disable it if voted, to match VotingPage behavior?
    // VotingPage disables it.
    // But here it's a card. If I can't click the card, I can't see the event details?
    // The button is the only link? No, usually cards are clickable or have a Title link.
    // Checking VotingCard code... `title` is just `h3`. No link.
    // So the button is the ONLY way to navigate.
    // WE MUST NOT DISABLE THE BUTTON completely if it's the only navigation.
    // OR we should make the button strictly for voting and add another link?
    // Or just change the text and keep it clickable (navigate to view).

    // "Voter 投票時，要先偵測是否連上 錢包，接著投票出去後，將 vote now 按鈕改為顯示 他的狀態，pending, verivied.."
    // The user wants the button to SHOW the status.
    // If I disable it, it might look like "Vote Verified" (Grayed out). That's fine.
    // BUT if I disable it, they can't click to enter the page.
    // If they can't enter the page, they can't see the candidates/results.
    // That seems bad.

    // Let's Check `VotingCard` usage. Is the card wrapped in a Link? No.
    // Is the Title a link? No.
    // So the button IS the navigation.

    // Solution: Change button text to "Vote Verified" but keep it ENABLED so it acts as "View Details"?
    // OR: Add a separate "View" action?
    // OR: If user is organizer, "View Details".
    // If user voted, "Vote Verified" (Clickable -> goes to page).
    // Let's make it clickable, but maybe styled differently?
    // Or just standard button with that text.
    // Wait, if I click "Vote Verified", it goes to `handleVoteClick` -> `/vote/${id}`.
    // Inside `/vote/${id}`, the button there is disabled.
    // So it's safe to let them navigate there.

    handleVoteClick();
  };

  // Actually, if the button says "Vote Pending", and I click it, and it takes me to the page where it says "Vote Pending" (disabled), that's consistent.
  // So I will NOT disable the button on the card, unlike the page.
  // Or I can use a variant="outline" or something?
  // Let's just keep it enabled but change text.

  return (
    <div className="event-card glass-panel">
      <Badge>{displayStatus}</Badge>

      <h3 className="event-title">{title}</h3>
      <p className="event-description">{description}</p>

      {/* Key Info Section */}
      <div
        className="key-info"
        style={{
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "1rem",
          fontFamily: "monospace",
          background: "rgba(0,0,0,0.2)",
          padding: "8px",
          borderRadius: "6px",
        }}
      >
        {onChainId && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>ID:</span>
            <span title={onChainId}>{onChainId.slice(0, 6)}...</span>
          </div>
        )}
        {organizerKeys?.encryption?.public && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Enc:</span>
            <span title={organizerKeys.encryption.public}>
              {organizerKeys.encryption.public.slice(0, 6)}...
            </span>
          </div>
        )}
        {organizerKeys?.signing?.public && (
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Sign:</span>
            <span title={"RSA Public Key"}>
              {(() => {
                try {
                  const jwk = JSON.parse(organizerKeys.signing.public);
                  return jwk.n ? jwk.n.slice(0, 6) + "..." : "RSA...";
                } catch (e) {
                  return "RSA...";
                }
              })()}
            </span>
          </div>
        )}
      </div>

      <div className="event-meta">
        {applies !== undefined ? (
          <span>📝 {applies} applies</span>
        ) : (
          <span>🗳️ {votes || 0} votes</span>
        )}
        <span>🕒 Ends {endDate ? endDate.replace("T", " ") : ""}</span>
      </div>

      <div className="vote-button-wrapper">
        {children ? (
          children
        ) : (
          <Button
            fullWidth
            onClick={handleClick}
            variant={
              voteStatus === "verified"
                ? "success"
                : voteStatus === "pending"
                ? "warning"
                : voteStatus === "rejected"
                ? "danger"
                : voteStatus
                ? "secondary"
                : "primary"
            }
          >
            {getButtonContent()}
          </Button>
        )}
      </div>
    </div>
  );
};

export default VotingCard;
