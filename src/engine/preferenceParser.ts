import { UserPreferenceState, ShopName, MenuItem } from "../data/types";
import { ALL_MENU_ITEMS } from "../data/menuService";

export interface ParsedIntent {
  intentType:
    | "recommend"
    | "followup"
    | "specific_item"
    | "off_menu_item"
    | "cheaper"
    | "why"
    | "why_not_comparison"
    | "ask_online_model"
    | "anything_better"
    | "switch_alternative"
    | "other_shop"
    | "unavailable_item"
    | "over_budget_item"
    | "unrelated"
    | "improper_input"
    | "reset"
    | "greeting";
  extractedPreferences: Partial<UserPreferenceState>;
  specificItemQuery?: string;
  matchedMenuItem?: MenuItem;
  comparisonItems?: { itemA: string; itemB: string };
  targetOverBudgetItem?: { name: string; price: number };
  isUnrelated?: boolean;
}

/**
 * Robust culinary negation checker supporting English, colloquial student phrases, and Hinglish
 */
export function hasNegatedTerm(text: string, termPattern: string): boolean {
  const regexPrefix = new RegExp(
    `(?:not|no|never|without|avoid(?:ing)?|don'?t\\s+want|dont\\s+want|must\\s+not\\s+be|should\\s+not\\s+be|shouldn'?t\\s+be|said\\s+not|said\\s+it\\s+must\\s+not\\s+be|said\\s+it\\s+should\\s+not\\s+be|told\\s+you\\s+not|non-?|less|zero|anything\\s+but|but\\s+not)\\s+(?:to\\s+be\\s+|too\\s+|very\\s+|so\\s+|much\\s+|really\\s+|any\\s+|it\\s+|anything\\s+)*(?:${termPattern})`,
    "i"
  );
  const regexSuffix = new RegExp(
    `(?:${termPattern})\\s+(?:nahi|nhi|mat|avoid|mat\\s+karna|mat\\s+karo|nahi\\s+chahiye|nhi\\s+chahiye)`,
    "i"
  );
  return regexPrefix.test(text) || regexSuffix.test(text);
}

export const DISH_ALIASES: Record<string, string> = {
  // Chhole Bhature & extras (HALKA PHULKA)
  "chola bhatura": "Chhole Bhature",
  "chola bhature": "Chhole Bhature",
  "chole bhature": "Chhole Bhature",
  "chole bhatura": "Chhole Bhature",
  "chhole bhatura": "Chhole Bhature",
  "chhole bhature": "Chhole Bhature",
  "chhola bhatura": "Chhole Bhature",
  "chhola bhature": "Chhole Bhature",
  "bhatura": "Chhole Bhature",
  "bhature": "Chhole Bhature",
  "chole": "Chhole Bhature",
  "chhole": "Chhole Bhature",
  "chola": "Chhole Bhature",
  "extra chhole": "Extra Chhole",
  "extra chole": "Extra Chhole",
  "extra bhature": "Extra Bhature",
  "extra bhatura": "Extra Bhature",

  // Street Snacks & Chaat
  "pani puri": "Pani Puri",
  "panipuri": "Pani Puri",
  "golgappa": "Pani Puri",
  "golgappe": "Pani Puri",
  "puchka": "Pani Puri",
  "phuchka": "Pani Puri",
  "gupchup": "Spl Masala Gupchup",
  "masala gupchup": "Spl Masala Gupchup",
  "dahi gupchup": "Dahi Gupchup",
  "papdi chat": "Papdi Chat",
  "papdi chaat": "Papdi Chat",
  "samosa chat": "Samosa Chat",
  "samosa chaat": "Samosa Chat",
  "alu tika chat": "Alu Tika Chat",
  "aloo tikki chaat": "Alu Tika Chat",
  "cutlet chat": "Cutlet Chat",
  "cutlet chaat": "Cutlet Chat",

  // Pav Bhaji & Vada Pav
  "pav bhaji": "Plain Pav Bhaji",
  "pavbhaji": "Plain Pav Bhaji",
  "butter pav bhaji": "Butter Pav Bhaji",
  "cheese pav bhaji": "Cheese Pav Bhaji",
  "vada pav": "Classic Vada Pav",
  "vadapav": "Classic Vada Pav",
  "wada pav": "Classic Vada Pav",
  "wadapav": "Classic Vada Pav",
  "butter vada pav": "Butter Vada Pav",
  "cheese vada pav": "Cheese Vada Pav",

  // Dahiwada & Odia Breakfast
  "dahi vada": "Aludum Dahiwada",
  "dahiwada": "Aludum Dahiwada",
  "dahi wada": "Aludum Dahiwada",
  "aludum dahiwada": "Aludum Dahiwada",
  "aloo dum dahi vada": "Aludum Dahiwada",
  "khata meetha dahiwada": "Khata Meetha Dahiwada",
  "upma": "Upama",
  "upama": "Upama",
  "aluchop": "Aluchop",
  "aloo chop": "Aluchop",

  // Dosa & South Indian
  "dosa": "Masala Dosa",
  "plain dosa": "Plain Dosa",
  "masala dosa": "Masala Dosa",
  "onion dosa": "Plain Onion Dosa",
  "butter masala dosa": "Butter Masala Dosa",
  "paneer dosa": "Paneer Masala Dosa",
  "paneer masala dosa": "Paneer Masala Dosa",
  "cheese masala dosa": "Cheese Masala Dosa",
  "uttapam": "Vegetable Uttapam",
  "veg uttapam": "Vegetable Uttapam",
  "onion uttapam": "Onion Uttapam",
  "tomato uttapam": "Tomato Uttapam",

  // Paratha
  "alu paratha": "Alu Paratha",
  "aloo paratha": "Alu Paratha",
  "paneer paratha": "Paneer Paratha",

  // Rolls
  "veg roll": "Veg Roll",
  "paneer roll": "Paneer Roll",
  "mushroom roll": "Mushroom Roll",
  "egg roll": "Egg Roll",
  "chicken roll": "Egg Chicken Roll",
  "egg chicken roll": "Egg Chicken Roll",

  // Maggi & Noodles
  "maggi": "Original Masala Maggi",
  "maggie": "Original Masala Maggi",
  "masala maggi": "Original Masala Maggi",
  "chilli garlic maggi": "Chilli Garlic Maggi",
  "peri peri maggi": "Periperi Maggi",
  "veg noodles": "Veg Noodles",
  "paneer noodles": "Paneer Noodles",
  "egg noodles": "Egg Noodles",
  "schezwan noodles": "Veg Schezwan Noodles",

  // Curries & Non-Veg Specials
  "chicken kasa": "Chicken Kasa",
  "chicken kassa": "Chicken Kasa",
  "chicken kosha": "Chicken Kasa",
  "kadhai chicken": "Kadhai Chicken",
  "kadai chicken": "Kadhai Chicken",
  "tandoori chicken": "Tandoori Chicken",
  "butter chicken": "Butter Chicken Masala",
  "butter chicken masala": "Butter Chicken Masala",
  "chicken tikka": "Chicken Tikka",
  "chicken lollipop": "Chicken Lollipop",
  "chilli chicken": "Chilli Chicken",
  "chilly chicken": "Chilli Chicken",
  "chicken manchurian": "Chicken Manchurian",
  "chicken 65": "Chicken 65",

  // Paneer Specialties
  "paneer butter masala": "Paneer Butter Masala",
  "paneer butter": "Paneer Butter Masala",
  "butter paneer": "Paneer Butter Masala",
  "kadai paneer": "Kadai Paneer",
  "kadhai paneer": "Kadai Paneer",
  "chilli paneer": "Chilli Paneer",
  "chilly paneer": "Chilli Paneer",
  "paneer manchurian": "Paneer Manchurian",
  "crispy paneer": "Crispy Paneer",

  // Thalis
  "veg thali": "Veg Thali",
  "paneer thali": "Paneer Thali",
  "egg thali": "Egg Thali",
  "chicken thali": "Chicken Thali",
  "fish thali": "Fish Thali",

  // Coffee, Shakes & Beverages
  "cold coffee": "Café Frappe (Cold Coffee)",
  "cold coffee shake": "Cold Coffee Shake",
  "frappe": "Café Frappe (Cold Coffee)",
  "cafe frappe": "Café Frappe (Cold Coffee)",
  "espresso": "Espresso Black Coffee",
  "black coffee": "Espresso Black Coffee",
  "cappuccino": "Cappuccino",
  "latte": "Café Latte",
  "hot chocolate": "Hot Chocolate",
  "cold chocolate": "Cold Chocolate",
  "tea": "Masala Tea",
  "chai": "Masala Tea",
  "lemon tea": "Lemon Tea",
  "oreo shake": "Oreo Shake",
  "mango shake": "Mango Shake",
  "banana shake": "Banana Shake",
  "chocolate shake": "Chocolate Shake",
  "kitkat shake": "Spl Kitkat",
  "lassi": "Spl Lassi",
  "sweet lassi": "Spl Lassi",
};

