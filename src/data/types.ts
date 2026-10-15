export type ShopName =
  | "Anna's Restaurant & Catering"
  | "Mughlai Affair's"
  | "HALKA PHULKA"
  | "MAGGIE POINT"
  | "4TH FLOOR"
  | "Iter Juice Centre";


export type DietaryType = "vegetarian" | "non_vegetarian" | "contains_egg";

export type PortionType = "half" | "full" | "standard";

export interface PortionPrice {
  portion: PortionType;
  price: number;
}

export interface MenuItem {
  id: string;
  shop: ShopName;
  name: string;
  category: string;
  price: number;
  portion?: PortionType;
  portionOptions?: PortionPrice[];
  dietary: DietaryType;
  tags: string[];
  ingredients?: string[];
  estimatedPreparationTime?: number; // In minutes
  availability: boolean; // Live in-stock status
  spiceLevel?: "mild" | "medium" | "spicy";
  fillingLevel?: "light" | "medium" | "heavy";
  foodType?: string; // "noodles", "rice", "roll", "thali", "chicken", "paneer", "beverage", "gravy", "starter"
}

export interface UserPreferenceState {
  budget: number | null;
  maxBudget: boolean;
  availableTime: number | null;
  dietary: "vegetarian" | "non_vegetarian" | null;
  craving: string[];
  mood: string | null;
  preferredProtein: string | null;
  preferredFoodType: string | null;
  exclusions: string[];
  preferredShop: ShopName | null;
  rawQuery?: string;
}

export interface RecommendationCandidate {
  item: MenuItem;
  selectedPortion?: PortionType;
  selectedPrice: number;
  score: number;
  matchedReasons: string[];
  tradeoffs?: string[];
}

export interface AlternativeCandidate {
  item: MenuItem;
  selectedPortion?: PortionType;
  selectedPrice: number;
  reason: string;
  type: "cheaper" | "other_shop" | "dietary_fallback" | "unavailable_substitute" | "relaxed_constraint";
}

export interface MealCombination {
  mainItem: MenuItem;
  mainPortion?: PortionType;
  mainPrice: number;
  pairingItem: MenuItem;
  pairingPrice: number;
  totalPrice: number;
  comboReason: string;
  estimatedPreparationTime?: number;
}

export interface FailureCaseDetails {
  type: "unavailable" | "over_budget";
  originalItemName: string;
  originalPrice?: number;
  whyOriginalFailed: string;
  whyAlternativeChosen: string;
}

export interface ApiErrorDetails {
  message: string;
  provider: string;
  hadFallback: boolean;
  requiresApiKey?: boolean;
}

export interface DecisionResponse {
  type: "recommendation" | "alternative_only" | "no_match_tradeoff" | "redirect" | "clarification";
  primaryItem?: RecommendationCandidate;
  combination?: MealCombination;
  failureCase?: FailureCaseDetails;
  alternatives: AlternativeCandidate[];
  summaryText: string;
  whyFitsList: string[];
  suggestedFollowUps: string[];
  activePreferences: Partial<UserPreferenceState>;
  apiErrorDetails?: ApiErrorDetails;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  timestamp: number;
  text?: string;
  decision?: DecisionResponse;
}
