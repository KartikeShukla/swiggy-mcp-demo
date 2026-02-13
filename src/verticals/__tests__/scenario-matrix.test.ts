import { verticals } from "@/verticals";

type Scenario = {
  name: string;
  verticalId: keyof typeof verticals;
  mustContain: string[];
};

const scenarios: Scenario[] = [
  {
    name: "food supports dual-mode: advisory with nutrition slots and direct product ordering",
    verticalId: "food",
    mustContain: [
      "search immediately",
      "goal + diet + servings first",
      "calories/protein/carbs/fats",
      "Only update cart after explicit user intent",
      "Never place order without explicit user confirmation",
    ],
  },
  {
    name: "style supports dual-mode: advisory routines and direct product shopping",
    verticalId: "style",
    mustContain: [
      "search immediately",
      "concern + skin_type for skincare",
      "concern + hair_type for haircare",
      "only update cart when user explicitly asks",
      "Never place order without explicit user confirmation",
    ],
  },
  {
    name: "dining uses active address as location and enforces single-booking",
    verticalId: "dining",
    mustContain: [
      "active address exists in system context, treat it as fulfilled",
      "Single-booking constraint",
      "chronologically first meal",
      "Availability check is mandatory before booking",
      "never assume a requested slot exists",
      "Never submit booking without explicit confirmation",
    ],
  },
  {
    name: "foodorder enforces restaurant-first discovery and menu mode lock",
    verticalId: "foodorder",
    mustContain: [
      "offer 2-3 cuisines",
      "switch to menu mode",
      "original craving/cuisine intent as a strict-first filter",
      "Restaurant selection = restaurant lock",
      "One tool call per step",
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
