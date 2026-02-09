import { verticals } from "@/verticals";

const LEGACY_BASELINE_WORDS = {
  food: 767,
  style: 771,
  dining: 756,
  foodorder: 740,
} as const;

function countWords(text: string): number {
  return (text.match(/\S+/g) ?? []).length;
}

describe("prompt budget", () => {
  it("reduces system prompt payload by at least 20% for every vertical", () => {
    for (const [verticalId, baseline] of Object.entries(LEGACY_BASELINE_WORDS)) {
      const prompt = verticals[verticalId].systemPrompt;
      const nextWords = countWords(prompt);
      const reduction = (baseline - nextWords) / baseline;
      expect(reduction).toBeGreaterThanOrEqual(0.2);
    }
  });
});
