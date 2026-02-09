import { verticals } from "@/verticals";

type Scenario = {
  name: string;
  verticalId: keyof typeof verticals;
  mustContain: string[];
};

const scenarios: Scenario[] = [
  {
    name: "food requires core nutrition context before search",
    verticalId: "food",
    mustContain: [
      "goal, diet, and servings",
      "Recommend 2-3 meal options",
      "Never place an order without explicit confirmation",
    ],
  },
  {
    name: "style branches context for skincare and haircare",
    verticalId: "style",
    mustContain: [
      "concern + skin_type",
      "concern + hair_type",
      "Never place an order without explicit confirmation",
    ],
  },
  {
    name: "dining enforces availability-before-booking",
    verticalId: "dining",
    mustContain: [
      "always call availability",
      "Never assume requested time is available",
      "Book only after user selects a slot and explicitly confirms",
    ],
  },
  {
    name: "foodorder handles vague hunger and explicit confirmation",
    verticalId: "foodorder",
    mustContain: [
      "offer 2-3 cuisine options",
      "fetch menu",
      "Never place an order without explicit confirmation",
    ],
  },
];

describe("scenario matrix", () => {
  it.each(scenarios)("$name", ({ verticalId, mustContain }) => {
    const prompt = verticals[verticalId].systemPrompt;
    for (const fragment of mustContain) {
      expect(prompt).toContain(fragment);
    }
  });
});
