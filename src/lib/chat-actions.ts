import type { ChatAction } from "./types";

export function isSelectAddressAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "select_address" }> {
  return typeof action === "object" && action !== null && action.kind === "select_address";
}

export function isCartAddSelectionAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "cart_add_selection" }> {
  return typeof action === "object" && action !== null && action.kind === "cart_add_selection";
}

export function isCartUpdateItemAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "cart_update_item" }> {
  return typeof action === "object" && action !== null && action.kind === "cart_update_item";
}

export function isRestaurantSelectAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "restaurant_select" }> {
  return typeof action === "object" && action !== null && action.kind === "restaurant_select";
}

export function isSlotSelectAction(
  action: ChatAction,
): action is Extract<ChatAction, { kind: "slot_select" }> {
  return typeof action === "object" && action !== null && action.kind === "slot_select";
}

export function getActionMessage(action: ChatAction): string {
  if (typeof action === "string") return action;
  if (action.kind === "text") return action.text;
  if (action.kind === "select_address") return action.message;
  if (action.kind === "cart_add_selection") return action.message;
  if (action.kind === "cart_update_item") return action.message;
  if (action.kind === "restaurant_select") return action.message;
  if (action.kind === "slot_select") return action.message;
  return "";
}
