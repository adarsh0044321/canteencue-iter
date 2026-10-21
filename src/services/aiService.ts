import {
  DecisionResponse,
  UserPreferenceState,
  ChatMessage,
  RecommendationCandidate,
  AlternativeCandidate,
  MealCombination,
} from "../data/types";
import { ALL_MENU_ITEMS, getItemPriceForPortion } from "../data/menuService";
import { processUserDecision } from "../engine";
import { syncCustomAiConfigToProfile } from "./authService";

export type AiProvider = "builtin" | "gemini" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enableMemory: boolean;
}

export const YOUTUBE_TUTORIAL_URL = "https://youtu.be/ruecxk8So4Q";

const STORAGE_KEY = "canteencue_ai_config";
const TRIAL_STORAGE_KEY = "canteencue_trial_started_at";
const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 Days in milliseconds

const envGeminiKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY || "").trim();
const envMultipleKeysRaw = ((import.meta as any).env?.VITE_GEMINI_API_KEYS || "").trim();
const envModel = (import.meta as any).env?.VITE_GEMINI_MODEL || "gemini-flash-latest";

// Extensible System Key Pool: Combines VITE_GEMINI_API_KEYS and VITE_GEMINI_API_KEY
const initialPool: string[] = [
  ...envMultipleKeysRaw
    .split(/[,\n]/)
    .map((k: string) => k.trim())
    .filter(Boolean),
  ...(envGeminiKey ? [envGeminiKey] : []),
].filter((k, idx, arr) => arr.indexOf(k) === idx);

export const SYSTEM_GEMINI_KEYS_POOL: string[] = initialPool;

export function addSystemGeminiPoolKeys(newKeys: string[]): void {
  for (const k of newKeys) {
    const trimmed = k.trim();
    if (trimmed && !SYSTEM_GEMINI_KEYS_POOL.includes(trimmed)) {
      SYSTEM_GEMINI_KEYS_POOL.push(trimmed);
    }
  }
}

export const SYSTEM_GEMINI_KEY = SYSTEM_GEMINI_KEYS_POOL[0] || envGeminiKey || "";

// Track cooling down keys (e.g. rate-limited 429) for 60 seconds before retrying
const keyCooldownMap = new Map<string, number>();
const KEY_COOLDOWN_MS = 60 * 1000;
let keyRotationCounter = 0;

export function markSystemKeyCoolingDown(key: string): void {
  if (key) {
    keyCooldownMap.set(key, Date.now());
  }
}

export function getRotatedSystemKey(preferredUserId?: string): string {
  if (SYSTEM_GEMINI_KEYS_POOL.length === 0) return envGeminiKey || "";
  if (SYSTEM_GEMINI_KEYS_POOL.length === 1) return SYSTEM_GEMINI_KEYS_POOL[0];

  const now = Date.now();
  const activeKeys = SYSTEM_GEMINI_KEYS_POOL.filter((k) => {
    const cooldown = keyCooldownMap.get(k);
    return !cooldown || now - cooldown > KEY_COOLDOWN_MS;
  });

  const poolToUse = activeKeys.length > 0 ? activeKeys : SYSTEM_GEMINI_KEYS_POOL;

  // Consistent per-user rotation so different users distribute load evenly across keys
  if (preferredUserId && preferredUserId !== "guest") {
    let hash = 0;
    for (let i = 0; i < preferredUserId.length; i++) {
      hash = (hash << 5) - hash + preferredUserId.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % poolToUse.length;
    return poolToUse[idx];
  }

  // Round-robin for anonymous / guest turns
  const selected = poolToUse[keyRotationCounter % poolToUse.length];
  keyRotationCounter = (keyRotationCounter + 1) % poolToUse.length;
  return selected;
}

export function isSystemGeminiKey(key: string): boolean {
  if (!key || !key.trim() || key === "backend-proxy") return true;
  return (
    key === envGeminiKey ||
    SYSTEM_GEMINI_KEYS_POOL.includes(key.trim())
  );
}

export interface AiTrialInfo {
  trialStartedAt: number;
  isTrialActive: boolean;
  isTrialExpired: boolean;
  daysRemaining: number;
  hoursRemaining: number;
  hasCustomKey: boolean;
}

export function getAiTrialInfo(apiKey?: string): AiTrialInfo {
  const currentKey = apiKey ?? getStoredAiConfig().apiKey;
  const hasCustomKey = !isSystemGeminiKey(currentKey) && !!currentKey.trim();

  let startedAt = 0;
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(TRIAL_STORAGE_KEY) : null;
    if (raw) {
      startedAt = parseInt(raw, 10);
    }
    if (!startedAt || isNaN(startedAt)) {
      startedAt = Date.now();
      if (typeof window !== "undefined") {
        localStorage.setItem(TRIAL_STORAGE_KEY, String(startedAt));
      }
    }
  } catch {
    startedAt = Date.now();
  }

  const elapsed = Date.now() - startedAt;
  const remainingMs = Math.max(0, TRIAL_DURATION_MS - elapsed);
  const isTrialExpired = !hasCustomKey && elapsed >= TRIAL_DURATION_MS;
  const isTrialActive = !hasCustomKey && !isTrialExpired;
  const daysRemaining = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const hoursRemaining = Math.ceil(remainingMs / (60 * 60 * 1000));

  return {
    trialStartedAt: startedAt,
    isTrialActive,
    isTrialExpired,
    daysRemaining,
    hoursRemaining,
    hasCustomKey,
  };
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: "gemini",
  apiKey: "",
  model: envModel,
  enableMemory: true,
};

