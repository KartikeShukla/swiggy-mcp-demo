import {
  collectProfileRules,
  compilePromptProfile,
  findDuplicateInstructionLines,
} from "./prompt-spec/compiler";
import type { PromptProfile } from "./prompt-spec/types";

/** Compact shared prompt rules applied to every vertical. */
export const SEARCH_EFFICIENCY_RULE = `Search Efficiency:\n- Use specific terms.\n- Make one targeted search per user intent.\n- Do not run overlapping retries when first results are usable.\n- Use at most 3 tool calls per user message unless user explicitly asks for more.`;

export const RESULT_FILTERING_RULE = `Result Filtering:\n- The UI already renders full cards.\n- Mention count and relevance only.\n- Do not list item-level catalog details in text.`;

export const TOOL_ERROR_RULE = `Tool Error Handling:\n- Auth errors (401/403/expired): do not retry; ask user to reconnect.\n- Server errors (5xx/timeout/unavailable): do not retry; ask user to try again shortly.\n- Validation errors: retry once with simpler parameters, then explain and ask.`;

export const CARD_RENDERING_RULE = `Card Rendering:\n- Cards are interactive and carry detailed data.\n- After tool results, keep response to 1-2 short sentences.\n- Do not duplicate details already visible in cards.`;

export const COD_CANCELLATION_RULE =
  "Remind users: orders are COD (Cash on Delivery) and cannot be cancelled once placed.";

export const SHARED_PROMPT_RULES = [
  SEARCH_EFFICIENCY_RULE,
  RESULT_FILTERING_RULE,
  TOOL_ERROR_RULE,
  CARD_RENDERING_RULE,
] as const;

/** Returns normalized duplicate rule lines for CI guardrails. */
export function lintPromptProfile(profile: PromptProfile): string[] {
  return findDuplicateInstructionLines([
    ...collectProfileRules(profile),
    ...SHARED_PROMPT_RULES,
  ]);
}

/** Build final system prompt from profile + compact shared rules. */
export function buildSystemPrompt(profile: PromptProfile): string {
  const parts = [compilePromptProfile(profile), ...SHARED_PROMPT_RULES];
  if (profile.includeCodRule) {
    parts.push(COD_CANCELLATION_RULE);
  }
  return parts.join("\n\n");
}
