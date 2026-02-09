export type VerticalId = "food" | "style" | "dining" | "foodorder";

export interface PromptContextRule {
  key: string;
  requirement: string;
  optional?: boolean;
  condition?: string;
}

export interface PromptProfile {
  id: VerticalId;
  assistantName: string;
  intro: string;
  scope: string[];
  declinePolicy: string;
  contextRules: PromptContextRule[];
  contextMinimum: string;
  workflow: string[];
  resultPolicy: string[];
  safetyRules: string[];
  includeCodRule?: boolean;
}