/**
 * Strips conversational conversational prefixes, suffixes, and outlet mentions
 * to isolate the target dish name.
 */
export function cleanItemSearchTerm(query: string): string {
  let text = (query || "").toLowerCase().trim();

  // Iteratively strip conversational question/suggestion prefixes
  let prev = "";
  while (text !== prev) {
    prev = text;
    text = text
      .replace(/^(?:okay|ok|so|well|then|umm+|uhh+|hmm+|yo|hey|hi|hello)\b[\s,]*/i, "")
      .replace(/^(?:can\s+(?:i|we)\s+get|can\s+(?:i|we)\s+have|could\s+(?:i|we)\s+get|could\s+(?:i|we)\s+have|where\s+(?:can|do)\s+(?:i|we)\s+get|where\s+(?:can|do)\s+(?:i|we)\s+have|what\s+about|how\s+about|tell\s+me\s+more\s+about|tell\s+me\s+about|ask\s+about|i\s+want\s+to\s+get|i\s+want|i\s+would\s+like|i'd\s+like|id\s+like|give\s+me|show\s+me|order|switch\s+to|keep|how\s+is|what\s+is|do\s+(?:you|they)\s+have|is\s+there|are\s+there|lets\s+go\s+for|let's\s+go\s+for|lets\s+get|let's\s+get|maybe|suggest|recommend)\b[\s,]*/i, "")
      .replace(/^(?:a|an|the|some)\b[\s,]*/i, "")
      .trim();
  }

  // Iteratively strip conversational suffixes
  prev = "";
  while (text !== prev) {
    prev = text;
    text = text
      .replace(/[\s,]+(?:somewhere(?:\s+on\s+campus|\s+in\s+campus)?|anywhere(?:\s+on\s+campus|\s+in\s+campus)?|on\s+campus|in\s+campus|near\s+me|here|please|available|available\s+hai(?:\s+kya)?|milega|mil\s+jayega|mil\s+sakta\s+hai|hoga|hai\s+kya|bhai|bro|yaar)$/i, "")
      .replace(/[\s?!.,~]+$/g, "")
      .trim();
  }

  // Strip trailing outlet mentions (e.g. "from iter juice", "from anna's", "at halka phulka")
  text = text
    .replace(/\s+(?:from|at)\s+(?:the\s+)?(?:iter\s+juice(?:\s+centre|\s+center)?|juice\s+(?:centre|center|corner|shop)|anna'?s?(?:\s+restaurant)?|mughlai(?:\s+affair'?s?)?|maggie\s+point|maggi\s+point|4th\s+floor|halka\s+phulka).*$/i, "")
    .trim();

  return text;
}

/**
 * Direct lookup for specific items from live menu catalog
 */
export function findMatchingMenuItem(cleanQuery: string): MenuItem | undefined {
  // If the query contains explicit budget constraints (e.g. "under 50", "budget 100"),
  // let the deterministic constraint filter and ranker handle it with precision
  if (
    /(?:under|below|less\s+than|budget|within|max)\s*(?:₹|rs\.?|rupees?)?\s*\d+/i.test(cleanQuery)
  ) {
    return undefined;
  }

  // If the query contains conversational negation or dissatisfaction, let exclusion filters process it
  if (
    /\b(isn'?t|is\s+not|not|no|don'?t|dont|hate|avoid|dislike|dam+n+|wth|wtf)\b/i.test(cleanQuery)
  ) {
    return undefined;
  }

  const stripped = cleanItemSearchTerm(cleanQuery);

  if (
    !stripped ||
    stripped === "food" ||
    stripped === "chicken" ||
    stripped === "veg" ||
    stripped === "vegetarian" ||
    stripped === "non veg" ||
    stripped === "egg" ||
    stripped === "spicy" ||
    stripped === "something" ||
    stripped === "anything"
  ) {
    return undefined;
  }

  // 1. Direct Alias & Synonym Dictionary Lookup
  if (DISH_ALIASES[stripped]) {
    const aliasTarget = DISH_ALIASES[stripped].toLowerCase();
    const found = ALL_MENU_ITEMS.find((it) => it.name.toLowerCase() === aliasTarget);
    if (found) return found;
  }

  // Alias lookup without trailing descriptors like "plate", "combo", "order", "dish"
  const strippedWithoutDescriptor = stripped.replace(/\s+(?:plate|dish|item|combo|order)$/i, "");
  if (DISH_ALIASES[strippedWithoutDescriptor]) {
    const aliasTarget = DISH_ALIASES[strippedWithoutDescriptor].toLowerCase();
    const found = ALL_MENU_ITEMS.find((it) => it.name.toLowerCase() === aliasTarget);
    if (found) return found;
  }

  // 2. Exact name match
  const exact = ALL_MENU_ITEMS.find((it) => it.name.toLowerCase() === stripped);
  if (exact) return exact;

  // 3. Match without parenthetical annotations, e.g. "Café Frappe (Cold Coffee)" vs "Café Frappe"
  const strippedParen = stripped.replace(/\s*\([^)]*\)/g, "").trim();
  const withoutParen = ALL_MENU_ITEMS.find((it) => {
    const itemNameClean = it.name.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
    return itemNameClean === stripped || (strippedParen.length > 2 && itemNameClean === strippedParen);
  });
  if (withoutParen) return withoutParen;

  // 4. Exact query equals or matches full item name
  const sorted = [...ALL_MENU_ITEMS].sort((a, b) => b.name.length - a.name.length);
  const substringMatch = sorted.find((it) => {
    const name = it.name.toLowerCase();
    if (name.length < 4 && stripped !== name) return false;
    return (
      stripped === name ||
      stripped.startsWith(name + " ") ||
      stripped.endsWith(" " + name) ||
      stripped.includes(" " + name + " ")
    );
  });
  if (substringMatch) return substringMatch;

  // 5. Match by dish tags (e.g. tag "chhole_bhature")
  const tagNormalized = stripped.replace(/\s+/g, "_");
  const tagMatch = ALL_MENU_ITEMS.find((it) =>
    it.tags?.some((t) => t.toLowerCase() === tagNormalized || t.toLowerCase() === stripped)
  );
  if (tagMatch) return tagMatch;

  return undefined;
}

