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
      "goal + diet + servings",
      "calories/protein/carbs/fats",
      "Never place order without explicit user confirmation",
    ],
  },
  {
    name: "style branches context for skincare and haircare",
    verticalId: "style",
    mustContain: [
      "concern + skin_type for skincare",
      "concern + hair_type for haircare",
      "Never place order without explicit user confirmation",
    ],
  },
  {
    name: "dining enforces availability-before-booking",
    verticalId: "dining",
    mustContain: [
      "Availability check is mandatory before booking",
      "never assume requested slot exists",
      "Never submit booking without explicit confirmation",
    ],
  },
  {
    name: "foodorder handles vague hunger and explicit confirmation",
    verticalId: "foodorder",
    mustContain: [
      "offer 2-3 cuisines",
      "switch to menu mode",
      "Never place order without explicit user confirmation",
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
