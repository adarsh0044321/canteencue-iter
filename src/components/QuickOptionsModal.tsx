import React, { useState } from "react";
import { X } from "lucide-react";

interface QuickOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (query: string) => void;
}

export const QuickOptionsModal: React.FC<QuickOptionsModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [budget, setBudget] = useState<number>(100);
  const [dietary, setDietary] = useState<"any" | "vegetarian" | "chicken">("any");
  const [craving, setCraving] = useState<string[]>(["spicy"]);
  const [time, setTime] = useState<number>(15);

  if (!isOpen) return null;

  const toggleCraving = (c: string) => {
    setCraving((prev) =>
      prev.includes(c) ? prev.filter((item) => item !== c) : [...prev, c]
    );
  };

  const handleApply = () => {
    const parts: string[] = [];
    if (dietary === "vegetarian") parts.push("vegetarian");
    if (dietary === "chicken") parts.push("chicken");
    if (craving.length > 0) parts.push(craving.join(" and "));
    parts.push(`under ₹${budget}`);
    if (time) parts.push(`within ${time} minutes`);

    const query = parts.join(", ");
    onApply(query);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Quick Preference Selection">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 600 }}>Quick Preference Selector</h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--muted)" }}>
              Customize your canteen requirements
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Budget */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
            Maximum Budget: ₹{budget}
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {[50, 70, 80, 100, 120, 150, 200].map((b) => (
              <button
                key={b}
                type="button"
                className={`chip ${budget === b ? "chip--active" : ""}`}
                onClick={() => setBudget(b)}
              >
                ₹{b}
              </button>
            ))}
          </div>
        </div>

        {/* Dietary */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
            Dietary Preference
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className={`chip ${dietary === "any" ? "chip--active" : ""}`}
              onClick={() => setDietary("any")}
            >
              No Restrictions
            </button>
            <button
              type="button"
              className={`chip ${dietary === "vegetarian" ? "chip--active" : ""}`}
              onClick={() => setDietary("vegetarian")}
            >
              Vegetarian
            </button>
            <button
              type="button"
              className={`chip ${dietary === "chicken" ? "chip--active" : ""}`}
              onClick={() => setDietary("chicken")}
            >
              Chicken
            </button>
          </div>
        </div>

        {/* Craving */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
            Cravings / Attributes
          </label>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["spicy", "filling", "light", "crispy", "sweet"].map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${craving.includes(c) ? "chip--active" : ""}`}
                onClick={() => toggleCraving(c)}
              >
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Available Time */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13.5px", fontWeight: 600, marginBottom: "8px" }}>
            Available Time Window
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            {[10, 15, 20, 30].map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${time === t ? "chip--active" : ""}`}
                onClick={() => setTime(t)}
              >
                {t} mins
              </button>
            ))}
          </div>
        </div>

        {/* Apply Button */}
        <button
          type="button"
          className="btn-dark"
          style={{ width: "100%", justifyContent: "center", padding: "12px" }}
          onClick={handleApply}
        >
          Find Matching Food
        </button>
      </div>
    </div>
  );
};
