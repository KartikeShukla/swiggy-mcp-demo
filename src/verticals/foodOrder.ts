import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import foodOrderPrompt from "./prompts/foodorder.md?raw";

export const foodOrderVertical: VerticalConfig = {
  id: "foodorder",
  name: "FoodExpress",
  tabName: "Order",
  tagline: "AI food ordering assistant with restaurant delivery",
  description:
    "Discover restaurants, browse menus, build your order, and get food delivered — all through a natural conversation.",
  color: "foodorder",
  icon: "Bike",
  systemPrompt: buildSystemPrompt(foodOrderPrompt, { includeCodRule: true }),
  welcomeMessage:
    "Hey! I'm FoodExpress. Tell me what you're craving — a specific dish, cuisine, or restaurant — and I'll help you order food delivered to your door.",
  examplePrompts: [
    "I'm craving butter chicken, find nearby restaurants",
    "Show me top-rated biryani places in my area",
    "What are some good pizza options under 500 rupees?",
  ],
  mcpServer: MCP_SERVERS.food,
};
