import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodPromptProfile } from "./prompt-spec/profiles";

export const foodVertical: VerticalConfig = {
  id: "food",
  name: "NutriCart",
  tabName: "Nutrition",
  tagline: "AI nutrition assistant with instant grocery delivery",
  description:
    "Get personalized meal plans, recipes with macros, and order ingredients from Instamart — all in one conversation.",
  color: "food",
  icon: "Salad",
  systemPrompt: buildSystemPrompt(foodPromptProfile),
  promptProfileId: foodPromptProfile.id,
  welcomeMessage:
    "Hi! I'm NutriCart. Tell me your nutrition goals — meal prep, a specific diet, or just eating healthier — and I'll plan meals and order ingredients from Instamart.",
  examplePrompts: [
    "Plan a high-protein vegetarian meal prep for the week",
    "I need ingredients for a keto dinner for two",
    "Help me build a 2000-calorie balanced meal plan",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
