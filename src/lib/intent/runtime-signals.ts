import type { ParserIntentHint } from "@/lib/types";

export type LoadingContext =
  | "generic"
  | "cart"
  | "menu"
  | "restaurant"
  | "slots"
  | "booking"
  | "address"
  | "auth"
  | "nutrition"
  | "style"
  | "grooming"
  | "order";

const ADDRESS_RE = /\b(address|location|deliver|delivery|sector|city|area|pin)\b/i;
const AUTH_RE = /\b(connect|oauth|token|login|signin|auth|swiggy)\b/i;
const GENERIC_CART_RE = /\b(cart|basket|add|remove|quantity|checkout)\b/i;
const EXPLICIT_CART_RE = /\b(cart|basket|checkout|quantity)\b|\b(add\b.*\bto\b.*\bcart)\b|\b(remove\b.*\bfrom\b.*\bcart)\b|\b(change|update|increase|decrease)\b.*\bquantity\b/i;
const SLOTS_RE = /\b(slot|time|timeslot|availability|available)\b/i;
const BOOKING_RE = /\b(book|booking|reservation|reserve|table)\b/i;
const RESTAURANT_RE = /\b(restaurant|dine|dining|cafe|nearby)\b/i;
const ORDER_RE = /\b(order|pay|payment|track)\b/i;
const MENU_RE = /\b(menu|item|dish|pizza|biryani|burger|meal|cuisine)\b/i;
const NUTRITION_RE = /\b(calorie|protein|macro|nutrition|diet|keto|vegan|meal prep)\b/i;
const STYLE_RE = /\b(outfit|style|look|dress|shirt|jeans|fashion)\b/i;
const GROOMING_RE = /\b(groom|skincare|hair|beard|serum|cleanser)\b/i;

const CONFIRM_RE = /\b(confirm|go ahead|place (it|order)|book (it|table)|checkout|yes do it)\b/i;
const MENU_INTENT_RE = /\b(menu|dish|item|open menu|show menu|menu at)\b/i;
const AVAILABILITY_RE = /\b(slot|availability|available|time slot|timeslot|check availability)\b/i;

export function detectLoadingContext(text: string, verticalId: string): LoadingContext {
  const input = text.toLowerCase();

  if (ADDRESS_RE.test(input)) return "address";
  if (AUTH_RE.test(input)) return "auth";
  if (
    (
      verticalId === "food" || verticalId === "style"
    )
      ? EXPLICIT_CART_RE.test(input)
      : GENERIC_CART_RE.test(input)
  ) return "cart";
  if (SLOTS_RE.test(input)) return "slots";
  if (BOOKING_RE.test(input)) return "booking";
  if (RESTAURANT_RE.test(input)) return "restaurant";
  if (ORDER_RE.test(input)) return "order";
  if (MENU_RE.test(input)) return "menu";
  if (NUTRITION_RE.test(input)) return "nutrition";
  if (STYLE_RE.test(input)) return "style";
  if (GROOMING_RE.test(input)) return "grooming";

  if (verticalId === "food") return "nutrition";
  if (verticalId === "style") return "style";
  if (verticalId === "dining") return "restaurant";
  if (verticalId === "foodorder") return "menu";

  return "generic";
}

export function detectParserIntent(text: string, verticalId: string): ParserIntentHint {
  const query = text.toLowerCase();

  if (CONFIRM_RE.test(query)) return "confirm";
  if (
    (
      verticalId === "food" || verticalId === "style"
    )
      ? EXPLICIT_CART_RE.test(query)
      : GENERIC_CART_RE.test(query)
  ) return "cart";
  if (verticalId === "foodorder" && MENU_INTENT_RE.test(query)) return "menu";
  if (verticalId === "dining" && AVAILABILITY_RE.test(query)) return "availability";

  return "discover";
}
