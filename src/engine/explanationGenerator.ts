import {
  UserPreferenceState,
  RecommendationCandidate,
  AlternativeCandidate,
  MealCombination,
} from "../data/types";

export interface ExplanationOutput {
  summaryText: string;
  whyFitsList: string[];
  suggestedFollowUps: string[];
}

export function generateExplanation(
  primary: RecommendationCandidate,
  state: UserPreferenceState,
  alternatives: AlternativeCandidate[],
  combination?: MealCombination
): ExplanationOutput {
  const item = primary.item;
  const price = primary.selectedPrice;
  const portionStr = primary.selectedPortion && primary.selectedPortion !== "standard"
    ? ` (${primary.selectedPortion === "half" ? "Half" : "Full"} portion)`
    : "";

  const reasons: string[] = [];
  const whyFitsList: string[] = [];

  // 1. Budget breakdown
  if (state.budget !== null) {
    const diff = state.budget - price;
    if (diff > 0) {
      reasons.push(`stays ₹${diff} under your ₹${state.budget} budget`);
      whyFitsList.push(`₹${price} / ₹${state.budget} budget (₹${diff} remaining)`);
    } else {
      reasons.push(`fits your exact ₹${state.budget} budget`);
      whyFitsList.push(`₹${price} / ₹${state.budget} budget (exact fit)`);
    }
  } else {
    whyFitsList.push(`Price: ₹${price}`);
  }

  // 2. Dietary breakdown
  if (state.dietary === "vegetarian" && item.dietary === "vegetarian") {
    reasons.push("satisfies your vegetarian preference");
    whyFitsList.push("Vegetarian ✓");
  } else if (state.preferredProtein) {
    reasons.push(`gives you the ${state.preferredProtein} you wanted`);
    whyFitsList.push(`${state.preferredProtein.charAt(0).toUpperCase() + state.preferredProtein.slice(1)} option ✓`);
  }

  // 3. Craving breakdown
  if (state.craving && state.craving.length > 0) {
    const matchedCravings = state.craving.filter((c: string) =>
      item.tags.includes(c) ||
      (c === "spicy" && item.spiceLevel === "spicy") ||
      (c === "filling" && item.fillingLevel === "heavy") ||
      (c === "light" && item.fillingLevel === "light") ||
      (c === "healthy" && (item.tags.includes("healthy") || item.tags.includes("wholesome")))
    );

    if (matchedCravings.length > 0) {
      const cravingStr = matchedCravings.join(" and ");
      reasons.push(`matches your ${cravingStr} preference`);
      for (const mc of matchedCravings) {
        whyFitsList.push(`${mc.charAt(0).toUpperCase() + mc.slice(1)} ✓`);
      }
    }
  }

  // 3.5 Mood breakdown
  if (state.mood === "Healthy") {
    reasons.push("provides a wholesome, lighter choice to help you feel refreshed");
    whyFitsList.push("Wholesome & healthy profile ✓");
  } else if (state.mood === "Comfort food") {
    reasons.push("hits the spot for comfort food");
    whyFitsList.push("Comfort food favorite ✓");
  } else if (state.mood === "Quick & light") {
    reasons.push("is quick and light on the stomach");
    whyFitsList.push("Quick & light choice ✓");
  }

  // 4. Time breakdown
  if (state.availableTime !== null) {
    const prep = item.estimatedPreparationTime || 15;
    whyFitsList.push(`Estimated prep ~${prep} min (fits your ${state.availableTime} min window) ✓`);
  }

  // 5. Exclusions mention
  if (state.exclusions && state.exclusions.length > 0) {
    whyFitsList.push(`Excludes ${state.exclusions.join(", ")} as requested ✓`);
  }

  // 6. Smart Combo mention
  if (combination) {
    if (state.craving?.includes("combination") || state.rawQuery?.toLowerCase().includes("combo") || state.rawQuery?.toLowerCase().includes("combination")) {
      reasons.push(`pairs with ${combination.pairingItem.name} for a complete ₹${combination.totalPrice} meal combo`);
      whyFitsList.push(`Smart Combo: ${combination.mainItem.name} + ${combination.pairingItem.name} (₹${combination.totalPrice}) ✓`);
    }
  }

  // Shop tag
  whyFitsList.push(`From ${item.shop}`);

  // Build natural summary text
  let summaryText = "";
  if (reasons.length > 0) {
    summaryText = `I recommend ${item.name}${portionStr} from ${item.shop} at ₹${price}. It ${reasons.join(", ")}.`;
  } else {
    summaryText = `I recommend ${item.name}${portionStr} from ${item.shop} at ₹${price}. Based on the menu, this gives you a balanced option that fits your current selection.`;
  }

  // Generate intelligent contextual follow-up chips
  const suggestedFollowUps: string[] = [];

  // Cheaper alternative check
  if (alternatives.some((a) => a.type === "cheaper")) {
    suggestedFollowUps.push("Something cheaper");
  }

  // Cross-shop check
  if (item.shop === "Anna's Restaurant & Catering") {
    suggestedFollowUps.push("Anything from Mughlai Affair’s?");
  } else {
    suggestedFollowUps.push("Anything from Anna’s?");
  }

  // Protein / Dietary switches
  if (item.dietary === "vegetarian" && !state.preferredProtein) {
    suggestedFollowUps.push("What about chicken?");
  } else if (item.dietary === "non_vegetarian") {
    suggestedFollowUps.push("I'm vegetarian");
  }

  // Food type switch
  if (item.foodType === "noodles") {
    suggestedFollowUps.push("I don't want noodles");
  } else if (item.foodType === "rice") {
    suggestedFollowUps.push("I don't want rice");
  }

  suggestedFollowUps.push("Why did you choose this?");

  return {
    summaryText,
    whyFitsList,
    suggestedFollowUps: suggestedFollowUps.slice(0, 4),
  };
}
