import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodPromptProfile } from "./prompt-spec/profiles";

export const foodVertical: VerticalConfig = {
  id: "food",
  name: "NutriCart",
  tabName: "Nutrition",
  description:
    "An AI nutrition coach that plans meals with full macro breakdowns, walks you through recipes step by step, and helps you find every ingredient on Instamart.",
  color: "food",
  icon: "Salad",
  systemPrompt: buildSystemPrompt(foodPromptProfile),
  promptProfileId: foodPromptProfile.id,
  welcomeMessage:
    "Tell me your nutrition goals, a diet you follow, or a meal to prep. I'll plan recipes with macros and help you find ingredients on Instamart.",
  examplePrompts: [
    "I'm on a high-protein vegetarian diet, plan my meals for the week",
    "Give me a keto dinner recipe for two with a full macro breakdown",
    "I want to eat under 2000 calories today — plan all three meals and order the groceries",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
