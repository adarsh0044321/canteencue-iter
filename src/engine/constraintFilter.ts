import { MenuItem, UserPreferenceState, PortionType } from "../data/types";
import { getAllPortionsForMenuItem } from "../data/menuService";

export interface EvaluatedPortionItem {
  item: MenuItem;
  portion?: PortionType;
  price: number;
}

export interface FilterResult {
  passed: EvaluatedPortionItem[];
  allCandidatesCount: number;
  tradeoffAnalysis?: {
    failedConstraint: "budget" | "dietary" | "protein" | "exclusion" | "shop";
    explanation: string;
    suggestedRelaxation: string;
    relaxedCandidates: EvaluatedPortionItem[];
  };
}

export function filterCandidates(
  menuItems: MenuItem[],
  state: UserPreferenceState
): FilterResult {
  // 1. Expand all menu items to their available portions
  const allPortions: EvaluatedPortionItem[] = [];
  for (const item of menuItems) {
    if (item.availability !== false) {
      allPortions.push(...getAllPortionsForMenuItem(item));
    }
  }

  // 2. Apply hard constraints step by step to identify bottlenecks
  let currentCandidates = [...allPortions];

  // A. Dietary restriction (Strict hard constraint)
  if (state.dietary === "vegetarian") {
    currentCandidates = currentCandidates.filter(
      (c) => c.item.dietary === "vegetarian"
    );
  }

  // B. Specific Protein requirement (Hard constraint if explicitly asked)
  if (state.preferredProtein) {
    const protein = state.preferredProtein.toLowerCase();
    currentCandidates = currentCandidates.filter((c) => {
      const name = c.item.name.toLowerCase();
      const tags = c.item.tags || [];
      return (
        name.includes(protein) ||
        tags.includes(protein) ||
        c.item.category.toLowerCase().includes(protein)
      );
    });
  }

  // C. Food Type requirement (e.g. noodles, rice, roll, thali)
  if (state.preferredFoodType) {
    const ft = state.preferredFoodType.toLowerCase();
    currentCandidates = currentCandidates.filter((c) => {
      const itemFt = (c.item.foodType || "").toLowerCase();
      const cat = c.item.category.toLowerCase();
      const name = c.item.name.toLowerCase();
      return itemFt.includes(ft) || cat.includes(ft) || name.includes(ft);
    });
  }

  // C.1 If user explicitly requested a "filling" or "heavy" meal, exclude pure beverages from primary candidates
  if (state.craving && (state.craving.includes("filling") || state.craving.includes("heavy"))) {
    const nonBeverages = currentCandidates.filter(
      (c) => c.item.foodType !== "beverage" && c.item.category.toLowerCase() !== "beverages"
    );
    if (nonBeverages.length > 0) {
      currentCandidates = nonBeverages;
    }
  }

  // D. Exclusions (Hard constraint)
  if (state.exclusions && state.exclusions.length > 0) {
    for (const exc of state.exclusions) {
      const excLower = exc.toLowerCase();
      currentCandidates = currentCandidates.filter((c) => {
        const name = c.item.name.toLowerCase();
        const cat = c.item.category.toLowerCase();
        const ft = (c.item.foodType || "").toLowerCase();
        const tags = (c.item.tags || []).join(" ").toLowerCase();
        return (
          !name.includes(excLower) &&
          !cat.includes(excLower) &&
          !ft.includes(excLower) &&
          !tags.includes(excLower)
        );
      });
    }
  }

  // E. Shop preference (if user explicitly requested one shop)
  if (state.preferredShop) {
    currentCandidates = currentCandidates.filter(
      (c) => c.item.shop === state.preferredShop
    );
  }

  // F. Budget constraint (Strict hard constraint if specified)
  if (state.budget !== null) {
    const maxBudget = state.maxBudget ? state.budget : state.budget * 1.05;
    const budgetFiltered = currentCandidates.filter((c) => c.price <= maxBudget);

    if (budgetFiltered.length > 0) {
      return {
        passed: budgetFiltered,
        allCandidatesCount: allPortions.length,
      };
    }

    // Trade-off situation: No items passed the budget with the other active constraints!
    // Example: "Chicken under ₹50"
    const cheapestWithPriorConstraints = currentCandidates.sort(
      (a, b) => a.price - b.price
    );
    const closestOverBudget = cheapestWithPriorConstraints[0];

    // Find non-constraint candidates that DO fit the budget
    const budgetOnlyCandidates = allPortions
      .filter((c) => c.price <= maxBudget)
      .sort((a, b) => b.price - a.price);

    let explanation = `I couldn't find an option that satisfies all constraints under ₹${state.budget}.`;
    let suggestedRelaxation = "";

    if (state.preferredProtein === "chicken") {
      const minChickenPrice = closestOverBudget ? closestOverBudget.price : 79;
      explanation = `The current canteen menu doesn't have a chicken option under ₹${state.budget}. Chicken options start at ₹${minChickenPrice} (such as ${closestOverBudget?.item.name || "Egg Chicken Roll"}).`;
      suggestedRelaxation = `If ₹${state.budget} is fixed, I can suggest great vegetarian or beverage options within your budget. If chicken is essential, stretching your budget to ₹${minChickenPrice} will work.`;
    } else if (state.preferredProtein === "paneer") {
      const minPaneerPrice = closestOverBudget ? closestOverBudget.price : 69;
      explanation = `All paneer options on the canteen menu start at ₹${minPaneerPrice} (such as ${closestOverBudget?.item.name || "Paneer Roll"}), which exceeds your active ₹${state.budget} budget.`;
      suggestedRelaxation = `You could adjust your budget to ₹${minPaneerPrice} to get ${closestOverBudget?.item.name || "Paneer Roll"}, or choose budget bites under ₹${state.budget}.`;
    } else {
      const minPrice = closestOverBudget ? closestOverBudget.price : 59;
      explanation = `The options matching your active preferences start at ₹${minPrice}${closestOverBudget ? ` (${closestOverBudget.item.name})` : ""}, which is above your ₹${state.budget} budget.`;
      suggestedRelaxation = `You could either increase your budget slightly to ₹${minPrice} or explore other meal types.`;
    }

    return {
      passed: [],
      allCandidatesCount: allPortions.length,
      tradeoffAnalysis: {
        failedConstraint: "budget",
        explanation,
        suggestedRelaxation,
        relaxedCandidates: budgetOnlyCandidates.slice(0, 3),
      },
    };
  }

  return {
    passed: currentCandidates,
    allCandidatesCount: allPortions.length,
  };
}
