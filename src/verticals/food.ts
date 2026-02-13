import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodPromptProfile } from "./prompt-spec/profiles";

export const foodVertical: VerticalConfig = {
  id: "food",
  name: "NutriCart",
  tabName: "Nutrition",
  description:
    "A nutrition coach that plans your meals with macros, walks you through recipes, and orders every ingredient from Instamart.",
  color: "food",
  icon: "Salad",
  systemPrompt: buildSystemPrompt(foodPromptProfile),
  promptProfileId: foodPromptProfile.id,
  welcomeMessage:
    "Tell me your nutrition goals — a diet you're following, a calorie target, or a meal you want to prep. I'll design recipes with full macro breakdowns, walk you through the steps, and then find and order every ingredient from Instamart.",
  examplePrompts: [
    "I'm on a high-protein vegetarian diet, plan my meals for the week",
    "Give me a keto dinner recipe for two with a full macro breakdown",
    "I want to eat under 2000 calories today — plan all three meals and order the groceries",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
