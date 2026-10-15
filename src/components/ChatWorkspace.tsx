import React, { useRef, useEffect } from "react";
import { ChatMessage, AlternativeCandidate } from "../data/types";
import { RecommendationCard } from "./RecommendationCard";
import { SmartComboCard } from "./SmartComboCard";
import { FailureCaseCard } from "./FailureCaseCard";
import { AlternativeCard } from "./AlternativeCard";
import { TradeoffCard } from "./TradeoffCard";
import { PromptInput } from "./PromptInput";
import { AiThinkingPhase } from "./AiThinkingPhase";
import { User, AlertTriangle, Settings, ZapOff } from "lucide-react";

interface ChatWorkspaceProps {
  messages: ChatMessage[];
  isLoading: boolean;
  isAiMode?: boolean;
  onSubmit: (text: string) => void;
  onOpenQuickOptions: () => void;
  onOpenMenuModal?: () => void;
  onOpenApiConfigModal?: () => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  isLoading,
  isAiMode = false,
  onSubmit,
  onOpenQuickOptions,
  onOpenMenuModal,
  onOpenApiConfigModal,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  return (
    <div className="chat-workspace" role="log" aria-live="polite">
      <div className="chat-stream">
        {messages.map((msg) => {
          if (msg.sender === "user") {
            return (
              <div key={msg.id} className="user-message-row">
                <div className="msg-user-bubble">
                  {msg.text}
                </div>
                <div className="user-avatar-circle" title="You">
                  <User size={16} />
                </div>
              </div>
            );
          }

          const decision = msg.decision;

          return (
            <div key={msg.id} className="assistant-message-row">
              {/* Glowing Gradient Circle Avatar matching Image 3 */}
              <div className="ai-avatar-circle" title="CanteenCue AI" />

              <div className="assistant-message-content">
                {/* Natural language conversational reasoning bubble */}
                {decision?.summaryText && (
                  <div className="msg-assistant-bubble" style={{ whiteSpace: "pre-line" }}>
                    {decision.summaryText}
                  </div>
                )}

                {/* AI Model Connection Error or Fallback Card */}
                {decision?.apiErrorDetails && (
                  decision.apiErrorDetails.requiresApiKey ? (
                    <div className="api-error-card">
                      <div className="api-error-header">
                        <AlertTriangle size={15} style={{ color: "#f59e0b", flexShrink: 0 }} />
                        <span>Live AI Model Error ({decision.apiErrorDetails.provider.toUpperCase()})</span>
                      </div>
                      <div className="api-error-body">
                        {decision.apiErrorDetails.message}
                      </div>
                      {onOpenApiConfigModal && (
                        <button
                          type="button"
                          className="api-error-action-btn"
                          onClick={onOpenApiConfigModal}
                        >
                          <Settings size={13} />
                          <span>Configure API Key in AI Settings</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="api-fallback-badge">
                      <ZapOff size={12} />
                      <span>Offline Menu Engine Active</span>
                      {onOpenApiConfigModal && (
                        <button
                          type="button"
                          className="api-fallback-link"
                          onClick={onOpenApiConfigModal}
                        >
                          (Check API Key)
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Case 1 & Case 2: Failure Case Card (Unavailable item or Over-budget) */}
                {decision?.failureCase && decision.alternatives[0] && (
                  <FailureCaseCard
                    failureCase={decision.failureCase}
                    alternative={decision.alternatives[0]}
                    onSelectAlternative={(alt: AlternativeCandidate) =>
                      onSubmit(`Tell me more about ${alt.item.name}`)
                    }
                  />
                )}

                {/* Primary Recommendation Card */}
                {decision?.primaryItem && !decision.failureCase && (
                  <RecommendationCard
                    candidate={decision.primaryItem}
                    whyFitsList={decision.whyFitsList}
                  />
                )}

                {/* Smart Meal Combination Card */}
                {decision?.combination && (
                  <SmartComboCard combination={decision.combination} />
                )}

                {/* Trade-off Card if impossible constraints */}
                {decision?.type === "no_match_tradeoff" && (
                  <TradeoffCard
                    summaryText={decision.summaryText}
                    whyFitsList={decision.whyFitsList}
                    alternatives={decision.alternatives}
                    onSelectAlternative={(alt: AlternativeCandidate) =>
                      onSubmit(`Tell me more about ${alt.item.name}`)
                    }
                    onFollowUp={onSubmit}
                  />
                )}

                {/* Secondary Alternatives */}
                {decision?.type === "recommendation" &&
                  !decision.failureCase &&
                  decision.alternatives &&
                  decision.alternatives.length > 0 && (
                    <div style={{ marginTop: "4px" }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          margin: "6px 0 4px",
                        }}
                      >
                        Other Suitable Options:
                      </div>
                      {decision.alternatives.map((alt) => (
                        <AlternativeCard
                          key={alt.item.id}
                          alternative={alt}
                          onSelectAlternative={(selectedAlt: AlternativeCandidate) =>
                            onSubmit(`What about ${selectedAlt.item.name}?`)
                          }
                        />
                      ))}
                    </div>
                  )}

                {/* Contextual Follow-up Chips */}
                {decision?.suggestedFollowUps && decision.suggestedFollowUps.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "8px",
                      marginTop: "4px",
                    }}
                  >
                    {decision.suggestedFollowUps.map((chipText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="chip"
                        onClick={() => onSubmit(chipText)}
                      >
                        {chipText}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Dynamic Multi-Statement AI Thinking Phase */}
        {isLoading && <AiThinkingPhase isAiMode={isAiMode} />}

        {/* Scroll anchor with generous bottom clearance above floating composer */}
        <div
          ref={bottomRef}
          style={{
            height: "8px",
            width: "100%",
            scrollMarginBottom: "240px",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Floating Bottom Question Box */}
      <div className="composer-fixed">
        <div className="composer-inner">
          <PromptInput
            onSubmit={onSubmit}
            isLoading={isLoading}
            placeholder="Ask a follow-up, change budget, or choose an alternative..."
            onOpenQuickOptions={onOpenQuickOptions}
            onOpenMenuModal={onOpenMenuModal}
          />
        </div>
      </div>
    </div>
  );
};
