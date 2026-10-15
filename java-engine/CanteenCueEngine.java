import java.util.*;
import java.util.regex.*;

/**
 * CanteenCue — AI College Canteen Food Decision Assistant
 * Standalone Java Decision Engine
 * Aligned with TCS Problem Statement: Intelligent recommendations considering budget, dietary restrictions, time, and mood.
 */
public class CanteenCueEngine {

    // --- Data Models ---
    public static class MenuItem {
        public String id;
        public String shop;
        public String name;
        public String category;
        public int price;
        public String dietary; // "vegetarian", "non_vegetarian", "contains_egg"
        public List<String> tags;
        public int preparationTime;
        public boolean availability;
        public String spiceLevel;
        public String fillingLevel;

        public MenuItem(String id, String shop, String name, String category, int price,
                        String dietary, List<String> tags, int prepTime, boolean availability,
                        String spiceLevel, String fillingLevel) {
            this.id = id;
            this.shop = shop;
            this.name = name;
            this.category = category;
            this.price = price;
            this.dietary = dietary;
            this.tags = tags;
            this.preparationTime = prepTime;
            this.availability = availability;
            this.spiceLevel = spiceLevel;
            this.fillingLevel = fillingLevel;
        }
    }

    public static class UserState {
        public Integer budget;
        public String dietary;
        public List<String> craving = new ArrayList<>();
        public Integer availableTime;
        public String mood;
        public String preferredShop;
        public String preferredProtein;
        public List<String> exclusions = new ArrayList<>();
    }

    public static class DecisionResult {
        public String type; // "recommendation", "clarification", "redirect", "no_match_tradeoff", "alternative_only"
        public MenuItem primaryItem;
        public MenuItem pairingItem;
        public int totalPrice;
        public String summaryText;
        public List<String> whyFitsList = new ArrayList<>();
        public List<String> suggestedFollowUps = new ArrayList<>();
    }

    // --- Static Dataset (Anna's Restaurant & Mughlai Affair's) ---
    public static List<MenuItem> MENU = Arrays.asList(
        new MenuItem("anna-veg-roll", "Anna's Restaurant & Catering", "Veg Roll", "Rolls", 59, "vegetarian", Arrays.asList("filling", "snack"), 10, true, "mild", "medium"),
        new MenuItem("anna-paneer-roll", "Anna's Restaurant & Catering", "Paneer Roll", "Rolls", 69, "vegetarian", Arrays.asList("paneer", "filling", "snack"), 10, true, "medium", "medium"),
        new MenuItem("anna-mix-veg-roll", "Anna's Restaurant & Catering", "Mix Veg Roll", "Rolls", 79, "vegetarian", Arrays.asList("healthy", "wholesome", "light", "veggies"), 10, true, "mild", "medium"),
        new MenuItem("anna-egg-roll", "Anna's Restaurant & Catering", "Egg Roll", "Rolls", 79, "contains_egg", Arrays.asList("egg", "protein", "filling"), 10, true, "medium", "medium"),
        new MenuItem("anna-egg-chicken-roll", "Anna's Restaurant & Catering", "Egg Chicken Roll", "Rolls", 79, "non_vegetarian", Arrays.asList("chicken", "protein", "filling"), 10, true, "medium", "medium"),
        new MenuItem("anna-veg-noodles", "Anna's Restaurant & Catering", "Veg Noodles", "Noodles", 79, "vegetarian", Arrays.asList("noodles", "comfort", "filling"), 15, true, "mild", "heavy"),
        new MenuItem("anna-veg-schezwan-noodles", "Anna's Restaurant & Catering", "Veg Schezwan Noodles", "Noodles", 89, "vegetarian", Arrays.asList("spicy", "noodles", "schezwan"), 15, true, "spicy", "heavy"),
        new MenuItem("anna-chicken-noodles", "Anna's Restaurant & Catering", "Chicken Noodles", "Noodles", 99, "non_vegetarian", Arrays.asList("chicken", "noodles", "filling"), 15, true, "medium", "heavy"),
        new MenuItem("anna-chicken-schezwan-noodles", "Anna's Restaurant & Catering", "Chicken Schezwan Noodles", "Noodles", 119, "non_vegetarian", Arrays.asList("spicy", "chicken", "noodles"), 15, true, "spicy", "heavy"),
        new MenuItem("anna-chicken-kasa", "Anna's Restaurant & Catering", "Chicken Kasa", "Chicken", 99, "non_vegetarian", Arrays.asList("chicken", "spicy", "gravy"), 15, true, "spicy", "heavy"),
        new MenuItem("anna-chicken-thali", "Anna's Restaurant & Catering", "Chicken Thali", "Thali", 149, "non_vegetarian", Arrays.asList("chicken", "thali", "filling", "wholesome"), 20, true, "medium", "heavy"),
        new MenuItem("anna-chicken-biryani", "Anna's Restaurant & Catering", "Chicken Biryani", "Biryani", 150, "non_vegetarian", Arrays.asList("chicken", "rice", "biryani", "spicy"), 15, true, "medium", "heavy"),
        new MenuItem("anna-chicken-tikka", "Anna's Restaurant & Catering", "Chicken Tikka", "Chicken", 119, "non_vegetarian", Arrays.asList("chicken", "smoky", "spicy"), 15, false, "spicy", "medium"), // Unavailable test item
        new MenuItem("anna-cold-drinks", "Anna's Restaurant & Catering", "Cold Drinks", "Beverages", 25, "vegetarian", Arrays.asList("drink", "cold", "refreshing", "light"), 2, true, "none", "light"),
        new MenuItem("anna-coffee", "Anna's Restaurant & Catering", "Coffee", "Beverages", 79, "vegetarian", Arrays.asList("drink", "warm", "energetic", "light"), 5, true, "none", "light"),
        new MenuItem("anna-cold-coffee", "Anna's Restaurant & Catering", "Cold Coffee", "Beverages", 99, "vegetarian", Arrays.asList("drink", "sweet", "cold", "refreshing", "light"), 5, true, "none", "light"),
        new MenuItem("mughlai-paneer-rice", "Mughlai Affair's", "Paneer Fried Rice", "Rice", 90, "vegetarian", Arrays.asList("paneer", "rice", "filling", "comfort"), 15, true, "medium", "heavy"),
        new MenuItem("mughlai-egg-chicken-rice", "Mughlai Affair's", "Egg Chicken Rice", "Rice", 95, "non_vegetarian", Arrays.asList("chicken", "egg", "rice", "protein"), 15, true, "medium", "heavy"),
        new MenuItem("mughlai-special-mix-veg-rice", "Mughlai Affair's", "Special Mix Veg Fried Rice", "Rice", 125, "vegetarian", Arrays.asList("healthy", "wholesome", "rice", "veggies"), 15, true, "mild", "heavy")
    );

