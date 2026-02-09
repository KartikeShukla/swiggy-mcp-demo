import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { stylePromptProfile } from "./prompt-spec/profiles";

export const styleVertical: VerticalConfig = {
  id: "style",
  name: "StyleBox",
  tabName: "Style",
  tagline: "Personal grooming advisor with product delivery",
  description:
    "Get expert skincare, haircare, and grooming advice — then order recommended products from Instamart instantly.",
  color: "style",
  icon: "Sparkles",
  systemPrompt: buildSystemPrompt(stylePromptProfile),
  promptProfileId: stylePromptProfile.id,
  welcomeMessage:
    "Hey! I'm StyleBox, your personal grooming advisor. Tell me what you need — skincare routine, haircare, grooming for an event, or anything style-related — and I'll find products on Instamart.",
  examplePrompts: [
    "Build me a morning skincare routine for oily skin",
    "I need grooming products for a wedding next week",
    "Recommend a complete beard care kit under 500 rupees",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