export function getStoredAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    if (!parsed.model || parsed.model === "gemini-2.5-flash" || parsed.model === "gemini-2.0-flash" || parsed.model === "gemini-1.5-flash") {
      parsed.model = envModel;
    }
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Asynchronously sync to Supabase user profile if authenticated
    syncCustomAiConfigToProfile(config).catch(() => {});
  } catch (err) {
    console.error("Failed to save AI config to localStorage:", err);
  }
}

// Compact, highly token-efficient catalog representation (~450 tokens)
const COMPACT_MENU_PROMPT = ALL_MENU_ITEMS.map((item) => {
  const portions = item.portionOptions
    ? item.portionOptions.map((p) => `${p.portion}: ₹${p.price}`).join(", ")
    : `₹${item.price}`;
  const unavail = !item.availability ? " [MARK_UNAVAILABLE]" : "";
  return `• ${item.name} (${item.shop}) — ${portions} | ${item.dietary} | ~${item.estimatedPreparationTime || 15}m prep${unavail}`;
}).join("\n");

function buildSystemInstruction(): string {
  return `You are CanteenCue, an AI college canteen food decision assistant.
Problem Statement: Help college students decide what to eat based on budget, available time, cravings, mood, and dietary preferences.

GROUNDING RULES:
1. ONLY recommend dishes from the official canteen menu catalog below. Never invent items or outlets.
2. Six official canteen shops: "Anna's Restaurant & Catering", "Mughlai Affair's", "HALKA PHULKA", "MAGGIE POINT", "4TH FLOOR", and "Iter Juice Centre".
3. If an item is marked [MARK_UNAVAILABLE] (like Chicken Tikka) or over budget, explain why and recommend a valid in-budget alternative.

CONVERSATIONAL MEMORY & USER PREFERENCES:
1. Track user's likes, dislikes, active budget, and food choices across messages.
2. If user asks "I only have 15 minutes" after a dish recommendation (e.g. Paneer Roll), evaluate if that dish (~10m prep) fits in 15 minutes.
3. Parse student budget typos (e.g., "ruppes", "bucks", "25 ruppes").
4. Respond politely to greetings (e.g., "Hello there") by introducing your role without forcing food items.
5. Politely redirect non-canteen queries back to food decisions.
6. If the user asks for an off-menu item (like "pizza", "burger", "pasta", "shawarma"):
   Explain that while pizza/burgers aren't on the official campus canteen menu (which focuses on fresh rolls, noodles, South Indian dosas, thalis, biryani, Maggi, and fresh juices), recommend the closest delicious campus canteen alternatives (such as Cheese Maggi from MAGGIE POINT, Paneer Roll from Anna's, or Veg Schezwan Noodles).
7. If the user expresses reaction, dissatisfaction, or negation (e.g. "damnnnn dosa isn't light", "not this", "something more lighter", "I don't want noodles"):
   Acknowledge their reaction empathetically, update exclusions or cravings, and recommend a dish that matches what they actually want.
8. If you genuinely do not understand the query, set "type": "clarification", "primaryItemName": null, and state clearly what you didn't understand and ask how you can help with their meal choice.

OFFICIAL CANTEEN MENU CATALOG:
${COMPACT_MENU_PROMPT}

OUTPUT FORMAT (Respond with a single valid JSON object):
{
  "type": "recommendation" | "clarification" | "redirect" | "no_match_tradeoff" | "alternative_only",
  "primaryItemName": string | null,
  "selectedPortion": "half" | "full" | "standard" | null,
  "summaryText": string,
  "whyFitsList": string[],
  "combination": { "mainItemName": string, "pairingItemName": string, "comboReason": string } | null,
  "alternatives": Array<{ "itemName": string, "reason": string }>,
  "suggestedFollowUps": string[],
  "updatedState": {
    "budget": number | null,
    "dietary": "vegetarian" | "non_vegetarian" | null,
    "cravings": string[],
    "availableTime": number | null,
    "exclusions": string[]
  }
}`;
}

