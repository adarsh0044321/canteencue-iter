import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  UtensilsCrossed,
  BookOpen,
  Bot,
  Flame,
  Search,
  X,
  Trash2,
  LogOut,
  LogIn,
  Menu,
  MessageSquare,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  ChatSession,
  getAllChatSessions,
  deleteChatSession,
} from "../services/chatDatabase";
import { AvatarGraphic } from "./AvatarGraphic";
import { CUTE_AVATARS } from "../data/avatars";

interface SidebarNavigationProps {
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  // Navigation Callbacks
  onNewDecision: () => void;
  onOpenMenuModal: () => void;
  onOpenApiConfigModal: () => void;
  onOpenQuickOptions: () => void;
  // Chat History Callbacks
  currentSessionId: string;
  onSelectSession: (session: ChatSession) => void;
  // Auth state
  userEmail: string | null;
  userId?: string | null;
  isGuest: boolean;
  onOpenLogin: () => void;
  onSignOut: () => void;
  // AI State
  isAiApiActive?: boolean;
  // Cute Avatar Mascot
  currentAvatarId: string;
  onOpenAvatarPicker: () => void;
}

function formatRelativeTime(timestamp: number): string {
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

function extractDisplayName(email: string | null, isGuest: boolean): string {
  if (isGuest || !email) return "Guest Student";
  const prefix = email.split("@")[0];
  const parts = prefix.split(/[._-]+/);
  return parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(" ");
}

export const SidebarNavigation: React.FC<SidebarNavigationProps> = ({
  isCollapsed,
  onToggleCollapsed,
  isMobileOpen,
  onCloseMobile,
  onNewDecision,
  onOpenMenuModal,
  onOpenApiConfigModal,
  onOpenQuickOptions,
  currentSessionId,
  onSelectSession,
  userEmail,
  userId,
  isGuest,
  onOpenLogin,
  onSignOut,
  isAiApiActive = false,
  currentAvatarId,
  onOpenAvatarPicker,
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeUserId = userEmail || userId || "guest";

  // Refresh sessions when active user or current session changes
  useEffect(() => {
    let isCancelled = false;
    getAllChatSessions(activeUserId, userId || undefined)
      .then((all) => {
        if (!isCancelled) setSessions(all);
      })
      .catch((err) => {
        console.warn("Failed to load sidebar chat sessions:", err);
      });
    return () => {
      isCancelled = true;
    };
  }, [activeUserId, userId, currentSessionId]);

  // Periodic poll to pick up newly saved decisions
  useEffect(() => {
    let isCancelled = false;
    const interval = setInterval(() => {
      getAllChatSessions(activeUserId, userId || undefined)
        .then((all) => {
          if (!isCancelled) setSessions(all);
        })
        .catch(() => {});
    }, 6000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeUserId, userId]);

  // Filter sessions based on search input
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter((s) => {
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchMsg = s.messages.some((m) =>
        (m.text || "").toLowerCase().includes(q)
      );
      return matchTitle || matchMsg;
    });
  }, [sessions, searchQuery]);

  // Handle session deletion
  const handleDeleteSession = async (
    e: React.MouseEvent,
    sessionId: string
  ) => {
    e.stopPropagation();
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (sessionId === currentSessionId) {
        onNewDecision();
      }
    } catch (err) {
      console.warn("Failed to delete session:", err);
    }
  };

  const displayName = extractDisplayName(userEmail, isGuest);
  const currentAvatarMeta = CUTE_AVATARS.find((a) => a.id === currentAvatarId) || CUTE_AVATARS[0];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          aria-label="Close navigation sidebar"
        />
      )}

      <aside
        className={`sidebar-rail ${isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"} ${
          isMobileOpen ? "sidebar-mobile-visible" : ""
        }`}
        aria-label="Main Navigation Sidebar"
      >
        {/* Top Header: Logo, Brand & Clean Hamburger Toggle (Matches reference design) */}
        <div className="sidebar-header">
          {!isCollapsed ? (
            <div className="sidebar-brand-group">
              <a
                href="#"
                className="sidebar-brand"
                onClick={(e) => {
                  e.preventDefault();
                  onNewDecision();
                  onCloseMobile();
                }}
              >
                <img
                  src="/logo.png"
                  alt="CanteenCue Monogram"
                  className="sidebar-logo-img"
                  width={32}
                  height={32}
                />
                <span className="sidebar-brand-text">
                  Canteen<span className="brand-accent">Cue</span>
                </span>
              </a>
              <button
                type="button"
                className="sidebar-icon-btn sidebar-collapse-trigger"
                onClick={onToggleCollapsed}
                title="Collapse sidebar rail"
                aria-label="Collapse sidebar rail"
              >
                <Menu size={18} />
              </button>
            </div>
          ) : (
            <div className="sidebar-brand-collapsed">
              <button
                type="button"
                className="sidebar-brand-collapsed-btn"
                onClick={onToggleCollapsed}
                title="Expand sidebar rail"
                aria-label="Expand sidebar rail"
                onMouseEnter={() => setHoveredTooltip("expand")}
                onMouseLeave={() => setHoveredTooltip(null)}
              >
                <img
                  src="/logo.png"
                  alt="CanteenCue Logo"
                  className="sidebar-logo-img"
                  width={30}
                  height={30}
                />
                {hoveredTooltip === "expand" && (
                  <div className="sidebar-rail-tooltip">Expand sidebar</div>
                )}
              </button>
              <button
                type="button"
                className="sidebar-icon-btn sidebar-expand-trigger"
                onClick={onToggleCollapsed}
                title="Expand sidebar rail"
                aria-label="Expand sidebar rail"
              >
                <Menu size={17} />
              </button>
            </div>
          )}
        </div>

        {/* Search Bar (or Collapsed Search Trigger) */}
        {!isCollapsed ? (
          <div className="sidebar-search-box">
            <Search size={14} className="sidebar-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search decisions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sidebar-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="sidebar-search-clear"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>
        ) : (
          <div className="sidebar-collapsed-action">
            <button
              type="button"
              className="sidebar-nav-item-collapsed"
              onClick={() => {
                onToggleCollapsed();
                setTimeout(() => searchInputRef.current?.focus(), 150);
              }}
              onMouseEnter={() => setHoveredTooltip("search")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="Search past decisions"
            >
              <Search size={18} />
              {hoveredTooltip === "search" && (
                <div className="sidebar-rail-tooltip">Search Decisions</div>
              )}
            </button>
          </div>
        )}

        {/* Primary CTA: New Decision (Pure Matte Black / Dark Glass - No green) */}
        <div className="sidebar-section-cta">
          {!isCollapsed ? (
            <button
              type="button"
              className="sidebar-btn-new-decision"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
            >
              <UtensilsCrossed size={16} />
              <span>New Decision</span>
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-nav-item-collapsed sidebar-cta-collapsed"
              onClick={() => {
                onNewDecision();
                onCloseMobile();
              }}
              onMouseEnter={() => setHoveredTooltip("new-chat")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="Start new food decision"
            >
              <UtensilsCrossed size={18} />
              {hoveredTooltip === "new-chat" && (
                <div className="sidebar-rail-tooltip">New Decision</div>
              )}
            </button>
          )}
        </div>

        {/* Main Navigation Utility Links (Monochrome Dark Glass - No green) */}
        <div className="sidebar-nav-list">
          {/* Canteen Menu Catalog */}
          {!isCollapsed ? (
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onOpenMenuModal();
                onCloseMobile();
              }}
            >
              <BookOpen size={16} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">Canteen Menu</span>
              <span className="sidebar-badge">6 Outlets</span>
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-nav-item-collapsed"
              onClick={() => {
                onOpenMenuModal();
                onCloseMobile();
              }}
              onMouseEnter={() => setHoveredTooltip("menu")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="View Canteen Menu Catalog"
            >
              <BookOpen size={18} />
              {hoveredTooltip === "menu" && (
                <div className="sidebar-rail-tooltip">Canteen Menu (6 Outlets)</div>
              )}
            </button>
          )}

          {/* AI Model Settings (Pure Dark Monochrome - No green) */}
          {!isCollapsed ? (
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onOpenApiConfigModal();
                onCloseMobile();
              }}
            >
              <Bot size={16} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">AI Settings</span>
              <span className="sidebar-badge">
                {isAiApiActive ? "Gemini" : "Built-in"}
              </span>
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-nav-item-collapsed"
              onClick={() => {
                onOpenApiConfigModal();
                onCloseMobile();
              }}
              onMouseEnter={() => setHoveredTooltip("ai-settings")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="AI Model Settings"
            >
              <Bot size={18} />
              {hoveredTooltip === "ai-settings" && (
                <div className="sidebar-rail-tooltip">
                  {isAiApiActive ? "AI Settings (Gemini)" : "AI Settings (Built-in)"}
                </div>
              )}
            </button>
          )}

          {/* Craving Filters Helper (Replaces generic sliders with culinary Flame) */}
          {!isCollapsed ? (
            <button
              type="button"
              className="sidebar-nav-item"
              onClick={() => {
                onOpenQuickOptions();
                onCloseMobile();
              }}
            >
              <Flame size={16} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">Craving Helper</span>
            </button>
          ) : (
            <button
              type="button"
              className="sidebar-nav-item-collapsed"
              onClick={() => {
                onOpenQuickOptions();
                onCloseMobile();
              }}
              onMouseEnter={() => setHoveredTooltip("quick-options")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="Craving & Dietary Filters"
            >
              <Flame size={18} />
              {hoveredTooltip === "quick-options" && (
                <div className="sidebar-rail-tooltip">Craving Helper</div>
              )}
            </button>
          )}

          {/* Collapsed Past Decisions Quick Icon */}
          {isCollapsed && (
            <button
              type="button"
              className="sidebar-nav-item-collapsed"
              onClick={onToggleCollapsed}
              onMouseEnter={() => setHoveredTooltip("history")}
              onMouseLeave={() => setHoveredTooltip(null)}
              aria-label="Past food decisions"
            >
              <Clock size={18} />
              {sessions.length > 0 && (
                <span className="sidebar-badge-count">{sessions.length}</span>
              )}
              {hoveredTooltip === "history" && (
                <div className="sidebar-rail-tooltip">
                  Past Decisions (7 days) ({sessions.length})
                </div>
              )}
            </button>
          )}
        </div>

        {/* Expanded Decisions History Section */}
        {!isCollapsed && (
          <div className="sidebar-history-section">
            <div className="sidebar-section-header">
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span className="sidebar-section-title">PAST DECISIONS</span>
                <span
                  className="sidebar-retention-pill"
                  title="Decision history is preserved for 7 days to keep storage fast and light"
                >
                  (7 days)
                </span>
              </div>
              <span className="sidebar-section-count">
                {filteredSessions.length}
              </span>
            </div>

            <div className="sidebar-history-list">
              {filteredSessions.length === 0 ? (
                <div className="sidebar-history-empty">
                  {searchQuery
                    ? "No matching decisions found"
                    : "No decisions yet. Ask CanteenCue what to eat!"}
                </div>
              ) : (
                filteredSessions.map((session) => {
                  const isActive = session.id === currentSessionId;
                  return (
                    <div
                      key={session.id}
                      className={`sidebar-session-item ${
                        isActive ? "session-active" : ""
                      }`}
                      onClick={() => {
                        onSelectSession(session);
                        onCloseMobile();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          onSelectSession(session);
                          onCloseMobile();
                        }
                      }}
                    >
                      <MessageSquare size={14} className="session-item-icon" />
                      <div className="session-item-content">
                        <div className="session-item-title" title={session.title}>
                          {session.title || "Food Decision"}
                        </div>
                        <div className="session-item-meta">
                          {formatRelativeTime(session.updatedAt || session.createdAt)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="session-item-delete"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        title="Delete decision"
                        aria-label="Delete decision"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Bottom Student Profile Card with Cute Mascot & Mascot Switcher */}
        <div className="sidebar-footer">
          {!isCollapsed ? (
            <div className="sidebar-user-card">
              <div
                className="sidebar-user-avatar-wrap"
                onClick={onOpenAvatarPicker}
                title="Click to change your foodie mascot"
                style={{ cursor: "pointer" }}
              >
                <AvatarGraphic avatarId={currentAvatarId} size={36} />
                <span
                  className="sidebar-online-indicator"
                  title="Session Connected"
                />
              </div>

              <div
                className="sidebar-user-info"
                onClick={onOpenAvatarPicker}
                title="Click to customize mascot"
                style={{ cursor: "pointer" }}
              >
                <div className="sidebar-user-name" title={displayName}>
                  {displayName}
                </div>
                <div
                  className="sidebar-user-email"
                  title={userEmail || "Guest Student"}
                >
                  <span className="sidebar-mascot-pill">{currentAvatarMeta.name}</span>
                  <span className="sidebar-email-text">{userEmail || "Guest Mode"}</span>
                </div>
              </div>

              <div className="sidebar-user-actions">
                <button
                  type="button"
                  className="sidebar-user-btn"
                  onClick={onOpenAvatarPicker}
                  title="Change mascot avatar"
                  aria-label="Change mascot avatar"
                >
                  <Sparkles size={14} />
                </button>
                {userEmail && !isGuest ? (
                  <button
                    type="button"
                    className="sidebar-user-btn"
                    onClick={onSignOut}
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="sidebar-user-btn sidebar-signin-btn"
                    onClick={() => {
                      onOpenLogin();
                      onCloseMobile();
                    }}
                    title="Sign In with College Email"
                    aria-label="Sign In"
                  >
                    <LogIn size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="sidebar-footer-collapsed">
              <button
                type="button"
                className="sidebar-avatar-btn-collapsed"
                onClick={onOpenAvatarPicker}
                onMouseEnter={() => setHoveredTooltip("profile")}
                onMouseLeave={() => setHoveredTooltip(null)}
                aria-label={`Current mascot: ${currentAvatarMeta.name}. Click to change.`}
              >
                <AvatarGraphic avatarId={currentAvatarId} size={36} />
                <span className="sidebar-online-indicator" />
                {hoveredTooltip === "profile" && (
                  <div className="sidebar-rail-tooltip sidebar-profile-tooltip">
                    <div className="tooltip-name">{currentAvatarMeta.name}</div>
                    <div className="tooltip-email">
                      {displayName} • {userEmail || "Guest Student"}
                    </div>
                    <div className="tooltip-action">
                      Click to change mascot avatar ✨
                    </div>
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
