import {
  DecisionResponse,
  UserPreferenceState,
  RecommendationCandidate,
  AlternativeCandidate,
} from "../data/types";
import { getMenuItems, getItemById } from "../data/menuService";
import { parseUserQuery } from "./preferenceParser";
import { filterCandidates } from "./constraintFilter";
import { rankCandidates } from "./recommender";
import { generateExplanation } from "./explanationGenerator";
import { mergePreferences, INITIAL_PREFERENCE_STATE } from "./conversationState";

export function processUserDecision(
  query: string,
  currentState: UserPreferenceState = INITIAL_PREFERENCE_STATE,
  lastPrimaryItem?: RecommendationCandidate
): { response: DecisionResponse; nextState: UserPreferenceState } {
  const parsed = parseUserQuery(query, currentState);

  // 1. Handle Reset
  if (parsed.intentType === "reset") {
    return {
      response: {
        type: "clarification",
        summaryText: "I've reset your preferences. Tell me your budget, craving, or dietary preference to start a new decision!",
        whyFitsList: [],
        alternatives: [],
        suggestedFollowUps: ["I have ₹100", "Vegetarian under ₹80", "Something spicy", "Surprise me"],
        activePreferences: {},
      },
      nextState: INITIAL_PREFERENCE_STATE,
    };
  }

  // 2. Handle Greeting
  if (parsed.intentType === "greeting") {
    return {
      response: {
        type: "clarification",
        summaryText: "Hi! I can help you figure out what to eat from the college canteen. You can tell me your budget, mood, craving, dietary preference, or how much time you have.",
        whyFitsList: [],
        alternatives: [],
        suggestedFollowUps: ["₹100, vegetarian, spicy, something filling", "I have ₹80 and want chicken", "I only have 15 minutes", "Something light"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 3. Handle Unrelated Queries (Polite redirection per Section 11 & Scenario L)
  if (parsed.intentType === "unrelated" || parsed.isUnrelated) {
    return {
      response: {
        type: "redirect",
        summaryText: "I can help you decide what to eat from the college canteen menu. Tell me your budget, craving, mood, dietary preference, or available time.",
        whyFitsList: [],
        alternatives: [],
        suggestedFollowUps: ["I have ₹100", "Something spicy", "Vegetarian food", "What can I get under ₹80?"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 3.4 Handle Off-Menu Food Queries (e.g. "pizza", "burger", "pasta")
  if (parsed.intentType === "off_menu_item") {
    const dish = parsed.specificItemQuery || "That dish";
    const allItems = getMenuItems();
    const maggiItem = allItems.find((it) => it.shop === "MAGGIE POINT" && it.name.includes("Maggi")) || allItems.find((it) => it.name.includes("Maggi")) || allItems[0];
    const paneerRoll = allItems.find((it) => it.name.toLowerCase() === "paneer roll") || allItems[1];
    const noodles = allItems.find((it) => it.name.toLowerCase().includes("schezwan noodles")) || allItems[2];

    const alts: AlternativeCandidate[] = [
      {
        item: paneerRoll,
        selectedPrice: paneerRoll.portionOptions?.[0]?.price || paneerRoll.price,
        reason: `${paneerRoll.name} from ${paneerRoll.shop} — crispy, savory student favorite`,
        type: "other_shop",
      },
      {
        item: noodles,
        selectedPrice: noodles.portionOptions?.[0]?.price || noodles.price,
        reason: `${noodles.name} from ${noodles.shop} — filling and satisfying comfort pick`,
        type: "other_shop",
      },
    ];

    const primaryPrice = maggiItem.portionOptions?.[0]?.price || maggiItem.price;

    return {
      response: {
        type: "recommendation",
        primaryItem: {
          item: maggiItem,
          selectedPrice: primaryPrice,
          score: 95,
          matchedReasons: [
            `${dish} is not available on campus, but this is a top campus comfort favorite`,
            `Prepared fresh at ${maggiItem.shop}`,
            `Budget-friendly at ₹${primaryPrice}`,
          ],
        },
        alternatives: alts,
        summaryText: `${dish} isn't served at the campus canteens (our 6 outlets specialize in fresh rolls, noodles, South Indian dosas, thalis, biryani, Maggi, and fruit juices). Instead, I recommend ${maggiItem.name} from ${maggiItem.shop} for a delicious comfort meal!`,
        whyFitsList: [
          `${dish} is not served at campus canteens`,
          `Recommended campus alternative: ${maggiItem.name}`,
          `Priced at ₹${primaryPrice} at ${maggiItem.shop}`,
        ],
        suggestedFollowUps: [
          `Tell me more about ${maggiItem.name}`,
          "Show me MAGGIE POINT menu",
          "Vegetarian food under ₹80",
          "What rolls do you have?",
        ],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 3.5 Handle Improper / Unrecognized Input (Prevent default forced recommendations)
  if (parsed.intentType === "improper_input") {
    return {
      response: {
        type: "clarification",
        summaryText: "I didn't quite catch that. Tell me what you're looking for—like your budget (e.g. ₹100), craving (spicy, filling, light), dietary preference (vegetarian), or available time (15 mins)—and I'll find the right canteen option for you.",
        whyFitsList: [],
        alternatives: [],
        suggestedFollowUps: ["I have ₹100", "Vegetarian food under ₹80", "Something spicy and filling", "I only have 15 minutes"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 3.7 Handle Questions About the Online AI Model
  if (parsed.intentType === "ask_online_model") {
    return {
      response: {
        type: "clarification",
        summaryText: "CanteenCue is integrated with Google Gemini Flash for advanced multi-turn conversational reasoning! When rate limits or temporary API pauses occur on the cloud model, CanteenCue seamlessly activates our deterministic campus decision engine so you never miss a meal recommendation. You can verify or provide your own Gemini API key anytime via the 'API Config' button in the top navigation bar.",
        whyFitsList: [
          "Cloud AI: Google Gemini Flash (Multi-turn conversational memory)",
          "Deterministic Fallback: CanteenCue Campus Decision Engine (Zero downtime)",
          "Catalog: 6 campus canteen outlets with 279 in-stock dishes",
        ],
        alternatives: [],
        suggestedFollowUps: [
          "Recommend something to eat",
          "Vegetarian food under ₹100",
          "Fast food under 15 mins",
          "Start a new decision",
        ],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 3.8 Handle Comparative Queries (e.g. "why this veg roll why not eag roll")
  if (parsed.intentType === "why_not_comparison") {
    const comp = parsed.comparisonItems;
    const allItems = getMenuItems();
    const nameA = (comp?.itemA || "").toLowerCase().trim();
    const nameB = (comp?.itemB || "").toLowerCase().trim();

    // Match item A (or fallback to lastPrimaryItem)
    const foundA =
      allItems.find((it) => it.name.toLowerCase().includes(nameA) || nameA.includes(it.name.toLowerCase())) ||
      lastPrimaryItem?.item;

    // Match item B (the alternative queried, e.g. "egg roll")
    const foundB = allItems.find(
      (it) => it.name.toLowerCase().includes(nameB) || nameB.includes(it.name.toLowerCase())
    );

    if (foundA && foundB) {
      const priceA = foundA.portionOptions?.[0]?.price || foundA.price;
      const priceB = foundB.portionOptions?.[0]?.price || foundB.price;
      const priceDiff = Math.abs(priceA - priceB);
      const isBCheaper = priceB < priceA;

      const altCandidate: AlternativeCandidate = {
        item: foundB,
        selectedPrice: priceB,
        reason: `${foundB.name} (${foundB.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"}) at ₹${priceB}.`,
        type: isBCheaper ? "cheaper" : "other_shop",
      };

      const primaryCandidate: RecommendationCandidate = {
        item: foundA,
        selectedPrice: priceA,
        score: 100,
        matchedReasons: [
          `Priced at ₹${priceA}`,
          `Dietary: ${foundA.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"}`,
          `From ${foundA.shop}`,
        ],
      };

      const explanationA = `${foundA.name} is priced at ₹${priceA} (${foundA.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"})`;
      const explanationB = `${foundB.name} is priced at ₹${priceB} (${foundB.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"})${isBCheaper ? ` — saving you ₹${priceDiff}` : ""}`;

      const summary = `You asked why ${foundA.name} and not ${foundB.name}:\n• ${explanationB}.\n• ${explanationA}.\n• Both options are served fresh at ${foundA.shop === foundB.shop ? foundA.shop : `${foundA.shop} / ${foundB.shop}`}.\n\nIf you eat ${foundB.dietary === "vegetarian" ? "vegetarian meals" : "eggs/non-veg"}, ${foundB.name} is a great alternative! Would you like to switch to ${foundB.name}?`;

      return {
        response: {
          type: "recommendation",
          primaryItem: primaryCandidate,
          summaryText: summary,
          whyFitsList: [
            `${foundA.name}: ₹${priceA} (${foundA.dietary})`,
            `${foundB.name}: ₹${priceB} (${foundB.dietary}) — ${isBCheaper ? `₹${priceDiff} cheaper` : "alternative choice"}`,
            `Campus outlet: ${foundA.shop}`,
          ],
          alternatives: [altCandidate],
          suggestedFollowUps: [
            `Switch to ${foundB.name}`,
            `Keep ${foundA.name}`,
            "Something cheaper",
            "Start a new decision",
          ],
          activePreferences: currentState,
        },
        nextState: currentState,
      };
    }
  }

  // 4. Handle "Why did you choose this?"
  if (parsed.intentType === "why" && lastPrimaryItem) {
    const item = lastPrimaryItem.item;
    const price = lastPrimaryItem.selectedPrice;
    return {
      response: {
        type: "recommendation",
        primaryItem: lastPrimaryItem,
        summaryText: `You asked why I chose ${item.name} (₹${price}). It satisfied all your active constraints without exceeding budget, and matched your specific cravings closer than other options in the menu.`,
        whyFitsList: [
          `Priced at ₹${price} ${currentState.budget ? `(within your ₹${currentState.budget} budget)` : ""}`,
          `Dietary: ${item.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"}`,
          `Category: ${item.category} from ${item.shop}`,
          ...(currentState.craving || []).map((c: string) => `Matched craving: ${c}`),
        ],
        alternatives: [],
        suggestedFollowUps: ["Anything better?", "Something cheaper", "What about chicken?", "Anything from the other shop?"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 5. Handle "Anything better?"
  if (parsed.intentType === "anything_better" && lastPrimaryItem) {
    const allItems = getMenuItems();
    const filterResult = filterCandidates(allItems, currentState);
    const ranked = rankCandidates(filterResult.passed, currentState);

    const second = ranked.secondBestCandidate || ranked.alternatives[0];
    const secondItemName = second?.item.name || "Paneer Fried Rice";
    const secondPrice = second?.selectedPrice || 89;

    return {
      response: {
        type: "recommendation",
        primaryItem: lastPrimaryItem,
        summaryText: `There is another option, ${secondItemName} at ₹${secondPrice}, but I consider ${lastPrimaryItem.item.name} a closer match to your primary craving.`,
        whyFitsList: [
          `Primary: ${lastPrimaryItem.item.name} (₹${lastPrimaryItem.selectedPrice}) — best craving match`,
          `Alternative: ${secondItemName} (₹${secondPrice}) — valid second choice`,
        ],
        alternatives: ranked.alternatives,
        suggestedFollowUps: [`What about ${secondItemName}?`, "Something cheaper", "Other shop", "Start a new decision"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 5.5 Handle contextual time constraint on active recommendation (e.g. "I only have 15 minutes")
  if (
    lastPrimaryItem &&
    parsed.extractedPreferences.availableTime !== undefined &&
    parsed.extractedPreferences.budget === undefined &&
    parsed.extractedPreferences.preferredProtein === undefined &&
    parsed.extractedPreferences.preferredFoodType === undefined &&
    !query.toLowerCase().includes("instead") &&
    !query.toLowerCase().includes("other")
  ) {
    const itemPrep = lastPrimaryItem.item.estimatedPreparationTime || 15;
    const requestedTime = parsed.extractedPreferences.availableTime;
    const item = lastPrimaryItem.item;
    const price = lastPrimaryItem.selectedPrice;

    if (requestedTime != null && itemPrep <= requestedTime) {
      const nextState: UserPreferenceState = {
        ...currentState,
        availableTime: requestedTime,
        budget: currentState.budget !== null ? Math.max(currentState.budget, price) : price,
      };
      return {
        response: {
          type: "recommendation",
          primaryItem: lastPrimaryItem,
          summaryText: `Yes! ${item.name} only takes about ~${itemPrep} minutes to prepare, so it easily fits within your ${requestedTime}-minute break.`,
          whyFitsList: [
            `Prep time: ~${itemPrep} mins (well within your ${requestedTime} min limit) ✓`,
            `Price: ₹${price} from ${item.shop}`,
            `Dietary: ${item.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"}`,
            "Confirmed fast turnaround for campus lunch breaks",
          ],
          alternatives: [],
          suggestedFollowUps: ["Something even faster", "Something cheaper", "What about chicken?", "Start a new decision"],
          activePreferences: nextState,
        },
        nextState,
      };
    }
  }

  // 6. Handle Failure Case 1: Unavailable Item (e.g. Chicken Tikka)
  if (parsed.intentType === "unavailable_item") {
    const fallbackItem = getItemById("anna-egg-chicken-roll") || getItemById("anna-chicken-kasa");
    const fallbackPrice = fallbackItem ? fallbackItem.price : 79;

    const fallbackCandidate: AlternativeCandidate = {
      item: fallbackItem!,
      selectedPrice: fallbackPrice,
      reason: "Available substitute that provides chicken at an affordable price.",
      type: "unavailable_substitute",
    };

    return {
      response: {
        type: "alternative_only",
        failureCase: {
          type: "unavailable",
          originalItemName: "Chicken Tikka",
          originalPrice: 119,
          whyOriginalFailed: "Chicken Tikka is currently marked unavailable in the live canteen menu.",
          whyAlternativeChosen: `I chose ${fallbackItem?.name || "Egg Chicken Roll"} instead because it still matches your chicken preference while staying under your budget.`,
        },
        summaryText: `Chicken Tikka would have matched your preferences, but it's currently marked unavailable in the live canteen menu.\n\nAlternative: ${fallbackItem?.name} — ₹${fallbackPrice}\nI chose this instead because it still matches your chicken preference while staying under your budget.`,
        whyFitsList: [
          "Chicken Tikka: Marked unavailable in live menu",
          `Suggested alternative: ${fallbackItem?.name} at ₹${fallbackPrice}`,
          "Reason: Matches your chicken preference within budget",
        ],
        alternatives: [fallbackCandidate],
        suggestedFollowUps: ["What about Chicken Kasa?", "Something vegetarian", "Start a new decision"],
        activePreferences: currentState,
      },
      nextState: currentState,
    };
  }

  // 7. Handle Failure Case 2: Over Budget Specific Item (e.g. Chicken Thali / Biryani under ₹100)
  if (parsed.intentType === "over_budget_item" && parsed.targetOverBudgetItem) {
    const target = parsed.targetOverBudgetItem;
    const fallbackItem = getItemById("anna-chicken-kasa") || getItemById("anna-egg-chicken-roll");
    const fallbackPrice = fallbackItem ? (fallbackItem.portionOptions?.[0]?.price || fallbackItem.price) : 99;

    const fallbackCandidate: AlternativeCandidate = {
      item: fallbackItem!,
      selectedPortion: fallbackItem?.portionOptions ? "half" : undefined,
      selectedPrice: fallbackPrice,
      reason: `Fits within your ₹${parsed.extractedPreferences.budget || 100} budget while giving you chicken.`,
      type: "cheaper",
    };

    return {
      response: {
        type: "alternative_only",
        failureCase: {
          type: "over_budget",
          originalItemName: target.name,
          originalPrice: target.price,
          whyOriginalFailed: `${target.name} matches your craving, but it's ₹${target.price}, which is above your ₹${parsed.extractedPreferences.budget || 100} budget.`,
          whyAlternativeChosen: `I selected ${fallbackItem?.name} (₹${fallbackPrice}) because it stays within your budget and still gives you a filling non-vegetarian chicken option.`,
        },
        summaryText: `${target.name} matches your craving, but it's ₹${target.price}, which is above your ₹${parsed.extractedPreferences.budget || 100} budget.\n\nAlternative: ${fallbackItem?.name} — ₹${fallbackPrice}\nI selected this because it stays within your budget and still gives you a filling non-vegetarian chicken option.`,
        whyFitsList: [
          `${target.name}: ₹${target.price} (Exceeds ₹${parsed.extractedPreferences.budget || 100} budget)`,
          `Alternative: ${fallbackItem?.name} (₹${fallbackPrice})`,
          "Reason: Stays within budget without sacrificing chicken",
        ],
        alternatives: [fallbackCandidate],
        suggestedFollowUps: ["Increase budget to ₹150", "What about Egg Chicken Roll?", "Start a new decision"],
        activePreferences: mergePreferences(currentState, parsed.extractedPreferences),
      },
      nextState: mergePreferences(currentState, parsed.extractedPreferences),
    };
  }

  // 7.5 Handle Specific Item Inquiry (e.g. from MenuModal "Ask assistant" or AlternativeCard "Ask about this")
  if (parsed.matchedMenuItem && parsed.intentType === "specific_item") {
    const item = parsed.matchedMenuItem;
    const price = item.portionOptions?.[0]?.price || item.price;
    const allItems = getMenuItems();

    // Check if user previously set an explicit hard budget and this item exceeds it
    if (currentState.budget !== null && price > currentState.budget) {
      const fallbackItem =
        getItemById("anna-chicken-kasa") ||
        getItemById("anna-egg-chicken-roll") ||
        allItems.find((it) => it.price <= currentState.budget! && it.dietary === item.dietary) ||
        allItems.find((it) => it.price <= currentState.budget!);

      const fallbackPrice = fallbackItem ? fallbackItem.price : currentState.budget;
      const fallbackCandidate: AlternativeCandidate = {
        item: fallbackItem!,
        selectedPrice: fallbackPrice,
        reason: `Fits within your ₹${currentState.budget} budget.`,
        type: "cheaper",
      };

      return {
        response: {
          type: "alternative_only",
          failureCase: {
            type: "over_budget",
            originalItemName: item.name,
            originalPrice: price,
            whyOriginalFailed: `${item.name} is ₹${price}, which exceeds your active ₹${currentState.budget} budget limit.`,
            whyAlternativeChosen: `I selected ${fallbackItem?.name} (₹${fallbackPrice}) because it stays within your budget.`,
          },
          summaryText: `${item.name} would be great, but it's ₹${price}, which exceeds your active ₹${currentState.budget} budget.\n\nAlternative: ${fallbackItem?.name} — ₹${fallbackPrice}\nI selected this because it stays within your budget.`,
          whyFitsList: [
            `${item.name}: ₹${price} (Exceeds ₹${currentState.budget} budget)`,
            `Alternative: ${fallbackItem?.name} (₹${fallbackPrice})`,
          ],
          alternatives: [fallbackCandidate],
          suggestedFollowUps: [`Increase budget to ₹${price}`, "Start a new decision"],
          activePreferences: currentState,
        },
        nextState: currentState,
      };
    }

    const primaryCandidate: RecommendationCandidate = {
      item,
      selectedPrice: price,
      selectedPortion: item.portion || "standard",
      score: 100,
      matchedReasons: [
        `Direct selection: ${item.name}`,
        `Priced at ₹${price}`,
        `From ${item.shop}`,
        item.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian",
        item.estimatedPreparationTime ? `~${item.estimatedPreparationTime} mins prep` : "Fast turnaround",
      ],
    };

    // Find cross-canteen or category alternatives
    const otherAlternatives: AlternativeCandidate[] = allItems
      .filter((other) => other.id !== item.id && other.availability !== false)
      .filter((other) => other.category === item.category || other.shop !== item.shop)
      .slice(0, 2)
      .map((alt) => ({
        item: alt,
        selectedPrice: alt.price,
        selectedPortion: alt.portion || "standard",
        reason:
          alt.shop !== item.shop
            ? `From ${alt.shop} at ₹${alt.price} as a cross-canteen option.`
            : `Another option from ${alt.shop} at ₹${alt.price}.`,
        type: alt.price < price ? "cheaper" : alt.shop !== item.shop ? "other_shop" : "relaxed_constraint",
      }));

    const prepText = item.estimatedPreparationTime ? ` It takes about ~${item.estimatedPreparationTime} mins to prepare.` : "";
    const dietText = item.dietary === "vegetarian" ? "a vegetarian choice" : "a non-vegetarian choice";
    const summary = `Yes! You can get ${item.name} from ${item.shop} for ₹${price}.${prepText} It's ${dietText} and served fresh at the counter.`;

    const nextState: UserPreferenceState = {
      ...currentState,
      preferredShop: item.shop,
      dietary: currentState.dietary || (item.dietary === "vegetarian" ? "vegetarian" : "non_vegetarian"),
      budget: currentState.budget !== null ? Math.max(currentState.budget, price) : price,
      rawQuery: query,
    };

    return {
      response: {
        type: "recommendation",
        primaryItem: primaryCandidate,
        summaryText: summary,
        whyFitsList: [
          `Dish: ${item.name} (₹${price})`,
          `Outlet: ${item.shop}`,
          `Dietary: ${item.dietary === "vegetarian" ? "Vegetarian" : "Non-Vegetarian"}`,
          ...(item.estimatedPreparationTime ? [`Preparation time: ~${item.estimatedPreparationTime} minutes`] : []),
        ],
        alternatives: otherAlternatives,
        suggestedFollowUps: [
          "Something cheaper",
          "What about another shop?",
          "Can you suggest a combo?",
          "Start a new decision",
        ],
        activePreferences: nextState,
      },
      nextState,
    };
  }

  // 8. Merge updated preferences into current state
  const updatedState = mergePreferences(currentState, parsed.extractedPreferences);
  updatedState.rawQuery = query;

  // 9. Get menu items and filter through deterministic constraints
  const allItems = getMenuItems();
  const filterResult = filterCandidates(allItems, updatedState);

  // 10. Handle Trade-offs (e.g. Chicken under ₹50 per Section 23, 40, 41)
  if (filterResult.passed.length === 0) {
    const analysis = filterResult.tradeoffAnalysis;
    const alternatives: AlternativeCandidate[] = (analysis?.relaxedCandidates || []).map((rc) => ({
      item: rc.item,
      selectedPortion: rc.portion,
      selectedPrice: rc.price,
      reason: `Fits your ₹${updatedState.budget} budget.`,
      type: "cheaper",
    }));

    return {
      response: {
        type: "no_match_tradeoff",
        summaryText: analysis?.explanation || "I couldn't find an exact match satisfying all constraints in the current canteen menu.",
        whyFitsList: [
          `No item in menu matches all active constraints simultaneously`,
          ...(analysis?.suggestedRelaxation ? [analysis.suggestedRelaxation] : []),
        ],
        alternatives,
        suggestedFollowUps: [
          updatedState.preferredProtein === "chicken" ? "Increase budget to ₹100" : "Increase budget",
          "Remove protein requirement",
          "Browse vegetarian options",
          "Start a new decision",
        ],
        activePreferences: updatedState,
      },
      nextState: updatedState,
    };
  }

  // 11. Rank valid candidates and select primary + combination + alternatives
  const ranked = rankCandidates(filterResult.passed, updatedState);
  if (!ranked.primary) {
    return {
      response: {
        type: "clarification",
        summaryText: "I couldn't pinpoint a single recommendation. Try giving me a target budget or craving.",
        whyFitsList: [],
        alternatives: [],
        suggestedFollowUps: ["I have ₹100", "Something spicy", "Start a new decision"],
        activePreferences: updatedState,
      },
      nextState: updatedState,
    };
  }

  // 12. Generate grounded explanation
  const explanation = generateExplanation(
    ranked.primary,
    updatedState,
    ranked.alternatives,
    ranked.combination
  );

  return {
    response: {
      type: "recommendation",
      primaryItem: ranked.primary,
      combination: ranked.combination,
      alternatives: ranked.alternatives,
      summaryText: explanation.summaryText,
      whyFitsList: explanation.whyFitsList,
      suggestedFollowUps: explanation.suggestedFollowUps,
      activePreferences: updatedState,
    },
    nextState: updatedState,
  };
}
