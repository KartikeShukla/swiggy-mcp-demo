import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import diningPrompt from "./prompts/dining.md?raw";

export const diningVertical: VerticalConfig = {
  id: "dining",
  name: "TableScout",
  tabName: "Dine",
  tagline: "AI dining concierge with table bookings",
  description:
    "Discover restaurants, check availability, and book tables — your personal dining concierge powered by Dineout.",
  color: "dining",
  icon: "UtensilsCrossed",
  systemPrompt: buildSystemPrompt(diningPrompt),
  welcomeMessage:
    "Welcome to TableScout! Tell me what you're looking for — cuisine, occasion, location, group size — and I'll find the perfect restaurant and book a table.",
  examplePrompts: [
    "Find a romantic Italian restaurant in Koramangala for tonight",
    "Best rated places for a birthday dinner, group of 8, in South Bangalore",
    "Any good rooftop restaurants with weekend offers?",
  ],
  mcpServer: MCP_SERVERS.dineout,
};