export async function testAiConnection(config: AiConfig): Promise<{ success: boolean; message: string }> {
  if (config.provider === "builtin") {
    return {
      success: true,
      message: "Built-in Neural Canteen Engine active. 100% deterministic, instant, and offline.",
    };
  }

  const trimmedKey = config.apiKey.trim();
  if (config.provider === "openai" && !trimmedKey) {
    return {
      success: false,
      message: "Please enter a valid OpenAI API key.",
    };
  }

  try {
    if (config.provider === "gemini") {
      const targetModel = config.model || "gemini-flash-latest";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (trimmedKey && !isSystemGeminiKey(trimmedKey)) {
        headers["x-gemini-api-key"] = trimmedKey;
      }

      const res = await fetch("/gemini", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: targetModel,
          prompt: "Explain how AI works in a few words",
          generationConfig: { maxOutputTokens: 40 },
        }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Connected";
        return {
          success: true,
          message: `Connected successfully to Google Gemini (${targetModel}) via secure server proxy! Response: "${reply}"`,
        };
      } else {
        const errorData = await res.json().catch(() => ({}));
        const lastError = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return { success: false, message: `Gemini Proxy Error: ${lastError}` };
      }
    } else if (config.provider === "openai") {
      const targetModel = config.model || "gpt-4o-mini";
      const url = "https://api.openai.com/v1/chat/completions";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${trimmedKey}`,
        },
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "user", content: "Ping" }],
          max_tokens: 15,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return { success: false, message: `OpenAI API Error: ${errMsg}` };
      }

      return {
        success: true,
        message: `Connected successfully to OpenAI (${targetModel})!`,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Network error connecting to API: ${err.message || String(err)}`,
    };
  }

  return { success: false, message: "Unknown provider configuration." };
}

/**
 * Sanitizes external error messages to prevent leaking API keys, credentials, or internal endpoints
 */
export function sanitizeErrorMessage(msg: string): string {
  if (!msg || typeof msg !== "string") return "Connection to external AI service failed.";
  let sanitized = msg;
  // Redact Bearer tokens first
  sanitized = sanitized.replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, "Bearer [REDACTED]");
  // Redact API key query parameters
  sanitized = sanitized.replace(/key=[a-zA-Z0-9_-]+/gi, "key=[REDACTED]");
  // Redact Google AI Studio / Gemini API key patterns (both legacy AIza... and new AQ.... formats)
  sanitized = sanitized.replace(/(?:AIza[0-9A-Za-z-_]{20,}|AQ\.[0-9A-Za-z-_]{20,})/g, "[REDACTED_API_KEY]");
  // Redact OpenAI API key patterns
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9_-]{20,}/g, "[REDACTED_API_KEY]");
  // Redact full URLs to prevent exposing endpoint internals
  sanitized = sanitized.replace(/https?:\/\/[^\s"'<>]+/gi, "[API_ENDPOINT]");
  // Trim excessive length
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 197) + "...";
  }
  return sanitized.trim();
}

