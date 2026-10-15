import { UserPreferenceState, ShopName, MenuItem } from "../data/types";
import { ALL_MENU_ITEMS } from "../data/menuService";

export interface ParsedIntent {
  intentType:
    | "recommend"
    | "followup"
    | "specific_item"
    | "cheaper"
    | "why"
    | "why_not_comparison"
    | "ask_online_model"
    | "anything_better"
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

  let stripped = cleanQuery
    .replace(/^(can\s+i\s+get|can\s+i\s+have|what\s+about|how\s+about|tell\s+me\s+more\s+about|tell\s+me\s+about|ask\s+about|i\s+want\s+to\s+get|i\s+want|give\s+me|show\s+me|order|switch\s+to|keep|how\s+is|what\s+is)\s+/i, "")
    .replace(/^(a|an|the)\s+/i, "")
    .replace(/[\s?!.,~]+$/g, "")
    .trim()
    .toLowerCase();

  // Strip trailing outlet mentions (e.g. "from iter juice", "from juice center", "from anna's")
  stripped = stripped
    .replace(/\s+(?:from|at)\s+(?:the\s+)?(?:iter\s+juice(?:\s+centre|\s+center)?|juice\s+(?:centre|center|corner|shop)|anna'?s?(?:\s+restaurant)?|mughlai(?:\s+affair'?s?)?|maggie\s+point|maggi\s+point|4th\s+floor|halka\s+phulka).*$/i, "")
    .trim();

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

  // 1. Exact name match
  const exact = ALL_MENU_ITEMS.find((it) => it.name.toLowerCase() === stripped);
  if (exact) return exact;

  // 2. Match without parenthetical annotations, e.g. "Café Frappe (Cold Coffee)" vs "Café Frappe"
  const strippedParen = stripped.replace(/\s*\([^)]*\)/g, "").trim();
  const withoutParen = ALL_MENU_ITEMS.find((it) => {
    const itemNameClean = it.name.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase();
    return itemNameClean === stripped || (strippedParen.length > 2 && itemNameClean === strippedParen);
  });
  if (withoutParen) return withoutParen;

  // 3. Exact query equals or matches full item name
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

  return undefined;
}

export function parseUserQuery(query: string, currentState: UserPreferenceState): ParsedIntent {
  let text = query.trim().toLowerCase();

  // Normalize Unicode quotes, backticks, dashes
  text = text
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, "-");

  // Normalize common user typos and phonetic variations
  text = text
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
    .replace(/\bsmth\b/gi, "something")
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
  if (
    text.includes("other shop") ||
    text.includes("another shop") ||
    text.includes("second shop")
  ) {
    const nextShop: ShopName =
      currentState.preferredShop === "Anna's Restaurant & Catering"
        ? "Mughlai Affair's"
        : "Anna's Restaurant & Catering";
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
    /(?:not|no|don't want|dont want|without|exclude)\s+(noodles?|rice|rolls?|thali|chicken|paneer|gravy|mushrooms?)/gi,
  ];

  for (const regex of exclusionPatterns) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const item = match[1].toLowerCase();
      const normalized = item.endsWith("s") ? item.slice(0, -1) : item;
      if (!exclusionList.includes(normalized)) {
        exclusionList.push(normalized);
      }
    }
  }
  if (exclusionList.length > 0) {
    extracted.exclusions = exclusionList;
  }

  // Extract Cravings
  const cravings: string[] = [];
  if (/\b(spicy|schezwan|chilly|chilli|hot)\b/i.test(text) || text.includes("kuch spicy")) {
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
    isCompleteMealOrTummy ||
    /\b(filling meal|filling food|something filling|want filling|solid meal|hearty)\b/i.test(text) ||
    text.includes("bhook") ||
    text.includes("hungry") ||
    text.includes("broke student") ||
    (/\b(filling|heavy)\b/i.test(text) && !isFeelingVerb && !/\b(feel|feeling)\b/i.test(text));

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

  if (/\b(light|quick bite|snack)\b/i.test(text) && !isCompleteMealOrTummy) {
    cravings.push("light");
  }
  if (/\b(crispy|crunchy)\b/i.test(text)) {
    cravings.push("crispy");
  }
  if (/\b(sweet|drink|cold coffee|beverage|tea|juice|coffee)\b/i.test(text)) {
    cravings.push("sweet");
  }

  if (isCompleteMealOrTummy) {
    extracted.mood = "Comfort food";
    // User explicitly asked to fill tummy / complete meal: clear any lingering 'light' craving
    const baseCravings = (currentState.craving || []).filter((c) => c !== "light");
    extracted.craving = Array.from(new Set([...baseCravings, ...cravings.filter((c) => c !== "light"), "filling"]));
  } else if (cravings.length > 0) {
    extracted.craving = Array.from(new Set([...(currentState.craving || []), ...cravings]));
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
  if (text.includes("chicken tikka")) {
    return {
      intentType: "unavailable_item",
      extractedPreferences: extracted,
      specificItemQuery: "Chicken Tikka",
    };
  }

  // Check Failure Case 2: Specific request for item that exceeds budget (e.g. Chicken Thali or Biryani under ₹100)
  if ((text.includes("chicken thali") || text.includes("chicken biryani")) && (extracted.budget || currentState.budget || 0) <= 100) {
    return {
      intentType: "over_budget_item",
      extractedPreferences: extracted,
      targetOverBudgetItem: text.includes("chicken thali")
        ? { name: "Chicken Thali", price: 149 }
        : { name: "Chicken Biryani", price: 150 },
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
  ];

  const isExplicitRecommendationAsk =
    explicitRecommendationPrompts.some((phrase) => text.includes(phrase)) ||
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
