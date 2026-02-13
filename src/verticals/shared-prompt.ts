import {
  collectProfileRules,
  compilePromptProfile,
  findDuplicateInstructionLines,
} from "./prompt-spec/compiler";
import type { PromptProfile } from "./prompt-spec/types";

export const SEARCH_EFFICIENCY_RULE = [
  "Search Efficiency",
  "- One tool call per turn. Show results, then wait for user input.",
  "- Avoid duplicate searches unless user asks to compare.",
  "- Never batch multiple searches in one response.",
].join("\n");

export const RESULT_FILTERING_RULE = [
  "Card-First Rendering",
  "- UI cards already show rich details.",
  "- After tool calls, respond in 1-2 short sentences.",
  "- Do not repeat catalog fields already visible in cards.",
].join("\n");

export const TOOL_ERROR_RULE = [
  "Tool Error Handling",
  "- Auth errors (401/403/expired): stop and ask user to reconnect.",
  "- 5xx/timeout/unavailable: do not loop; ask user to retry shortly.",
  "- Validation: retry once with simpler params, then explain clearly.",
].join("\n");

export const LOCATION_LOCK_RULE = [
  "Location Lock",
  "- If a default address is provided in system context, treat it as active.",
  "- Do not call address/location tools unless user asks to change location or tool output requires it.",
].join("\n");

export const COD_CANCELLATION_RULE =
  "COD Notice: COD orders are non-cancellable after placement. Remind users before confirm.";

export const SHARED_PROMPT_RULES = [
  SEARCH_EFFICIENCY_RULE,
  RESULT_FILTERING_RULE,
  TOOL_ERROR_RULE,
  LOCATION_LOCK_RULE,
] as const;

export function lintPromptProfile(profile: PromptProfile): string[] {
  return findDuplicateInstructionLines([
    ...collectProfileRules(profile),
    ...SHARED_PROMPT_RULES,
  ]);
}

export function buildSystemPrompt(profile: PromptProfile): string {
  const parts = [compilePromptProfile(profile), ...SHARED_PROMPT_RULES];
  if (profile.includeCodRule) {
    parts.push(COD_CANCELLATION_RULE);
  }
  return parts.join("\n\n");
}
