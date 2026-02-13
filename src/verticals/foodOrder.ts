import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { foodOrderPromptProfile } from "./prompt-spec/profiles";

export const foodOrderVertical: VerticalConfig = {
  id: "foodorder",
  name: "FeedMe",
  tabName: "Order",
  description:
    "Go from a craving to a delivered meal — finds restaurants nearby, dives into their menu, builds your cart, and places the order for delivery.",
  color: "foodorder",
  icon: "Bike",
  systemPrompt: buildSystemPrompt(foodOrderPromptProfile),
  promptProfileId: foodOrderPromptProfile.id,
  welcomeMessage:
    "Name a dish, cuisine, or vibe — I'll find restaurants, show you the menu, and get your order delivered.",
  examplePrompts: [
    "I'm craving butter chicken — find the best-rated places nearby",
    "I want to order pizza for 4 people, keep it under ₹1500",
    "Surprise me — something South Indian and spicy, whatever's highly rated around me",
  ],
  mcpServer: MCP_SERVERS.food,
};
