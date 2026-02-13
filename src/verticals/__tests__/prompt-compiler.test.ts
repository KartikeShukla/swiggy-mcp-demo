import { verticals } from "@/verticals";
import {
  diningPromptProfile,
  foodOrderPromptProfile,
  foodPromptProfile,
  stylePromptProfile,
} from "@/verticals/prompt-spec/profiles";
import { lintPromptProfile } from "@/verticals/shared-prompt";

const profiles = [
  foodPromptProfile,
  stylePromptProfile,
  diningPromptProfile,
  foodOrderPromptProfile,
];

describe("prompt compiler", () => {
  it("has no duplicate normalized instructions in profile + shared rules", () => {
    for (const profile of profiles) {
      expect(lintPromptProfile(profile)).toEqual([]);
    }
  });

  it("keeps vertical identity statements", () => {
    expect(verticals.food.systemPrompt).toContain("You are NutriCart");
    expect(verticals.style.systemPrompt).toContain("You are StyleKit");
    expect(verticals.dining.systemPrompt).toContain("You are TableScout");
    expect(verticals.foodorder.systemPrompt).toContain("You are FeedMe");
  });

  it("preserves key vertical behavior rules", () => {
    expect(verticals.food.systemPrompt).toContain("calories/protein/carbs/fats");
    expect(verticals.food.systemPrompt).toContain(
      "Only update cart after explicit user intent",
    );
    expect(verticals.food.systemPrompt).toContain("search immediately");
    expect(verticals.style.systemPrompt).toContain(
      "concern + skin_type for skincare",
    );
    expect(verticals.style.systemPrompt).toContain(
      "only update cart when user explicitly asks",
    );
    expect(verticals.style.systemPrompt).toContain("search immediately");
    expect(verticals.dining.systemPrompt).toContain(
      "Availability check is mandatory before booking",
    );
    expect(verticals.dining.systemPrompt).toContain("Single-booking constraint");
    expect(verticals.foodorder.systemPrompt).toContain(
      "switch to menu mode",
    );
    expect(verticals.foodorder.systemPrompt).toContain(
      "original craving/cuisine intent as a filter",
    );
    expect(verticals.foodorder.systemPrompt).toContain(
      "Restaurant selection = restaurant lock",
    );
  });
});
