import React, { useState, useEffect } from "react";
import { Sparkles, BrainCircuit } from "lucide-react";

interface AiThinkingPhaseProps {
  isAiMode?: boolean;
}

const THINKING_STEPS = [
  "AI is choosing something for you...",
  "Analyzing Anna’s Restaurant & Mughlai Affair’s menus...",
  "Balancing your cravings, budget & preparation time...",
  "Synthesizing smart combinations & pairings...",
  "Finalizing recommendations for you...",
];

export const AiThinkingPhase: React.FC<AiThinkingPhaseProps> = ({
  isAiMode = true,
}) => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [fade, setFade] = useState<boolean>(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setStepIndex((prev) => (prev + 1) % THINKING_STEPS.length);
        setFade(true);
      }, 160);
    }, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="assistant-message-row" style={{ animation: "fadeInBubble 0.2s ease" }}>
      <div className="ai-avatar-circle" title="CanteenCue AI Thinking" />

      <div
        className="msg-assistant-bubble"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "12px",
          background: "linear-gradient(135deg, rgba(20, 184, 166, 0.16) 0%, rgba(22, 28, 25, 0.8) 100%)",
          border: "1px solid rgba(45, 212, 191, 0.35)",
          boxShadow: "0 8px 24px -4px rgba(20, 184, 166, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          padding: "14px 20px",
          borderRadius: "18px",
          color: "#ffffff",
          width: "fit-content",
          maxWidth: "90%",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "rgba(45, 212, 191, 0.2)",
            color: "#2dd4bf",
            flexShrink: 0,
          }}
        >
          {isAiMode ? (
            <Sparkles size={16} style={{ animation: "pulse 1.5s infinite" }} />
          ) : (
            <BrainCircuit size={16} style={{ animation: "pulse 1.5s infinite" }} />
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#2dd4bf",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{isAiMode ? "AI THINKING PHASE" : "CANTEENCUE DECISION REASONING"}</span>
            <span
              style={{
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                background: "#2dd4bf",
                boxShadow: "0 0 6px #2dd4bf",
                animation: "pulse 1s infinite alternate",
              }}
            />
          </div>

          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "#e2e8f0",
              transition: "opacity 0.16s ease",
              opacity: fade ? 1 : 0,
            }}
          >
            {THINKING_STEPS[stepIndex]}
          </div>
        </div>
      </div>
    </div>
  );
};
