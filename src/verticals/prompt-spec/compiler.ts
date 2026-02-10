import type { PromptProfile, PromptSlotRule } from "./types";

function normalizeRule(rule: string): string {
  return rule
    .trim()
    .toLowerCase()
    .replace(/[`*_]/g, "")
    .replace(/[\s]+/g, " ");
}

export function findDuplicateInstructionLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const line of lines) {
    const normalized = normalizeRule(line);
    if (!normalized) continue;
    if (seen.has(normalized)) {
      duplicates.add(normalized);
      continue;
    }
    seen.add(normalized);
  }

  return [...duplicates];
}

function formatSlotRule(rule: PromptSlotRule): string {
  const tags: string[] = [];
  if (!rule.required) tags.push("optional");
  if (rule.when) tags.push(rule.when);
  if (tags.length === 0) return `- ${rule.key}: ${rule.prompt}`;
  return `- ${rule.key}: ${rule.prompt} [${tags.join("; ")}]`;
}

export function collectProfileRules(profile: PromptProfile): string[] {
  return [
    profile.mission,
    ...profile.inScope,
    profile.outOfScope,
    ...profile.slots.map((rule) => formatSlotRule(rule)),
    profile.preToolRequirement,
    ...profile.phaseFlow,
    ...profile.toolPolicies,
    ...profile.responseStyle,
    ...profile.confirmationRules,
    ...profile.fallbackRules,
  ];
}

export function compilePromptProfile(profile: PromptProfile): string {
  const sections: string[] = [];

  sections.push(`You are ${profile.assistantName}. ${profile.mission}`);

  sections.push(
    [
      "Scope",
      ...profile.inScope.map((line) => `- ${line}`),
      `- ${profile.outOfScope}`,
    ].join("\n"),
  );

  sections.push(
    [
      "Slots To Collect",
      ...profile.slots.map((rule) => formatSlotRule(rule)),
      `- ${profile.preToolRequirement}`,
    ].join("\n"),
  );

  sections.push(
    ["Execution Phases", ...profile.phaseFlow.map((line, index) => `${index + 1}. ${line}`)].join(
      "\n",
    ),
  );

  sections.push(
    ["Tool Policy", ...profile.toolPolicies.map((line) => `- ${line}`)].join("\n"),
  );

  sections.push(
    ["Response Style", ...profile.responseStyle.map((line) => `- ${line}`)].join("\n"),
  );

  sections.push(
    ["Confirmation", ...profile.confirmationRules.map((line) => `- ${line}`)].join(
      "\n",
    ),
  );

  sections.push(
    ["Fallbacks", ...profile.fallbackRules.map((line) => `- ${line}`)].join("\n"),
  );

  return sections.join("\n\n");
}
