import {
  DecisionResponse,
  UserPreferenceState,
  ChatMessage,
  RecommendationCandidate,
} from "../data/types";
import { processUserDecision } from "../engine";
import { processAiDecision, getStoredAiConfig } from "./aiService";
import { saveChatSession, updateUserProfile, getCurrentSessionId } from "./chatDatabase";

/**
 * Determines whether a query is a standard, predictable test statement
 * (which can be handled instantly by the deterministic engine with 0 token cost)
 * or an open-ended, complex, colloquial conversational query
 * (which should be routed to the live LLM for deep natural reasoning).
 */
export function isStandardTestStatement(query: string): boolean {
  const text = query.trim().toLowerCase();

  // 1. Strict standard greetings / commands
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)[\s!.,?\\/]*$/i.test(text) ||
    /^(help|reset|clear|start over)[\s!.,?]*$/i.test(text) ||
    /^(why did you choose this|why this|anything better|something cheaper|other shop)[\s!.,?]*$/i.test(text)
  ) {
    return true;
  }

  // 2. Exact simple budget expressions (e.g., "I have ₹100", "Under ₹80", "Budget 50")
  if (
    /^(i have|budget|under|below|within|less than|max)\s*(?:₹|rs\.?|rupees?)?\s*\d{2,3}[\s!.,?]*$/i.test(text) ||
    /^\d{2,3}\s*(?:₹|rs\.?|rupees?)?$/i.test(text)
  ) {
    return true;
  }

  // 3. Exact standard dietary statements
  if (
    /^(i want|show|pure)?\s*(vegetarian|pure veg|veg only|strictly vegetarian|non-veg|chicken|egg)[\s!.,?]*$/i.test(text)
  ) {
    return true;
  }

  // 4. Exact standard failure test cases
  if (
    text.includes("chicken tikka") ||
    text.includes("chicken thali under") ||
    text.includes("chicken biryani under")
  ) {
    return true;
  }

  // If the query contains complex student phrasing, conversational descriptions,
  // multi-clause desires (e.g. "heavy and party like", "celebration", "stressed"),
  // treat it as an open-ended conversational query for the live AI!
  const complexCues = [
    "party",
    "celebrat",
    "heavy",
    "something like",
    "u see",
    "stress",
    "exam",
    "friends",
    "share",
    "sleepy",
    "vibe",
    "confused",
    "what should i choose",
    "treat myself",
    "bhai",
    "bhook",
    "party like",
    "rainy",
    "celebrate",
  ];

  if (complexCues.some((cue) => text.includes(cue))) {
    return false;
  }

  // Long queries (> 6 words) usually have nuanced conversational context
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 6) {
    return false;
  }

  return true;
}

export interface DecisionExecutionResult {
  response: DecisionResponse;
  nextState: UserPreferenceState;
  source: "deterministic_engine" | "live_llm";
}

export async function routeUserDecision(
  query: string,
  history: ChatMessage[],
  currentState: UserPreferenceState,
  lastPrimaryItem?: RecommendationCandidate
): Promise<DecisionExecutionResult> {
  const aiConfig = getStoredAiConfig();
  const hasLiveAiKey = aiConfig.provider !== "builtin" && !!aiConfig.apiKey.trim();
  const isReset = /^(reset|clear|start over|new decision)$/i.test(query.trim());

  let result: { response: DecisionResponse; nextState: UserPreferenceState };
  let source: "deterministic_engine" | "live_llm" = "deterministic_engine";

  // When an AI provider (Gemini / OpenAI) is configured, route all conversational queries directly to the AI server!
  if (hasLiveAiKey && !isReset) {
    source = "live_llm";
    result = await processAiDecision(query, history, currentState, lastPrimaryItem);
  } else {
    // Built-in offline engine or exact reset command
    result = processUserDecision(query, currentState, lastPrimaryItem);
  }

  // Persist session to local chat database (IndexedDB / localStorage)
  try {
    const sessionId = getCurrentSessionId() || `session_${Date.now()}`;
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      timestamp: Date.now(),
      text: query,
    };
    const asstMsg: ChatMessage = {
      id: `asst_${Date.now() + 1}`,
      sender: "assistant",
      timestamp: Date.now() + 1,
      decision: result.response,
    };

    await saveChatSession({
      id: sessionId,
      title: history[0]?.text?.slice(0, 30) || query.slice(0, 30),
      createdAt: history[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
      messages: [...history, userMsg, asstMsg],
      preferenceState: result.nextState,
    });

    // Update user profile database with discovered likes/dislikes
    if (result.nextState.craving && result.nextState.craving.length > 0) {
      await updateUserProfile({
        likes: result.nextState.craving,
        dietaryPreference: result.nextState.dietary,
        averageBudget: result.nextState.budget || undefined,
        favoriteItems: result.response.primaryItem ? [result.response.primaryItem.item.name] : [],
      });
    }
  } catch (err) {
    console.warn("Failed to persist to chat database:", err);
  }

  return { ...result, source };
}
