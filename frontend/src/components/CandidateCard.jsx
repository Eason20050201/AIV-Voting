import React from "react";
import "./CandidateCard.css";

const CandidateCard = ({ candidate, isSelected, onSelect }) => {
  return (
    <div
      className={`candidate-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(candidate.id)}
    >
      <div className="radio-circle"></div>
      <div className="candidate-info">
        <h3>{candidate.name}</h3>
        <p>{candidate.description}</p>
      </div>
    </div>
  );
};

export default CandidateCard;
