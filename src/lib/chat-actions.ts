import type { ChatAction } from "./types";

export function isSelectAddressAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "select_address" }> {
  return typeof action === "object" && action !== null && action.kind === "select_address";
}

export function getActionMessage(action: ChatAction): string {
  if (typeof action === "string") return action;
  if (action.kind === "text") return action.text;
  if (action.kind === "select_address") return action.message;
  return "";
}
