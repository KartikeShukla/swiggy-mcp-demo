import type { PromptContextRule, PromptProfile } from "./types";

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

function formatContextRule(rule: PromptContextRule): string {
  const tags: string[] = [];
  if (rule.optional) tags.push("optional");
  if (rule.condition) tags.push(rule.condition);
  if (tags.length === 0) return `- ${rule.key}: ${rule.requirement}`;
  return `- ${rule.key}: ${rule.requirement} [${tags.join("; ")}]`;
}

export function collectProfileRules(profile: PromptProfile): string[] {
  return [
    ...profile.scope,
    profile.declinePolicy,
    ...profile.contextRules.map((rule) => formatContextRule(rule)),
    profile.contextMinimum,
    ...profile.workflow,
    ...profile.resultPolicy,
    ...profile.safetyRules,
  ];
}

export function compilePromptProfile(profile: PromptProfile): string {
  const sections: string[] = [];

  sections.push(`You are ${profile.assistantName}. ${profile.intro}`);

  sections.push(
    [
      "Scope:",
      ...profile.scope.map((line) => `- ${line}`),
      `- ${profile.declinePolicy}`,
    ].join("\n"),
  );

  sections.push(
    [
      "Context Before Tool Calls:",
      ...profile.contextRules.map((rule) => formatContextRule(rule)),
      `- ${profile.contextMinimum}`,
    ].join("\n"),
  );

  sections.push(
    ["Workflow:", ...profile.workflow.map((line, index) => `${index + 1}. ${line}`)].join(
      "\n",
    ),
  );

  sections.push(
    ["Result Policy:", ...profile.resultPolicy.map((line) => `- ${line}`)].join("\n"),
  );

  sections.push(
    ["Safety:", ...profile.safetyRules.map((line) => `- ${line}`)].join("\n"),
  );

  return sections.join("\n\n");
}
