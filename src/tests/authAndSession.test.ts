import { describe, it, expect, beforeEach } from "vitest";

// Polyfill localStorage and window for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = { location: { origin: "http://localhost:5174", href: "" } };

import {
  isGuestModeActive,
  setGuestMode,
  isValidEmailFormat,
  validateRealEmail,
  getEmailCategory,
  checkUserAlreadyExists,
  signInWithGoogle,
  registerWithEmailAndPassword,
  signInWithPassword,
  getStoredSavedAccount,
  saveAccountProfile,
  removeStoredAccountProfile,
  recordRegisteredEmail,
  getKnownRegisteredEmails,
  isEmailKnownRegistered,
} from "../services/authService";
import {
  saveChatSession,
  getChatSession,
  getAllChatSessions,
  deleteChatSession,
  clearAllChatSessions,
  ChatSession,
  isSessionWithin7Days,
} from "../services/chatDatabase";
import { INITIAL_PREFERENCE_STATE } from "../engine/conversationState";

describe("Auth and Chat Session Storage", () => {
  beforeEach(async () => {
    mockLocalStorage.clear();
    await clearAllChatSessions();
  });

  it("handles guest mode state in localStorage", () => {
    expect(isGuestModeActive()).toBe(false);
    setGuestMode(true);
    expect(isGuestModeActive()).toBe(true);
    setGuestMode(false);
    expect(isGuestModeActive()).toBe(false);
  });

  it("validates real emails and strictly rejects fake, disposable, or malformed inputs", () => {
    // Valid emails
    expect(validateRealEmail("jaisingh@soa.ac.in").isValid).toBe(true);
    expect(validateRealEmail("student.campus@soa.ac.in").isValid).toBe(true);
    expect(validateRealEmail("adarshkumarsingh004@gmail.com").isValid).toBe(true);
    expect(validateRealEmail("campus.student@outlook.com").isValid).toBe(true);
    expect(validateRealEmail("user@yahoo.co.in").isValid).toBe(true);

    // Disposable & fake domains must be rejected
    const tempRes = validateRealEmail("spammer@tempmail.com");
    expect(tempRes.isValid).toBe(false);
    expect(tempRes.reason).toContain("Temporary, disposable");

    const mailinatorRes = validateRealEmail("throwaway@mailinator.com");
    expect(mailinatorRes.isValid).toBe(false);

    const testDomainRes = validateRealEmail("anyone@test.com");
    expect(testDomainRes.isValid).toBe(false);

    // Boolean helper wrapper check
    expect(isValidEmailFormat("jaisingh@soa.ac.in")).toBe(true);
    expect(isValidEmailFormat("spammer@tempmail.com")).toBe(false);
    expect(isValidEmailFormat("invalid-email")).toBe(false);

    // Malformed inputs
    expect(validateRealEmail("invalid-email").isValid).toBe(false);
    expect(validateRealEmail("test@").isValid).toBe(false);
    expect(validateRealEmail("@soa.ac.in").isValid).toBe(false);
    expect(validateRealEmail("test@soa").isValid).toBe(false);
    expect(validateRealEmail("a@b.c").isValid).toBe(false);
    expect(validateRealEmail("student@domain.123").isValid).toBe(false);

    // Live UI category detection
    expect(getEmailCategory("jaisingh@soa.ac.in").type).toBe("soa");
    expect(getEmailCategory("student@iitd.ac.in").type).toBe("university");
    expect(getEmailCategory("user@gmail.com").type).toBe("standard");
    expect(getEmailCategory("fake@tempmail.com").type).toBe("disposable");
    expect(getEmailCategory("").type).toBe("empty");
    expect(getEmailCategory("notanemail").type).toBe("invalid");
  });

  it("checks non-existent user registration probe without dispatching live emails", async () => {
    const exists = await checkUserAlreadyExists("non_existent_student_probe_999@soa.ac.in");
    expect(typeof exists).toBe("boolean");
    expect(exists).toBe(false);
  });

  it("generates Google OAuth sign in redirect without crashing", async () => {
    const res = await signInWithGoogle();
    expect(res).toHaveProperty("success");
    expect(res).toHaveProperty("message");
    if (res.success) {
      expect(res.url).toContain("supabase.co");
    }
  });

  it("safely handles registration attempt without sending live bouncing emails in test mode", async () => {
    const res = await registerWithEmailAndPassword(
      "test_student_mock@soa.ac.in",
      "ValidPass123!"
    );
    expect(res).toHaveProperty("success");
    expect(res).toHaveProperty("message");
  });

  it("rejects invalid email formats before contacting Supabase", async () => {
    const res = await registerWithEmailAndPassword(
      "bad-email-without-domain",
      "ValidPass123!"
    );
    expect(res.success).toBe(false);
    expect(res.message).toContain("@");
  });

  it("saves, retrieves, lists, and deletes chat sessions", async () => {
    const now = Date.now();
    const session1: ChatSession = {
      id: "session_test_1",
      title: "Pani Puri under ₹200",
      createdAt: now - 2000,
      updatedAt: now - 2000,
      messages: [
        {
          id: "m1",
          sender: "user",
          text: "I want pani puri",
          timestamp: now - 2000,
        },
      ],
      preferenceState: { ...INITIAL_PREFERENCE_STATE, budget: 200 },
    };

    const session2: ChatSession = {
      id: "session_test_2",
      title: "Chicken Kasa — ₹189",
      createdAt: now - 1000,
      updatedAt: now - 1000,
      messages: [
        {
          id: "m2",
          sender: "user",
          text: "chicken kasa full",
          timestamp: now - 1000,
        },
      ],
      preferenceState: { ...INITIAL_PREFERENCE_STATE, budget: 200, dietary: "non_vegetarian" },
    };

    await saveChatSession(session1);
    await saveChatSession(session2);

    const retrieved1 = await getChatSession("session_test_1");
    expect(retrieved1).not.toBeNull();
    expect(retrieved1?.title).toBe("Pani Puri under ₹200");
    expect(retrieved1?.messages.length).toBe(1);

    const allSessions = await getAllChatSessions();
    expect(allSessions.length).toBe(2);
    // Should be sorted updatedAt desc
    expect(allSessions[0].id).toBe("session_test_2");
    expect(allSessions[1].id).toBe("session_test_1");

    await deleteChatSession("session_test_1");
    const remainingSessions = await getAllChatSessions();
    expect(remainingSessions.length).toBe(1);
    expect(remainingSessions[0].id).toBe("session_test_2");
  });

  it("isolates chat histories between different authenticated users and guest", async () => {
    const now = Date.now();
    const userASession: ChatSession = {
      id: "session_user_a_1",
      userId: "user_a@soa.ac.in",
      title: "User A Food Decision",
      createdAt: now - 3000,
      updatedAt: now - 3000,
      messages: [{ id: "m1", sender: "user", text: "veg roll", timestamp: now - 3000 }],
      preferenceState: INITIAL_PREFERENCE_STATE,
    };

    const userBSession: ChatSession = {
      id: "session_user_b_1",
      userId: "user_b@soa.ac.in",
      title: "User B Food Decision",
      createdAt: now - 2000,
      updatedAt: now - 2000,
      messages: [{ id: "m2", sender: "user", text: "chicken thali", timestamp: now - 2000 }],
      preferenceState: INITIAL_PREFERENCE_STATE,
    };

    const guestSession: ChatSession = {
      id: "session_guest_1",
      userId: "guest",
      title: "Guest Decision",
      createdAt: now - 1000,
      updatedAt: now - 1000,
      messages: [{ id: "m3", sender: "user", text: "maggi", timestamp: now - 1000 }],
      preferenceState: INITIAL_PREFERENCE_STATE,
    };

    await saveChatSession(userASession);
    await saveChatSession(userBSession);
    await saveChatSession(guestSession);

    // User A should only see User A's session
    const sessionsA = await getAllChatSessions("user_a@soa.ac.in");
    expect(sessionsA.length).toBe(1);
    expect(sessionsA[0].id).toBe("session_user_a_1");

    // User B should only see User B's session
    const sessionsB = await getAllChatSessions("user_b@soa.ac.in");
    expect(sessionsB.length).toBe(1);
    expect(sessionsB[0].id).toBe("session_user_b_1");

    // Guest should only see guest session
    const guestSessions = await getAllChatSessions("guest");
    expect(guestSessions.length).toBe(1);
    expect(guestSessions[0].id).toBe("session_guest_1");
  });

  it("manages returning user saved profile and cookie persistence for Instagram-style Welcome Back flow", () => {
    // 1. Fresh state should return null
    expect(getStoredSavedAccount()).toBeNull();

    // 2. Save an account profile
    saveAccountProfile("mika.singh@soa.ac.in", "Mika Singh", "samosa-monkey");

    const saved = getStoredSavedAccount();
    expect(saved).not.toBeNull();
    expect(saved?.email).toBe("mika.singh@soa.ac.in");
    expect(saved?.name).toBe("Mika Singh");
    expect(saved?.avatarId).toBe("samosa-monkey");
    expect(typeof saved?.savedAt).toBe("number");

    // 3. Fallback to username if name is not explicitly passed
    saveAccountProfile("adarsh@soa.ac.in");
    const savedAutoName = getStoredSavedAccount();
    expect(savedAutoName?.name).toBe("Adarsh");

    // 4. Remove saved account clears it
    removeStoredAccountProfile();
    expect(getStoredSavedAccount()).toBeNull();
  });

  it("strictly enforces 7-day chat history retention and filters out older sessions", async () => {
    const now = Date.now();
    const activeSession: ChatSession = {
      id: "active_session_3_days_old",
      title: "Active 3-day old decision",
      createdAt: now - 3 * 24 * 60 * 60 * 1000,
      updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      messages: [{ id: "m1", sender: "user", text: "tea", timestamp: now - 3 * 24 * 60 * 60 * 1000 }],
      preferenceState: INITIAL_PREFERENCE_STATE,
    };

    const expiredSession: ChatSession = {
      id: "expired_session_8_days_old",
      title: "Expired 8-day old decision",
      createdAt: now - 8 * 24 * 60 * 60 * 1000,
      updatedAt: now - 8 * 24 * 60 * 60 * 1000,
      messages: [{ id: "m2", sender: "user", text: "samosa", timestamp: now - 8 * 24 * 60 * 60 * 1000 }],
      preferenceState: INITIAL_PREFERENCE_STATE,
    };

    // isSessionWithin7Days check
    expect(isSessionWithin7Days(activeSession, now)).toBe(true);
    expect(isSessionWithin7Days(expiredSession, now)).toBe(false);

    // Save both
    await saveChatSession(activeSession);
    await saveChatSession(expiredSession);

    // Expired session should not be retrieved
    const retrievedExpired = await getChatSession("expired_session_8_days_old");
    expect(retrievedExpired).toBeNull();

    // Active session should be retrieved
    const retrievedActive = await getChatSession("active_session_3_days_old");
    expect(retrievedActive).not.toBeNull();
    expect(retrievedActive?.id).toBe("active_session_3_days_old");

    // Listing sessions only includes active sessions within 7 days
    const all = await getAllChatSessions();
    expect(all.some((s) => s.id === "expired_session_8_days_old")).toBe(false);
    expect(all.some((s) => s.id === "active_session_3_days_old")).toBe(true);
  });

  it("manages known registered email registry and routes between Sign In and Sign Up intelligently", async () => {
    // 1. Initial state: no known emails
    expect(getKnownRegisteredEmails()).toEqual([]);
    expect(isEmailKnownRegistered("student@soa.ac.in")).toBe(false);

    // 2. Registering an email records it
    recordRegisteredEmail("student@soa.ac.in");
    expect(isEmailKnownRegistered("student@soa.ac.in")).toBe(true);
    expect(isEmailKnownRegistered("STUDENT@soa.ac.in")).toBe(true); // Case-insensitive
    expect(getKnownRegisteredEmails()).toContain("student@soa.ac.in");

    // 3. Registering again does not duplicate
    recordRegisteredEmail("student@soa.ac.in");
    expect(getKnownRegisteredEmails().filter((e) => e === "student@soa.ac.in").length).toBe(1);

    // 4. Test account creation records it automatically
    const regResult = await registerWithEmailAndPassword("test_newuser@soa.ac.in", "Password123!");
    expect(regResult.success).toBe(true);
    expect(isEmailKnownRegistered("test_newuser@soa.ac.in")).toBe(true);

    // 5. Unregistered email sign-in marks isAccountNotFound: true
    const unregResult = await signInWithPassword("unregistered.user@soa.ac.in", "anyPassword123!");
    expect(unregResult.success).toBe(false);
    expect(unregResult.isAccountNotFound).toBe(true);
    expect(unregResult.message).toContain("No account found");

    // 6. Known registered email with wrong password marks isAccountNotFound: false
    const knownResult = await signInWithPassword("student@soa.ac.in", "wrongPassword123!");
    expect(knownResult.success).toBe(false);
    expect(knownResult.isAccountNotFound).toBe(false);
    expect(knownResult.message).toContain("Incorrect password");
  });
});