export async function processAiDecision(
  query: string,
  history: ChatMessage[],
  currentState: UserPreferenceState,
  lastPrimaryItem?: RecommendationCandidate
): Promise<{ response: DecisionResponse; nextState: UserPreferenceState }> {
  const config = getStoredAiConfig();

  // If Built-in engine, use the enhanced local engine
  if (config.provider === "builtin" || (config.provider === "openai" && !config.apiKey.trim())) {
    return processUserDecision(query, currentState, lastPrimaryItem);
  }

  let apiError: any = null;
  try {
    if (config.provider === "gemini") {
      return await callGeminiApi(config, query, history, currentState, lastPrimaryItem);
    } else if (config.provider === "openai") {
      return await callOpenAiApi(config, query, history, currentState, lastPrimaryItem);
    }
  } catch (err: any) {
    apiError = err;
    console.warn("AI API request failed, evaluating fallback behavior:", err);
  }

  // Check if failure is due to a revoked, deleted, or invalid personal API key
  const isCustomKeyFailure =
    apiError?.message?.includes("CUSTOM_KEY_INVALID") ||
    apiError?.message?.includes("deleted, revoked, or is invalid") ||
    apiError?.message?.toLowerCase().includes("api key not valid") ||
    apiError?.message?.includes("API_KEY_INVALID");

  const trialInfo = getAiTrialInfo(config.apiKey);

  // If the student's personal key was deleted in Google AI Studio BUT their 3-day free trial is still active,
  // automatically failover to CanteenCue's shared system key so their lunch decision is not disrupted!
  if (isCustomKeyFailure && trialInfo.isTrialActive && config.provider === "gemini") {
    try {
      const fallbackConfig: AiConfig = { ...config, apiKey: SYSTEM_GEMINI_KEY };
      const systemResult = await callGeminiApi(fallbackConfig, query, history, currentState, lastPrimaryItem);
      return {
        response: {
          ...systemResult.response,
          whyFitsList: [
            ...(systemResult.response.whyFitsList || []),
            "⚡ Your personal Gemini API key was invalid or deleted in Google AI Studio. Seamlessly fell back to CanteenCue's free trial key (update your key in AI Settings)."
          ],
        },
        nextState: systemResult.nextState,
      };
    } catch (sysErr) {
      console.warn("Seamless fallback to system trial key also failed:", sysErr);
    }
  }

  const rawErrorMsg = sanitizeErrorMessage(apiError?.message || "Connection to external AI service failed.");
  const offlineResult = processUserDecision(query, currentState, lastPrimaryItem);

  // Check if the deterministic offline engine can handle this query with a confident recommendation
  const canOfflineHandle =
    offlineResult.response.type === "recommendation" &&
    Boolean(offlineResult.response.primaryItem);

  if (canOfflineHandle) {
    // Graceful fallback to offline engine, attaching transparent error details
    const fallbackResponse: DecisionResponse = {
      ...offlineResult.response,
      whyFitsList: [
        ...(offlineResult.response.whyFitsList || []),
        `⚡ Served via offline canteen menu engine (Live ${config.provider.toUpperCase()} API connection had an issue: check API key in AI Settings)`
      ],
      apiErrorDetails: {
        provider: config.provider,
        message: rawErrorMsg,
        hadFallback: true,
        requiresApiKey: false,
      },
    };
    return {
      response: fallbackResponse,
      nextState: offlineResult.nextState,
    };
  }

  // If the query is complex, conversational, or the offline engine cannot handle it:
  // Provide clear, actionable feedback directing the user to configure their own API key
  const friendlyErrorMsg =
    isCustomKeyFailure
      ? `Your personal Google Gemini API key has been deleted or invalidated in Google AI Studio. Since your 3-day trial has ended, please generate a new free key in AI Settings (⚙️) or switch to the Built-in Engine.`
      : rawErrorMsg.includes("429") || rawErrorMsg.toLowerCase().includes("quota")
      ? `API quota or rate limit reached on ${config.provider.toUpperCase()}. Please configure your own API key in AI Settings (⚙️).`
      : rawErrorMsg.includes("400") || rawErrorMsg.toLowerCase().includes("key")
      ? `Invalid or inactive API key for ${config.provider.toUpperCase()}. Please update your API key in AI Settings (⚙️).`
      : `Unable to reach ${config.provider.toUpperCase()} AI model (${rawErrorMsg}).`;

  const errorNoticeResponse: DecisionResponse = {
    type: "clarification",
    summaryText: `⚠️ Live AI Service Notice: ${friendlyErrorMsg}\n\nSince this query requires open-ended conversational reasoning, the offline engine could not fulfill it. Please configure or use your own API key in AI Settings, or ask with specific budget/dietary constraints.`,
    whyFitsList: [
      `Live model (${config.provider.toUpperCase()}) notice: ${rawErrorMsg}`,
      "Tap 'AI Settings' in the sidebar to configure your personal Gemini or OpenAI API key",
      "Or state a specific budget (e.g. ₹100) or craving (e.g. spicy roll) to use the built-in offline engine"
    ],
    alternatives: [],
    suggestedFollowUps: isCustomKeyFailure
      ? [
          "Open AI Settings",
          "Reset to Built-in",
          "Watch Video Guide",
          "Vegetarian food under ₹80",
        ]
      : [
          "Open AI Settings",
          "Vegetarian food under ₹80",
          "Something spicy and filling",
          "What can I get for ₹100?",
        ],
    activePreferences: currentState,
    apiErrorDetails: {
      provider: config.provider,
      message: friendlyErrorMsg,
      hadFallback: false,
      requiresApiKey: true,
    },
  };

  return {
    response: errorNoticeResponse,
    nextState: currentState,
  };
}

