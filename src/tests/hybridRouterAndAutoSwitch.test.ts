import { describe, it, expect, vi } from "vitest";
import {
  isFoodRelatedQuery,
  isOfflineEngineConfidentlyCatching,
  routeUserDecision,
} from "../services/hybridRouter";
import { processUserDecision } from "../engine";
import { INITIAL_PREFERENCE_STATE } from "../engine/conversationState";
import * as aiService from "../services/aiService";

describe("Hybrid Router & Auto-Switching to Online AI", () => {
  describe("1. isFoodRelatedQuery (Non-food guard for rate limiting)", () => {
    it("recognizes food, canteen, and dining queries as food-related", () => {
      expect(isFoodRelatedQuery("damnnnn dosa isn't light")).toBe(true);
      expect(isFoodRelatedQuery("okay maybe somethinh more lighter")).toBe(true);
      expect(isFoodRelatedQuery("pizza")).toBe(true);
      expect(isFoodRelatedQuery("burger")).toBe(true);
      expect(isFoodRelatedQuery("I want vegetarian food under ₹80")).toBe(true);
      expect(isFoodRelatedQuery("Can I get Veg Roll?")).toBe(true);
      expect(isFoodRelatedQuery("Something spicy and filling in 10 mins")).toBe(true);
      expect(isFoodRelatedQuery("Show Maggie Point menu")).toBe(true);
      expect(isFoodRelatedQuery("cold coffee from iter juice")).toBe(true);
    });

    it("identifies non-food queries (coding, homework, trivia, weather) as NOT food-related", () => {
      expect(isFoodRelatedQuery("write python code for binary search")).toBe(false);
      expect(isFoodRelatedQuery("who is the prime minister of India")).toBe(false);
      expect(isFoodRelatedQuery("what is the capital of France")).toBe(false);
      expect(isFoodRelatedQuery("tell me a joke about dogs")).toBe(false);
      expect(isFoodRelatedQuery("solve this math equation: x^2 + 5x = 0")).toBe(false);
      expect(isFoodRelatedQuery("how to build a react website")).toBe(false);
      expect(isFoodRelatedQuery("what is the weather in Delhi")).toBe(false);
    });

    it("allows standard commands and conversational follow-ups", () => {
      expect(isFoodRelatedQuery("hello")).toBe(true);
      expect(isFoodRelatedQuery("why did you choose this")).toBe(true);
      expect(isFoodRelatedQuery("anything better")).toBe(true);
      expect(isFoodRelatedQuery("not this", [{ id: "1", sender: "user", timestamp: 1, text: "dosa" }])).toBe(true);
    });
  });

  describe("2. Rate Limiting: Intercepts Non-Food Queries Without Sending to LLM", () => {
    it("blocks non-food query offline with specialized redirection", async () => {
      const processAiSpy = vi.spyOn(aiService, "processAiDecision");

      const result = await routeUserDecision(
        "write me python code for binary search",
        [],
        INITIAL_PREFERENCE_STATE
      );

      expect(result.source).toBe("deterministic_engine");
      expect(result.response.type).toBe("redirect");
      expect(result.response.summaryText).toContain("I am CanteenCue");
      expect(result.response.summaryText).toContain("campus canteen food decision assistant");
      // Verify processAiDecision was NEVER called!
      expect(processAiSpy).not.toHaveBeenCalled();

      processAiSpy.mockRestore();
    });
  });

  describe("3. isOfflineEngineConfidentlyCatching & Auto-Switching", () => {
    it("confidently catches standard budget and dietary constraints offline to save API quota", () => {
      const offline1 = processUserDecision("I have ₹100");
      expect(isOfflineEngineConfidentlyCatching("I have ₹100", offline1)).toBe(true);

      const offline2 = processUserDecision("Vegetarian food under ₹80");
      expect(isOfflineEngineConfidentlyCatching("Vegetarian food under ₹80", offline2)).toBe(true);

      const offline3 = processUserDecision("Can I get Veg Roll?");
      expect(isOfflineEngineConfidentlyCatching("Can I get Veg Roll?", offline3)).toBe(true);
    });

    it("flags off-menu items, negation, and clarification as NOT caught by offline model", () => {
      const offlinePizza = processUserDecision("pizza");
      expect(isOfflineEngineConfidentlyCatching("pizza", offlinePizza)).toBe(false);

      const offlineDosaNegation = processUserDecision("damnnnn dosa isn't light");
      expect(isOfflineEngineConfidentlyCatching("damnnnn dosa isn't light", offlineDosaNegation)).toBe(false);

      const offlineLighter = processUserDecision("okay maybe somethinh more lighter");
      expect(isOfflineEngineConfidentlyCatching("okay maybe somethinh more lighter", offlineLighter)).toBe(false);
    });

    it("auto-switches to configured online AI model when offline model isn't catching it", async () => {
      // Mock an active online AI config
      vi.spyOn(aiService, "getStoredAiConfig").mockReturnValue({
        provider: "gemini",
        apiKey: "test-valid-key",
        model: "gemini-flash-lite-latest",
        enableMemory: true,
      });

      const mockAiResponse = {
        response: {
          type: "clarification" as const,
          summaryText: "We don't serve pizza at the canteen, but I recommend checking out our Cheese Maggi or Paneer Roll!",
          whyFitsList: ["Pizza not on menu", "Cheesy alternative available"],
          alternatives: [],
          suggestedFollowUps: ["Show Maggie Point menu", "What rolls do you have?"],
          activePreferences: INITIAL_PREFERENCE_STATE,
        },
        nextState: INITIAL_PREFERENCE_STATE,
      };

      const processAiSpy = vi.spyOn(aiService, "processAiDecision").mockResolvedValue(mockAiResponse);

      const result = await routeUserDecision("pizza", [], INITIAL_PREFERENCE_STATE);

      // Successfully auto-switched to live LLM!
      expect(result.source).toBe("live_llm");
      expect(processAiSpy).toHaveBeenCalledWith("pizza", [], INITIAL_PREFERENCE_STATE, undefined);
      expect(result.response.summaryText).toContain("We don't serve pizza");

      processAiSpy.mockRestore();
      vi.restoreAllMocks();
    });

    it("displays whatever Gemini replies even if Gemini says it doesn't understand", async () => {
      vi.spyOn(aiService, "getStoredAiConfig").mockReturnValue({
        provider: "gemini",
        apiKey: "test-valid-key",
        model: "gemini-flash-lite-latest",
        enableMemory: true,
      });

      const mockAiUnsureResponse = {
        response: {
          type: "clarification" as const,
          summaryText: "I'm sorry, I don't quite understand what kind of food you're looking for. Tell me your budget or craving!",
          whyFitsList: [],
          alternatives: [],
          suggestedFollowUps: ["I have ₹100", "Vegetarian food under ₹80"],
          activePreferences: INITIAL_PREFERENCE_STATE,
        },
        nextState: INITIAL_PREFERENCE_STATE,
      };

      vi.spyOn(aiService, "processAiDecision").mockResolvedValue(mockAiUnsureResponse);

      const result = await routeUserDecision("what about zebra food with dragonfruit salsa", [], INITIAL_PREFERENCE_STATE);

      expect(result.source).toBe("live_llm");
      expect(result.response.type).toBe("clarification");
      expect(result.response.summaryText).toContain("I don't quite understand");
      expect(result.response.primaryItem).toBeUndefined();

      vi.restoreAllMocks();
    });
  });

  describe("4. Offline Engine Fallback When Live AI Not Configured", () => {
    it("handles off-menu dishes like 'pizza' gracefully instead of 'I didn't quite catch that'", () => {
      const result = processUserDecision("pizza");
      expect(result.response.type).toBe("recommendation");
      expect(result.response.summaryText).toContain("isn't served at the campus canteens");
      expect(result.response.summaryText).toContain("Maggi");
      expect(result.response.primaryItem).toBeDefined();
    });

    it("parses typo 'somethinh' and 'lighter' into light craving", () => {
      const result = processUserDecision("okay maybe somethinh more lighter");
      expect(result.nextState.craving).toContain("light");
      expect(result.response.type).toBe("recommendation");
    });

    it("excludes dosa when user negates 'damnnnn dosa isn't light'", () => {
      const result = processUserDecision("damnnnn dosa isn't light");
      expect(result.nextState.exclusions).toContain("dosa");
      if (result.response.primaryItem) {
        expect(result.response.primaryItem.item.name.toLowerCase()).not.toContain("dosa");
      }
    });
  });
});
