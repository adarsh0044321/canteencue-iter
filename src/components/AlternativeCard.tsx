import React from "react";
import { AlternativeCandidate } from "../data/types";
import { ArrowUpRight } from "lucide-react";

interface AlternativeCardProps {
  alternative: AlternativeCandidate;
  onSelectAlternative?: (alt: AlternativeCandidate) => void;
}

export const AlternativeCard: React.FC<AlternativeCardProps> = ({
  alternative,
  onSelectAlternative,
}) => {
  const { item, selectedPortion, selectedPrice, reason, type } = alternative;

  const portionLabel =
    selectedPortion && selectedPortion !== "standard"
      ? ` (${selectedPortion === "half" ? "Half" : "Full"})`
      : "";

  const badgeText =
    type === "cheaper"
      ? "Budget Alternative"
      : type === "other_shop"
      ? "Other Canteen Shop"
      : type === "unavailable_substitute"
      ? "Available Substitute"
      : "Another Option";

  return (
    <div className="alt-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className="alt-badge">{badgeText}</span>
          <h4 className="alt-title">
            {item.name}
            {portionLabel} — ₹{selectedPrice}
          </h4>
          <p style={{ margin: "2px 0", fontSize: "12px", color: "var(--muted)" }}>
            {item.shop}
          </p>
        </div>

        {onSelectAlternative && (
          <button
            type="button"
            className="chip"
            style={{ fontSize: "11px", padding: "4px 8px" }}
            onClick={() => onSelectAlternative(alternative)}
          >
            <span>Ask about this</span>
            <ArrowUpRight size={12} />
          </button>
        )}
      </div>

      <p className="alt-reason">{reason}</p>
    </div>
  );
};
