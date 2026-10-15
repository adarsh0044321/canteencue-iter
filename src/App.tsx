import React, { useState, useEffect, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { Header } from "./components/Header";
import { BackgroundAtmosphere } from "./components/BackgroundAtmosphere";
import { Hero } from "./components/Hero";
import { ChatWorkspace } from "./components/ChatWorkspace";
import { MenuModal } from "./components/MenuModal";
import { QuickOptionsModal } from "./components/QuickOptionsModal";
import { ApiConfigModal } from "./components/ApiConfigModal";
import { LoginPage } from "./components/LoginPage";
import { SidebarNavigation } from "./components/SidebarNavigation";
import { AvatarModal } from "./components/AvatarModal";
import { getStoredAvatarId, setStoredAvatarId } from "./data/avatars";
import { ChatMessage, UserPreferenceState, RecommendationCandidate } from "./data/types";
import { INITIAL_PREFERENCE_STATE } from "./engine/conversationState";
import { getStoredAiConfig, AiConfig } from "./services/aiService";
import { routeUserDecision } from "./services/hybridRouter";
import {
  saveChatSession,
  getChatSession,
  ChatSession,
} from "./services/chatDatabase";
import { syncChatMessageToSupabase } from "./services/supabaseClient";
import {
  getInitialSession,
  subscribeToAuthChanges,
  signOutUser,
  isGuestModeActive,
  setGuestMode,
} from "./services/authService";

// Helper to check if a Supabase session or guest state exists synchronously before initial async fetch
function hasLikelyStoredSession(): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) return false;
    if (isGuestModeActive()) return true;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
        const item = localStorage.getItem(key);
        if (item && item.includes("access_token")) return true;
      }
    }
  } catch {}
  return false;
}

