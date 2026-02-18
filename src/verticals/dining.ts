import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { diningPromptProfile } from "./prompt-spec/profiles";

export const diningVertical: VerticalConfig = {
  id: "dining",
  name: "TableScout",
  tabName: "Dine",
  description:
    "A dining concierge that finds restaurants matching your mood and cuisine, checks real-time table availability on Dineout, and helps you reserve a spot.",
  color: "dining",
  icon: "UtensilsCrossed",
  systemPrompt: buildSystemPrompt(diningPromptProfile),
  promptProfileId: diningPromptProfile.id,
  welcomeMessage:
    "Tell me the cuisine, group size, and when. I'll find restaurants with open tables on Dineout so you can pick and book.",
  examplePrompts: [
    "I'm visiting Gurugram this weekend — find great lunch and dinner spots across two days",
    "Romantic Italian restaurant in Koramangala, Friday 8 PM, table for two — check what's available",
    "Birthday dinner for 8 people tonight — find places with a private dining vibe and open slots",
  ],
  mcpServer: MCP_SERVERS.dineout,
};