// Call Google Gemini API with token-efficient rolling history for genuine multi-turn memory
async function callGeminiApi(
  config: AiConfig,
  query: string,
  history: ChatMessage[],
  currentState: UserPreferenceState,
  _lastPrimaryItem?: RecommendationCandidate
): Promise<{ response: DecisionResponse; nextState: UserPreferenceState }> {
  const trimmedKey = config.apiKey.trim();

  // Keep last 8 messages (4 complete turns) to save tokens while keeping exact conversational context
  const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

  // Exclude trailing user message if it's already the current query
  const filteredHistory = history.filter((msg, idx) => {
    if (idx === history.length - 1 && msg.sender === "user" && msg.text?.trim() === query.trim()) {
      return false;
    }
    return true;
  });

  const recentHistory = filteredHistory.slice(-8);
  for (const msg of recentHistory) {
    if (msg.sender === "user") {
      const text = msg.text?.trim() || "";
      if (!text) continue;
      if (contents.length > 0 && contents[contents.length - 1].role === "user") {
        contents[contents.length - 1].parts[0].text += `\n${text}`;
      } else {
        contents.push({
          role: "user",
          parts: [{ text }],
        });
      }
    } else {
      const summary = msg.decision?.summaryText || "";
      const itemDesc = msg.decision?.primaryItem
        ? `[Recommended: ${msg.decision.primaryItem.item.name} at ₹${msg.decision.primaryItem.selectedPrice}] `
        : "";
      const replyText = `${itemDesc}${summary}`.trim();
      if (!replyText) continue;
      if (contents.length > 0 && contents[contents.length - 1].role === "model") {
        contents[contents.length - 1].parts[0].text += `\n${replyText}`;
      } else {
        contents.push({
          role: "model",
          parts: [{ text: replyText }],
        });
      }
    }
  }

  // Current user turn - strictly ensures final role is user without consecutive user entries
  if (contents.length > 0 && contents[contents.length - 1].role === "user") {
    contents[contents.length - 1].parts[0].text += `\n${query}`;
  } else {
    contents.push({
      role: "user",
      parts: [{ text: query }],
    });
  }

  const payload = {
    system_instruction: {
      parts: [{ text: buildSystemInstruction() }],
    },
    contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 600,
      responseMimeType: "application/json",
    },
  };

  const targetModel = config.model || "gemini-flash-latest";
  const proxyPayload = {
    ...payload,
    model: targetModel,
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (trimmedKey && !isSystemGeminiKey(trimmedKey)) {
    headers["x-gemini-api-key"] = trimmedKey;
  }

  const res = await fetch("/gemini", {
    method: "POST",
    headers,
    body: JSON.stringify(proxyPayload),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const errorMsg = errorJson?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(`Gemini proxy error: ${errorMsg}`);
  }

  const data = await res.json();
  const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textResponse) {
    throw new Error(`Empty response from Gemini proxy (${targetModel})`);
  }

  const parsed = JSON.parse(textResponse);
  return mapLlmJsonToDecisionResponse(parsed, currentState, query);
}

