import { runMessageStream } from "@/integrations/anthropic/stream-runner";
import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { createClient } from "@/lib/anthropic";
import { logger } from "@/lib/logger";
import type { ChatMessage, ParsedAddress } from "@/lib/types";
import { verticals } from "@/verticals";
import { isInstamartSwitchVerticalId } from "@/lib/cart/tab-switch-state";

interface TriggerRemoteClearArgs {
  verticalId: string;
  apiKey: string | null;
  swiggyToken: string | null;
  selectedAddress?: ParsedAddress | null;
}

/**
 * Best-effort cart-clear call used during Nutrition/Style tab switches.
 * This is intentionally fire-and-forget from the UI flow and should never throw.
 */
export async function triggerBestEffortInstamartCartClear(
  args: TriggerRemoteClearArgs,
): Promise<void> {
  const { verticalId, apiKey, swiggyToken, selectedAddress } = args;
  if (!isInstamartSwitchVerticalId(verticalId)) return;
  if (!apiKey || !swiggyToken) return;

  const vertical = verticals[verticalId];
  if (!vertical) return;

  const clearCartMessage: ChatMessage = {
    role: "user",
    content: [
      "Clear my Instamart cart completely.",
      "Remove all current items from cart and return the updated cart snapshot.",
      "Do not add items or run product discovery tools.",
    ].join(" "),
    timestamp: Date.now(),
  };

  try {
    const client = createClient(apiKey);
    const params = buildMessageStreamParams(
      [clearCartMessage],
      vertical,
      swiggyToken,
      selectedAddress,
      null,
    );
    await runMessageStream(client, params);
    logger.debug("[Tab Switch] Background cart clear completed", {
      verticalId,
    });
  } catch (error) {
    logger.warn("[Tab Switch] Background cart clear failed", {
      verticalId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
