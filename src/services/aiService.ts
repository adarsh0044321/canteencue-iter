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

export type AiProvider = "builtin" | "gemini" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enableMemory: boolean;
}

const STORAGE_KEY = "canteencue_ai_config";

const envGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "";
const envModel = (import.meta as any).env?.VITE_GEMINI_MODEL || "gemini-flash-lite-latest";

export const SYSTEM_GEMINI_KEY = envGeminiKey;

export function isSystemGeminiKey(key: string): boolean {
  return key === envGeminiKey || !key.trim();
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: envGeminiKey ? "gemini" : "builtin",
  apiKey: envGeminiKey,
  model: envModel,
  enableMemory: true,
};

export function getStoredAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    // Auto-migrate legacy deprecated or congested models
    if (
      parsed.model === "gemini-2.5-flash" ||
      parsed.model === "gemini-1.5-flash" ||
      parsed.model === "gemini-flash-latest" ||
      !parsed.model
    ) {
      parsed.model = "gemini-flash-lite-latest";
    }
    // If no apiKey in storage but env has it, use env
    if (!parsed.apiKey && envGeminiKey) {
      parsed.apiKey = envGeminiKey;
      parsed.provider = "gemini";
    }
    return { ...DEFAULT_AI_CONFIG, ...parsed };
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(config: AiConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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
  if (!trimmedKey) {
    return {
      success: false,
      message: "Please enter a valid API key.",
    };
  }

  try {
    if (config.provider === "gemini") {
      const preferredModel = config.model || "gemini-flash-lite-latest";
      const candidateModels = [preferredModel, "gemini-flash-lite-latest", "gemini-3.8-flash"].filter(
        (m, idx, arr) => arr.indexOf(m) === idx
      );

      let lastError = "";
      for (const model of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": trimmedKey,
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: "Explain how AI works in a few words" }] }],
              generationConfig: { maxOutputTokens: 40 },
            }),
          });

          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Connected";
            return {
              success: true,
              message: `Connected successfully to Google Gemini (${model})! Response: "${reply}"`,
            };
          } else {
            const errorData = await res.json().catch(() => ({}));
            lastError = errorData?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
          }
        } catch (e: any) {
          lastError = e.message || String(e);
        }
      }

      return { success: false, message: `Gemini API Error: ${lastError}` };
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

export async function processAiDecision(
  query: string,
  history: ChatMessage[],
  currentState: UserPreferenceState,
  lastPrimaryItem?: RecommendationCandidate
): Promise<{ response: DecisionResponse; nextState: UserPreferenceState }> {
  const config = getStoredAiConfig();

  // If Built-in engine or no API key, use the enhanced local engine
  if (config.provider === "builtin" || !config.apiKey.trim()) {
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

  const rawErrorMsg = apiError?.message || "Connection to external AI service failed.";
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
    rawErrorMsg.includes("429") || rawErrorMsg.toLowerCase().includes("quota")
      ? `API quota or rate limit reached on ${config.provider.toUpperCase()}. Please configure your own API key in AI Settings (⚙️).`
      : rawErrorMsg.includes("400") || rawErrorMsg.toLowerCase().includes("key")
      ? `Invalid or inactive API key for ${config.provider.toUpperCase()}. Please update your API key in AI Settings (⚙️).`
      : `Unable to reach ${config.provider.toUpperCase()} AI model (${rawErrorMsg}).`;

  const errorNoticeResponse: DecisionResponse = {
    type: "clarification",
    summaryText: `⚠️ Live AI Service Notice: ${friendlyErrorMsg}\n\nSince this query requires open-ended conversational reasoning, the offline engine could not fulfill it. Please configure or use your own API key in AI Settings, or ask with specific budget/dietary constraints.`,
    whyFitsList: [
      `Live model (${config.provider.toUpperCase()}) error: ${rawErrorMsg}`,
      "Tap 'AI Settings' in the sidebar to configure your personal Gemini or OpenAI API key",
      "Or state a specific budget (e.g. ₹100) or craving (e.g. spicy roll) to use the built-in offline engine"
    ],
    alternatives: [],
    suggestedFollowUps: [
      "Open AI Settings",
      "Vegetarian food under ₹80",
      "Something spicy and filling",
      "What can I get for ₹100?"
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
  const preferredModel = config.model || "gemini-flash-lite-latest";
  const trimmedKey = config.apiKey.trim();
  const candidateModels = [preferredModel, "gemini-flash-lite-latest", "gemini-3.8-flash"].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

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

  let lastError: Error | null = null;
  for (const model of candidateModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${trimmedKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": trimmedKey,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const errorMsg = errorJson?.error?.message || `HTTP ${res.status}`;
        throw new Error(`Gemini API error (${model}): ${errorMsg}`);
      }

      const data = await res.json();
      const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error(`Empty response from Gemini API (${model})`);
      }

      const parsed = JSON.parse(textResponse);
      return mapLlmJsonToDecisionResponse(parsed, currentState, query);
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} unavailable, trying failover model:`, err.message);
    }
  }

  throw lastError || new Error("All candidate Gemini models failed");
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
          alternatives.push({
            item: found,
            selectedPrice: found.price,
            reason: alt.reason || "Alternative option",
            type: "cheaper",
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