// Call OpenAI API
async function callOpenAiApi(
  config: AiConfig,
  query: string,
  history: ChatMessage[],
  currentState: UserPreferenceState,
  _lastPrimaryItem?: RecommendationCandidate
): Promise<{ response: DecisionResponse; nextState: UserPreferenceState }> {
  const targetModel = config.model || "gpt-4o-mini";
  const trimmedKey = config.apiKey.trim();
  const url = "https://api.openai.com/v1/chat/completions";

  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: buildSystemInstruction() },
  ];

  // Exclude trailing user message if it's already the current query
  const filteredHistory = history.filter((msg, idx) => {
    if (idx === history.length - 1 && msg.sender === "user" && msg.text?.trim() === query.trim()) {
      return false;
    }
    return true;
  });

  const recentHistory = filteredHistory.slice(-8);
  for (const msg of recentHistory) {
    if (msg.sender === "user") {
      const text = msg.text?.trim() || "";
      if (!text) continue;
      if (messages.length > 1 && messages[messages.length - 1].role === "user") {
        messages[messages.length - 1].content += `\n${text}`;
      } else {
        messages.push({ role: "user", content: text });
      }
    } else {
      const summary = msg.decision?.summaryText || "";
      const itemDesc = msg.decision?.primaryItem
        ? `[Recommended: ${msg.decision.primaryItem.item.name} at ₹${msg.decision.primaryItem.selectedPrice}] `
        : "";
      const replyText = `${itemDesc}${summary}`.trim();
      if (!replyText) continue;
      if (messages.length > 1 && messages[messages.length - 1].role === "assistant") {
        messages[messages.length - 1].content += `\n${replyText}`;
      } else {
        messages.push({ role: "assistant", content: replyText });
      }
    }
  }

  if (messages.length > 1 && messages[messages.length - 1].role === "user") {
    messages[messages.length - 1].content += `\n${query}`;
  } else {
    messages.push({ role: "user", content: query });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${trimmedKey}`,
    },
    body: JSON.stringify({
      model: targetModel,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    const errorMsg = errorJson?.error?.message || `HTTP ${res.status}`;
    throw new Error(`OpenAI API error: ${errorMsg}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Empty response from OpenAI API");
  }

  const parsed = JSON.parse(content);
  return mapLlmJsonToDecisionResponse(parsed, currentState, query);
}

