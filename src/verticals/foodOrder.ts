import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodOrderPromptProfile } from "./prompt-spec/profiles";

export const foodOrderVertical: VerticalConfig = {
  id: "foodorder",
  name: "FeedMe",
  tabName: "Food",
  description:
    "Go from a craving to a delivered meal. Discovers restaurants nearby, explores their menus, and helps you build your cart and place an order.",
  color: "foodorder",
  icon: "Bike",
  systemPrompt: buildSystemPrompt(foodOrderPromptProfile),
  promptProfileId: foodOrderPromptProfile.id,
  welcomeMessage:
    "Name a dish, cuisine, or mood. I'll find restaurants nearby and show you menus so you can pick what you want.",
  examplePrompts: [
    "I'm craving butter chicken — find the best-rated places nearby",
    "I want to order pizza for 4 people, keep it under ₹1500",
    "Surprise me — something South Indian and spicy, whatever's highly rated around me",
  ],
  mcpServer: MCP_SERVERS.food,
};