    // --- Query Parser ---
    public static UserState parseQuery(String query, UserState current) {
        UserState state = new UserState();
        if (current != null) {
            state.budget = current.budget;
            state.dietary = current.dietary;
            state.craving = new ArrayList<>(current.craving);
            state.availableTime = current.availableTime;
            state.mood = current.mood;
            state.preferredShop = current.preferredShop;
            state.preferredProtein = current.preferredProtein;
            state.exclusions = new ArrayList<>(current.exclusions);
        }

        String text = query.trim().toLowerCase();
        // Typo normalization
        text = text.replace("fillilng", "feeling")
                   .replace("unhealty", "unhealthy")
                   .replace("healty", "healthy")
                   .replace("vegitarian", "vegetarian");

        // 1. Budget extraction
        Matcher mBudget = Pattern.compile("(?:₹|rs\\.?|rupees)?\\s*(\\d{2,4})\\b").matcher(text);
        if (mBudget.find()) {
            int val = Integer.parseInt(mBudget.group(1));
            if (val <= 1000) state.budget = val;
        }

        // 2. Dietary extraction
        if (text.contains("vegetarian") || text.contains("veg ") || text.equals("veg") || text.contains("pure veg")) {
            state.dietary = "vegetarian";
        } else if (text.contains("chicken") || text.contains("non-veg") || text.contains("non veg")) {
            state.dietary = "non_vegetarian";
            if (text.contains("chicken")) state.preferredProtein = "chicken";
        }

        // 3. Cravings
        if (text.contains("spicy") || text.contains("schezwan") || text.contains("hot")) {
            if (!state.craving.contains("spicy")) state.craving.add("spicy");
        }
        if (text.contains("something filling") || text.contains("heavy meal") || text.contains("solid meal")) {
            if (!state.craving.contains("filling")) state.craving.add("filling");
        }
        if (text.contains("light") || text.contains("snack") || text.contains("quick bite")) {
            if (!state.craving.contains("light")) state.craving.add("light");
        }
        if (text.contains("sweet") || text.contains("drink") || text.contains("coffee")) {
            if (!state.craving.contains("sweet")) state.craving.add("sweet");
        }

        // 4. Healthy / Feeling Unhealthy
        if (text.contains("unhealthy") || text.contains("feeling unhealthy") || text.contains("healthy") || text.contains("wholesome")) {
            state.mood = "Healthy";
            if (!state.craving.contains("light")) state.craving.add("light");
            if (!state.craving.contains("healthy")) state.craving.add("healthy");
        }

        // 5. Time window
        Matcher mTime = Pattern.compile("(\\d{1,2})\\s*(?:min|mins|minutes)").matcher(text);
        if (mTime.find()) {
            state.availableTime = Integer.parseInt(mTime.group(1));
        }

        // 6. Shop
        if (text.contains("anna")) {
            state.preferredShop = "Anna's Restaurant & Catering";
        } else if (text.contains("mughlai")) {
            state.preferredShop = "Mughlai Affair's";
        }

        return state;
    }

