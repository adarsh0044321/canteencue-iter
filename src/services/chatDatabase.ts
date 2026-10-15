/**
 * ============================================================================
 * CanteenCue Local Storage & IndexedDB Protocol
 * ============================================================================
 * 
 * Storage Protocol:
 * 1. Primary Store: IndexedDB (Database `CanteenCueDatabase`, objectStore `sessions`).
 *    Handles multi-megabyte chat histories, structured decision objects, and user preferences.
 * 2. Secondary Store: localStorage fallback if IndexedDB is disabled, in private browsing,
 *    or unsupported in the browser environment.
 * 3. Session Hierarchy: Every session contains an ID, readable title, timestamp, full
 *    array of ChatMessages, and progressive UserPreferenceState.
 * ============================================================================
 */

import { ChatMessage, UserPreferenceState } from "../data/types";

export interface ChatSession {
  id: string;
  userId?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  preferenceState: UserPreferenceState;
}

export interface UserPreferencesDatabase {
  likes: string[];
  dislikes: string[];
  favoriteItems: string[];
  dietaryPreference: string | null;
  averageBudget: number | null;
  totalDecisionsCount: number;
}

const DB_NAME = "CanteenCueDatabase";
const DB_VERSION = 1;
const SESSIONS_STORE = "sessions";
const PROFILE_STORE = "user_profile";
const LOCAL_STORAGE_SESSIONS_KEY = "canteencue_chat_sessions";
const LOCAL_STORAGE_PROFILE_KEY = "canteencue_user_profile";
const CURRENT_SESSION_ID_KEY = "canteencue_current_session_id";

// Default user profile
const DEFAULT_PROFILE: UserPreferencesDatabase = {
  likes: [],
  dislikes: [],
  favoriteItems: [],
  dietaryPreference: null,
  averageBudget: null,
  totalDecisionsCount: 0,
};

// Open or initialize IndexedDB
function openIndexedDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        db.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

import { fetchAllCloudSessions, deleteCloudChatSession } from "./supabaseClient";

/**
 * Chat History 7-Day Retention Limit
 * Preserves browser and account database storage by automatically pruning sessions older than 7 days.
 */
export const CHAT_HISTORY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms (604,800,000 ms)

export function isSessionWithin7Days(session: ChatSession, now: number = Date.now()): boolean {
  const timestamp = session.updatedAt || session.createdAt || 0;
  return now - timestamp <= CHAT_HISTORY_RETENTION_MS;
}

/**
 * Automatically purges sessions older than 7 days from IndexedDB and localStorage
 */
