import type { ParserIntentHint, ToolRenderContext } from "@/lib/types";
import { extractFoodorderConstraints, shouldAllowBroadening } from "./foodorder";

const MENU_RE = /\b(menu|dish|item|dosa|idli|pizza|biryani|burger)\b/i;
const CART_RE = /\b(cart|basket|add|remove|quantity)\b/i;
const CONFIRM_RE = /\b(confirm|go ahead|place order|checkout|book it)\b/i;

function inferMode(query: string): ParserIntentHint {
  if (!query) return "discover";
  if (CONFIRM_RE.test(query)) return "confirm";
  if (CART_RE.test(query)) return "cart";
  if (MENU_RE.test(query)) return "menu";
  return "discover";
}

export function buildToolRenderContext(
  verticalId: string,
  latestUserQuery?: string,
  lockedRestaurant?: string | null,
): ToolRenderContext {
  const query = latestUserQuery ?? "";
  const context: ToolRenderContext = {
    verticalId,
    latestUserQuery: query,
    lockedRestaurant: lockedRestaurant ?? null,
    mode: inferMode(query),
    debug: Boolean(import.meta.env.DEV),
  };

  if (verticalId === "foodorder") {
    context.strictConstraints = extractFoodorderConstraints(query);
    context.allowConstraintBroadening = shouldAllowBroadening(query);
  }

  return context;
}
