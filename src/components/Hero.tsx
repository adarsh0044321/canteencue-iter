import React, { useState } from "react";
import { PromptInput } from "./PromptInput";
import { QuickChips } from "./QuickChips";
import { SlidersHorizontal, Sparkles } from "lucide-react";

interface HeroProps {
  onSubmit: (query: string) => void;
  isLoading: boolean;
  onOpenQuickOptions: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onSubmit,
  isLoading,
  onOpenQuickOptions,
}) => {
  const [showGuided, setShowGuided] = useState<boolean>(false);
  const [selectedBudget, setSelectedBudget] = useState<string>("₹100");
  const [selectedTime, setSelectedTime] = useState<string>("15 min");
  const [selectedMood, setSelectedMood] = useState<string>("Comfort food");
  const [selectedDietary, setSelectedDietary] = useState<string>("Vegetarian");
  const [selectedCraving, setSelectedCraving] = useState<string>("Spicy");

  const handleGetRecommendation = () => {
    const parts: string[] = [];
    if (selectedBudget && selectedBudget !== "No limit") parts.push(`budget ${selectedBudget}`);
    if (selectedTime && selectedTime !== "No limit") parts.push(`have ${selectedTime}`);
    if (selectedDietary && selectedDietary !== "No restrictions") parts.push(selectedDietary.toLowerCase());
    if (selectedCraving) parts.push(`craving something ${selectedCraving.toLowerCase()}`);
    if (selectedMood) parts.push(`in the mood for ${selectedMood.toLowerCase()}`);

    const query = parts.join(", ");
    onSubmit(query || "I have ₹100, vegetarian, spicy and filling");
  };

  return (
    <main className="stage" role="main">
      {/* Badge */}
      <div className="badge">
        <span>AI College Canteen Food Decision Assistant</span>
      </div>

      {/* Headline */}
      <h1 className="headline">
        What should I eat today?
      </h1>

      {/* Subcopy */}
      <p className="sub">
        Tell us what you’re looking for, and we’ll find the best option or combination from your college canteen menu.
      </p>

      {/* Conversational Textarea Input */}
      <PromptInput
        onSubmit={onSubmit}
        isLoading={isLoading}
        placeholder="Tell me what you feel like eating... (e.g. ₹100, vegetarian, spicy, something filling)"
        onOpenQuickOptions={onOpenQuickOptions}
      />

      {/* Quick Select Chips */}
      <QuickChips onSelect={onSubmit} disabled={isLoading} />

      {/* Guided Criteria Toggle */}
      <div style={{ marginTop: "12px", width: "100%", maxWidth: "780px" }}>
        <button
          type="button"
          className="chip"
          style={{
            background: showGuided ? "rgba(255, 255, 255, 0.12)" : "rgba(22, 28, 25, 0.65)",
            borderColor: showGuided ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.16)",
            color: "#ffffff",
            padding: "8px 16px",
            fontSize: "13.5px",
            fontWeight: 500,
          }}
          onClick={() => setShowGuided(!showGuided)}
        >
          <SlidersHorizontal size={14} />
          <span>{showGuided ? "Hide Guided Criteria" : "Or use Guided Criteria (Budget, Time, Mood, Dietary, Craving)"}</span>
        </button>

        {showGuided && (
          <div
            className="rec-card"
            style={{
              marginTop: "14px",
              textAlign: "left",
              background: "rgba(18, 22, 20, 0.72)",
              border: "1px solid rgba(255, 255, 255, 0.14)",
            }}
          >
            {/* 1. Budget */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                BUDGET
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["₹50", "₹100", "₹150", "Custom"].map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`chip ${selectedBudget === b ? "chip--active" : ""}`}
                    onClick={() => setSelectedBudget(b)}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Available Time */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                AVAILABLE TIME
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["10 min", "15 min", "20 min", "30 min", "No limit"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${selectedTime === t ? "chip--active" : ""}`}
                    onClick={() => setSelectedTime(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Mood */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                MOOD
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Quick & light", "Comfort food", "Energetic", "Healthy", "Treat myself"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`chip ${selectedMood === m ? "chip--active" : ""}`}
                    onClick={() => setSelectedMood(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Dietary Requirements */}
            <div style={{ marginBottom: "12px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                DIETARY PREFERENCE
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Vegetarian", "Vegan", "No restrictions", "Chicken"].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={`chip ${selectedDietary === d ? "chip--active" : ""}`}
                    onClick={() => setSelectedDietary(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Craving */}
            <div style={{ marginBottom: "18px" }}>
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--muted)", marginBottom: "6px" }}>
                CRAVING
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {["Spicy", "Sweet", "Crispy", "Filling", "Something light"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`chip ${selectedCraving === c ? "chip--active" : ""}`}
                    onClick={() => setSelectedCraving(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Get Recommendation Button */}
            <button
              type="button"
              className="btn-dark"
              style={{ width: "100%", justifyContent: "center", padding: "12px" }}
              onClick={handleGetRecommendation}
            >
              <Sparkles size={16} />
              <span>Get Recommendation</span>
            </button>
          </div>
        )}
      </div>
    </main>
  );
};
