export type VerticalId = "food" | "style" | "dining" | "foodorder";

export interface PromptSlotRule {
  key: string;
  prompt: string;
  required?: boolean;
  when?: string;
}

export interface PromptProfile {
  id: VerticalId;
  assistantName: string;
  mission: string;
  inScope: string[];
  outOfScope: string;
  slots: PromptSlotRule[];
  preToolRequirement: string;
  phaseFlow: string[];
  toolPolicies: string[];
  responseStyle: string[];
  confirmationRules: string[];
  fallbackRules: string[];
  includeCodRule?: boolean;
}
