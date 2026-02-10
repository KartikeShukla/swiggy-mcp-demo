import { verticals } from "@/verticals";
import {
  COD_CANCELLATION_RULE,
  LOCATION_LOCK_RULE,
  RESULT_FILTERING_RULE,
  SEARCH_EFFICIENCY_RULE,
  TOOL_ERROR_RULE,
} from "@/verticals/shared-prompt";

describe("vertical system prompts", () => {
  it("includes shared safety/rendering rules in every vertical", () => {
    for (const vertical of Object.values(verticals)) {
      expect(vertical.systemPrompt).toContain(SEARCH_EFFICIENCY_RULE);
      expect(vertical.systemPrompt).toContain(TOOL_ERROR_RULE);
      expect(vertical.systemPrompt).toContain(RESULT_FILTERING_RULE);
      expect(vertical.systemPrompt).toContain(LOCATION_LOCK_RULE);
    }
  });

  it("includes COD cancellation reminder only where expected", () => {
    expect(verticals.food.systemPrompt).toContain(COD_CANCELLATION_RULE);
    expect(verticals.style.systemPrompt).toContain(COD_CANCELLATION_RULE);
    expect(verticals.foodorder.systemPrompt).toContain(COD_CANCELLATION_RULE);
    expect(verticals.dining.systemPrompt).not.toContain(COD_CANCELLATION_RULE);
  });

  it("keeps vertical identity statements", () => {
    expect(verticals.food.systemPrompt).toContain("You are NutriCart");
    expect(verticals.style.systemPrompt).toContain("You are StyleBox");
    expect(verticals.dining.systemPrompt).toContain("You are TableScout");
    expect(verticals.foodorder.systemPrompt).toContain("You are FoodExpress");
  });
});
