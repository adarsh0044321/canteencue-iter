import { UserPreferenceState } from "../data/types";

export const INITIAL_PREFERENCE_STATE: UserPreferenceState = {
  budget: null,
  maxBudget: true,
  availableTime: null,
  dietary: null,
  craving: [],
  mood: null,
  preferredProtein: null,
  preferredFoodType: null,
  exclusions: [],
  preferredShop: null,
  rawQuery: "",
};

export function mergePreferences(
  current: UserPreferenceState,
  updates: Partial<UserPreferenceState>
): UserPreferenceState {
  const mergedExclusions = Array.from(new Set([...(current.exclusions || []), ...(updates.exclusions || [])]));

  let mergedCravings = Array.from(new Set([...(current.craving || []), ...(updates.craving || [])]));
  // If an attribute is in exclusions (e.g. 'spicy', 'sweet', 'heavy'), prune it from active cravings
  if (mergedExclusions.length > 0) {
    mergedCravings = mergedCravings.filter((c) => !mergedExclusions.includes(c.toLowerCase()));
  }

  const merged: UserPreferenceState = {
    ...current,
    ...updates,
    craving: mergedCravings,
    exclusions: mergedExclusions,
  };

  // If user explicitly asked for a vegetarian dietary restriction or excluded non-veg/chicken, clear conflicting non-veg protein
  if (
    (updates.dietary === "vegetarian" || mergedExclusions.includes("chicken") || mergedExclusions.includes("non_veg")) &&
    merged.preferredProtein === "chicken"
  ) {
    merged.preferredProtein = null;
  }
  if (mergedExclusions.includes("egg") && merged.preferredProtein === "egg") {
    merged.preferredProtein = null;
  }
  if (mergedExclusions.includes("paneer") && merged.preferredProtein === "paneer") {
    merged.preferredProtein = null;
  }

  // If user explicitly asked for chicken protein, ensure dietary aligns
  if (updates.preferredProtein === "chicken") {
    merged.dietary = "non_vegetarian";
  }

  return merged;
}
