import { verticals } from "@/verticals";

const MAX_PROMPT_WORDS = {
  food: 530,
  style: 520,
  dining: 500,
  foodorder: 525,
} as const;

function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

describe("prompt budget", () => {
  it("keeps prompts compact under per-vertical budgets", () => {
    for (const [verticalId, budget] of Object.entries(MAX_PROMPT_WORDS)) {
      const prompt = verticals[verticalId].systemPrompt;
      const words = countWords(prompt);
      expect(words).toBeLessThanOrEqual(budget);
    }
  });
});
