import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { diningPromptProfile } from "./prompt-spec/profiles";

export const diningVertical: VerticalConfig = {
  id: "dining",
  name: "TableScout",
  tabName: "Dine",
  tagline: "Travel-aware dining concierge with table bookings",
  description:
    "Find great places across your itinerary, check live availability, and book tables through Dineout.",
  color: "dining",
  icon: "UtensilsCrossed",
  systemPrompt: buildSystemPrompt(diningPromptProfile),
  promptProfileId: diningPromptProfile.id,
  welcomeMessage:
    "Welcome to TableScout. Share your city plan, cuisine mood, location, and group size, and I'll find the right places and book a slot.",
  examplePrompts: [
    "I am visiting Gurugram this weekend, suggest lunch spots near Cyber Hub",
    "Find a romantic Italian restaurant in Koramangala for tonight",
    "Best places for a birthday dinner, group of 8, with table availability",
  ],
  mcpServer: MCP_SERVERS.dineout,
};