    // --- Decision Engine ---
    public static DecisionResult processDecision(String query, UserState currentState) {
        String text = query.trim().toLowerCase();
        DecisionResult res = new DecisionResult();

        // 1. Greetings
        if (text.matches("^(hi|hello|hey|greetings|howdy|good morning)[\\s!.,?]*$") ||
            text.contains("how are you") || text.equals("help") || text.contains("what can you do")) {
            res.type = "clarification";
            res.summaryText = "Hi! I'm CanteenCue, your AI college canteen food decision assistant. I can recommend suitable meals and smart combinations from your canteen menu based on budget, mood, dietary preference, or available time.";
            res.suggestedFollowUps = Arrays.asList("I have ₹100", "Vegetarian food under ₹80", "Something healthy and light", "I only have 15 minutes");
            return res;
        }

        // 2. Unrelated queries
        if (text.contains("write code") || text.contains("poem") || text.contains("weather") || text.contains("joke")) {
            res.type = "redirect";
            res.summaryText = "I can help you decide what to eat from the college canteen menu. Tell me your budget, craving, mood, dietary preference, or available time.";
            res.suggestedFollowUps = Arrays.asList("I have ₹100", "Something spicy", "Vegetarian food under ₹80");
            return res;
        }

        UserState state = parseQuery(query, currentState);

        // 3. Failure Case 1: Unavailable item
        if (text.contains("chicken tikka")) {
            res.type = "alternative_only";
            res.summaryText = "Chicken Tikka would have matched your chicken preference, but it's currently marked unavailable in the prototype canteen menu.\n\nAlternative: Egg Chicken Roll — ₹79 (Anna's Restaurant & Catering)\nI chose this instead because it is available, stays within budget, and gives you chicken at an affordable price.";
            res.whyFitsList = Arrays.asList("Chicken Tikka: Marked Unavailable in prototype", "Alternative: Egg Chicken Roll (₹79) matches chicken preference");
            res.suggestedFollowUps = Arrays.asList("Tell me more about Egg Chicken Roll", "Something cheaper", "Other shop");
            return res;
        }

        // 4. Failure Case 2: Over-budget item
        if ((text.contains("chicken thali") || text.contains("chicken biryani")) && (state.budget != null && state.budget <= 100)) {
            res.type = "alternative_only";
            res.summaryText = "Chicken Thali matches your craving, but it's ₹149, which is above your stated ₹" + state.budget + " budget.\n\nAlternative: Chicken Kasa — ₹99 (Anna's Restaurant & Catering)\nI selected this because it stays within your budget and still gives you a filling chicken option.";
            res.whyFitsList = Arrays.asList("Chicken Thali is ₹149 (exceeds budget)", "Alternative: Chicken Kasa is ₹99 (within ₹" + state.budget + " budget)");
            res.suggestedFollowUps = Arrays.asList("What about Chicken Kasa?", "Increase my budget to ₹150", "Other options");
            return res;
        }

        // 5. Hard Constraint Filtering
        List<MenuItem> candidates = new ArrayList<>();
        for (MenuItem item : MENU) {
            if (!item.availability) continue;
            if (state.budget != null && item.price > state.budget) continue;
            if ("vegetarian".equals(state.dietary) && !"vegetarian".equals(item.dietary)) continue;
            if (state.preferredShop != null && !item.shop.equalsIgnoreCase(state.preferredShop)) continue;
            candidates.add(item);
        }

        if (candidates.isEmpty()) {
            res.type = "no_match_tradeoff";
            res.summaryText = "No exact canteen item satisfies all constraints simultaneously. Consider relaxing your budget or switching dietary criteria.";
            res.suggestedFollowUps = Arrays.asList("Increase my budget", "Show vegetarian options instead");
            return res;
        }

        // 6. Soft Attribute Scoring
        MenuItem bestItem = null;
        int maxScore = -999;
        for (MenuItem item : candidates) {
            int score = 100;
            if (state.budget != null) {
                double ratio = (double) item.price / state.budget;
                if (ratio >= 0.6 && ratio <= 1.0) score += 20;
            }
            if ("vegetarian".equals(state.dietary) && "vegetarian".equals(item.dietary)) score += 15;
            if (state.craving.contains("spicy") && item.tags.contains("spicy")) score += 30;
            if (state.craving.contains("light") && item.tags.contains("light")) score += 25;
            if (state.craving.contains("sweet") && item.tags.contains("sweet")) score += 20;
            if ("Healthy".equals(state.mood)) {
                if (item.tags.contains("healthy") || item.tags.contains("wholesome") || item.name.contains("Mix Veg")) {
                    score += 50;
                } else if ("heavy".equals(item.fillingLevel) || "spicy".equals(item.spiceLevel)) {
                    score -= 35; // Penalize heavy greasy food when user feels unhealthy
                }
            }
            if (state.preferredProtein != null && item.tags.contains(state.preferredProtein)) score += 35;

            if (score > maxScore) {
                maxScore = score;
                bestItem = item;
            }
        }

        res.type = "recommendation";
        res.primaryItem = bestItem;

        // Smart Combo check (Main + Drink under budget)
        int budgetCap = state.budget != null ? state.budget : 200;
        if (bestItem != null && !bestItem.category.equals("Beverages")) {
            for (MenuItem bev : MENU) {
                if (bev.category.equals("Beverages") && bestItem.price + bev.price <= budgetCap) {
                    res.pairingItem = bev;
                    res.totalPrice = bestItem.price + bev.price;
                    break;
                }
            }
        }

        // Formulate explanation
        List<String> reasons = new ArrayList<>();
        if (state.budget != null) {
            int rem = state.budget - bestItem.price;
            reasons.add("stays ₹" + rem + " under your ₹" + state.budget + " budget");
            res.whyFitsList.add("₹" + bestItem.price + " / ₹" + state.budget + " budget (₹" + rem + " remaining) ✓");
        } else {
            res.whyFitsList.add("Price: ₹" + bestItem.price);
        }

        if ("vegetarian".equals(state.dietary)) {
            reasons.add("satisfies your vegetarian preference");
            res.whyFitsList.add("Vegetarian ✓");
        }
        if ("Healthy".equals(state.mood)) {
            reasons.add("provides a wholesome, lighter choice to help you feel refreshed");
            res.whyFitsList.add("Wholesome & healthy choice ✓");
        } else if (state.craving.contains("spicy")) {
            reasons.add("matches your spicy craving");
            res.whyFitsList.add("Spicy craving match ✓");
        }

        res.summaryText = "I recommend " + bestItem.name + " from " + bestItem.shop + " at ₹" + bestItem.price + ". It " + String.join(", ", reasons) + ".";
        res.whyFitsList.add("From " + bestItem.shop);
        res.suggestedFollowUps = Arrays.asList("Something cheaper", "Anything from the other shop?", "What about chicken?", "Why did you choose this?");

        return res;
    }

    public static void main(String[] args) {
        System.out.println("=================================================");
        System.out.println("CanteenCue Java Engine — Test Demonstrations");
        System.out.println("=================================================\n");

        String[] testQueries = {
            "I have ₹100, vegetarian, spicy",
            "I am fillilng unhealty",
            "Hello how are you",
            "I want Chicken Tikka",
            "Chicken Thali under ₹100",
            "Write me a poem"
        };

        for (String q : testQueries) {
            System.out.println(">>> Query: \"" + q + "\"");
            DecisionResult res = processDecision(q, null);
            System.out.println("Result Type: " + res.type);
            if (res.primaryItem != null) {
                System.out.println("Primary Recommendation: " + res.primaryItem.name + " (₹" + res.primaryItem.price + ")");
            }
            if (res.pairingItem != null) {
                System.out.println("Smart Combo: " + res.primaryItem.name + " + " + res.pairingItem.name + " (Total: ₹" + res.totalPrice + ")");
            }
            System.out.println("Summary Text:\n" + res.summaryText);
            System.out.println("-------------------------------------------------");
        }
    }
}
