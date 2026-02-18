import type { VerticalConfig } from "@/lib/types";
import { MCP_SERVERS } from "@/lib/constants";
import { buildSystemPrompt } from "./shared-prompt";
import { stylePromptProfile } from "./prompt-spec/profiles";

export const styleVertical: VerticalConfig = {
  id: "style",
  name: "Styling",
  tabName: "Styling",
  description:
    "A grooming advisor that builds structured skincare and haircare routines for morning, evening, and weekly care, and helps you shop the right products on Instamart.",
  color: "style",
  icon: "Sparkles",
  systemPrompt: buildSystemPrompt(stylePromptProfile),
  promptProfileId: stylePromptProfile.id,
  welcomeMessage:
    "I can build a personalized skincare or haircare routine, or just help you find and order grooming products on Instamart.",
  examplePrompts: [
    "Build me a morning and evening skincare routine for oily, acne-prone skin",
    "I have a wedding in 5 days — put together a grooming prep plan",
    "Order a good sunscreen and a vitamin C serum",
  ],
  mcpServer: MCP_SERVERS.instamart,
};
