import React from "react";
import { FailureCaseDetails, AlternativeCandidate } from "../data/types";
import { AlertTriangle, ArrowRight, Check } from "lucide-react";

interface FailureCaseCardProps {
  failureCase: FailureCaseDetails;
  alternative: AlternativeCandidate;
  onSelectAlternative?: (alt: AlternativeCandidate) => void;
}

export const FailureCaseCard: React.FC<FailureCaseCardProps> = ({
  failureCase,
  alternative,
  onSelectAlternative,
}) => {
  const { type, originalItemName, originalPrice, whyOriginalFailed, whyAlternativeChosen } = failureCase;
  const isUnavailable = type === "unavailable";

  return (
    <div
      className="rec-card"
      style={{
        borderLeft: isUnavailable ? "4px solid #ef4444" : "4px solid #f59e0b",
        background: "rgba(22, 28, 25, 0.78)",
      }}
    >
      <div
        className="rec-badge-tag"
        style={{
          background: isUnavailable ? "linear-gradient(135deg, #ef4444, #dc2626)" : "linear-gradient(135deg, #f59e0b, #d97706)",
          color: "#ffffff",
        }}
      >
        <AlertTriangle size={12} />
        <span>{isUnavailable ? "Item Marked Unavailable — Alternative Suggested" : "Budget Limit Exceeded — Smart Alternative"}</span>
      </div>

      {/* 1. Why original failed */}
      <div style={{ marginBottom: "14px", padding: "12px", background: "rgba(239, 68, 68, 0.12)", borderRadius: "10px", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
        <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#fca5a5", marginBottom: "4px" }}>
          Why {originalItemName} didn't fit:
        </div>
        <div style={{ fontSize: "14px", color: "#fee2e2", lineHeight: 1.45 }}>
          {whyOriginalFailed} {originalPrice ? `(Listed at ₹${originalPrice})` : ""}
        </div>
      </div>

      {/* 2. Alternative Item Display */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 14px",
          background: "rgba(34, 197, 94, 0.12)",
          border: "1px solid rgba(34, 197, 94, 0.28)",
          borderRadius: "10px",
          marginBottom: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#86efac" }}>
            Recommended Alternative:
          </div>
          <h4 style={{ margin: "2px 0", fontSize: "17px", fontWeight: 600, color: "#ffffff" }}>
            {alternative.item.name}
          </h4>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>
            {alternative.item.shop} • {alternative.item.dietary === "vegetarian" ? "Vegetarian" : "Non-Veg"}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#4ade80" }}>
            ₹{alternative.selectedPrice}
          </div>
        </div>
      </div>

      {/* 3. Why alternative chosen */}
      <div className="rec-why-box" style={{ background: "rgba(0, 0, 0, 0.25)" }}>
        <div className="rec-why-title" style={{ color: "#4ade80" }}>
          Why this alternative instead:
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#e2e8f0" }}>
          <Check size={16} style={{ color: "#4ade80", marginTop: "2px", flexShrink: 0 }} />
          <span>{whyAlternativeChosen}</span>
        </div>
      </div>

      {onSelectAlternative && (
        <div style={{ marginTop: "12px", textAlign: "right" }}>
          <button
            type="button"
            className="chip"
            onClick={() => onSelectAlternative(alternative)}
          >
            <span>Ask about {alternative.item.name}</span>
            <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
