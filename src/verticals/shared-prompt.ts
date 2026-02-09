/** Shared prompt fragments used across verticals to avoid redundancy. */

export const TOOL_ERROR_RULE = `## Tool Error Handling

When a tool call returns an error, follow these rules based on the error type:

1. **Authentication errors** (403, Forbidden, 401, Unauthorized, expired, access denied):
   - Do NOT retry. Tell the user their session expired and to click Reconnect. STOP.

2. **Server errors** (500, timeout, service unavailable):
   - Do NOT retry. Tell the user the service is temporarily down.

3. **Validation errors**:
   - Retry ONCE with simplified parameters (shorter query, fewer filters).
   - If retry also fails, explain and ask the user.

General: NEVER retry more than once. Be transparent about errors.`;

export const CARD_RENDERING_RULE = `IMPORTANT: When a tool call returns results, the UI AUTOMATICALLY renders interactive cards with all details (names, prices, images, quantities, ratings). Your text response MUST be ONLY a brief 1-sentence conversational acknowledgment. NEVER list item names, prices, descriptions, or details that the cards already display.`;

export const COD_CANCELLATION_RULE = `Remind users: orders are COD (Cash on Delivery) and CANNOT be cancelled once placed.`;

export function buildSystemPrompt(
  verticalPrompt: string,
  options: { includeCodRule: boolean } = { includeCodRule: false },
): string {
  const parts = [verticalPrompt, TOOL_ERROR_RULE, CARD_RENDERING_RULE];
  if (options.includeCodRule) {
    parts.push(COD_CANCELLATION_RULE);
  }
  return parts.join("\n");
}
