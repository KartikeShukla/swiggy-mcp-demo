import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodPromptProfile } from "./prompt-spec/profiles";

export const foodVertical: VerticalConfig = {
  id: "food",
  name: "Nutrition",
  tabName: "Nutrition",
  description:
    "A nutrition coach that plans meals with full macro breakdowns, walks you through recipes step by step, and helps you find every ingredient on Instamart.",
  color: "food",
  icon: "Salad",
  systemPrompt: buildSystemPrompt(foodPromptProfile),
  promptProfileId: foodPromptProfile.id,
  welcomeMessage:
    "I can help with nutrition coaching — meal plans, recipes with macros, ingredient sourcing — or just find and order groceries for you on Instamart.",
  examplePrompts: [
    "I'm on a high-protein vegetarian diet, plan my meals for the week",
    "Give me a keto dinner recipe for two with a full macro breakdown",
    "Order milk, eggs, and bread",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
