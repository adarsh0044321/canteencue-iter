import { describe, it, expect } from "vitest";
import { processUserDecision } from "../engine";
import { ALL_MENU_ITEMS } from "../data/menuService";

describe("CanteenCue Decision Engine — TCS Problem Statement Tests", () => {
  // Scenario A — Simple budget: "I have ₹100"
  it("Scenario A: Under ₹100 should never return an item priced above ₹100", () => {
    const { response } = processUserDecision("I have ₹100");
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();
    expect(response.primaryItem!.selectedPrice).toBeLessThanOrEqual(100);
    expect(response.summaryText).toContain("100");
  });

  // Scenario B — Budget + craving: "I have ₹100 and want something spicy"
  it("Scenario B: Budget + spicy craving prioritizes spicy items within budget", () => {
    const { response } = processUserDecision("I have ₹100 and want something spicy");
    expect(response.type).toBe("recommendation");
    const primary = response.primaryItem!;
    expect(primary.selectedPrice).toBeLessThanOrEqual(100);
    const isSpicy =
      primary.item.tags.includes("spicy") ||
      primary.item.spiceLevel === "spicy" ||
      primary.item.name.toLowerCase().includes("schezwan") ||
      primary.item.name.toLowerCase().includes("chilly");
    expect(isSpicy).toBe(true);
  });

  // Scenario C — Budget + dietary: "I want vegetarian food under ₹80"
  it("Scenario C: Vegetarian food under ₹80 strictly excludes non-veg and egg items", () => {
    const { response } = processUserDecision("I want vegetarian food under ₹80");
    expect(response.type).toBe("recommendation");
    const primary = response.primaryItem!;
    expect(primary.selectedPrice).toBeLessThanOrEqual(80);
    expect(primary.item.dietary).toBe("vegetarian");
    expect(primary.item.dietary).not.toBe("non_vegetarian");
    expect(primary.item.dietary).not.toBe("contains_egg");
  });

  // Scenario D — Budget + time + craving: "I have ₹100, want something spicy, and only have 15 minutes"
  it("Scenario D: Budget + time + craving respects all 3 constraints", () => {
    const { response } = processUserDecision(
      "I have ₹100, want something spicy, and only have 15 minutes"
    );
    expect(response.type).toBe("recommendation");
    const primary = response.primaryItem!;
    expect(primary.selectedPrice).toBeLessThanOrEqual(100);
    const prep = primary.item.estimatedPreparationTime || 15;
    expect(prep).toBeLessThanOrEqual(15);
  });

  // Scenario E — Chicken request: "I want chicken under ₹100"
  it("Scenario E: Chicken under ₹100 only recommends verified chicken items <= ₹100", () => {
    const { response } = processUserDecision("I want chicken under ₹100");
    expect(response.type).toBe("recommendation");
    const primary = response.primaryItem!;
    expect(primary.selectedPrice).toBeLessThanOrEqual(100);
    expect(
      primary.item.name.toLowerCase().includes("chicken") ||
      primary.item.tags.includes("chicken")
    ).toBe(true);
  });

  // Scenario F — Impossible constraint: "I want chicken under ₹50"
  it("Scenario F: Chicken under ₹50 explains trade-off without hallucinating chicken at ₹50", () => {
    const { response } = processUserDecision("I want chicken under ₹50");
    expect(response.type).toBe("no_match_tradeoff");
    expect(response.summaryText).toContain("doesn't have a chicken option under ₹50");
    for (const alt of response.alternatives) {
      expect(alt.selectedPrice).toBeLessThanOrEqual(50);
    }
  });

  // Scenario G — Explicit exclusion: "I want something spicy under ₹100 but not noodles"
  it("Scenario G: Explicit exclusion prevents noodles from being recommended", () => {
    const { response } = processUserDecision(
      "I want something spicy under ₹100 but not noodles"
    );
    expect(response.type).toBe("recommendation");
    const primary = response.primaryItem!;
    expect(primary.selectedPrice).toBeLessThanOrEqual(100);
    expect(primary.item.category.toLowerCase()).not.toContain("noodle");
    expect(primary.item.name.toLowerCase()).not.toContain("noodle");
  });

  // Scenario H — Follow-up: "What about chicken?"
  it("Scenario H: Follow-up retains prior budget while updating protein preference", () => {
    const turn1 = processUserDecision("I have ₹100 and want something spicy");
    expect(turn1.response.primaryItem!.selectedPrice).toBeLessThanOrEqual(100);

    const turn2 = processUserDecision(
      "What about chicken?",
      turn1.nextState,
      turn1.response.primaryItem
    );
    expect(turn2.response.type).toBe("recommendation");
    const primary2 = turn2.response.primaryItem!;
    expect(primary2.selectedPrice).toBeLessThanOrEqual(100);
    expect(primary2.item.name.toLowerCase()).toContain("chicken");
  });

  // Scenario I — Other shop: "Anything from Mughlai Affair’s?"
  it("Scenario I: Shop preference strictly filters results to the requested shop", () => {
    const { response } = processUserDecision("Anything from Mughlai Affair's under ₹100?");
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem!.item.shop).toBe("Mughlai Affair's");
  });

  // Scenario J — Why: "Why did you choose this?"
  it("Scenario J: Explains specific attributes of the previously recommended item", () => {
    const turn1 = processUserDecision("I have ₹100 and want something spicy");
    const turn2 = processUserDecision("Why did you choose this?", turn1.nextState, turn1.response.primaryItem);
    expect(turn2.response.summaryText).toContain("You asked why I chose");
    expect(turn2.response.whyFitsList.length).toBeGreaterThan(0);
  });

  // Failure Case 1: Unavailable item fallback (TCS requirement)
  it("Failure Case 1: Explains unavailable status and offers available fallback with reason", () => {
    const { response } = processUserDecision("I want Chicken Tikka");
    expect(response.type).toBe("alternative_only");
    expect(response.failureCase).toBeDefined();
    expect(response.failureCase!.type).toBe("unavailable");
    expect(response.summaryText).toContain("currently marked unavailable in the live canteen menu");
    expect(response.alternatives.length).toBeGreaterThan(0);
  });

  // Failure Case 2: Over budget tradeoff (TCS requirement)
  it("Failure Case 2: Explains when requested item exceeds budget and offers within-budget alternative", () => {
    const { response } = processUserDecision("I want Chicken Thali under ₹100");
    expect(response.type).toBe("alternative_only");
    expect(response.failureCase).toBeDefined();
    expect(response.failureCase!.type).toBe("over_budget");
    expect(response.summaryText).toContain("Chicken Thali matches your craving, but it's ₹149, which is above your ₹100 budget");
    expect(response.alternatives[0].selectedPrice).toBeLessThanOrEqual(100);
  });

  // Smart Meal Combination (TCS requirement)
  it("TCS Smart Meal Combination: Pairs main dish with drink within budget", () => {
    const { response } = processUserDecision("I have ₹150, vegetarian, something filling");
    expect(response.combination).toBeDefined();
    const combo = response.combination!;
    expect(combo.totalPrice).toBeLessThanOrEqual(150);
    expect(combo.mainItem).toBeDefined();
    expect(combo.pairingItem).toBeDefined();
    expect(combo.comboReason.length).toBeGreaterThan(10);
  });

  // Follow-up: "Anything better?"
  it("Follow-up: 'Anything better?' compares primary recommendation with second-best candidate", () => {
    const turn1 = processUserDecision("I have ₹100 and want something spicy");
    const turn2 = processUserDecision("Anything better?", turn1.nextState, turn1.response.primaryItem);
    expect(turn2.response.summaryText).toContain("There is another option");
  });

  // Scenario L — Unrelated request: "Write me a poem"
  it("Scenario L: Gracefully redirects non-food requests back to canteen assistant", () => {
    const { response } = processUserDecision("Write me a poem");
    expect(response.type).toBe("redirect");
    expect(response.summaryText).toContain("I can help you decide what to eat from the college canteen menu");
  });

  // Data Integrity Test
  it("Data Integrity: Recommended item and price exist in verified menu dataset", () => {
    const queries = [
      "I have ₹100",
      "Paneer under ₹110",
      "Vegetarian food under ₹70",
      "Mushroom Fried Rice",
      "Something light under ₹30",
    ];

    for (const q of queries) {
      const { response } = processUserDecision(q);
      if (response.primaryItem) {
        const item = response.primaryItem.item;
        const existsInDataset = ALL_MENU_ITEMS.some((m) => m.id === item.id && m.name === item.name);
        expect(existsInDataset).toBe(true);

        if (response.primaryItem.selectedPortion === "half") {
          const halfOpt = item.portionOptions?.find((p: any) => p.portion === "half");
          expect(halfOpt?.price).toBe(response.primaryItem.selectedPrice);
        } else if (response.primaryItem.selectedPortion === "full") {
          const fullOpt = item.portionOptions?.find((p: any) => p.portion === "full");
          expect(fullOpt?.price).toBe(response.primaryItem.selectedPrice);
        } else {
          expect(item.price).toBe(response.primaryItem.selectedPrice);
        }
      }
    }
  });

  // Scenario M — Improper / Unusual input: "asdfghjkl", "123456", "random gibberish"
  it("Scenario M: Responds to improper/unusual text with polite clarification without recommending food", () => {
    const improperInputs = ["asdfghjkl", "qwertyuiop", "123456", "random gibberish without food", "???"];
    for (const input of improperInputs) {
      const { response } = processUserDecision(input);
      expect(response.type, `Failed for input: ${input}`).toBe("clarification");
      expect(response.primaryItem).toBeUndefined();
      expect(response.summaryText).toContain("didn't quite catch that");
      expect(response.suggestedFollowUps.length).toBeGreaterThan(0);
    }
  });

  // Scenario N — Help and Capabilities query
  it("Scenario N: Responds to help or capability queries with guidance without recommending food", () => {
    const helpInputs = ["help", "what can you do", "how to use this"];
    for (const input of helpInputs) {
      const { response } = processUserDecision(input);
      expect(response.type).toBe("clarification");
      expect(response.primaryItem).toBeUndefined();
      expect(response.summaryText).toContain("canteen");
    }
  });

  // Scenario O — Conversational Greeting: "Hello how are you"
  it("Scenario O: Conversational greeting responds warmly without recommending food prematurely", () => {
    const greetings = ["Hello how are you", "hi how are you", "hey there", "good morning"];
    for (const g of greetings) {
      const { response } = processUserDecision(g);
      expect(response.type).toBe("clarification");
      expect(response.primaryItem).toBeUndefined();
      expect(response.summaryText.toLowerCase()).toContain("canteen");
    }
  });

  // Scenario P — Feeling unhealthy / typos: "I am fillilng unhealty"
  it("Scenario P: 'I am fillilng unhealty' recommends healthy, wholesome food instead of heavy/filling food", () => {
    const { response } = processUserDecision("I am fillilng unhealty");
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();
    const item = response.primaryItem!.item;
    // Should NOT be regular Veg Roll with heavy filling
    expect(
      item.tags.includes("healthy") ||
      item.tags.includes("wholesome") ||
      item.name.includes("Mix Veg") ||
      item.category === "Beverages"
    ).toBe(true);
    expect(response.summaryText.toLowerCase()).not.toContain("filling craving");
  });

  // Scenario Q — Comparative query with typo: "why this veg roll why not eag roll"
  it("Scenario Q: 'why this veg roll why not eag roll' explains difference and compares Veg Roll with Egg Roll", () => {
    const { response } = processUserDecision("why this veg roll why not eag roll");
    expect(response.type).toBe("recommendation");
    expect(response.summaryText.toLowerCase()).toContain("egg roll");
    expect(response.summaryText.toLowerCase()).toContain("veg roll");
    expect(response.whyFitsList.length).toBeGreaterThan(0);
    expect(response.alternatives.length).toBeGreaterThan(0);
    expect(response.alternatives[0].item.name.toLowerCase()).toContain("egg roll");
  });

  // Scenario R — Hunger trigger + budget negation: "I didn't specify anything now did I just said I want something to eat right so I didn't even mention the bidget"
  it("Scenario R: Resolves natural hunger statement and clears budget on explicit budget negation", () => {
    const { response, nextState } = processUserDecision(
      "I didn't specify anything now did I just said I want something to eat right so I didn't even mention the bidget"
    );
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();
    // Budget should be cleared (null), not constrained to an erroneous number
    expect(nextState.budget).toBeNull();
  });

  // Scenario S — Online AI model query: "why not ask the onlinemodel"
  it("Scenario S: 'why not ask the onlinemodel' explains Gemini online AI and campus engine fallback", () => {
    const { response } = processUserDecision("why not ask the onlinemodel");
    expect(response.type).toBe("clarification");
    expect(response.summaryText).toContain("Google Gemini Flash");
    expect(response.whyFitsList.some((w) => w.includes("Gemini"))).toBe(true);
  });

  // Scenario T — Smart Meal Combination across outlets
  it("Scenario T: Recommends dish with paired beverage combo within budget", () => {
    const { response } = processUserDecision("Something filling under ₹100");
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();
    if (response.combination) {
      expect(response.combination.totalPrice).toBeLessThanOrEqual(100);
      expect(response.combination.mainItem).toBeDefined();
      expect(response.combination.pairingItem).toBeDefined();
    }
  });

  // Scenario U — Iter Juice Centre queries and catalog integrity
  it("Scenario U: Iter Juice Centre catalog has all 40 items and resolves outlet queries accurately", () => {
    const juiceItems = ALL_MENU_ITEMS.filter((item) => item.shop === "Iter Juice Centre");
    expect(juiceItems.length).toBe(40);
    expect(juiceItems.every((item) => item.dietary === "vegetarian")).toBe(true);

    // Query 1: Mango shake from Iter Juice
    const query1 = processUserDecision("I want a mango shake from iter juice");
    expect(query1.response.type).toBe("recommendation");
    expect(query1.response.primaryItem).toBeDefined();
    expect(query1.response.primaryItem!.item.shop).toBe("Iter Juice Centre");
    expect(query1.response.primaryItem!.item.name.toLowerCase()).toContain("mango shake");
    expect(query1.response.primaryItem!.selectedPrice).toBe(40);

    // Query 2: Cold coffee from juice center under 50
    const query2 = processUserDecision("Cold coffee from juice center under 50");
    expect(query2.response.type).toBe("recommendation");
    expect(query2.response.primaryItem).toBeDefined();
    expect(query2.response.primaryItem!.item.shop).toBe("Iter Juice Centre");
    expect(query2.response.primaryItem!.selectedPrice).toBeLessThanOrEqual(50);
    expect(query2.response.primaryItem!.item.name.toLowerCase()).toContain("cold coffee");

    // Query 3: Spl Kitkat from juice corner
    const query3 = processUserDecision("spl kitkat from juice corner");
    expect(query3.response.type).toBe("recommendation");
    expect(query3.response.primaryItem).toBeDefined();
    expect(query3.response.primaryItem!.item.shop).toBe("Iter Juice Centre");
    expect(query3.response.primaryItem!.item.name).toBe("Spl Kitkat");
    expect(query3.response.primaryItem!.selectedPrice).toBe(80);
  });

  // Scenario V — Direct Item Selection & Alternative Inquiries (Ask Assistant & Ask About This)
  it("Scenario V: Direct item queries and alternative inquiries resolve accurately to primary recommendation", () => {
    // 1. Menu modal "Ask assistant" on Pineapple
    const pineappleQuery = processUserDecision("Can I get Pineapple?");
    expect(pineappleQuery.response.type).toBe("recommendation");
    expect(pineappleQuery.response.primaryItem).toBeDefined();
    expect(pineappleQuery.response.primaryItem!.item.name).toBe("Pineapple");
    expect(pineappleQuery.response.primaryItem!.item.shop).toBe("Iter Juice Centre");
    expect(pineappleQuery.response.primaryItem!.selectedPrice).toBe(80);
    expect(pineappleQuery.response.summaryText).toContain("Pineapple");

    // 2. Alternative card "Ask about this" on Café Frappe (Cold Coffee)
    const altQuery = processUserDecision("What about Café Frappe (Cold Coffee)?");
    expect(altQuery.response.type).toBe("recommendation");
    expect(altQuery.response.primaryItem).toBeDefined();
    expect(altQuery.response.primaryItem!.item.name).toBe("Café Frappe (Cold Coffee)");
    expect(altQuery.response.primaryItem!.item.shop).toBe("MAGGIE POINT");
    expect(altQuery.response.primaryItem!.selectedPrice).toBe(80);

    // 3. Alternative card "Tell me more about" on Coffee
    const coffeeQuery = processUserDecision("Tell me more about Coffee");
    expect(coffeeQuery.response.type).toBe("recommendation");
    expect(coffeeQuery.response.primaryItem).toBeDefined();
    expect(coffeeQuery.response.primaryItem!.item.name).toBe("Coffee");
    expect(coffeeQuery.response.primaryItem!.item.shop).toBe("Anna's Restaurant & Catering");
  });

  // Scenario W — Conversational Dish Proposals & Phonetic Variations (Chhole Bhature)
  it("Scenario W: Correctly matches 'okay so maybe chola bhatura' and switches outlet to HALKA PHULKA", () => {
    // 1. User was at Anna's with exclusions
    const turn1 = processUserDecision("something from Anna's under 80 without veg roll");
    expect(turn1.nextState.preferredShop).toBe("Anna's Restaurant & Catering");

    // 2. User then proposes: "okay so maybe chola bhatura"
    const turn2 = processUserDecision("okay so maybe chola bhatura", turn1.nextState, turn1.response.primaryItem);
    expect(turn2.response.type).toBe("recommendation");
    expect(turn2.response.primaryItem).toBeDefined();
    expect(turn2.response.primaryItem!.item.name).toBe("Chhole Bhature");
    expect(turn2.response.primaryItem!.item.shop).toBe("HALKA PHULKA");
    expect(turn2.response.primaryItem!.selectedPrice).toBe(60);
    expect(turn2.nextState.preferredShop).toBe("HALKA PHULKA");

    // 3. Suffix variant: "can i get chola bhatura somewhere"
    const turn3 = processUserDecision("can i get chola bhatura somewhere");
    expect(turn3.response.type).toBe("recommendation");
    expect(turn3.response.primaryItem).toBeDefined();
    expect(turn3.response.primaryItem!.item.name).toBe("Chhole Bhature");
    expect(turn3.response.primaryItem!.item.shop).toBe("HALKA PHULKA");

    // 4. Spelling variations
    const choleQuery = processUserDecision("where can i get chole bhature");
    expect(choleQuery.response.primaryItem!.item.name).toBe("Chhole Bhature");

    const bhaturaQuery = processUserDecision("i want bhatura");
    expect(bhaturaQuery.response.primaryItem!.item.name).toBe("Chhole Bhature");

    const paniPuriQuery = processUserDecision("okay maybe golgappa");
    expect(paniPuriQuery.response.primaryItem!.item.name).toBe("Pani Puri");

    const vadaPavQuery = processUserDecision("can we get wada pav please");
    expect(vadaPavQuery.response.primaryItem!.item.name).toBe("Classic Vada Pav");
  });
});

