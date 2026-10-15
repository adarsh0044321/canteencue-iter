import React, { useState } from "react";
import { MealCombination } from "../data/types";
import { Utensils, Clock, Check, Share2, Copy } from "lucide-react";

interface SmartComboCardProps {
  combination: MealCombination;
}

export const SmartComboCard: React.FC<SmartComboCardProps> = ({ combination }) => {
  const { mainItem, pairingItem, totalPrice, comboReason, estimatedPreparationTime } = combination;
  const [copied, setCopied] = useState<boolean>(false);

  const formattedShareText = `🍱 CanteenCue Smart Meal Combo:\n• Main: ${mainItem.name} (${mainItem.shop})\n• Pairing: ${pairingItem.name} (${pairingItem.shop})\n• Total Price: ₹${totalPrice} | Prep Time: ~${estimatedPreparationTime || 12} mins\n• Why it fits: ${comboReason}\n\nDecided with CanteenCue AI!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Smart Combo: ${mainItem.name} + ${pairingItem.name}`,
          text: formattedShareText,
        });
        return;
      } catch {}
    }
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(formattedShareText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="rec-card"
      style={{
        marginTop: "10px",
        background: "rgba(20, 26, 24, 0.75)",
        border: "1px solid rgba(20, 184, 166, 0.3)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <div
          className="rec-badge-tag"
          style={{ background: "linear-gradient(135deg, #0d9488, #0f766e)" }}
        >
          <Utensils size={12} />
          <span>Smart Meal Combination</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleCopy}
            title="Copy combo summary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: copied ? "rgba(16, 185, 129, 0.25)" : "rgba(255, 255, 255, 0.08)",
              border: `1px solid ${copied ? "rgba(16, 185, 129, 0.5)" : "rgba(255, 255, 255, 0.15)"}`,
              borderRadius: "8px",
              color: copied ? "#6ee7b7" : "#cbd5e1",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? "Copied!" : "Copy Combo"}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            title="Share combo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              background: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.18)",
              borderRadius: "8px",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <Share2 size={11} />
            <span>Share</span>
          </button>
        </div>
      </div>

      <div className="rec-header">
        <div>
          <h3 className="rec-title" style={{ fontSize: "19px", color: "#ffffff" }}>
            {mainItem.name} + {pairingItem.name}
          </h3>
          <p className="rec-shop" style={{ color: "#94a3b8" }}>
            {mainItem.shop} {pairingItem.shop !== mainItem.shop ? `& ${pairingItem.shop}` : ""}
          </p>
        </div>
        <div className="rec-price" style={{ color: "#34d399" }}>
          ₹{totalPrice}
        </div>
      </div>

      <div className="rec-tags">
        <span className="rec-tag">Meal + Beverage Combo</span>
        {estimatedPreparationTime && (
          <span className="rec-tag">
            <Clock size={11} style={{ display: "inline", marginRight: "4px" }} />
            ~{estimatedPreparationTime} mins total
          </span>
        )}
      </div>

      <div className="rec-why-box" style={{ background: "rgba(0, 0, 0, 0.3)", borderColor: "rgba(20, 184, 166, 0.2)" }}>
        <div className="rec-why-title" style={{ color: "#2dd4bf" }}>
          Why this combination fits
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "13.5px", color: "#e2e8f0" }}>
          <Check size={16} style={{ color: "#2dd4bf", marginTop: "2px", flexShrink: 0 }} />
          <span>{comboReason}</span>
        </div>
      </div>
    </div>
  );
};
