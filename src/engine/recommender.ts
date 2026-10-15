import {
  UserPreferenceState,
  RecommendationCandidate,
  AlternativeCandidate,
  MealCombination,
  MenuItem,
} from "../data/types";
import { EvaluatedPortionItem } from "./constraintFilter";
import { getItemById } from "../data/menuService";

export interface RankedResults {
  primary?: RecommendationCandidate;
  combination?: MealCombination;
  alternatives: AlternativeCandidate[];
  secondBestCandidate?: RecommendationCandidate;
}

export function rankCandidates(
  candidates: EvaluatedPortionItem[],
  state: UserPreferenceState
): RankedResults {
  if (candidates.length === 0) {
    return { alternatives: [] };
  }

  // Score each candidate
  const scored: RecommendationCandidate[] = candidates.map((cand) => {
    let score = 100; // Base score for satisfying hard constraints
    const matchedReasons: string[] = [];

    // 1. Budget efficiency
    if (state.budget !== null) {
      matchedReasons.push(`Within ₹${state.budget} budget (costs ₹${cand.price})`);
      const budgetRatio = cand.price / state.budget;
      if (budgetRatio >= 0.6 && budgetRatio <= 1.0) {
        score += 20;
      } else if (budgetRatio < 0.6) {
        score += 10;
      }
    }

    // 2. Dietary matching
    if (state.dietary === "vegetarian" && cand.item.dietary === "vegetarian") {
      matchedReasons.push("100% Vegetarian");
      score += 15;
    }

    // 3. Craving match
    if (state.craving && state.craving.length > 0) {
      for (const cr of state.craving) {
        const itemTags = cand.item.tags || [];
        const isSpicy = cr === "spicy" && (cand.item.spiceLevel === "spicy" || itemTags.includes("spicy"));
        const isFilling = cr === "filling" && (cand.item.fillingLevel === "heavy" || itemTags.includes("filling"));
        const isLight = cr === "light" && (cand.item.fillingLevel === "light" || itemTags.includes("light"));
        const isCrispy = cr === "crispy" && itemTags.includes("crispy");
        const isSweet = cr === "sweet" && itemTags.includes("sweet");
        const isHealthy =
          (cr === "healthy" || cr === "wholesome") &&
          (itemTags.includes("healthy") || itemTags.includes("wholesome") || cand.item.name.includes("Mix Veg") || cand.item.foodType === "beverage");

        if (isSpicy) {
          score += 30;
          matchedReasons.push("Matches your spicy craving");
        }
        if (isFilling) {
          score += 25;
          matchedReasons.push("Substantial, filling meal");
        }
        if (isLight) {
          score += 20;
          matchedReasons.push("Light bite");
        }
        if (isCrispy) {
          score += 20;
          matchedReasons.push("Crispy texture");
        }
        if (isSweet) {
          score += 15;
          matchedReasons.push("Sweet beverage");
        }
        if (isHealthy) {
          score += 40;
          matchedReasons.push("Healthy, wholesome option");
        }
      }
    }

    // 4. Time match
    if (state.availableTime !== null) {
      const prep = cand.item.estimatedPreparationTime || 15;
      if (prep <= state.availableTime) {
        score += 25;
        matchedReasons.push(`Estimated prep (~${prep} mins) fits your ${state.availableTime} min window`);
      } else {
        score -= 20;
      }
    }

    // 5. Protein match
    if (state.preferredProtein) {
      const protein = state.preferredProtein.toLowerCase();
      if (
        cand.item.name.toLowerCase().includes(protein) ||
        cand.item.tags.includes(protein)
      ) {
        score += 35;
        matchedReasons.push(`Provides your requested ${state.preferredProtein}`);
      }
    }

    // 6. Mood match
    if (state.mood) {
      const moodLower = state.mood.toLowerCase();
      if (moodLower.includes("healthy")) {
        const itemTags = cand.item.tags || [];
        if (itemTags.includes("healthy") || itemTags.includes("wholesome") || cand.item.name.includes("Mix Veg")) {
          score += 50;
          matchedReasons.push("Nutritious and wholesome choice");
        } else if (cand.item.fillingLevel === "heavy" || cand.item.spiceLevel === "spicy") {
          // Penalize greasy or very heavy foods when feeling unhealthy
          score -= 35;
        }
      } else if (moodLower.includes("comfort") && (cand.item.tags.includes("comfort") || cand.item.category === "Noodles" || cand.item.category === "Rice")) {
        score += 25;
        matchedReasons.push("Perfect comfort food");
      } else if (moodLower.includes("quick") && (cand.item.estimatedPreparationTime || 15) <= 10) {
        score += 25;
        matchedReasons.push("Quick & light choice");
      }
    }

    // 7. Shop match
    if (state.preferredShop && cand.item.shop === state.preferredShop) {
      score += 20;
      matchedReasons.push(`From ${state.preferredShop}`);
    }

    // 8. Specific query keyword / item name matching from rawQuery
    if (state.rawQuery) {
      const qLower = state.rawQuery.toLowerCase();
      const itemNameLower = cand.item.name.toLowerCase();

      // Check full item name match
      if (qLower.includes(itemNameLower)) {
        score += 80;
        matchedReasons.unshift(`Direct match for ${cand.item.name}`);
      } else {
        // Check multi-word phrase or specific item tokens (excluding common stop words)
        const stopWords = new Set(["i", "want", "a", "an", "the", "from", "in", "at", "under", "with", "and", "or", "to", "for", "me", "something", "food", "have", "centre", "center", "shop", "iter", "corner"]);
        const queryTokens = qLower
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((t) => t.length > 2 && !stopWords.has(t));

        let tokenMatches = 0;
        for (const token of queryTokens) {
          if (itemNameLower.includes(token) || (cand.item.tags && cand.item.tags.includes(token))) {
            tokenMatches++;
          }
        }
        if (tokenMatches > 0) {
          score += tokenMatches * 25;
          matchedReasons.unshift(`Matches "${cand.item.name}" from your request`);
        }
      }
    }

    return {
      item: cand.item,
      selectedPortion: cand.portion,
      selectedPrice: cand.price,
      score,
      matchedReasons,
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const primary = scored[0];
  const secondBestCandidate = scored.length > 1 ? scored[1] : undefined;
  const alternatives: AlternativeCandidate[] = [];

  // Generate Smart Meal Combination (Main + Beverage or Snack)
  let combination: MealCombination | undefined = undefined;
  const budgetLimit = state.budget || 200;

  if (primary && primary.item.foodType !== "beverage") {
    // Look for compatible beverage pairing across outlets, prioritizing the same outlet
    const candidateIds = [
      "anna-cold-drinks",
      "hp_bev_1",
      "mp_bev_1",
      "mp_bev_4",
      "mp_bev_6",
      "anna-coffee",
      "mp_cbev_1",
      "anna-cold-coffee",
      "mp_cbev_6",
    ];

    const beverageCandidates = candidateIds
      .map((id) => getItemById(id))
      .filter((b): b is MenuItem => !!b && b.availability)
      .sort((a, b) => {
        const aSame = a.shop === primary.item.shop ? 0 : 1;
        const bSame = b.shop === primary.item.shop ? 0 : 1;
        if (aSame !== bSame) return aSame - bSame;
        return a.price - b.price;
      });

    for (const bev of beverageCandidates) {
      if (primary.selectedPrice + bev.price <= budgetLimit) {
        const total = primary.selectedPrice + bev.price;
        const sameShopTag = bev.shop === primary.item.shop ? `from ${bev.shop}` : `${primary.item.shop} & ${bev.shop}`;
        combination = {
          mainItem: primary.item,
          mainPortion: primary.selectedPortion,
          mainPrice: primary.selectedPrice,
          pairingItem: bev,
          pairingPrice: bev.price,
          totalPrice: total,
          comboReason: `${primary.item.name} + ${bev.name} comes to ₹${total} (${sameShopTag}). You get a satisfying complete meal with a drink while staying within your ₹${budgetLimit} budget.`,
          estimatedPreparationTime: Math.max(primary.item.estimatedPreparationTime || 10, bev.estimatedPreparationTime || 4),
        };
        break;
      }
    }
  }

  // Find a secondary option:
  // Preference A: A high-scoring option from the OTHER shop
  const otherShopCand = scored.find(
    (c) => c.item.shop !== primary.item.shop && c.item.id !== primary.item.id
  );
  if (otherShopCand) {
    alternatives.push({
      item: otherShopCand.item,
      selectedPortion: otherShopCand.selectedPortion,
      selectedPrice: otherShopCand.selectedPrice,
      reason: `From ${otherShopCand.item.shop} at ₹${otherShopCand.selectedPrice} as a cross-canteen option.`,
      type: "other_shop",
    });
  }

  // Preference B: A cheaper option (budget saver)
  const cheaperCand = scored.find(
    (c) =>
      c.selectedPrice < primary.selectedPrice &&
      c.item.id !== primary.item.id &&
      (!otherShopCand || c.item.id !== otherShopCand.item.id)
  );
  if (cheaperCand) {
    const diff = primary.selectedPrice - cheaperCand.selectedPrice;
    alternatives.push({
      item: cheaperCand.item,
      selectedPortion: cheaperCand.selectedPortion,
      selectedPrice: cheaperCand.selectedPrice,
      reason: `Saves you ₹${diff} at ₹${cheaperCand.selectedPrice} while still giving you a satisfying choice.`,
      type: "cheaper",
    });
  }

  // If we still have only 1 alternative, pick the next highest ranked
  if (alternatives.length < 2) {
    const nextBest = scored.find(
      (c) =>
        c.item.id !== primary.item.id &&
        !alternatives.some((a) => a.item.id === c.item.id)
    );
    if (nextBest) {
      alternatives.push({
        item: nextBest.item,
        selectedPortion: nextBest.selectedPortion,
        selectedPrice: nextBest.selectedPrice,
        reason: `Another solid match at ₹${nextBest.selectedPrice}.`,
        type: "relaxed_constraint",
      });
    }
  }

  return {
    primary,
    combination,
    alternatives: alternatives.slice(0, 2),
    secondBestCandidate,
  };
}
