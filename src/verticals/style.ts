import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { stylePromptProfile } from "./prompt-spec/profiles";

export const styleVertical: VerticalConfig = {
  id: "style",
  name: "StyleKit",
  tabName: "Style",
  description:
    "A personal grooming advisor that builds structured routines — morning, evening, weekly — and orders every product from Instamart.",
  color: "style",
  icon: "Sparkles",
  systemPrompt: buildSystemPrompt(stylePromptProfile),
  promptProfileId: stylePromptProfile.id,
  welcomeMessage:
    "What's your grooming goal — building a skincare routine, prepping for an event, or fixing a specific concern? I'll put together a structured routine with the right products and the reasoning behind each pick, then help you order everything from Instamart.",
  examplePrompts: [
    "Build me a full morning and evening skincare routine for oily, acne-prone skin",
    "I have a wedding in 5 days — put together a grooming prep plan",
    "My hair's been thinning — recommend a haircare routine and explain why each product helps",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