export async function pruneExpiredSessions(): Promise<number> {
  const cutoff = Date.now() - CHAT_HISTORY_RETENTION_MS;
  let removedCount = 0;

  // 1. Purge from IndexedDB
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    const store = tx.objectStore(SESSIONS_STORE);
    const req = store.getAll();
    await new Promise<void>((resolve) => {
      req.onsuccess = () => {
        const sessions: ChatSession[] = req.result || [];
        for (const s of sessions) {
          const time = s.updatedAt || s.createdAt || 0;
          if (time < cutoff) {
            store.delete(s.id);
            removedCount++;
          }
        }
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch {}

  // 2. Purge from localStorage fallback
  try {
    const all = getAllSessionsFromLocalStorage();
    const active = all.filter((s) => (s.updatedAt || s.createdAt || 0) >= cutoff);
    if (active.length !== all.length) {
      removedCount += (all.length - active.length);
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(active));
    }
  } catch {}

  return removedCount;
}

// -------------------------------------------------------------
// SESSIONS API
// -------------------------------------------------------------

export async function saveChatSession(session: ChatSession): Promise<void> {
  let existingUserId: string | undefined;
  try {
    const existing = await getChatSession(session.id);
    if (existing?.userId && existing.userId !== "guest") {
      existingUserId = existing.userId;
    }
  } catch {}

  const normalized: ChatSession = {
    ...session,
    userId: session.userId || existingUserId || "guest",
    updatedAt: session.updatedAt || Date.now(),
    createdAt: session.createdAt || Date.now(),
  };

  // Run async background retention cleanup
  pruneExpiredSessions().catch(() => {});

  try {
    const db = await openIndexedDb();
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    const store = tx.objectStore(SESSIONS_STORE);
    store.put(normalized);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage
    try {
      const all = getAllSessionsFromLocalStorage();
      const idx = all.findIndex((s) => s.id === normalized.id);
      if (idx >= 0) {
        all[idx] = normalized;
      } else {
        all.unshift(normalized);
      }
      // Retain strictly sessions from the last 7 days
      const strictlyRetained = all.filter((s) => isSessionWithin7Days(s));
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(strictlyRetained.slice(0, 100)));
    } catch (e) {
      console.warn("Failed to save session to localStorage:", e);
    }
  }

  // Also track current session ID
  try {
    localStorage.setItem(CURRENT_SESSION_ID_KEY, normalized.id);
  } catch {}
}

export async function getChatSession(id: string): Promise<ChatSession | null> {
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const store = tx.objectStore(SESSIONS_STORE);
    const req = store.get(id);
    return new Promise((resolve) => {
      req.onsuccess = () => {
        const result = req.result || null;
        if (result && !isSessionWithin7Days(result)) {
          resolve(null);
        } else {
          resolve(result);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    const all = getAllSessionsFromLocalStorage();
    const found = all.find((s) => s.id === id);
    if (found && isSessionWithin7Days(found)) {
      return found;
    }
    return null;
  }
}

export async function getAllChatSessions(
  filterUserId?: string,
  userAltId?: string
): Promise<ChatSession[]> {
  try {
    // Background prune expired sessions
    pruneExpiredSessions().catch(() => {});

    const db = await openIndexedDb();
    const tx = db.transaction(SESSIONS_STORE, "readonly");
    const store = tx.objectStore(SESSIONS_STORE);
    const req = store.getAll();

    const localSessions: ChatSession[] = await new Promise((resolve) => {
      req.onsuccess = () => {
        let results: ChatSession[] = req.result || [];
        resolve(results.filter((s) => isSessionWithin7Days(s)));
      };
      req.onerror = () => resolve(getAllSessionsFromLocalStorage(filterUserId, userAltId));
    });

    // Cloud synchronization: Fetch past decisions stored in Supabase
    let merged = [...localSessions];
    try {
      const cloudSessions = await fetchAllCloudSessions(filterUserId);
      if (cloudSessions.length > 0) {
        const existingIds = new Set(merged.map((s) => s.id));
        for (const cs of cloudSessions) {
          if (!existingIds.has(cs.id) && isSessionWithin7Days(cs)) {
            merged.push(cs);
            existingIds.add(cs.id);
            // Cache to local IndexedDB for instant offline access
            try {
              const writeTx = db.transaction(SESSIONS_STORE, "readwrite");
              writeTx.objectStore(SESSIONS_STORE).put(cs);
            } catch {}
          }
        }
      }
    } catch (cloudErr) {
      console.warn("Cloud chat history sync fallback:", cloudErr);
    }

    // Filter strictly for 7-day retention window
    merged = merged.filter((s) => isSessionWithin7Days(s));

    // Sort by recency
    merged.sort((a, b) => b.updatedAt - a.updatedAt);

    // Filter sessions matching account (email or auth UUID)
    if (filterUserId && filterUserId !== "all") {
      merged = merged.filter((s) => {
        const sid = s.userId || "guest";
        return sid === filterUserId || (userAltId && sid === userAltId);
      });
    }

    return merged;
  } catch {
    return getAllSessionsFromLocalStorage(filterUserId, userAltId);
  }
}

export async function deleteChatSession(id: string): Promise<void> {
  // Delete from Supabase cloud
  try {
    await deleteCloudChatSession(id);
  } catch {}

  try {
    const db = await openIndexedDb();
    const tx = db.transaction(SESSIONS_STORE, "readwrite");
    tx.objectStore(SESSIONS_STORE).delete(id);
  } catch {
    const all = getAllSessionsFromLocalStorage().filter((s) => s.id !== id);
    localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(all));
  }
}

export async function clearAllChatSessions(forUserId?: string): Promise<void> {
  if (!forUserId) {
    try {
      const db = await openIndexedDb();
      const tx = db.transaction(SESSIONS_STORE, "readwrite");
      tx.objectStore(SESSIONS_STORE).clear();
    } catch {}
    try {
      localStorage.removeItem(LOCAL_STORAGE_SESSIONS_KEY);
      localStorage.removeItem(CURRENT_SESSION_ID_KEY);
    } catch {}
  } else {
    try {
      const db = await openIndexedDb();
      const tx = db.transaction(SESSIONS_STORE, "readwrite");
      const store = tx.objectStore(SESSIONS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const all: ChatSession[] = req.result || [];
        for (const s of all) {
          if ((s.userId || "guest") === forUserId) {
            store.delete(s.id);
          }
        }
      };
    } catch {}
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
      if (raw) {
        const all: ChatSession[] = JSON.parse(raw);
        const filtered = all.filter((s) => (s.userId || "guest") !== forUserId);
        localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(filtered));
      }
    } catch {}
  }
}

export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

function getAllSessionsFromLocalStorage(filterUserId?: string, userAltId?: string): ChatSession[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY);
    if (!raw) return [];
    let all: ChatSession[] = JSON.parse(raw);
    all = all.filter((s) => isSessionWithin7Days(s));
    if (filterUserId && filterUserId !== "all") {
      all = all.filter((s) => {
        const sid = s.userId || "guest";
        return sid === filterUserId || (userAltId && sid === userAltId);
      });
    }
    return all;
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// USER PREFERENCES & LIKES/DISLIKES PROFILE DATABASE
// -------------------------------------------------------------

export async function getUserProfile(): Promise<UserPreferencesDatabase> {
  try {
    const db = await openIndexedDb();
    const tx = db.transaction(PROFILE_STORE, "readonly");
    const store = tx.objectStore(PROFILE_STORE);
    const req = store.get("profile");
    return new Promise((resolve) => {
      req.onsuccess = () => resolve(req.result?.data || DEFAULT_PROFILE);
      req.onerror = () => resolve(DEFAULT_PROFILE);
    });
  } catch {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PROFILE_KEY);
      return raw ? JSON.parse(raw) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }
}

export async function updateUserProfile(updates: Partial<UserPreferencesDatabase>): Promise<UserPreferencesDatabase> {
  const current = await getUserProfile();
  const merged: UserPreferencesDatabase = {
    ...current,
    ...updates,
    likes: Array.from(new Set([...current.likes, ...(updates.likes || [])])),
    dislikes: Array.from(new Set([...current.dislikes, ...(updates.dislikes || [])])),
    favoriteItems: Array.from(new Set([...current.favoriteItems, ...(updates.favoriteItems || [])])),
    totalDecisionsCount: current.totalDecisionsCount + 1,
  };

  try {
    const db = await openIndexedDb();
    const tx = db.transaction(PROFILE_STORE, "readwrite");
    tx.objectStore(PROFILE_STORE).put({ key: "profile", data: merged });
  } catch {}

  try {
    localStorage.setItem(LOCAL_STORAGE_PROFILE_KEY, JSON.stringify(merged));
  } catch {}

  return merged;
}
