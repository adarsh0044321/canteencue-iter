import React from "react";
import { AlternativeCandidate } from "../data/types";
import { AlertCircle } from "lucide-react";
import { AlternativeCard } from "./AlternativeCard";

interface TradeoffCardProps {
  summaryText: string;
  whyFitsList: string[];
  alternatives: AlternativeCandidate[];
  onSelectAlternative?: (alt: AlternativeCandidate) => void;
  onFollowUp: (query: string) => void;
}

export const TradeoffCard: React.FC<TradeoffCardProps> = ({
  summaryText,
  whyFitsList,
  alternatives,
  onSelectAlternative,
  onFollowUp,
}) => {
  return (
    <div
      className="rec-card"
      style={{
        borderLeft: "4px solid #eab308",
        background: "rgba(22, 28, 25, 0.72)",
      }}
    >
      <div
        className="rec-badge-tag"
        style={{ background: "linear-gradient(135deg, #eab308, #ca8a04)", color: "#ffffff" }}
      >
        <AlertCircle size={12} />
        <span>Trade-off Analysis</span>
      </div>

      <h3 className="rec-title" style={{ fontSize: "18px", marginBottom: "8px", color: "#ffffff" }}>
        No Exact Match Satisfies All Constraints
      </h3>

      <p style={{ margin: "0 0 12px", fontSize: "14.5px", color: "#cbd5e1", lineHeight: 1.5 }}>
        {summaryText}
      </p>

      {whyFitsList.length > 0 && (
        <ul className="rec-why-list" style={{ marginBottom: "14px" }}>
          {whyFitsList.map((item, idx) => (
            <li key={idx} className="rec-why-item" style={{ fontSize: "13px", color: "#e2e8f0" }}>
              <span style={{ color: "#facc15", fontWeight: 700 }}>•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {alternatives.length > 0 && (
        <div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--muted)",
              marginBottom: "6px",
            }}
          >
            Closest Options Within Budget:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {alternatives.map((alt) => (
              <AlternativeCard
                key={alt.item.id}
                alternative={alt}
                onSelectAlternative={onSelectAlternative}
              />
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button
          type="button"
          className="chip"
          onClick={() => onFollowUp("Increase my budget")}
        >
          Increase budget
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => onFollowUp("Show vegetarian options instead")}
        >
          Keep budget & switch to vegetarian
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => onFollowUp("Start a new decision")}
        >
          Start new decision
        </button>
      </div>
    </div>
  );
};
