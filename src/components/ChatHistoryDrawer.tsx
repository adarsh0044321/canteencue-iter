import React, { useEffect, useState } from "react";
import {
  MessageSquare,
  Plus,
  Trash2,
  X,
  Clock,
  User,
  LogOut,
  LogIn,
  Sparkles,
  ShieldCheck,
  Search,
  Download,
} from "lucide-react";
import {
  ChatSession,
  getAllChatSessions,
  deleteChatSession,
  clearAllChatSessions,
} from "../services/chatDatabase";

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  userEmail: string | null;
  userId?: string | null;
  isGuest: boolean;
  onOpenLogin: () => void;
  onSignOut: () => void;
}

function formatSessionTimestamp(timestamp: number): string {
  if (!timestamp) return "Recent";
  const now = Date.now();
  const diffMin = Math.floor((now - timestamp) / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 2) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const ChatHistoryDrawer: React.FC<ChatHistoryDrawerProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onSelectSession,
  onNewChat,
  userEmail,
  userId,
  isGuest,
  onOpenLogin,
  onSignOut,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentUserId = userEmail || userId || "guest";

  // Load chat sessions whenever drawer opens
  useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;
    getAllChatSessions(currentUserId, userId || undefined)
      .then((all) => {
        if (!isCancelled) {
          setSessions(all);
          setIsLoadingSessions(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("Failed to load chat history:", err);
          setIsLoadingSessions(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, currentUserId, userId]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (currentSessionId === id) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to clear your past food decision chats?")) {
      await clearAllChatSessions(currentUserId);
      setSessions([]);
      onNewChat();
    }
  };

  const handleExportHistory = () => {
    if (sessions.length === 0) return;
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `campuscue-decisions-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter((session) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      session.title.toLowerCase().includes(q) ||
      session.messages.some(
        (m) =>
          m.text?.toLowerCase().includes(q) ||
          m.decision?.summaryText?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <>
      {/* Frosted Backdrop Scrim: Blurs the active chatbot page behind it */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.58)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          zIndex: 998,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Slide-out Glassmorphic Sidebar Drawer */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "min(360px, 88vw)",
          background: "rgba(8, 12, 11, 0.82)",
          backdropFilter: "blur(36px) saturate(180%)",
          WebkitBackdropFilter: "blur(36px) saturate(180%)",
          borderRight: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "20px 0 60px rgba(0, 0, 0, 0.75), inset -1px 0 0 rgba(255, 255, 255, 0.06)",
          zIndex: 999,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
          color: "#ffffff",
          fontFamily: 'var(--font-display, "Sora", sans-serif)',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "20px 22px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(20, 184, 166, 0.28) 0%, rgba(13, 148, 136, 0.15) 100%)",
                border: "1px solid rgba(20, 184, 166, 0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2dd4bf",
                boxShadow: "0 0 16px rgba(20, 184, 166, 0.2)",
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display, "Sora", sans-serif)',
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  textTransform: "uppercase",
                }}
              >
                Past Decisions
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: "10px",
                  letterSpacing: "0.14em",
                  color: "rgba(255, 255, 255, 0.4)",
                  textTransform: "uppercase",
                }}
              >
                CanteenCue Memory
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "8px",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.color = "#ffffff";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.14)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.color = "#94a3b8";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
            }}
            title="Close Drawer (Esc)"
          >
            <X size={15} />
          </button>
        </div>

        {/* Action: Start New Decision */}
        <div style={{ padding: "16px 20px 8px" }}>
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onClose();
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)",
              border: "1px solid rgba(20, 184, 166, 0.38)",
              borderRadius: "10px",
              color: "#2dd4bf",
              fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.25s ease",
              boxShadow: "0 4px 18px rgba(0, 0, 0, 0.2)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(20, 184, 166, 0.32) 0%, rgba(13, 148, 136, 0.2) 100%)";
              e.currentTarget.style.borderColor = "rgba(20, 184, 166, 0.65)";
              e.currentTarget.style.boxShadow = "0 0 20px rgba(20, 184, 166, 0.3)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.1) 100%)";
              e.currentTarget.style.borderColor = "rgba(20, 184, 166, 0.38)";
              e.currentTarget.style.boxShadow = "0 4px 18px rgba(0, 0, 0, 0.2)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <Plus size={15} />
            <span>New Decision</span>
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div style={{ padding: "0 20px 8px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              padding: "7px 10px",
            }}
          >
            <Search size={13} color="rgba(255, 255, 255, 0.45)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search past decisions..."
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#ffffff",
                fontSize: "12px",
                fontFamily: 'var(--font-display, "Sora", sans-serif)',
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Database History Stats & Export Toolbar */}
        <div
          style={{
            padding: "0 20px 8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "10.5px",
            fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
            color: "rgba(255, 255, 255, 0.45)",
          }}
        >
          <span>
            {filteredSessions.length} {filteredSessions.length === 1 ? "DECISION" : "DECISIONS"}
          </span>
          {sessions.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button
                type="button"
                onClick={handleExportHistory}
                style={{
                  background: "none",
                  border: "none",
                  color: "#2dd4bf",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "10.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                }}
                title="Export chat history as JSON"
              >
                <Download size={11} /> Export
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(239, 68, 68, 0.75)",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "10.5px",
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                }}
                title="Clear all saved sessions"
              >
                <Trash2 size={11} /> Clear
              </button>
            </div>
          )}
        </div>

        {/* Sessions Feed */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "7px",
          }}
        >
          {isLoadingSessions ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "48px 10px",
                color: "rgba(255, 255, 255, 0.4)",
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: "12px",
                letterSpacing: "0.1em",
                gap: "10px",
              }}
            >
              <Clock size={18} />
              <span>Loading saved chats...</span>
            </div>
          ) : sessions.length === 0 ? (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "12px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px dashed rgba(255, 255, 255, 0.16)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <MessageSquare size={18} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)', letterSpacing: "0.08em" }}>
                NO PAST SESSIONS
              </div>
              <div style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.35)", maxWidth: "210px", lineHeight: 1.5 }}>
                Your canteen conversations and food choices will appear here automatically.
              </div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div
              style={{
                padding: "40px 16px",
                textAlign: "center",
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "12px",
              }}
            >
              No decisions match "{searchQuery}"
            </div>
          ) : (
            filteredSessions.map((session) => {
              const isCurrent = session.id === currentSessionId;
              const msgCount = session.messages?.length || 0;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  style={{
                    position: "relative",
                    padding: "11px 14px",
                    borderRadius: "10px",
                    background: isCurrent
                      ? "linear-gradient(135deg, rgba(20, 184, 166, 0.18) 0%, rgba(13, 148, 136, 0.08) 100%)"
                      : "rgba(255, 255, 255, 0.03)",
                    border: isCurrent
                      ? "1px solid rgba(20, 184, 166, 0.45)"
                      : "1px solid rgba(255, 255, 255, 0.07)",
                    boxShadow: isCurrent
                      ? "0 4px 18px rgba(20, 184, 166, 0.12)"
                      : "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "10px",
                    transition: "all 0.18s ease",
                  }}
                  onMouseOver={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.07)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.18)";
                      e.currentTarget.style.transform = "translateX(2px)";
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isCurrent) {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                      e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
                      e.currentTarget.style.transform = "translateX(0)";
                    }
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-display, "Sora", sans-serif)',
                        fontSize: "13px",
                        fontWeight: isCurrent ? 500 : 400,
                        color: isCurrent ? "#2dd4bf" : "#f1f5f9",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        marginBottom: "3px",
                      }}
                      title={session.title || "Campus Food Decision"}
                    >
                      {session.title || "Campus Food Decision"}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                        fontSize: "10px",
                        letterSpacing: "0.06em",
                        color: "rgba(255, 255, 255, 0.4)",
                      }}
                    >
                      <span>{formatSessionTimestamp(session.updatedAt || session.createdAt)}</span>
                      <span>•</span>
                      <span>{msgCount} {msgCount === 1 ? "turn" : "turns"}</span>
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(255, 255, 255, 0.3)",
                      padding: "6px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.color = "#f87171";
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.16)";
                    }}
                    onMouseOut={(e) => {
                      e.stopPropagation();
                      e.currentTarget.style.color = "rgba(255, 255, 255, 0.3)";
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Delete Chat"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Clear All Chats Link */}
        {sessions.length > 2 && (
          <div style={{ padding: "4px 20px 8px", textAlign: "right" }}>
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.32)",
                fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "underline",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#f87171")}
              onMouseOut={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.32)")}
            >
              Clear all history
            </button>
          </div>
        )}

        {/* Drawer Footer: User Profile & Authentication Status */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
          }}
        >
          {userEmail && !isGuest ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                    color: "#ffffff",
                    flexShrink: 0,
                    textTransform: "uppercase",
                    boxShadow: "0 0 12px rgba(20, 184, 166, 0.35)",
                  }}
                >
                  {userEmail.charAt(0)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Sora", sans-serif)',
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "160px",
                    }}
                    title={userEmail}
                  >
                    {userEmail}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      color: "#2dd4bf",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      textTransform: "uppercase",
                    }}
                  >
                    <ShieldCheck size={11} />
                    <span>Verified Student</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSignOut();
                  onClose();
                }}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: "8px",
                  color: "#94a3b8",
                  padding: "7px 11px",
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: "10.5px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "all 0.18s ease",
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = "#f87171";
                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.4)";
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.14)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = "#94a3b8";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.12)";
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                }}
                title="Sign Out"
              >
                <LogOut size={12} />
                <span>Exit</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <User size={16} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display, "Sora", sans-serif)',
                      fontSize: "12.5px",
                      fontWeight: 500,
                      color: "#ffffff",
                    }}
                  >
                    Guest Student
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      color: "rgba(255, 255, 255, 0.4)",
                      textTransform: "uppercase",
                    }}
                  >
                    Not signed in
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                style={{
                  background: "linear-gradient(135deg, rgba(20, 184, 166, 0.25) 0%, rgba(13, 148, 136, 0.18) 100%)",
                  border: "1px solid rgba(20, 184, 166, 0.42)",
                  borderRadius: "8px",
                  color: "#2dd4bf",
                  padding: "7px 14px",
                  fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                  fontSize: "11px",
                  fontWeight: 500,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  boxShadow: "0 2px 10px rgba(20, 184, 166, 0.15)",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(20, 184, 166, 0.4) 0%, rgba(13, 148, 136, 0.28) 100%)";
                  e.currentTarget.style.borderColor = "rgba(20, 184, 166, 0.7)";
                  e.currentTarget.style.boxShadow = "0 0 16px rgba(20, 184, 166, 0.3)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "linear-gradient(135deg, rgba(20, 184, 166, 0.25) 0%, rgba(13, 148, 136, 0.18) 100%)";
                  e.currentTarget.style.borderColor = "rgba(20, 184, 166, 0.42)";
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(20, 184, 166, 0.15)";
                }}
              >
                <LogIn size={13} />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
