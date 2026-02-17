import type { ParserIntentHint, ToolRenderContext } from "@/lib/types";
import { extractDiningConstraints, shouldAllowDiningBroadening } from "./dining";
import { extractFoodorderConstraints, shouldAllowBroadening } from "./foodorder";
import { detectParserIntent } from "@/lib/intent/runtime-signals";

function inferMode(query: string, verticalId: string): ParserIntentHint {
  if (!query) return "discover";
  return detectParserIntent(query, verticalId);
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
    mode: inferMode(query, verticalId),
    debug: Boolean(import.meta.env.DEV),
  };

  if (verticalId === "foodorder") {
    context.strictConstraints = extractFoodorderConstraints(query);
    context.allowConstraintBroadening = shouldAllowBroadening(query);
  }

  if (verticalId === "dining") {
    context.strictConstraints = extractDiningConstraints(query);
    context.allowConstraintBroadening = shouldAllowDiningBroadening(query);
  }

  return context;
}
