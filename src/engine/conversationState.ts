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
  const merged: UserPreferenceState = {
    ...current,
    ...updates,
    craving: Array.from(new Set([...(current.craving || []), ...(updates.craving || [])])),
    exclusions: Array.from(new Set([...(current.exclusions || []), ...(updates.exclusions || [])])),
  };

  // If user explicitly asked for a vegetarian dietary restriction, clear conflicting non-veg protein
  if (updates.dietary === "vegetarian" && merged.preferredProtein === "chicken") {
    merged.preferredProtein = null;
  }

  // If user explicitly asked for chicken protein, ensure dietary aligns
  if (updates.preferredProtein === "chicken") {
    merged.dietary = "non_vegetarian";
  }

  return merged;
}