// Convert LLM output to strongly typed DecisionResponse and ensure 100% menu grounding
function mapLlmJsonToDecisionResponse(
  json: any,
  currentState: UserPreferenceState,
  query: string
): { response: DecisionResponse; nextState: UserPreferenceState } {
  let responseType = json.type || "recommendation";
  if (responseType === "question") {
    responseType = "clarification";
  }

  let primaryCandidate: RecommendationCandidate | undefined = undefined;
  if (json.primaryItemName) {
    let matchedItem = ALL_MENU_ITEMS.find(
      (m) => m.name.toLowerCase() === json.primaryItemName.toLowerCase()
    );
    if (!matchedItem) {
      const lower = json.primaryItemName.toLowerCase();
      matchedItem = ALL_MENU_ITEMS.find(
        (m) => m.name.toLowerCase().includes(lower) || lower.includes(m.name.toLowerCase())
      );
    }

    if (matchedItem) {
      const portion = json.selectedPortion || (matchedItem.portionOptions ? "half" : undefined);
      const price = getItemPriceForPortion(matchedItem, portion);
      primaryCandidate = {
        item: matchedItem,
        selectedPortion: portion,
        selectedPrice: price,
        score: 0.96,
        matchedReasons: Array.isArray(json.whyFitsList) && json.whyFitsList.length > 0
          ? json.whyFitsList
          : ["Matches your preferences"],
      };
    }
  }

  const summaryLower = (json.summaryText || "").toLowerCase();
  const isLlmUnsureOrClarifying =
    responseType === "clarification" ||
    responseType === "redirect" ||
    responseType === "question" ||
    !json.primaryItemName ||
    summaryLower.includes("don't understand") ||
    summaryLower.includes("dont understand") ||
    summaryLower.includes("didn't understand") ||
    summaryLower.includes("didnt understand") ||
    summaryLower.includes("not sure what you mean") ||
    summaryLower.includes("could you clarify") ||
    summaryLower.includes("rephrase") ||
    summaryLower.includes("what kind of food") ||
    summaryLower.includes("sorry, i") ||
    summaryLower.includes("sorry, but");

  if (!primaryCandidate && isLlmUnsureOrClarifying) {
    // If Gemini indicated clarification or didn't understand, don't force a recommendation card.
    // Let Gemini's honest response speak for itself!
    responseType = "clarification";
  } else if (!primaryCandidate && (responseType === "recommendation" || !json.type)) {
    const defaultFav = ALL_MENU_ITEMS.find((m) => m.name === "Paneer Roll") || ALL_MENU_ITEMS[0];
    primaryCandidate = {
      item: defaultFav,
      selectedPortion: defaultFav.portionOptions ? "half" : undefined,
      selectedPrice: defaultFav.price,
      score: 0.95,
      matchedReasons: Array.isArray(json.whyFitsList) && json.whyFitsList.length > 0
        ? json.whyFitsList
        : ["Top campus student recommendation", "Prepared fresh in ~10 mins"],
    };
    responseType = "recommendation";
  }

  let smartCombo: MealCombination | undefined = undefined;
  if (json.combination && json.combination.mainItemName && json.combination.pairingItemName) {
    const main = ALL_MENU_ITEMS.find(
      (m) => m.name.toLowerCase() === json.combination.mainItemName.toLowerCase()
    );
    const pairing = ALL_MENU_ITEMS.find(
      (m) => m.name.toLowerCase() === json.combination.pairingItemName.toLowerCase()
    );
    if (main && pairing) {
      smartCombo = {
        mainItem: main,
        mainPrice: main.price,
        pairingItem: pairing,
        pairingPrice: pairing.price,
        totalPrice: main.price + pairing.price,
        comboReason: json.combination.comboReason || `${main.name} paired with ${pairing.name}`,
      };
    }
  }

  const alternatives: AlternativeCandidate[] = [];
  if (Array.isArray(json.alternatives)) {
    for (const alt of json.alternatives) {
      if (alt.itemName) {
        const found = ALL_MENU_ITEMS.find(
          (m) => m.name.toLowerCase() === alt.itemName.toLowerCase()
        );
        if (found) {
          const isCheaper = primaryCandidate ? found.price < primaryCandidate.selectedPrice : false;
          const isOtherShop = primaryCandidate ? found.shop !== primaryCandidate.item.shop : false;
          const altType: AlternativeCandidate["type"] = isCheaper
            ? "cheaper"
            : isOtherShop
            ? "other_shop"
            : "relaxed_constraint";

          alternatives.push({
            item: found,
            selectedPrice: found.price,
            reason: alt.reason || "Alternative option",
            type: altType,
          });
        }
      }
    }
  }

  const updatedState: UserPreferenceState = {
    ...currentState,
    rawQuery: query,
    budget: json.updatedState?.budget !== undefined ? json.updatedState.budget : currentState.budget,
    dietary: json.updatedState?.dietary !== undefined ? json.updatedState.dietary : currentState.dietary,
    availableTime: json.updatedState?.availableTime !== undefined ? json.updatedState.availableTime : currentState.availableTime,
    craving: json.updatedState?.cravings || currentState.craving,
    exclusions: json.updatedState?.exclusions || currentState.exclusions,
  };

  const response: DecisionResponse = {
    type: responseType,
    primaryItem: primaryCandidate,
    combination: smartCombo,
    alternatives,
    summaryText: json.summaryText || "Here is a recommendation from the canteen menu.",
    whyFitsList: Array.isArray(json.whyFitsList) ? json.whyFitsList : [],
    suggestedFollowUps: Array.isArray(json.suggestedFollowUps) && json.suggestedFollowUps.length > 0
      ? json.suggestedFollowUps
      : ["Anything from Mughlai Affair's?", "Something cheaper", "What about chicken?", "Start a new decision"],
    activePreferences: updatedState,
  };

  return { response, nextState: updatedState };
}
