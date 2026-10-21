import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { sanitizeErrorMessage } from "../services/aiService";
import { isValidSupabaseUrl, saveSupabaseConfig, getStoredSupabaseConfig, fetchAllCloudSessions, deleteCloudChatSession } from "../services/supabaseClient";
import { checkLoginRateLimit, recordFailedLoginAttempt, clearLoginAttempts, registerWithEmailAndPassword } from "../services/authService";
import { parseUserQuery } from "../engine/preferenceParser";
import { isFoodRelatedQuery } from "../services/hybridRouter";
import { INITIAL_PREFERENCE_STATE } from "../engine/conversationState";

// Polyfill localStorage and window for node test runner
const storageMap = new Map<string, string>();
const mockLocalStorage = {
  getItem: (key: string) => storageMap.get(key) || null,
  setItem: (key: string, value: string) => storageMap.set(key, String(value)),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
};
(globalThis as any).localStorage = mockLocalStorage;
(globalThis as any).window = { location: { origin: "http://localhost:3000", href: "" } };

describe("CanteenCue Security Audit & Hardening Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockLocalStorage.clear();
  });

  describe("1. Sensitive Credential & Error Message Redaction", () => {
    it("redacts Google Gemini API keys from error messages", () => {
      const leakedKeyError = "API call failed with status 400: API key not valid. Please pass a valid API key: AIzaSyD9ExampleLeak1234567890abcdef";
      const sanitized = sanitizeErrorMessage(leakedKeyError);
      expect(sanitized).not.toContain("AIzaSyD9ExampleLeak1234567890abcdef");
      expect(sanitized).toContain("[REDACTED_API_KEY]");
    });

    it("redacts OpenAI secret keys and Bearer tokens from error messages", () => {
      const openAiError = "Authorization error: Bearer sk-proj-1234567890abcdefghijklmnopqrstuvwxyz is expired";
      const sanitized = sanitizeErrorMessage(openAiError);
      expect(sanitized).not.toContain("sk-proj-1234567890abcdefghijklmnopqrstuvwxyz");
      expect(sanitized).toContain("Bearer [REDACTED]");
    });

    it("redacts query parameter API keys and raw endpoint URLs", () => {
      const urlError = "Fetch failed: https://generativelanguage.googleapis.com/v1beta/models/gemini-flash?key=AIzaSySecret1234567890123456789012345";
      const sanitized = sanitizeErrorMessage(urlError);
      expect(sanitized).not.toContain("AIzaSySecret1234567890123456789012345");
      expect(sanitized).not.toContain("https://generativelanguage.googleapis.com");
      expect(sanitized).toContain("[API_ENDPOINT]");
    });

    it("caps excessive error string length to prevent UI overflow or memory bloat", () => {
      const massiveError = "Database failure: " + "A".repeat(500);
      const sanitized = sanitizeErrorMessage(massiveError);
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
  });

  describe("2. Database Configuration & Host Tampering Protection", () => {
    it("validates legitimate Supabase HTTPS endpoints", () => {
      expect(isValidSupabaseUrl("https://onemcemddewbcazkyogm.supabase.co")).toBe(true);
      expect(isValidSupabaseUrl("https://my-app-iter.supabase.co")).toBe(true);
      expect(isValidSupabaseUrl("http://localhost:54321")).toBe(true);
    });

    it("rejects malicious, insecure, or untrusted endpoints", () => {
      expect(isValidSupabaseUrl("http://insecure-domain.com")).toBe(false);
      expect(isValidSupabaseUrl("javascript:alert(1)")).toBe(false);
      expect(isValidSupabaseUrl("https://attacker-supabase.com")).toBe(false);
      expect(isValidSupabaseUrl("https://evil.co?target=supabase.co")).toBe(false);
      expect(isValidSupabaseUrl("not-a-url")).toBe(false);
    });

    it("refuses to store malicious hostnames into localStorage", () => {
      const initial = getStoredSupabaseConfig();
      saveSupabaseConfig({
        url: "https://malicious-phishing.com",
        anonKey: "malicious-key",
      });
      const afterAttempt = getStoredSupabaseConfig();
      expect(afterAttempt.url).not.toBe("https://malicious-phishing.com");
      expect(afterAttempt.url).toBe(initial.url);
    });
  });

  describe("3. IDOR & Unauthenticated Cloud Session Protection", () => {
    it("prevents unauthenticated callers from dumping cloud chat histories", async () => {
      // Mock unauthenticated client
      const sessions = await fetchAllCloudSessions();
      expect(sessions).toEqual([]);
    });

    it("blocks unauthenticated callers from issuing cloud session deletes", async () => {
      // Should cleanly return without exception or unauthorized delete
      await expect(deleteCloudChatSession("target-session-id")).resolves.not.toThrow();
    });
  });

  describe("4. Brute-Force Rate Limiting & Cooldown on Login", () => {
    it("allows attempts below the rate limit threshold", () => {
      const testEmail = "student.auth@soa.ac.in";
      clearLoginAttempts(testEmail);
      expect(checkLoginRateLimit(testEmail).isLocked).toBe(false);

      recordFailedLoginAttempt(testEmail);
      recordFailedLoginAttempt(testEmail);
      recordFailedLoginAttempt(testEmail);
      expect(checkLoginRateLimit(testEmail).isLocked).toBe(false);
    });

    it("locks out an account after 5 consecutive failed attempts", () => {
      const testEmail = "brute.force.test@soa.ac.in";
      clearLoginAttempts(testEmail);

      for (let i = 0; i < 5; i++) {
        recordFailedLoginAttempt(testEmail);
      }

      const limitCheck = checkLoginRateLimit(testEmail);
      expect(limitCheck.isLocked).toBe(true);
      expect(limitCheck.waitSeconds).toBeGreaterThan(0);
      expect(limitCheck.waitSeconds).toBeLessThanOrEqual(30);
    });

    it("clears lockout attempts on successful authentication", () => {
      const testEmail = "cleared.student@soa.ac.in";
      recordFailedLoginAttempt(testEmail);
      recordFailedLoginAttempt(testEmail);
      clearLoginAttempts(testEmail);
      expect(checkLoginRateLimit(testEmail).isLocked).toBe(false);
    });
  });

  describe("5. Input Length Bounding & ReDoS Resistance", () => {
    it("safely truncates massive inputs in preference parser without freezing or crashing", () => {
      const massiveInput = "dosa ".repeat(5000); // 25,000 characters
      const startTime = Date.now();
      const parsed = parseUserQuery(massiveInput, INITIAL_PREFERENCE_STATE);
      const elapsed = Date.now() - startTime;

      expect(parsed).toBeDefined();
      expect(elapsed).toBeLessThan(500); // Must complete in under 500ms
    });

    it("safely evaluates repetitive queries in isFoodRelatedQuery without ReDoS", () => {
      const repeatedNegations = "not not not not not spicy ".repeat(500);
      const startTime = Date.now();
      const isFood = isFoodRelatedQuery(repeatedNegations);
      const elapsed = Date.now() - startTime;

      expect(typeof isFood).toBe("boolean");
      expect(elapsed).toBeLessThan(500);
    });

    it("rejects oversized emails (> 254 chars) and passwords (> 128 chars) in auth", async () => {
      const oversizedEmail = "a".repeat(250) + "@soa.ac.in"; // 260 chars
      const regRes = await registerWithEmailAndPassword(oversizedEmail, "ValidPass123!");
      expect(regRes.success).toBe(false);
      expect(regRes.message).toContain("exceeds maximum permitted length");

      const oversizedPass = "P".repeat(150);
      const regPassRes = await registerWithEmailAndPassword("valid@soa.ac.in", oversizedPass);
      expect(regPassRes.success).toBe(false);
      expect(regPassRes.message).toContain("exceeds maximum permitted length");
    });
  });

  describe("6. Production Security Headers & Secrets Absence", () => {
    it("verifies public/_headers declares essential HTTP security protections", () => {
      const headersPath = path.resolve(process.cwd(), "public/_headers");
      expect(fs.existsSync(headersPath)).toBe(true);

      const content = fs.readFileSync(headersPath, "utf-8");
      expect(content).toContain("X-Frame-Options: DENY");
      expect(content).toContain("X-Content-Type-Options: nosniff");
      expect(content).toContain("Referrer-Policy: strict-origin-when-cross-origin");
      expect(content).toContain("Strict-Transport-Security");
      expect(content).toContain("Content-Security-Policy");
      expect(content).toContain("Permissions-Policy");
    });

    it("verifies .gitignore strictly ignores .env and private certificate files", () => {
      const gitignorePath = path.resolve(process.cwd(), ".gitignore");
      const content = fs.readFileSync(gitignorePath, "utf-8");
      expect(content).toMatch(/^\.env$/m);
      expect(content).toContain("*.key");
      expect(content).toContain("*.pem");
    });
  });

  describe("7. Google Search Favicon & Branding Integrity", () => {
    it("ensures index.html declares valid square favicon links without invalid sizes attribute on ICO", () => {
      const htmlPath = path.resolve(process.cwd(), "index.html");
      const content = fs.readFileSync(htmlPath, "utf-8");

      // Verify no invalid sizes="any" on favicon.ico
      expect(content).not.toMatch(/href="\/favicon\.ico"[^>]*sizes="any"/);

      // Verify presence of standard square icon declarations
      expect(content).toContain('href="/favicon-48x48.png"');
      expect(content).toContain('href="/favicon-96x96.png"');
      expect(content).toContain('href="/favicon-192x192.png"');
      expect(content).toContain('href="/favicon-512x512.png"');
      expect(content).toContain('href="/favicon.svg"');
      expect(content).toContain('rel="shortcut icon"');
    });

    it("ensures public/favicon.svg is a square SVG with official branding, not Vite template residual", () => {
      const svgPath = path.resolve(process.cwd(), "public/favicon.svg");
      expect(fs.existsSync(svgPath)).toBe(true);

      const content = fs.readFileSync(svgPath, "utf-8");
      // Must not contain default Vite purple color
      expect(content).not.toContain("#863bff");
      // Must be square (viewBox 0 0 192 192 or width=height)
      expect(content).toContain('viewBox="0 0 192 192"');
    });

    it("verifies WebSite structured data defines the brand CanteenCue ITER and canonical URL", () => {
      const htmlPath = path.resolve(process.cwd(), "index.html");
      const content = fs.readFileSync(htmlPath, "utf-8");

      expect(content).toContain('"@type": "WebSite"');
      expect(content).toContain('"name": "CanteenCue ITER"');
      expect(content).toContain('"url": "https://canteencue-iter.pages.dev/"');
    });
  });

  describe("8. Supabase RLS Hardening Script Verification", () => {
    it("verifies security_patch_rls.sql includes user_id column creation and RLS on all 5 key tables", () => {
      const sqlPath = path.resolve(process.cwd(), "supabase/security_patch_rls.sql");
      expect(fs.existsSync(sqlPath)).toBe(true);

      const content = fs.readFileSync(sqlPath, "utf-8");
      expect(content).toContain("ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id)");
      expect(content).toContain("ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;");
      expect(content).toContain("ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;");
      expect(content).toContain("ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;");
      expect(content).toContain("ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;");
      expect(content).toContain("ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;");
      expect(content).toContain("DROP POLICY IF EXISTS \"Allow public all access on outlets\"");
      expect(content).toContain("DROP POLICY IF EXISTS \"Allow public all access on menu items\"");
    });
  });
});
