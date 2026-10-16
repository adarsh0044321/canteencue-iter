import {
  DecisionResponse,
  UserPreferenceState,
  ChatMessage,
  RecommendationCandidate,
} from "../data/types";
import { processUserDecision } from "../engine";
import { processAiDecision, getStoredAiConfig, getAiTrialInfo, YOUTUBE_TUTORIAL_URL } from "./aiService";
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

/**
 * Determines whether a query is related to campus food, canteen outlets, cravings,
 * budgets, or an ongoing meal conversation.
 * Used by the offline engine to act as a rate limiter / guardian and PREVENT
 * non-food queries from being forwarded to the live LLM.
 */
export function isFoodRelatedQuery(query: string, history: ChatMessage[] = []): boolean {
  const text = query.trim().toLowerCase();
  if (!text) return false;

  // Explicit non-food patterns (programming, homework, general trivia, politics, bot meta-prompts)
  const nonFoodPatterns = [
    /\b(code|coding|python|javascript|typescript|java|c\+\+|html|css|sql|github|git|bug|function|compile|regex|algorithm|script|api|endpoint|backend|frontend)\b/i,
    /\b(math|maths|equation|derivative|integral|algebra|geometry|calculus|formula|physics|chemistry|biology|quantum|gravity|homework|assignment|exam\s+paper)\b/i,
    /\b(prime\s+minister|president|parliament|election|politics|government|constitution|supreme\s+court)\b/i,
    /\b(capital\s+of|population\s+of|weather\s+in|forecast|climate|earthquake|tsunami)\b/i,
    /\b(who\s+won|score\s+of|cricket\s+match|football\s+match|world\s+cup|ipl|olympics)\b/i,
    /\b(write\s+(?:me\s+)?(?:a\s+)?(?:poem|essay|story|song|script|letter|email)|tell\s+(?:me\s+)?(?:a\s+)?joke|sing\s+(?:a\s+)?song)\b/i,
    /\b(who\s+is\s+(?:elon\s+musk|modi|trump|biden|messi|ronaldo|virat|dhoni))\b/i,
    /\b(crypto|bitcoin|ethereum|stock\s+price|market\s+crash|investing)\b/i,
  ];

  const hasNonFoodPattern = nonFoodPatterns.some((pattern) => pattern.test(text));

  // Comprehensive food, canteen, craving, and dining keywords
  const foodKeywords = [
    "food", "eat", "eating", "meal", "meals", "dish", "dishes", "snack", "snacks", "bite", "bites",
    "breakfast", "lunch", "dinner", "brunch", "supper", "tiffin",
    "hungry", "starving", "starve", "hunger", "appetite", "crave", "craving", "cravings",
    "bhook", "bhuk", "khana", "nashta", "pet", "tummy", "stomach",
    "canteen", "cafe", "cafeteria", "mess", "food court", "counter", "shop", "stall",
    "anna", "annas", "anna's", "mughlai", "halka", "phulka", "halka phulka",
    "maggie point", "maggi point", "4th floor", "fourth floor", "iter juice", "juice centre", "juice center",
    "pizza", "pizzas", "burger", "burgers", "roll", "rolls", "wrap", "wraps", "frankie",
    "noodle", "noodles", "maggi", "maggie", "pasta", "pastas", "macaroni", "sandwich", "sandwiches",
    "dosa", "dosas", "idli", "idlis", "vada", "vadas", "uttapam", "sambar", "chutney",
    "poori", "puri", "chole", "bhature", "kulcha", "paratha", "parathas", "roti", "rotis", "chapati", "naan",
    "biryani", "biryany", "biriani", "pulao", "rice", "fried rice", "schezwan", "khichdi", "curd rice",
    "thali", "curry", "gravy", "dal", "dal makhani", "paneer", "chicken", "egg", "eggs", "anda",
    "mutton", "fish", "prawn", "prawns", "kebab", "tikka", "manchurian", "chilly", "chilli",
    "momos", "momo", "samosa", "samosas", "chaat", "pakora", "pakoda", "cutlet", "fries", "french fries",
    "shawarma", "tacos", "salad", "salads", "soup", "soups",
    "drink", "drinks", "beverage", "beverages", "coffee", "coffe", "tea", "chai",
    "frappe", "cappuccino", "latte", "espresso", "cold coffee", "shake", "shakes", "milkshake",
    "juice", "juices", "smoothie", "smoothies", "lassi", "buttermilk", "chaas",
    "soda", "sprite", "coke", "thums up", "pepsi", "fanta", "limca", "maaza", "water", "water bottle",
    "sweet", "dessert", "desserts", "ice cream", "icecream", "cake", "pastry", "brownie",
    "veg", "vegetarian", "non-veg", "nonveg", "non vegetarian", "vegan", "eggetarian",
    "spicy", "sweet", "light", "lighter", "heavy", "filling", "crispy", "crunchy",
    "cheesy", "creamy", "hot", "cold", "healthy", "diet", "clean food", "junk food",
    "budget", "rupee", "rupees", "rs", "inr", "bucks", "paise", "cheap", "cheaper", "expensive", "cost", "price",
    "under", "max", "below", "within",
    "amul", "cadbury", "kitkat", "oreo", "bournvita", "horlicks",
  ];

  const hasFoodKeyword = foodKeywords.some((word) => {
    if (word.length <= 4) {
      const regex = new RegExp(`\\b${word}\\b`, "i");
      return regex.test(text);
    }
    return text.includes(word);
  });

  if (hasNonFoodPattern && !hasFoodKeyword) {
    return false;
  }

  if (hasFoodKeyword) {
    return true;
  }

  // Greetings, help, or platform commands are allowed
  if (
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)[\s!.,?\\/]*$/i.test(text) ||
    /^(help|reset|clear|start over|new decision)[\s!.,?]*$/i.test(text) ||
    /^(what can you do|how do you work|who are you)[\s!.,?]*$/i.test(text)
  ) {
    return true;
  }

  // Follow-up, alternative, rejection, or preference adjustment cues
  const followUpCues = [
    "why did you choose this",
    "why choose",
    "why this",
    "anything better",
    "something better",
    "something cheaper",
    "cheaper",
    "other shop",
    "another shop",
    "different shop",
    "tell me more",
    "something else",
    "anything else",
    "what else",
    "something different",
    "anything different",
    "another option",
    "other option",
    "different option",
    "not this",
    "not that",
    "don't want",
    "dont want",
    "would be better",
    "surprise me",
    "pick one",
    "skip",
    "instead",
    "change",
    "switch",
  ];

  if (followUpCues.some((cue) => text.includes(cue))) {
    return true;
  }

  if (
    /\b(nah+|nope|no\s+thanks|skip\s+(?:this|it)|other\s+(?:one|choice)|different\s+(?:one|dish)|better\s+option)\b/i.test(text)
  ) {
    return true;
  }

  // Any message in an ongoing conversation without explicit non-food patterns is on-topic
  if (history.length > 0 && !hasNonFoodPattern) {
    return true;
  }

  return false;
}

