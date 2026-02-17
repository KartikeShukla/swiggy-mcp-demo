import { findLatestCartState } from "@/lib/cart/latest-cart";
import { getChatHistory } from "@/lib/storage";

export const INSTAMART_SWITCH_VERTICALS = ["food", "style"] as const;

export type InstamartSwitchVerticalId = (typeof INSTAMART_SWITCH_VERTICALS)[number];

export function isInstamartSwitchVerticalId(
  verticalId: string,
): verticalId is InstamartSwitchVerticalId {
  return INSTAMART_SWITCH_VERTICALS.includes(verticalId as InstamartSwitchVerticalId);
}

export function isInstamartCrossTabSwitch(from: string, to: string): boolean {
  if (from === to) return false;
  return isInstamartSwitchVerticalId(from) && isInstamartSwitchVerticalId(to);
}

export function hasClearableInstamartState(verticalId: string): boolean {
  if (!isInstamartSwitchVerticalId(verticalId)) return false;

  const history = getChatHistory(verticalId);
  const latestCart = findLatestCartState(history, verticalId);
  const cartItems = latestCart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return history.length > 0 || cartItems > 0;
}
