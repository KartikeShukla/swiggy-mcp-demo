import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { diningPromptProfile } from "./prompt-spec/profiles";

export const diningVertical: VerticalConfig = {
  id: "dining",
  name: "TableScout",
  tabName: "Dine",
  description:
    "Your AI dining concierge — finds restaurants matching your vibe and cuisine, checks real-time table availability on Dineout, and books your spot.",
  color: "dining",
  icon: "UtensilsCrossed",
  systemPrompt: buildSystemPrompt(diningPromptProfile),
  promptProfileId: diningPromptProfile.id,
  welcomeMessage:
    "Tell me the vibe, cuisine, group size, and when — I'll find restaurants and book a table on Dineout.",
  examplePrompts: [
    "I'm visiting Gurugram this weekend — find great lunch and dinner spots across two days",
    "Romantic Italian restaurant in Koramangala, Friday 8 PM, table for two — check what's available",
    "Birthday dinner for 8 people tonight — find places with a private dining vibe and open slots",
  ],
  mcpServer: MCP_SERVERS.dineout,
};