/**
 * Checks whether the offline deterministic engine caught the user's intent
 * with high confidence.
 */
export function isOfflineEngineConfidentlyCatching(
  cleanQuery: string,
  offlineResult: { response: DecisionResponse; nextState: UserPreferenceState }
): boolean {
  const text = cleanQuery.toLowerCase();
  const resp = offlineResult.response;

  // 1. If the offline engine gave "I didn't quite catch that...", it definitely did not catch it!
  if (resp.type === "clarification" && resp.summaryText.includes("didn't quite catch that")) {
    return false;
  }

  // 2. Off-menu item requests (e.g. pizza, burger, pasta, shawarma, momos)
  const isOffMenu = /\b(pizza|pizzas?|burger|burgers?|pasta|pastas?|shawarma|shawarmas?|momos?|sandwich|french\s+fries|tacos|ice\s*cream)\b/i.test(text);
  if (isOffMenu) {
    return false;
  }

  // 3. Conversational negation, hesitation, or dissatisfaction/complaint
  // (e.g. "damnnnn dosa isn't light", "okay maybe somethinh more lighter", "not light", "not spicy", "too heavy")
  const isConversationalHesitationOrNegation =
    /\b(isn'?t|is\s+not|not|no|don'?t|dont|hate|dislike|too)\s+(light|spicy|heavy|filling|good|healthy|tasty|cheap)\b/i.test(text) ||
    /\b(dam+n+|wth|wtf|nope|nah+|not\s+this|something\s+else|would\s+be\s+better|different\s+option|another\s+option|maybe|somethinh|more\s+light|lighter)\b/i.test(text);
  if (isConversationalHesitationOrNegation) {
    return false;
  }

  // 4. Nuanced conversational student queries (> 6 words or complex emotional triggers)
  if (!isStandardTestStatement(cleanQuery)) {
    return false;
  }

  // 5. If the offline engine gave a no-match tradeoff (couldn't satisfy constraints)
  if (resp.type === "no_match_tradeoff") {
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
  const cleanQuery = query.trim();
  const isReset = /^(reset|clear|start over|new decision)$/i.test(cleanQuery);

  // 1. Reset command -> handled instantly by offline engine
  if (isReset) {
    const offlineReset = processUserDecision(cleanQuery, currentState, lastPrimaryItem);
    await persistDecisionHistory(cleanQuery, history, offlineReset);
    return { ...offlineReset, source: "deterministic_engine" };
  }

  // 2. Non-Food Concern Check (Offline model acts as rate limiter & guardian)
  // If the offline model knows the concern is NOT food related, it will NOT send it to Gemini!
  const isFood = isFoodRelatedQuery(cleanQuery, history);
  if (!isFood) {
    const nonFoodResponse: DecisionResponse = {
      type: "redirect",
      summaryText:
        "I am CanteenCue, your campus canteen food decision assistant. I can only help you with food recommendations, menus, cravings, dietary preferences, and budgets at the 6 campus canteens.",
      whyFitsList: [
        "Specialized Campus Focus: Dedicated strictly to campus food decisions and outlet recommendations",
        "Campus Outlets: Anna's Restaurant, Mughlai Affair's, HALKA PHULKA, MAGGIE POINT, 4TH FLOOR, Iter Juice Centre",
      ],
      alternatives: [],
      suggestedFollowUps: [
        "I have ₹100",
        "Something spicy and filling",
        "Vegetarian food under ₹80",
        "What can I get in 10 minutes?",
      ],
      activePreferences: currentState,
    };
    const nonFoodResult = { response: nonFoodResponse, nextState: currentState };
    await persistDecisionHistory(cleanQuery, history, nonFoodResult);
    return { ...nonFoodResult, source: "deterministic_engine" };
  }

  // 3. Evaluate query with the offline deterministic model first (acts as 0-token rate limiter)
  const offlineResult = processUserDecision(cleanQuery, currentState, lastPrimaryItem);

  // Check if an online AI model (Gemini or OpenAI) is configured
  const aiConfig = getStoredAiConfig();
  const hasLiveAiKey = aiConfig.provider !== "builtin" && !!aiConfig.apiKey.trim();

  // Check if offline model caught it with confidence
  const isOfflineCatching = isOfflineEngineConfidentlyCatching(cleanQuery, offlineResult);

  let result: { response: DecisionResponse; nextState: UserPreferenceState };
  let source: "deterministic_engine" | "live_llm" = "deterministic_engine";

  if (isOfflineCatching) {
    // Offline model caught it! Instant 0-token response saves API rate limits
    result = offlineResult;
    source = "deterministic_engine";
  } else if (hasLiveAiKey) {
    const trialInfo = getAiTrialInfo(aiConfig.apiKey);

    if (trialInfo.isTrialExpired && !trialInfo.hasCustomKey) {
      // 3-day free shared AI trial concluded -> ask user to add their own free key or watch tutorial
      const trialExpiredResponse: DecisionResponse = {
        type: "clarification",
        summaryText:
          "⏳ Your 3-day free AI trial has ended! To continue using online AI reasoning with Google Gemini, please configure your own free Gemini API key (it's 100% free and takes 1 minute to generate). You can watch the video tutorial below.\n\nOur instant built-in campus decision engine is still 100% active and free to help you decide!",
        whyFitsList: [
          "Free 3-Day Trial Period Concluded",
          "Add your personal free API key in AI Settings to resume unlimited online reasoning",
          `Watch video demonstration: ${YOUTUBE_TUTORIAL_URL}`,
          "Instant offline campus decision engine remains active with 0 token cost",
        ],
        alternatives: offlineResult.response.alternatives || [],
        suggestedFollowUps: [
          "Open AI Settings",
          "Watch Video Guide",
          "Recommend something to eat",
          "Vegetarian food under ₹80",
        ],
        activePreferences: currentState,
        apiErrorDetails: {
          provider: "gemini",
          message: "Your 3-day free AI trial has ended. Please configure your personal free Gemini API key in AI Settings.",
          hadFallback: true,
          requiresApiKey: true,
        },
      };
      result = { response: trialExpiredResponse, nextState: currentState };
      source = "deterministic_engine";
    } else {
      // User is within 3-day trial or has their own custom key -> AUTO SWITCH to online AI!
      source = "live_llm";
      try {
        result = await processAiDecision(cleanQuery, history, currentState, lastPrimaryItem);
      } catch (err) {
        console.warn("Auto-switch to online AI failed, falling back to offline engine:", err);
        result = offlineResult;
        source = "deterministic_engine";
      }
    }
  } else {
    // Online model is not configured (built-in mode) -> use the best offline response
    result = offlineResult;
    source = "deterministic_engine";
  }

  await persistDecisionHistory(cleanQuery, history, result);

  return { ...result, source };
}

async function persistDecisionHistory(
  query: string,
  history: ChatMessage[],
  result: { response: DecisionResponse; nextState: UserPreferenceState }
): Promise<void> {
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

    // Filter out trailing duplicate user message from history if already present
    const baseHistory = history.filter((msg, idx) => {
      if (idx === history.length - 1 && msg.sender === "user" && msg.text?.trim() === query.trim()) {
        return false;
      }
      return true;
    });

    await saveChatSession({
      id: sessionId,
      title: baseHistory[0]?.text?.slice(0, 30) || query.slice(0, 30),
      createdAt: baseHistory[0]?.timestamp || Date.now(),
      updatedAt: Date.now(),
      messages: [...baseHistory, userMsg, asstMsg],
      preferenceState: result.nextState,
    });

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
}
