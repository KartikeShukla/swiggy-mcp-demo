import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { diningPromptProfile } from "./prompt-spec/profiles";

export const diningVertical: VerticalConfig = {
  id: "dining",
  name: "TableScout",
  tabName: "Dine",
  description:
    "A dining concierge that finds restaurants matching your vibe, checks real-time availability on Dineout, and books your table.",
  color: "dining",
  icon: "UtensilsCrossed",
  systemPrompt: buildSystemPrompt(diningPromptProfile),
  promptProfileId: diningPromptProfile.id,
  welcomeMessage:
    "Planning a meal out? Tell me where you're headed, the vibe you want, your group size, and when. I'll find the right restaurants, check live table availability on Dineout, and book a slot — only after you confirm.",
  examplePrompts: [
    "I'm visiting Gurugram this weekend — find great lunch and dinner spots across two days",
    "Romantic Italian restaurant in Koramangala, Friday 8 PM, table for two — check what's available",
    "Birthday dinner for 8 people tonight — find places with a private dining vibe and open slots",
  ],
  mcpServer: MCP_SERVERS.dineout,
};