export function parseUserQuery(query: string, currentState: UserPreferenceState): ParsedIntent {
  let text = (query || "").trim().slice(0, 1000).toLowerCase();

  // Normalize Unicode quotes, backticks, dashes
  text = text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");

  // Normalize common user typos and phonetic variations
  text = text
    .replace(/\bchola\s+bhatura\b/gi, "chhole bhature")
    .replace(/\bchola\s+bhature\b/gi, "chhole bhature")
    .replace(/\bchole\s+bhatura\b/gi, "chhole bhature")
    .replace(/\bchole\s+bhature\b/gi, "chhole bhature")
    .replace(/\bchhola\s+bhatura\b/gi, "chhole bhature")
    .replace(/\bchhola\s+bhature\b/gi, "chhole bhature")
    .replace(/\bchhole\s+bhatura\b/gi, "chhole bhature")
    .replace(/\bchola\b/gi, "chhole")
    .replace(/\bchole\b/gi, "chhole")
    .replace(/\bchhola\b/gi, "chhole")
    .replace(/\bbhatura\b/gi, "bhature")
    .replace(/\bpanipuri\b/gi, "pani puri")
    .replace(/\bgolgappa\b/gi, "pani puri")
    .replace(/\bgolgappe\b/gi, "pani puri")
    .replace(/\bpuchka\b/gi, "pani puri")
    .replace(/\bphuchka\b/gi, "pani puri")
    .replace(/\bvadapav\b/gi, "vada pav")
    .replace(/\bwadapav\b/gi, "vada pav")
    .replace(/\bwada\s+pav\b/gi, "vada pav")
    .replace(/\bpavbhaji\b/gi, "pav bhaji")
    .replace(/\bpaav\s+bhaji\b/gi, "pav bhaji")
    .replace(/\bdahiwada\b/gi, "dahi vada")
    .replace(/\bdahi\s+wada\b/gi, "dahi vada")
    .replace(/\baloo\s+paratha\b/gi, "alu paratha")
    .replace(/\baloo\s+chop\b/gi, "aluchop")
    .replace(/\bchow\s*mein\b/gi, "noodles")
    .replace(/\bmaggie\b/gi, "maggi")
    .replace(/\bfillilng\b/gi, "feeling")
    .replace(/\bfealin\b/gi, "feeling")
    .replace(/\bfeelng\b/gi, "feeling")
    .replace(/\bunhealty\b/gi, "unhealthy")
    .replace(/\bunheathy\b/gi, "unhealthy")
    .replace(/\bunhelthy\b/gi, "unhealthy")
    .replace(/\bhealty\b/gi, "healthy")
    .replace(/\bhelthy\b/gi, "healthy")
    .replace(/\bvegitarian\b/gi, "vegetarian")
    .replace(/\bvegiterian\b/gi, "vegetarian")
    .replace(/\bchiken\b/gi, "chicken")
    .replace(/\bchikken\b/gi, "chicken")
    .replace(/\bchkn\b/gi, "chicken")
    .replace(/\bchikn\b/gi, "chicken")
    .replace(/\bbriyani\b/gi, "biryani")
    .replace(/\bbiryani\b/gi, "biryani")
    .replace(/\bnodles\b/gi, "noodles")
    .replace(/\bnoodels\b/gi, "noodles")
    .replace(/\bnoodls\b/gi, "noodles")
    .replace(/\bnoodl\b/gi, "noodles")
    .replace(/\brol\b/gi, "roll")
    .replace(/\brool\b/gi, "roll")
    .replace(/\bschezwn\b/gi, "schezwan")
    .replace(/\bcoffe\b/gi, "coffee")
    .replace(/\beag\b/gi, "egg")
    .replace(/\bbidget\b/gi, "budget")
    .replace(/\bbudgt\b/gi, "budget")
    .replace(/\bonlinemodel\b/gi, "online model")
    .replace(/\bcombi\b/gi, "combination")
    .replace(/\bcombo\b/gi, "combination")
    .replace(/\breccomend\b/gi, "recommend")
    .replace(/\brecommed\b/gi, "recommend")
    .replace(/\bshouldi\b/gi, "should i")
    .replace(/\bwnat\b/gi, "want")
    .replace(/\bwanna\b/gi, "want to")
    .replace(/\bwhar\b/gi, "what")
    .replace(/\bwaht\b/gi, "what")
    .replace(/\bwat\b/gi, "what")
    .replace(/\bsomethin\b/gi, "something")
    .replace(/\bsomethinh\b/gi, "something")
    .replace(/\bsomthing\b/gi, "something")
    .replace(/\bsomthng\b/gi, "something")
    .replace(/\bsmthg\b/gi, "something")
    .replace(/\bsmth\b/gi, "something")
    .replace(/\blighter\b/gi, "light")
    .replace(/\bfeedme\b/gi, "feed me")
    .replace(/\bruppes\b/gi, "rupees")
    .replace(/\brupes\b/gi, "rupees")
    .replace(/\brpees\b/gi, "rupees")
    .replace(/\brupess\b/gi, "rupees")
    .replace(/\broopees\b/gi, "rupees")
    .replace(/\bbucks\b/gi, "rupees")
    .replace(/\brupya\b/gi, "rupees")
    .replace(/\brupiya\b/gi, "rupees")
    .replace(/\brupaye\b/gi, "rupees");

  const cleanGreetingText = text.replace(/[\s\\/.,?!~#@$%^&*()_+=\-[\]{}|;:'"<>`]+$/g, "").trim();

  const extracted: Partial<UserPreferenceState> = {};

  // Check reset intent
  if (
    text === "reset" ||
    text === "start over" ||
    text === "new decision" ||
    text === "clear" ||
    text.includes("start a new decision")
  ) {
    return {
      intentType: "reset",
      extractedPreferences: {},
    };
  }

  // Check greeting or help (handles trailing slashes, punctuation like 'Hello there\')
  const isGreetingQuery =
    /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|howdy)[\s!.,?\\/]*$/i.test(text) ||
    /^(hi|hello|hey)[\s,]+(how are you|how are u|how r u|what'?s up|whats up|how is it going|there)[\s!.,?\\/]*$/i.test(text) ||
    /^(how are you|how are u|how r u|how is it going|what'?s up|whats up)[\s!.,?\\/]*$/i.test(text) ||
    cleanGreetingText === "hello there" ||
    cleanGreetingText === "hi there" ||
    cleanGreetingText === "hey there" ||
    cleanGreetingText === "help" ||
    cleanGreetingText.includes("how to use") ||
    cleanGreetingText.includes("what can you do") ||
    cleanGreetingText.includes("how do you work") ||
    cleanGreetingText.includes("who are you");

  if (isGreetingQuery) {
    return {
      intentType: "greeting",
      extractedPreferences: {},
    };
  }

  // Check for unrelated non-canteen requests
  const unrelatedPatterns = [
    /write\s+(me\s+)?(a\s+)?(poem|code|program|essay|script|joke|story)/i,
    /who\s+is\s+(the\s+)?(prime\s+minister|president|ceo)/i,
    /what\s+is\s+(the\s+)?weather/i,
    /tell\s+(me\s+)?a\s+joke/i,
    /what\s+is\s+ai/i,
    /how\s+to\s+hack/i,
  ];

  for (const pattern of unrelatedPatterns) {
    if (pattern.test(text)) {
      return {
        intentType: "unrelated",
        extractedPreferences: {},
        isUnrelated: true,
      };
    }
  }

  // Check questions about the online model (e.g. "why not ask the onlinemodel", "ask the online model")
  if (
    text.includes("online model") ||
    text.includes("ask the online model") ||
    text.includes("ask online model") ||
    text.includes("why not ask the online") ||
    text.includes("why not ask online") ||
    text.includes("why not online model") ||
    text.includes("why not gemini")
  ) {
    return {
      intentType: "ask_online_model",
      extractedPreferences: {},
    };
  }

  // Check for comparative queries (e.g. "why this veg roll why not eag roll", "why veg roll why not egg roll")
  const comparisonMatch =
    text.match(/why\s+(?:this\s+)?([a-z0-9\s'-]+?)\s+why\s+not\s+([a-z0-9\s'-]+)/i) ||
    text.match(/why\s+not\s+([a-z0-9\s'-]+?)\s+(?:instead\s+of|rather\s+than)\s+([a-z0-9\s'-]+)/i);

  if (comparisonMatch) {
    const itemA = comparisonMatch[1].trim();
    const itemB = comparisonMatch[2].trim();
    return {
      intentType: "why_not_comparison",
      extractedPreferences: {},
      comparisonItems: { itemA, itemB },
    };
  }

  // Check for "Why did you choose this?" or "Why this?"
  if (
    text.includes("why did you") ||
    text.includes("why this") ||
    text.includes("why recommend") ||
    text === "why?" ||
    text === "why"
  ) {
    return {
      intentType: "why",
      extractedPreferences: {},
    };
  }

  // Check for "Anything better?"
  if (
    text.includes("anything better") ||
    text.includes("is there anything better") ||
    text.includes("something better") ||
    text.includes("any other option")
  ) {
    return {
      intentType: "anything_better",
      extractedPreferences: {},
    };
  }

  // Check for switching / alternative request (e.g. "nahh something else would be better", "not this", "something else")
  const isSwitchAlternative =
    /\b(something\s+else|anything\s+else|what\s+else|different\s+option|another\s+option|another\s+one|other\s+option|other\s+choice|not\s+this|not\s+that|skip\s+this|skip\s+it|switch|change\s+(?:this|item|dish)|something\s+different|anything\s+different)\b/i.test(text) ||
    /\b(would\s+be\s+better|something\s+better|any\s+other\s+option)\b/i.test(text) ||
    /\b(nah+|nope)\b/i.test(text) ||
    /\b(don'?t\s+want\s+this|not\s+feeling\s+this|not\s+in\s+the\s+mood\s+for\s+this)\b/i.test(text);

  if (isSwitchAlternative) {
    return {
      intentType: "switch_alternative",
      extractedPreferences: extracted,
    };
  }

  // Check for "Something cheaper"
  if (
    text.includes("cheaper") ||
    text.includes("less expensive") ||
    text.includes("lower budget") ||
    text.includes("too expensive")
  ) {
    const currentB = currentState.budget || 100;
    const newBudget = Math.max(50, Math.round(currentB * 0.75));
    return {
      intentType: "cheaper",
      extractedPreferences: { budget: newBudget, maxBudget: true },
    };
  }

  // Check for "What if I increase my budget to ₹150?"
  const increaseBudgetMatch = text.match(/(?:increase|stretch|raise)\s+(?:my\s+)?budget\s+to\s+(?:₹|rs\.?)?\s*(\d{2,4})/i);
  if (increaseBudgetMatch) {
    const higherBudget = parseInt(increaseBudgetMatch[1], 10);
    return {
      intentType: "followup",
      extractedPreferences: { budget: higherBudget, maxBudget: true },
    };
  }

  // Check for "Anything from the other shop?"
  // Rotates cleanly through all 6 campus canteens instead of locking to just Anna's & Mughlai
  if (
    text.includes("other shop") ||
    text.includes("another shop") ||
    text.includes("second shop") ||
    text.includes("different shop")
  ) {
    const ALL_SHOPS: ShopName[] = [
      "Anna's Restaurant & Catering",
      "Mughlai Affair's",
      "HALKA PHULKA",
      "MAGGIE POINT",
      "4TH FLOOR",
      "Iter Juice Centre",
    ];
    const currentIdx = currentState.preferredShop ? ALL_SHOPS.indexOf(currentState.preferredShop) : 0;
    const nextShop: ShopName = ALL_SHOPS[(currentIdx + 1) % ALL_SHOPS.length];
    return {
      intentType: "other_shop",
      extractedPreferences: { preferredShop: nextShop },
    };
  }

  if (text.includes("mughlai affair") || text.includes("mughlai")) {
    extracted.preferredShop = "Mughlai Affair's";
  } else if (text.includes("anna's") || text.includes("annas") || text.includes("anna")) {
    extracted.preferredShop = "Anna's Restaurant & Catering";
  } else if (text.includes("halka phulka") || text.includes("halka") || text.includes("phulka")) {
    extracted.preferredShop = "HALKA PHULKA";
  } else if (text.includes("maggie point") || text.includes("maggi point") || text.includes("maggie") || text.includes("maggi")) {
    extracted.preferredShop = "MAGGIE POINT";
  } else if (text.includes("4th floor") || text.includes("fourth floor")) {
    extracted.preferredShop = "4TH FLOOR";
  } else if (
    text.includes("iter juice") ||
    text.includes("juice centre") ||
    text.includes("juice center") ||
    text.includes("juice corner") ||
    text.includes("juice shop")
  ) {
    extracted.preferredShop = "Iter Juice Centre";
  }

  // Extract Budget
  // Check Budget Negation (e.g. "I didn't specify anything now did I just said I want something to eat right so I didn't even mention the budget")
  const isBudgetNegation =
    text.includes("didn't specify budget") ||
    text.includes("didn't mention budget") ||
    text.includes("didnt specify budget") ||
    text.includes("didnt mention budget") ||
    text.includes("didn't even mention the budget") ||
    text.includes("didnt even mention the budget") ||
    text.includes("didn't even mention budget") ||
    text.includes("didnt even mention budget") ||
    text.includes("no budget") ||
    text.includes("without budget") ||
    text.includes("not specified budget") ||
    text.includes("didn't say budget") ||
    text.includes("didnt say budget");

  if (isBudgetNegation) {
    extracted.budget = null;
  }

  // 1. Explicit currency: ₹100, rs 100, 100 rupees, 100 rs, inr 100, 25 ruppes, ruppes 50
  const currencyMatch =
    !isBudgetNegation &&
    (text.match(/(?:₹|rs\.?|rupees?|inr|bucks)\s*(\d{1,4})/i) ||
     text.match(/(\d{1,4})\s*(?:₹|rs\.?|rupees?|inr|bucks)/i));

  // 2. Budget indicator words: budget 100, under 100, have 100, within 100, max 100, for 100, under ruppes 50
  const contextualBudgetMatch =
    !isBudgetNegation &&
    (text.match(
      /(?:budget(?:\s+of)?|under|below|less than|within|max(?:imum)?|around|at most|have|only have|got|spend|for)\s*(?:about|around)?\s*(?:₹|rs\.?|rupees?|inr|bucks)?\s*(\d{1,4})\b/i
    ) ||
    text.match(
      /(?:under|below|less than|within|for)\s*(?:about|around)?\s*(?:₹|rs\.?|rupees?|inr|bucks)?\s*(\d{1,4})/i
    ));

  // 3. Isolated number (entire string is just 2-3 digits representing canteen budget, e.g. "100" or "80")
  const isolatedNumberMatch = !isBudgetNegation && text.match(/^(\d{1,3})$/);

  if (contextualBudgetMatch) {
    const val = parseInt(contextualBudgetMatch[1], 10);
    if (val <= 1000) {
      extracted.budget = val;
      extracted.maxBudget = !text.includes("around");
    }
  } else if (currencyMatch) {
    const val = parseInt(currencyMatch[1], 10);
    if (val <= 1000) {
      extracted.budget = val;
      extracted.maxBudget = true;
    }
  } else if (isolatedNumberMatch) {
    const val = parseInt(isolatedNumberMatch[1], 10);
    if (val >= 15 && val <= 500) {
      extracted.budget = val;
      extracted.maxBudget = true;
    }
  }

  // Support text numbers
  if (!extracted.budget) {
    if (text.includes("hundred rupees") || text.includes("a hundred")) {
      extracted.budget = 100;
      extracted.maxBudget = true;
    } else if (text.includes("fifty rupees") || text.includes("fifty")) {
      extracted.budget = 50;
      extracted.maxBudget = true;
    } else if (text.includes("one fifty") || text.includes("hundred and fifty")) {
      extracted.budget = 150;
      extracted.maxBudget = true;
    }
  }

  // Extract Time
  const timeRegex = /(\d{1,2})\s*(?:mins?|minutes?)/i;
  const timeMatch = text.match(timeRegex);
  if (timeMatch) {
    extracted.availableTime = parseInt(timeMatch[1], 10);
  } else if (text.includes("quick") || text.includes("hurry") || text.includes("rush") || text.includes("don't want to wait")) {
    extracted.availableTime = 10;
  }

  // Extract Dietary
  // Detect dietary negation: e.g. "don't like non veg", "no non veg", "avoid non veg", "not non veg"
  const isNegatingNonVeg =
    /\b(don'?t|dont|not|no|hate|avoid|dislike)\s+(like\s+)?(non-?veg|meat|chicken|fish)\b/i.test(text) ||
    text.includes("i said i don't like non veg") ||
    text.includes("don't like non veg") ||
    text.includes("dont like non veg") ||
    text.includes("no non-veg") ||
    text.includes("no non veg");

  // Detect explicit Vegetarian request or colloquial student veg expressions
  const isExplicitVeg =
    isNegatingNonVeg ||
    /\b(pure\s+veg|vegetarian|veg\s+only|strictly\s+veg|veg\s+food)\b/i.test(text) ||
    /\b(i'?m|im|i\s+am)\s+veg\b/i.test(text) ||
    /\b(veg\s+bro|veg\s+broo|veg\s+bhai|veggie|veggies|veggge|vegie|shakahari)\b/i.test(text) ||
    /\b(something\s+veg|something\s+veggge|want\s+veg|prefer\s+veg|give\s+me\s+veg|veg\s+please)\b/i.test(text) ||
    text.includes("no meat") ||
    text.includes("don't eat meat") ||
    text.includes("dont eat meat") ||
    text.includes("vegan");

  const isExplicitNonVeg =
    !isNegatingNonVeg &&
    (/\b(non-?veg|meat|chicken|mutton|prawns?|fish)\b/i.test(text) &&
     !/\b(no|not|don'?t|dont|avoid)\s+(want\s+)?(chicken|meat|non-?veg)\b/i.test(text));

  if (isExplicitVeg) {
    extracted.dietary = "vegetarian";
    // If previous state had chicken or non-veg protein, reset it
    extracted.preferredProtein = undefined;
  } else if (isExplicitNonVeg) {
    extracted.dietary = "non_vegetarian";
  }

  // Extract Protein requirement (strictly whole word match to avoid 'veggge' containing 'egg')
  if (/\b(chicken)\b/i.test(text) && !/\b(no|not|don'?t|dont)\s+chicken\b/i.test(text) && !isExplicitVeg) {
    extracted.preferredProtein = "chicken";
    extracted.dietary = "non_vegetarian";
  } else if (/\b(paneer)\b/i.test(text)) {
    extracted.preferredProtein = "paneer";
    extracted.dietary = "vegetarian";
  } else if (/\b(mushroom)\b/i.test(text)) {
    extracted.preferredProtein = "mushroom";
    extracted.dietary = "vegetarian";
  } else if (/\b(egg|eggs|anda)\b/i.test(text) && !/\b(no|not|don'?t|dont)\s+egg\b/i.test(text) && !isExplicitVeg) {
    extracted.preferredProtein = "egg";
  } else if (/\b(prawn|prawns)\b/i.test(text) && !/\b(no|not|don'?t|dont)\s+prawn\b/i.test(text) && !isExplicitVeg) {
    extracted.preferredProtein = "prawn";
    extracted.dietary = "non_vegetarian";
  } else if (/\b(fish)\b/i.test(text) && !/\b(no|not|don'?t|dont)\s+fish\b/i.test(text) && !isExplicitVeg) {
    extracted.preferredProtein = "fish";
    extracted.dietary = "non_vegetarian";
  }

  // Extract Food Type
  if (text.includes("noodle") && !text.includes("not noodle") && !text.includes("no noodle")) {
    extracted.preferredFoodType = "noodles";
  } else if (text.includes("rice") && !text.includes("not rice") && !text.includes("no rice")) {
    extracted.preferredFoodType = "rice";
  } else if (text.includes("roll") && !text.includes("not roll") && !text.includes("no roll")) {
    extracted.preferredFoodType = "roll";
  } else if (text.includes("thali")) {
    extracted.preferredFoodType = "thali";
  } else if (text.includes("biryani") || text.includes("biriyani")) {
    extracted.preferredFoodType = "rice";
  } else if (
    text.includes("coffee") ||
    text.includes("tea") ||
    text.includes("drink") ||
    text.includes("beverage") ||
    text.includes("juice") ||
    text.includes("shake") ||
    text.includes("lassi") ||
    text.includes("sprite") ||
    text.includes("limca") ||
    text.includes("thums up") ||
    text.includes("water bottle")
  ) {
    extracted.preferredFoodType = "beverage";
  }

  // Student colloquial budget/time cues
  if (!extracted.budget && (text.includes("broke student") || text.includes("paise kam"))) {
    extracted.budget = 50;
    extracted.maxBudget = true;
  }
  if (!extracted.availableTime && (text.includes("lecture") || text.includes("between classes"))) {
    extracted.availableTime = 10;
  }

  // Extract Exclusions
  const exclusionList: string[] = [...(currentState.exclusions || [])];
  const exclusionPatterns = [
    /(?:not|no|don't want|dont want|without|exclude|avoid|never)\s+(?:any\s+)?(noodles?|rice|rolls?|thali|chicken|paneer|gravy|mushrooms?|egg|eggs?|meat|fish|curd|dosa|sandwich|burger|pizza|pasta|spicy|sweet|fried|oily|sugar|heavy)/gi,
  ];

  for (const regex of exclusionPatterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const item = match[1].toLowerCase();
      const normalized = item.endsWith("s") && !["noodles", "desserts"].includes(item) ? item.slice(0, -1) : item;
      if (!exclusionList.includes(normalized)) {
        exclusionList.push(normalized);
      }
    }
  }

  // Explicit semantic negations for core culinary dimensions:
  const isNegatingSpicy = hasNegatedTerm(text, "spicy|spice|schezwan|chilly|chilli|hot|tikha|teekha");
  if (isNegatingSpicy && !exclusionList.includes("spicy")) {
    exclusionList.push("spicy");
  }

  const isNegatingSweet = hasNegatedTerm(text, "sweet|sugar|sugary|meetha");
  if (isNegatingSweet && !exclusionList.includes("sweet")) {
    exclusionList.push("sweet");
  }

  const isNegatingHeavy = hasNegatedTerm(text, "heavy|filling|stomach\\s+filling");
  if (isNegatingHeavy && !exclusionList.includes("heavy")) {
    exclusionList.push("heavy");
  }

  const isNegatingChicken = hasNegatedTerm(text, "chicken|kukkad|murga");
  if (isNegatingChicken) {
    if (!exclusionList.includes("chicken")) {
      exclusionList.push("chicken");
    }
    extracted.preferredProtein = undefined;
  }

  if (exclusionList.length > 0) {
    extracted.exclusions = exclusionList;
  }

  // Extract Cravings
  const cravings: string[] = [];
  if (!isNegatingSpicy && (/\b(spicy|schezwan|chilly|chilli|hot)\b/i.test(text) || text.includes("kuch spicy"))) {
    cravings.push("spicy");
  }

  // Distinction: "feeling" vs "filling"
  // If user says "feeling unhealthy", "feeling sick", etc., it is NOT a filling craving!
  const isFeelingVerb = /\b(feel|feelin|feeling|felt)\s+(unhealthy|sick|tired|bloated|bad|heavy|greasy|low|lazy|off)\b/i.test(text);

  const isCompleteMealOrTummy =
    /\b(fill\s+(?:my\s+)?(?:tummy|stomach|belly)|fill\s+me\s+up|full\s+tummy|heavy\s+tummy|tummy)\b/i.test(text) ||
    /\b(complete\s+meal|full\s+meal|proper\s+meal|proper\s+lunch|proper\s+dinner|solid\s+meal|hearty\s+meal|real\s+meal)\b/i.test(text) ||
    /\b(replace\s+(?:my\s+)?lunch|instead\s+of\s+lunch|for\s+lunch|heavy\s+lunch|can\s+replace\s+lunch)\b/i.test(text);

  const isExplicitFilling =
    !isNegatingHeavy &&
    (isCompleteMealOrTummy ||
    /\b(filling meal|filling food|something filling|want filling|solid meal|hearty)\b/i.test(text) ||
    text.includes("bhook") ||
    text.includes("hungry") ||
    text.includes("broke student") ||
    (/\b(filling|heavy)\b/i.test(text) && !isFeelingVerb && !/\b(feel|feeling)\b/i.test(text)));

  if (isExplicitFilling) {
    cravings.push("filling");
  }

  // Detect Healthy request or "feeling unhealthy" state
  const isHealthyOrUnhealthy =
    text.includes("unhealthy") ||
    text.includes("feeling unhealthy") ||
    text.includes("too much junk") ||
    text.includes("clean food") ||
    text.includes("healthy") ||
    text.includes("nutritious") ||
    text.includes("wholesome") ||
    text.includes("salad") ||
    text.includes("diet food") ||
    text.includes("pet kharab") ||
    (text.includes("stomach") && (text.includes("upset") || text.includes("bad") || text.includes("pain") || text.includes("light on")));

  if (isHealthyOrUnhealthy) {
    extracted.mood = "Healthy";
    cravings.push("light");
    cravings.push("healthy");
  }

  const isNegatingLight =
    /\b(isn'?t|is\s+not|not|no|don'?t|dont)\s+(?:very\s+|super\s+|really\s+)?light\b/i.test(text) ||
    text.includes("isn't light") ||
    text.includes("is not light") ||
    text.includes("not light");

  if (isNegatingLight) {
    if (text.includes("more light") || text.includes("something light") || text.includes("actually light") || text.includes("real light")) {
      cravings.push("light");
    }
    if (text.includes("dosa")) {
      const updatedExclusions = [...(extracted.exclusions || currentState.exclusions || [])];
      if (!updatedExclusions.includes("dosa")) {
        updatedExclusions.push("dosa");
      }
      extracted.exclusions = updatedExclusions;
    }
  } else if ((/\b(light|quick bite|snack)\b/i.test(text) && !isCompleteMealOrTummy) || isNegatingHeavy) {
    cravings.push("light");
  }
  if (/\b(crispy|crunchy)\b/i.test(text)) {
    cravings.push("crispy");
  }
  if (!isNegatingSweet && /\b(sweet|dessert|mithai|pastry|meetha)\b/i.test(text)) {
    cravings.push("sweet");
  }

  // Prune any craving that is now present in exclusionList
  const sanitizedPriorCravings = (currentState.craving || []).filter(
    (c) => !exclusionList.includes(c.toLowerCase())
  );
  const sanitizedNewCravings = cravings.filter(
    (c) => !exclusionList.includes(c.toLowerCase())
  );

  if (isCompleteMealOrTummy) {
    extracted.mood = "Comfort food";
    // User explicitly asked to fill tummy / complete meal: clear any lingering 'light' craving
    const baseCravings = sanitizedPriorCravings.filter((c) => c !== "light");
    extracted.craving = Array.from(new Set([...baseCravings, ...sanitizedNewCravings.filter((c) => c !== "light"), "filling"]));
  } else if (sanitizedNewCravings.length > 0 || sanitizedPriorCravings.length > 0 || exclusionList.length > 0) {
    extracted.craving = Array.from(new Set([...sanitizedPriorCravings, ...sanitizedNewCravings]));
  }

  // Extract Mood (TCS problem statement dimensions)
  const isPartyOrFeast = text.includes("party") || text.includes("feast") || text.includes("celebrat") || text.includes("heavy");
  if (isPartyOrFeast) {
    extracted.mood = "Treat myself";
    cravings.push("filling");
    // If previous state had a restrictive micro-budget (<= 60) from an earlier question,
    // clear it so genuine filling party dishes can be recommended!
    if (!extracted.budget && currentState.budget !== null && currentState.budget <= 60) {
      extracted.budget = null;
    }
  }

  if (isHealthyOrUnhealthy) {
    extracted.mood = "Healthy";
  } else if (text.includes("quick & light") || text.includes("quick and light")) {
    extracted.mood = "Quick & light";
  } else if (text.includes("comfort food") || text.includes("comfort")) {
    extracted.mood = "Comfort food";
  } else if (text.includes("energetic")) {
    extracted.mood = "Energetic";
  } else if (text.includes("treat myself") || text.includes("treat")) {
    extracted.mood = "Treat myself";
  }

  // Check Failure Case 1: Specific request for item marked unavailable (e.g. Chicken Tikka)
  if (text.includes("chicken tikka") && !hasNegatedTerm(text, "chicken\\s+tikka")) {
    return {
      intentType: "unavailable_item",
      extractedPreferences: extracted,
      specificItemQuery: "Chicken Tikka",
    };
  }

  // Check Failure Case 2: Specific request for item that exceeds budget (e.g. Chicken Thali or Special Mix Non-Veg Fried Rice under ₹100)
  // Strictly grounded on official campus catalog items (Chicken Thali ₹149 or Special Mix Non-Veg Rice ₹150)
  if (
    (text.includes("chicken thali") || text.includes("chicken rice") || text.includes("mix non-veg") || text.includes("chicken biryani")) &&
    !hasNegatedTerm(text, "chicken\\s+thali|chicken\\s+rice|chicken\\s+biryani") &&
    (extracted.budget || currentState.budget || 0) <= 100
  ) {
    return {
      intentType: "over_budget_item",
      extractedPreferences: extracted,
      targetOverBudgetItem: text.includes("chicken thali")
        ? { name: "Chicken Thali", price: 149 }
        : { name: "Special Mix Non-Veg Fried Rice", price: 150 },
    };
  }

  // Check Specific Item Match from the live menu catalog (e.g. "Can I get Pineapple?", "What about Café Frappe?", "Veg Roll", "Ask assistant")
  const matchedItem = findMatchingMenuItem(text);
  if (matchedItem) {
    if (matchedItem.availability === false || matchedItem.name.toLowerCase().includes("chicken tikka")) {
      return {
        intentType: "unavailable_item",
        extractedPreferences: { ...extracted, preferredShop: matchedItem.shop },
        specificItemQuery: matchedItem.name,
        matchedMenuItem: matchedItem,
      };
    }
    return {
      intentType: "specific_item",
      extractedPreferences: {
        ...extracted,
        preferredShop: matchedItem.shop,
        dietary: matchedItem.dietary === "vegetarian" ? "vegetarian" : "non_vegetarian",
      },
      specificItemQuery: matchedItem.name,
      matchedMenuItem: matchedItem,
    };
  }

  // Check for common off-menu student food requests (e.g. "pizza", "burger", "pasta", "shawarma", "momos", "sandwich")
  const offMenuPatterns = [
    { name: "Pizza", pattern: /\b(pizzas?|pizaa|piza)\b/i },
    { name: "Burger", pattern: /\b(burgers?|burgir)\b/i },
    { name: "Pasta", pattern: /\b(pastas?|macaroni|spaghetti)\b/i },
    { name: "Shawarma", pattern: /\b(shawarmas?|shwarma)\b/i },
    { name: "Momos", pattern: /\b(momos?|momo|dimsum)\b/i },
    { name: "Sandwich", pattern: /\b(sandwich|sandwiches|sandwhich)\b/i },
    { name: "French Fries", pattern: /\b(french\s+fries|fries|potato\s+wedges)\b/i },
    { name: "Tacos", pattern: /\b(tacos?|quesadilla|burrito)\b/i },
    { name: "Ice Cream", pattern: /\b(ice\s*cream|sundae|gelato)\b/i },
  ];

  const matchedOffMenu = offMenuPatterns.find((p) => p.pattern.test(text));
  if (matchedOffMenu) {
    return {
      intentType: "off_menu_item",
      extractedPreferences: extracted,
      specificItemQuery: matchedOffMenu.name,
    };
  }

  const hasExtractedPreferences =
    extracted.budget !== undefined ||
    extracted.dietary !== undefined ||
    (extracted.craving && extracted.craving.length > 0) ||
    extracted.preferredProtein !== undefined ||
    extracted.preferredFoodType !== undefined ||
    extracted.availableTime !== undefined ||
    extracted.mood !== undefined ||
    (extracted.exclusions && extracted.exclusions.length > 0) ||
    extracted.preferredShop !== undefined;

  const explicitRecommendationPrompts = [
    "surprise me",
    "pick something",
    "what should i eat",
    "should i eat",
    "what to eat",
    "what can i eat",
    "recommend something",
    "suggest something",
    "what can i get",
    "what's good",
    "whats good",
    "show options",
    "show menu",
    "explore menu",
    "tell me what to eat",
    "find me food",
    "something to eat",
    "eat something",
    "want to eat",
    "want food",
    "hungry",
    "starving",
    "need food",
    "give me food",
    "feed me",
    "just want to eat",
    "want something to eat",
    "said i want something to eat",
    "anything to eat",
    "meal combo",
    "food combination",
    "proper combination",
    "didn't specify budget",
    "didn't mention budget",
    "didnt specify budget",
    "didnt mention budget",
    "what should i go for",
    "what should we go for",
    "what to go for",
    "what should i order",
    "what to order",
    "what should i have",
    "what to have",
    "what can i have",
    "what can i get",
    "help me decide",
    "help me choose",
    "confused what to eat",
    "confused what to order",
    "kya khaye",
    "kya khayein",
    "kya khau",
    "kya order karu",
    "suggest me",
    "give me recommendations",
  ];

  const isExplicitRecommendationAsk =
    explicitRecommendationPrompts.some((phrase) => text.includes(phrase)) ||
    /\bwhat\s+(?:should|can|to)\s+(?:i|we)?\s*(?:go\s+for|order|eat|have|pick|choose)\b/i.test(text) ||
    /\b(suggest|recommend|pick)\s+(?:something|food|dish|meal)\b/i.test(text) ||
    (text.includes("eat") && (text.includes("want") || text.includes("what") || text.includes("something") || text.includes("like"))) ||
    (text.includes("food") && (text.includes("want") || text.includes("get") || text.includes("some")));

  if (
    !hasExtractedPreferences &&
    !isExplicitRecommendationAsk &&
    !text.startsWith("what about") &&
    !text.startsWith("how about")
  ) {
    return {
      intentType: "improper_input",
      extractedPreferences: {},
    };
  }

  return {
    intentType: text.startsWith("what about") || text.startsWith("how about") ? "followup" : "recommend",
    extractedPreferences: extracted,
  };
}
