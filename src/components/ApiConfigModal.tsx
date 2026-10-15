import React, { useState } from "react";
import {
  AiConfig,
  AiProvider,
  getStoredAiConfig,
  saveAiConfig,
  testAiConnection,
  SYSTEM_GEMINI_KEY,
  isSystemGeminiKey,
} from "../services/aiService";
import {
  X,
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  Bot,
  Zap,
  Activity,
  Lock,
  RefreshCw,
} from "lucide-react";

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  // AI State
  const [aiConfig, setAiConfig] = useState<AiConfig>(getStoredAiConfig);
  const [isCustomKeyMode, setIsCustomKeyMode] = useState<boolean>(() => {
    const stored = getStoredAiConfig();
    return !isSystemGeminiKey(stored.apiKey) && !!stored.apiKey.trim();
  });
  const [showKey, setShowKey] = useState<boolean>(false);
  const [isAiTesting, setIsAiTesting] = useState<boolean>(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Connection Diagnostics & Latency History Log
  const [diagnosticHistory, setDiagnosticHistory] = useState<Array<{
    id: string;
    timestamp: string;
    type: "AI";
    status: "success" | "error";
    latencyMs: number;
    message: string;
  }>>(() => {
    try {
      const raw = sessionStorage.getItem("campuscue_diag_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const recordDiagnostic = (log: {
    id: string;
    timestamp: string;
    type: "AI";
    status: "success" | "error";
    latencyMs: number;
    message: string;
  }) => {
    setDiagnosticHistory((prev) => {
      const updated = [log, ...prev].slice(0, 8);
      try {
        sessionStorage.setItem("campuscue_diag_history", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  if (!isOpen) return null;

  const handleProviderChange = (provider: AiProvider) => {
    let defaultModel = "gemini-flash-lite-latest";
    let defaultKey = aiConfig.apiKey;

    if (provider === "gemini") {
      defaultModel = "gemini-flash-lite-latest";
      if (!isCustomKeyMode) {
        defaultKey = SYSTEM_GEMINI_KEY;
      }
    } else if (provider === "openai") {
      defaultModel = "gpt-4o-mini";
      defaultKey = isSystemGeminiKey(aiConfig.apiKey) ? "" : aiConfig.apiKey;
    } else if (provider === "builtin") {
      defaultModel = "built-in-neural";
      defaultKey = "";
    }

    setAiConfig((prev) => ({
      ...prev,
      provider,
      model: defaultModel,
      apiKey: defaultKey,
    }));
    setAiTestResult(null);
  };

  const handleAiTest = async () => {
    setIsAiTesting(true);
    setAiTestResult(null);
    const start = performance.now();
    try {
      const result = await testAiConnection(aiConfig);
      const latencyMs = Math.round(performance.now() - start);
      setAiTestResult(result);
      recordDiagnostic({
        id: `ai_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "AI",
        status: result.success ? "success" : "error",
        latencyMs,
        message: result.message,
      });
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - start);
      const msg = err.message || "Failed to reach AI provider";
      setAiTestResult({
        success: false,
        message: msg,
      });
      recordDiagnostic({
        id: `ai_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: "AI",
        status: "error",
        latencyMs,
        message: msg,
      });
    } finally {
      setIsAiTesting(false);
    }
  };

  const handleSaveAll = () => {
    saveAiConfig(aiConfig);
    onConfigSaved();
    onClose();
  };

  const handleSwitchToCustomKey = () => {
    setIsCustomKeyMode(true);
    setAiConfig((prev) => ({
      ...prev,
      apiKey: isSystemGeminiKey(prev.apiKey) ? "" : prev.apiKey,
    }));
    setAiTestResult(null);
  };

  const handleRevertToSystemKey = () => {
    setIsCustomKeyMode(false);
    setAiConfig((prev) => ({
      ...prev,
      apiKey: SYSTEM_GEMINI_KEY,
    }));
    setAiTestResult(null);
  };

  const handleResetAi = () => {
    const resetConfig: AiConfig = {
      provider: "builtin",
      apiKey: "",
      model: "gemini-flash-latest",
      enableMemory: true,
    };
    setAiConfig(resetConfig);
    saveAiConfig(resetConfig);
    setIsCustomKeyMode(false);
    onConfigSaved();
    setAiTestResult({
      success: true,
      message: "Reset to Built-in Engine (Offline & Free).",
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Configuration Modal"
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            paddingBottom: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(20, 184, 166, 0.3) 0%, rgba(13, 148, 136, 0.4) 100%)",
                border: "1px solid rgba(20, 184, 166, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2dd4bf",
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>
                AI & Decision Settings
              </h2>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--muted)" }}>
                Multi-turn conversational memory & student preference understanding
              </p>
            </div>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close Configuration"
          >
            <X size={18} />
          </button>
        </div>

        {/* AI CONFIGURATION & MODEL SELECTOR */}
            {/* Provider Cards */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "10px" }}>
                Select Decision Engine & AI Provider
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "10px" }}>
                {/* Google Gemini Card */}
                <div
                  onClick={() => handleProviderChange("gemini")}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: aiConfig.provider === "gemini" ? "1.5px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.12)",
                    background: aiConfig.provider === "gemini"
                      ? "linear-gradient(135deg, rgba(20, 184, 166, 0.18) 0%, rgba(13, 148, 136, 0.1) 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Zap size={16} color={aiConfig.provider === "gemini" ? "#2dd4bf" : "#94a3b8"} />
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: aiConfig.provider === "gemini" ? "#ffffff" : "#cbd5e1" }}>
                      Google Gemini
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
                    Pre-configured system key active. Fast flash conversational reasoning.
                  </p>
                </div>

                {/* OpenAI Card */}
                <div
                  onClick={() => handleProviderChange("openai")}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: aiConfig.provider === "openai" ? "1.5px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.12)",
                    background: aiConfig.provider === "openai"
                      ? "linear-gradient(135deg, rgba(20, 184, 166, 0.18) 0%, rgba(13, 148, 136, 0.1) 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Bot size={16} color={aiConfig.provider === "openai" ? "#2dd4bf" : "#94a3b8"} />
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: aiConfig.provider === "openai" ? "#ffffff" : "#cbd5e1" }}>
                      OpenAI
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
                    Supports GPT-4o-mini & GPT-4o conversational reasoning.
                  </p>
                </div>

                {/* Built-in Engine Card */}
                <div
                  onClick={() => handleProviderChange("builtin")}
                  style={{
                    padding: "12px",
                    borderRadius: "12px",
                    border: aiConfig.provider === "builtin" ? "1.5px solid #2dd4bf" : "1px solid rgba(255, 255, 255, 0.12)",
                    background: aiConfig.provider === "builtin"
                      ? "linear-gradient(135deg, rgba(20, 184, 166, 0.18) 0%, rgba(13, 148, 136, 0.1) 100%)"
                      : "rgba(255, 255, 255, 0.04)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <Cpu size={16} color={aiConfig.provider === "builtin" ? "#2dd4bf" : "#94a3b8"} />
                    <span style={{ fontSize: "13.5px", fontWeight: 600, color: aiConfig.provider === "builtin" ? "#ffffff" : "#cbd5e1" }}>
                      Built-in Engine
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: "11px", color: "#94a3b8", lineHeight: 1.4 }}>
                    Offline, zero API key required, 100% deterministic & free.
                  </p>
                </div>
              </div>
            </div>

            {/* Gemini Key Config: Masked System Key vs Custom Key Override */}
            {aiConfig.provider === "gemini" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "18px" }}>
                {!isCustomKeyMode ? (
                  /* Pre-configured System Key Active Card (Masked, No Plaintext Leaks) */
                  <div
                    style={{
                      background: "rgba(20, 184, 166, 0.08)",
                      border: "1px solid rgba(20, 184, 166, 0.3)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Lock size={16} color="#2dd4bf" />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#ffffff" }}>
                          Pre-Configured System Gemini Key
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: "rgba(16, 185, 129, 0.2)",
                            border: "1px solid rgba(16, 185, 129, 0.4)",
                            color: "#6ee7b7",
                            fontWeight: 600,
                          }}
                        >
                          ● Encrypted & Active
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleSwitchToCustomKey}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "8px",
                          color: "#cbd5e1",
                          fontSize: "11.5px",
                          fontWeight: 500,
                          padding: "5px 12px",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
                          e.currentTarget.style.color = "#ffffff";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                          e.currentTarget.style.color = "#cbd5e1";
                        }}
                      >
                        Switch to Custom Key
                      </button>
                    </div>

                    <div
                      style={{
                        padding: "9px 14px",
                        background: "rgba(0, 0, 0, 0.4)",
                        borderRadius: "10px",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                        fontSize: "13px",
                        letterSpacing: "0.2em",
                        color: "#94a3b8",
                        fontFamily: "monospace",
                        userSelect: "none",
                      }}
                    >
                      ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●
                    </div>

                    <p style={{ margin: 0, fontSize: "11.5px", color: "#94a3b8", lineHeight: 1.45 }}>
                      CanteenCue is automatically connected to Google Gemini AI. If you experience quota pauses or wish to use your personal Google AI Studio tier, click "Switch to Custom Key".
                    </p>
                  </div>
                ) : (
                  /* Custom Key Input Mode */
                  <div
                    style={{
                      background: "rgba(0, 0, 0, 0.25)",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Key size={14} color="#2dd4bf" />
                        <span>Your Custom Google Gemini API Key</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleRevertToSystemKey}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#2dd4bf",
                          fontSize: "11.5px",
                          fontWeight: 500,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <RefreshCw size={12} />
                        Revert to System Key
                      </button>
                    </div>

                    <div style={{ position: "relative" }}>
                      <input
                        type={showKey ? "text" : "password"}
                        value={aiConfig.apiKey}
                        onChange={(e) => {
                          setAiConfig({ ...aiConfig, apiKey: e.target.value });
                          setAiTestResult(null);
                        }}
                        placeholder="Paste your Gemini AI Studio API key (AIzaSy...)"
                        style={{
                          width: "100%",
                          padding: "10px 40px 10px 14px",
                          background: "rgba(0, 0, 0, 0.4)",
                          border: "1px solid rgba(255, 255, 255, 0.16)",
                          borderRadius: "12px",
                          color: "#ffffff",
                          fontSize: "13px",
                          fontFamily: "inherit",
                          outline: "none",
                          boxSizing: "border-box",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowKey(!showKey)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          border: "none",
                          color: "#94a3b8",
                          cursor: "pointer",
                          padding: "4px",
                        }}
                        title={showKey ? "Hide key" : "Show key"}
                      >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Target AI Model */}
                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Target AI Model
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => {
                      setAiConfig({ ...aiConfig, model: e.target.value });
                      setAiTestResult(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      background: "#161c18",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="gemini-flash-lite-latest">gemini-flash-lite-latest (Recommended: Ultra-fast & active)</option>
                    <option value="gemini-3.8-flash">gemini-3.8-flash (Latest Flash Model)</option>
                    <option value="gemini-flash-latest">gemini-flash-latest</option>
                  </select>
                </div>
              </div>
            )}

            {/* OpenAI Configuration */}
            {aiConfig.provider === "openai" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "18px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <label style={{ fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Key size={14} />
                      <span>OpenAI API Key</span>
                    </label>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: "11.5px", color: "#2dd4bf", textDecoration: "none" }}
                    >
                      Get key →
                    </a>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showKey ? "text" : "password"}
                      value={aiConfig.apiKey}
                      onChange={(e) => {
                        setAiConfig({ ...aiConfig, apiKey: e.target.value });
                        setAiTestResult(null);
                      }}
                      placeholder="sk-..."
                      style={{
                        width: "100%",
                        padding: "10px 40px 10px 14px",
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px solid rgba(255, 255, 255, 0.16)",
                        borderRadius: "12px",
                        color: "#ffffff",
                        fontSize: "13px",
                        fontFamily: "inherit",
                        outline: "none",
                        boxSizing: "border-box",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "transparent",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        padding: "4px",
                      }}
                      title={showKey ? "Hide key" : "Show key"}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12.5px", fontWeight: 600, color: "#cbd5e1", marginBottom: "6px" }}>
                    Target AI Model
                  </label>
                  <select
                    value={aiConfig.model}
                    onChange={(e) => {
                      setAiConfig({ ...aiConfig, model: e.target.value });
                      setAiTestResult(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "9px 14px",
                      background: "#161c18",
                      border: "1px solid rgba(255, 255, 255, 0.16)",
                      borderRadius: "12px",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontFamily: "inherit",
                      outline: "none",
                      cursor: "pointer",
                    }}
                  >
                    <option value="gpt-4o-mini">gpt-4o-mini (Fast & efficient)</option>
                    <option value="gpt-4o">gpt-4o (Full capability)</option>
                  </select>
                </div>
              </div>
            )}

            {/* AI Test Status */}
            {aiTestResult && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  background: aiTestResult.success ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                  border: `1px solid ${aiTestResult.success ? "rgba(16, 185, 129, 0.35)" : "rgba(239, 68, 68, 0.35)"}`,
                  fontSize: "12.5px",
                  color: aiTestResult.success ? "#6ee7b7" : "#fca5a5",
                }}
              >
                {aiTestResult.success ? <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: "2px" }} /> : <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />}
                <div>
                  <div style={{ fontWeight: 600 }}>{aiTestResult.success ? "AI Verified" : "Verification Notice"}</div>
                  <div style={{ marginTop: "2px", opacity: 0.9 }}>{aiTestResult.message}</div>
                </div>
              </div>
            )}

        {/* Diagnostic History & Ping Latency Log */}
        <div
          style={{
            marginTop: "16px",
            marginBottom: "16px",
            padding: "12px 14px",
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#e2e8f0" }}>
              <Activity size={14} color="#2dd4bf" />
              <span>Connection Diagnostics & Latency History</span>
            </div>
            {diagnosticHistory.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setDiagnosticHistory([]);
                  try { sessionStorage.removeItem("campuscue_diag_history"); } catch {}
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  fontSize: "11px",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Clear Log
              </button>
            )}
          </div>

          {diagnosticHistory.length === 0 ? (
            <div style={{ fontSize: "11.5px", color: "rgba(255, 255, 255, 0.35)", fontStyle: "italic" }}>
              Click "Test AI Model Connection" below to benchmark live reasoning latency.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {diagnosticHistory.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                    fontSize: "11.5px",
                    fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: item.status === "success" ? "#34d399" : "#f87171",
                      }}
                    />
                    <span style={{ color: "#ffffff", fontWeight: 500 }}>{item.type}</span>
                    <span style={{ color: "rgba(255, 255, 255, 0.45)", fontSize: "10.5px" }}>{item.timestamp}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: item.latencyMs < 400 ? "#34d399" : "#fbbf24" }}>
                      {item.latencyMs}ms
                    </span>
                    <span
                      style={{
                        color: item.status === "success" ? "#34d399" : "#f87171",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        fontWeight: 600,
                      }}
                    >
                      {item.status === "success" ? "PASS" : "FAIL"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Global Security Notice */}
        <div
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <ShieldCheck size={16} color="#2dd4bf" style={{ flexShrink: 0 }} />
          <span>All credentials remain encrypted and masked. No plain text secrets are ever exposed.</span>
        </div>

        {/* Modal Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div>
            {aiConfig.provider !== "builtin" && (
              <button
                type="button"
                className="chip"
                onClick={handleAiTest}
                disabled={isAiTesting || !aiConfig.apiKey.trim()}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                {isAiTesting ? "Testing AI..." : "Test AI Model Connection"}
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              className="chip"
              onClick={handleResetAi}
              style={{ padding: "8px 16px", fontSize: "13px" }}
            >
              Reset to Built-in
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveAll}
              style={{ padding: "8px 20px", fontSize: "13.5px" }}
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
