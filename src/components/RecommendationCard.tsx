import React, { useState } from "react";
import { RecommendationCandidate } from "../data/types";
import { Check, Clock, Sparkles, Share2, Copy } from "lucide-react";

interface RecommendationCardProps {
  candidate: RecommendationCandidate;
  whyFitsList: string[];
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  candidate,
  whyFitsList,
}) => {
  const { item, selectedPortion, selectedPrice } = candidate;
  const [copied, setCopied] = useState<boolean>(false);

  const portionLabel =
    selectedPortion && selectedPortion !== "standard"
      ? ` — ${selectedPortion === "half" ? "Half" : "Full"}`
      : "";

  const formattedShareText = `🍽️ CanteenCue Recommendation:\n• Dish: ${item.name}${portionLabel} (${item.shop})\n• Price: ₹${selectedPrice} | Prep Time: ~${item.estimatedPreparationTime || 10} mins\n• Dietary: ${item.dietary === "vegetarian" ? "Veg" : item.dietary === "contains_egg" ? "Egg" : "Non-Veg"}\n• Why it fits:\n${whyFitsList.map((r) => `  ✓ ${r}`).join("\n")}\n\nDecided with CanteenCue AI!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Canteen Meal: ${item.name}`,
          text: formattedShareText,
        });
        return;
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    }
    // Fallback: Open WhatsApp Web/Mobile
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="rec-card" role="region" aria-label="Primary food recommendation">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div className="rec-badge-tag">
          <Sparkles size={12} />
          <span>Recommended For You</span>
        </div>

        {/* Share & Copy Action Chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy recommendation summary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              background: copied ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${copied ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "8px",
              color: copied ? "#6ee7b7" : "#cbd5e1",
              fontSize: "11.5px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>

          <button
            type="button"
            onClick={handleNativeShare}
            title="Share decision via WhatsApp / System Share"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "4px 10px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "11.5px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Share2 size={12} />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="rec-header">
        <div>
          <h3 className="rec-title">
            {item.name}
            {portionLabel}
          </h3>
          <p className="rec-shop">{item.shop}</p>
        </div>
        <div className="rec-price">₹{selectedPrice}</div>
      </div>

      <div className="rec-tags">
        <span className="rec-tag">
          {item.dietary === "vegetarian" ? "Vegetarian" : item.dietary === "contains_egg" ? "Contains Egg" : "Non-Vegetarian"}
        </span>
        {(item.tags || []).map((tag: string) => (
          <span key={tag} className="rec-tag">
            {tag.charAt(0).toUpperCase() + tag.slice(1)}
          </span>
        ))}
        {item.estimatedPreparationTime && (
          <span className="rec-tag" title="Estimated kitchen preparation time">
            <Clock size={11} style={{ display: "inline", marginRight: "4px" }} />
            ~{item.estimatedPreparationTime} mins (est.)
          </span>
        )}
      </div>

      {whyFitsList.length > 0 && (
        <div className="rec-why-box">
          <div className="rec-why-title">Why this fits</div>
          <ul className="rec-why-list">
            {whyFitsList.map((reason, idx) => (
              <li key={idx} className="rec-why-item">
                <Check size={14} className="rec-check" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
