import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { stylePromptProfile } from "./prompt-spec/profiles";

export const styleVertical: VerticalConfig = {
  id: "style",
  name: "StyleKit",
  tabName: "Style",
  description:
    "An AI grooming advisor that builds structured skincare and haircare routines for morning, evening, and weekly care, and helps you shop the right products on Instamart.",
  color: "style",
  icon: "Sparkles",
  systemPrompt: buildSystemPrompt(stylePromptProfile),
  promptProfileId: stylePromptProfile.id,
  welcomeMessage:
    "Share your grooming goal or concern. I'll recommend a routine with the right products and help you find them on Instamart.",
  examplePrompts: [
    "Build me a full morning and evening skincare routine for oily, acne-prone skin",
    "I have a wedding in 5 days — put together a grooming prep plan",
    "My hair's been thinning — recommend a haircare routine and explain why each product helps",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
