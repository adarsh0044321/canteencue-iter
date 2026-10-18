import { describe, it, expect } from "vitest";
import { processUserDecision } from "../engine";
import { isFoodRelatedQuery } from "../services/hybridRouter";

describe("Negation Handling and Food Decision Starters", () => {
  // 1. Single-turn Negation: "lets go for something light maybe but not spicy"
  it("excludes spicy dishes when user states 'lets go for something light maybe but not spicy'", () => {
    const { response, nextState } = processUserDecision("lets go for something light maybe but not spicy");

    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();

    const primary = response.primaryItem!;
    // Must NOT be spicy
    expect(primary.item.spiceLevel).not.toBe("spicy");
    expect(primary.item.tags.map((t) => t.toLowerCase())).not.toContain("spicy");

    // Summary must NOT claim it matches spicy craving
    expect(response.summaryText.toLowerCase()).not.toContain("matches your spicy");
    expect(response.summaryText.toLowerCase()).not.toContain("spicy and light");

    // Why fits list must NOT check off Spicy
    const whyFits = response.whyFitsList.join(" ").toLowerCase();
    expect(whyFits).not.toContain("spicy ✓");

    // Next state must NOT have spicy in cravings and MUST have spicy in exclusions
    expect(nextState.craving).not.toContain("spicy");
    expect(nextState.exclusions).toContain("spicy");
  });

  // 2. Multi-turn Correction: "I said not spicy"
  it("corrects recommendation when user says 'I said not spicy'", () => {
    const turn1 = processUserDecision("I have ₹100 and want something to eat");
    const turn2 = processUserDecision(
      "I said not spicy",
      turn1.nextState,
      turn1.response.primaryItem
    );

    expect(turn2.response.type).toBe("recommendation");
    const primary2 = turn2.response.primaryItem!;
    expect(primary2.item.spiceLevel).not.toBe("spicy");
    expect(primary2.item.tags.map((t) => t.toLowerCase())).not.toContain("spicy");
    expect(turn2.nextState.craving).not.toContain("spicy");
    expect(turn2.nextState.exclusions).toContain("spicy");
  });

  // 3. Multi-turn Correction: "I said it must not be spicy"
  it("corrects recommendation when user says 'I said it must not be spicy'", () => {
    const turn1 = processUserDecision("I have ₹60");
    const turn2 = processUserDecision(
      "I said it must not be spicy",
      turn1.nextState,
      turn1.response.primaryItem
    );

    expect(turn2.response.type).toBe("recommendation");
    const primary2 = turn2.response.primaryItem!;
    expect(primary2.item.spiceLevel).not.toBe("spicy");
    expect(primary2.item.tags.map((t) => t.toLowerCase())).not.toContain("spicy");
    expect(turn2.nextState.exclusions).toContain("spicy");
  });

  // 4. Other Cravings / Attributes Negation
  it("excludes sweet items when user asks for 'something to drink but not sweet'", () => {
    const { response, nextState } = processUserDecision("something to drink but not sweet");
    expect(response.type).toBe("recommendation");
    expect(nextState.craving).not.toContain("sweet");
    expect(nextState.exclusions).toContain("sweet");
    if (response.primaryItem) {
      expect(response.primaryItem.item.tags.map((t) => t.toLowerCase())).not.toContain("sweet");
    }
  });

  it("excludes chicken when user asks for 'something under 100 but not chicken'", () => {
    const { response, nextState } = processUserDecision("something under 100 but not chicken");
    expect(response.type).toBe("recommendation");
    expect(nextState.preferredProtein).not.toBe("chicken");
    expect(nextState.exclusions).toContain("chicken");
    if (response.primaryItem) {
      expect(response.primaryItem.item.name.toLowerCase()).not.toContain("chicken");
    }
  });

  it("sets dietary to vegetarian when user says 'no non veg'", () => {
    const { nextState } = processUserDecision("I want lunch under 100 but no non veg");
    expect(nextState.dietary).toBe("vegetarian");
  });

  // 5. Open-ended Decision Starters in hybridRouter
  it("recognizes open-ended campus decision starters as food-related queries", () => {
    expect(isFoodRelatedQuery("Umm what should I go for")).toBe(true);
    expect(isFoodRelatedQuery("what should I go for")).toBe(true);
    expect(isFoodRelatedQuery("what should I eat")).toBe(true);
    expect(isFoodRelatedQuery("what should I eat today")).toBe(true);
    expect(isFoodRelatedQuery("what to eat")).toBe(true);
    expect(isFoodRelatedQuery("suggest something")).toBe(true);
    expect(isFoodRelatedQuery("recommend something")).toBe(true);
    expect(isFoodRelatedQuery("help me decide what to order")).toBe(true);
    expect(isFoodRelatedQuery("what's good today")).toBe(true);
    expect(isFoodRelatedQuery("confused what to eat")).toBe(true);
  });

  // 6. Engine returns recommendation for open-ended decision starters
  it("generates a valid campus recommendation for 'Umm what should I go for'", () => {
    const { response } = processUserDecision("Umm what should I go for");
    expect(response.type).toBe("recommendation");
    expect(response.primaryItem).toBeDefined();
    expect(response.summaryText).toContain(response.primaryItem!.item.name);
  });
});