export const App: React.FC = () => {
  // Authentication & Guest State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState<boolean>(() => isGuestModeActive());
  const [isAuthInitializing, setIsAuthInitializing] = useState<boolean>(() => hasLikelyStoredSession());

  // Mascot Avatar State (Randomized on first visit, switchable anytime)
  const [currentAvatarId, setCurrentAvatarId] = useState<string>(() => getStoredAvatarId());

  // Unified Mutually Exclusive Modal State (Closes previous modal when new one opens)
  const [activeModal, setActiveModal] = useState<
    "none" | "menu" | "quick_options" | "api_config" | "avatar" | "login"
  >("none");

  const isMenuModalOpen = activeModal === "menu";
  const isQuickOptionsOpen = activeModal === "quick_options";
  const isApiConfigOpen = activeModal === "api_config";
  const isAvatarModalOpen = activeModal === "avatar";
  const isLoginModalOpen = activeModal === "login";

  const closeAllModals = useCallback(() => {
    setActiveModal("none");
  }, []);

  const openMenuModal = useCallback(() => {
    setActiveModal("menu");
  }, []);

  const openQuickOptions = useCallback(() => {
    setActiveModal("quick_options");
  }, []);

  const openApiConfig = useCallback(() => {
    setActiveModal("api_config");
  }, []);

  const openAvatarPicker = useCallback(() => {
    setActiveModal("avatar");
  }, []);

  const openLogin = useCallback(() => {
    setActiveModal("login");
  }, []);

  // Close modals on Escape key
  useEffect(() => {
    if (activeModal === "none") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeAllModals();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModal, closeAllModals]);

  // Sidebar Navigation State (Desktop collapsed rail vs expanded + Mobile drawer)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem("canteencue_sidebar_collapsed") === "true";
    } catch {
      return false;
    }
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Active Session State
  const [sessionId, setSessionId] = useState<string>(() => "session_" + Date.now());
  const [sessionTitle, setSessionTitle] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [preferenceState, setPreferenceState] = useState<UserPreferenceState>(INITIAL_PREFERENCE_STATE);
  const [lastPrimary, setLastPrimary] = useState<RecommendationCandidate | undefined>(undefined);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [aiConfig, setAiConfig] = useState<AiConfig>(getStoredAiConfig());

  // Session rate limiting (max 25 requests per session)
  const [requestCount, setRequestCount] = useState<number>(0);
  const MAX_SESSION_REQUESTS = 25;

  const isChatActive = messages.length > 0;
  const isAiApiActive = aiConfig.provider !== "builtin" && !!aiConfig.apiKey.trim();

  // 1. Initialize Supabase Auth & Session Check (Fast, Non-Blocking)
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { user } = await getInitialSession();
        if (isMounted) {
          if (user) {
            setCurrentUser(user);
            setIsGuest(false);
          } else {
            setIsGuest(isGuestModeActive());
          }
        }
      } catch (err) {
        console.warn("Auth initialization warning:", err);
      } finally {
        if (isMounted) {
          setIsAuthInitializing(false);
        }
      }
    }

    initAuth();

    const unsubscribe = subscribeToAuthChanges((user) => {
      if (isMounted) {
        if (user) {
          setCurrentUser(user);
          setIsGuest(false);
          if (typeof window !== "undefined" && (window.location.hash || window.location.search)) {
            window.history.replaceState(null, "", window.location.pathname);
          }
        } else {
          setCurrentUser(null);
        }
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const TAB_SESSION_STORAGE_KEY = "canteencue_tab_session_id";
  const activeUserId = currentUser?.email || currentUser?.id || "guest";

  // Start fresh decision
  const handleNewChat = useCallback(() => {
    closeAllModals();
    setIsMobileSidebarOpen(false);
    const newId = "session_" + Date.now();
    setSessionId(newId);
    setSessionTitle("");
    setMessages([]);
    setPreferenceState(INITIAL_PREFERENCE_STATE);
    setLastPrimary(undefined);
    setRequestCount(0);
    try {
      sessionStorage.removeItem(TAB_SESSION_STORAGE_KEY);
    } catch {}
  }, [closeAllModals]);

  // 2. Restore active tab session if present (tab-isolated: page refresh retains session, new tab starts fresh)
  useEffect(() => {
    async function restoreActiveTabSession() {
      try {
        const storedTabSessionId = sessionStorage.getItem(TAB_SESSION_STORAGE_KEY);
        if (storedTabSessionId) {
          const session = await getChatSession(storedTabSessionId);
          if (session && session.messages.length > 0 && (session.userId || "guest") === activeUserId) {
            setSessionId(session.id);
            setSessionTitle(session.title || "Campus Food Decision");
            setMessages(session.messages);
            setPreferenceState(session.preferenceState || INITIAL_PREFERENCE_STATE);
            const lastWithPrimary = [...session.messages]
              .reverse()
              .find((m) => m.sender === "assistant" && m.decision?.primaryItem);
            if (lastWithPrimary?.decision?.primaryItem) {
              setLastPrimary(lastWithPrimary.decision.primaryItem);
            }
            return;
          }
        }
        // If no tab session exists or it belonged to a different user, start a fresh session
        handleNewChat();
      } catch (e) {
        console.warn("Could not restore tab session:", e);
      }
    }
    restoreActiveTabSession();
  }, [activeUserId, handleNewChat]);

  // Persist session to local DB & cloud
  const persistSession = async (
    targetSessionId: string,
    targetTitle: string,
    targetMessages: ChatMessage[],
    targetState: UserPreferenceState
  ) => {
    if (targetMessages.length === 0) return;
    const sessionObj: ChatSession = {
      id: targetSessionId,
      userId: activeUserId,
      title: targetTitle || "Campus Food Decision",
      createdAt: parseInt(targetSessionId.replace("session_", "") || String(Date.now())),
      updatedAt: Date.now(),
      messages: targetMessages,
      preferenceState: targetState,
    };
    try {
      await saveChatSession(sessionObj);
      sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, targetSessionId);
    } catch (e) {
      console.warn("Failed to persist session to local DB:", e);
    }
  };

  // Select an existing past chat from drawer
  const handleSelectSession = (session: ChatSession) => {
    closeAllModals();
    setIsMobileSidebarOpen(false);
    setSessionId(session.id);
    setSessionTitle(session.title || "Campus Food Decision");
    setMessages(session.messages || []);
    setPreferenceState(session.preferenceState || INITIAL_PREFERENCE_STATE);
    const lastWithPrimary = [...(session.messages || [])]
      .reverse()
      .find((m) => m.sender === "assistant" && m.decision?.primaryItem);
    setLastPrimary(lastWithPrimary?.decision?.primaryItem || undefined);
    try {
      sessionStorage.setItem(TAB_SESSION_STORAGE_KEY, session.id);
    } catch {}
  };

  const handleSignOut = async () => {
    await signOutUser();
    setCurrentUser(null);
    setIsGuest(false);
    setGuestMode(false);
    try {
      sessionStorage.removeItem(TAB_SESSION_STORAGE_KEY);
    } catch {}
    handleNewChat();
  };

  const handleConfigSaved = () => {
    setAiConfig(getStoredAiConfig());
  };

  const handleUserSubmit = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    // Quick action trigger for AI settings
    if (userText.trim().toLowerCase() === "open ai settings") {
      openApiConfig();
      return;
    }

    // Check rate limiting
    if (requestCount >= MAX_SESSION_REQUESTS) {
      const limitMsg: ChatMessage = {
        id: `limit-${Date.now()}`,
        sender: "assistant",
        timestamp: Date.now(),
        decision: {
          type: "redirect",
          summaryText:
            "You've reached the active session limit for this conversation. Feel free to click 'New Decision' in the top bar to start fresh and continue exploring.",
          whyFitsList: [],
          alternatives: [],
          suggestedFollowUps: ["Start a new decision"],
          activePreferences: preferenceState,
        },
      };
      setMessages((prev) => [...prev, limitMsg]);
      return;
    }

    setRequestCount((c) => c + 1);

    // Generate initial session title if first message
    let activeTitle = sessionTitle;
    if (!activeTitle) {
      activeTitle = userText.length > 34 ? `${userText.slice(0, 34)}...` : userText;
      setSessionTitle(activeTitle);
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      timestamp: Date.now(),
      text: userText,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    syncChatMessageToSupabase(sessionId, userMsg, currentUser?.email, activeTitle).catch(() => {});
    persistSession(sessionId, activeTitle, nextHistory, preferenceState);

    setIsLoading(true);

    try {
      // Minimum duration for the thinking phase so rotating statements can cycle smoothly
      const thinkingDelay = new Promise((resolve) => setTimeout(resolve, 850));
      const decisionPromise = routeUserDecision(
        userText,
        nextHistory,
        preferenceState,
        lastPrimary
      );

      const [_, result] = await Promise.all([thinkingDelay, decisionPromise]);

      setPreferenceState(result.nextState);
      if (result.response.primaryItem) {
        setLastPrimary(result.response.primaryItem);
        // Elevate session title with recommended food item name
        activeTitle = `${result.response.primaryItem.item.name} (${result.response.primaryItem.item.shop})`;
        setSessionTitle(activeTitle);
      }

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        timestamp: Date.now(),
        decision: result.response,
      };

      const finalHistory = [...nextHistory, assistantMsg];
      setMessages(finalHistory);
      syncChatMessageToSupabase(sessionId, assistantMsg, currentUser?.email, activeTitle).catch(() => {});
      persistSession(sessionId, activeTitle, finalHistory, result.nextState);
    } catch (err) {
      console.error("Decision engine error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAvatar = useCallback((id: string) => {
    setStoredAvatarId(id);
    setCurrentAvatarId(id);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsMobileSidebarOpen((prev) => !prev);
    } else {
      setIsSidebarCollapsed((prev) => {
        const next = !prev;
        try {
          localStorage.setItem("canteencue_sidebar_collapsed", String(next));
        } catch {}
        return next;
      });
    }
  }, []);


  // While determining session, show subtle ambient loader so LoginPage never flashes on refresh
  if (isAuthInitializing) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#080c0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <img
            src="/logo.png"
            alt="CanteenCue"
            style={{
              width: "56px",
              height: "56px",
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    );
  }

  // If user is neither signed in nor a guest, show the LoginPage gateway
  if (!currentUser && !isGuest) {
    return (
      <LoginPage
        onAuthSuccess={async () => {
          const { user } = await getInitialSession();
          if (user) setCurrentUser(user);
          setIsGuest(false);
          closeAllModals();
        }}
        onContinueAsGuest={() => {
          setGuestMode(true);
          setIsGuest(true);
          closeAllModals();
        }}
      />
    );
  }

  return (
    <div
      className={`app-container ${
        isSidebarCollapsed ? "sidebar-collapsed-layout" : "sidebar-expanded-layout"
      }`}
    >
      {/* Living Atmospheric Background */}
      <BackgroundAtmosphere />

      {/* Modern Collapsible Sidebar Navigation (Dual-mode desktop rail + mobile drawer) */}
      <SidebarNavigation
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => {
          setIsSidebarCollapsed((prev) => {
            const next = !prev;
            try {
              localStorage.setItem("canteencue_sidebar_collapsed", String(next));
            } catch {}
            return next;
          });
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onNewDecision={handleNewChat}
        onOpenMenuModal={openMenuModal}
        onOpenApiConfigModal={openApiConfig}
        onOpenQuickOptions={openQuickOptions}
        currentSessionId={sessionId}
        onSelectSession={handleSelectSession}
        userEmail={currentUser?.email || null}
        userId={currentUser?.id || null}
        isGuest={isGuest}
        onOpenLogin={openLogin}
        onSignOut={handleSignOut}
        isAiApiActive={isAiApiActive}
        currentAvatarId={currentAvatarId}
        onOpenAvatarPicker={openAvatarPicker}
      />

      {/* Streamlined Minimal Header (Clean logo + name + sidebar toggle) */}
      <Header
        onToggleSidebar={handleToggleSidebar}
        onReset={handleNewChat}
        isChatActive={isChatActive}
      />

      {/* Main Content: Hero Landing vs Conversational Workspace */}
      {!isChatActive ? (
        <Hero
          onSubmit={handleUserSubmit}
          isLoading={isLoading}
          onOpenQuickOptions={openQuickOptions}
        />
      ) : (
        <ChatWorkspace
          messages={messages}
          isLoading={isLoading}
          isAiMode={isAiApiActive}
          onSubmit={handleUserSubmit}
          onOpenQuickOptions={openQuickOptions}
          onOpenMenuModal={openMenuModal}
          onOpenApiConfigModal={openApiConfig}
        />
      )}

      {/* Mascot Avatar Picker Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={closeAllModals}
        currentAvatarId={currentAvatarId}
        onSelectAvatar={handleSelectAvatar}
      />

      {/* In-App Login Modal (When user clicks Sign In from Header/Drawer) */}
      {isLoginModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1100,
            background: "#080c0a",
            overflowY: "auto",
          }}
        >
          <LoginPage
            onAuthSuccess={async () => {
              const { user } = await getInitialSession();
              if (user) setCurrentUser(user);
              setIsGuest(false);
              closeAllModals();
              handleNewChat();
            }}
            onContinueAsGuest={() => {
              setGuestMode(true);
              setIsGuest(true);
              closeAllModals();
            }}
            onClose={closeAllModals}
          />
        </div>
      )}

      {/* Modals */}
      <MenuModal
        isOpen={isMenuModalOpen}
        onClose={closeAllModals}
        onSelectItem={handleUserSubmit}
      />

      <QuickOptionsModal
        isOpen={isQuickOptionsOpen}
        onClose={closeAllModals}
        onApply={handleUserSubmit}
      />

      {isApiConfigOpen && (
        <ApiConfigModal
          isOpen={isApiConfigOpen}
          onClose={closeAllModals}
          onConfigSaved={handleConfigSaved}
        />
      )}
    </div>
  );
};

export default App;
