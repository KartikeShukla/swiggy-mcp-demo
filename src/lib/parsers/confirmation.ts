import type { ParsedToolResult } from "@/lib/types";
import { str } from "./primitives";

export function tryParseConfirmation(payload: unknown, toolName: string): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null) return null;
  const obj = payload as Record<string, unknown>;

  // Check for order placement
  if (/order|place|checkout|submit/i.test(toolName)) {
    return {
      type: "order_placed",
      orderId: str(obj.order_id) || str(obj.orderId) || str(obj.id),
      status: str(obj.status) || str(obj.message) || "Order placed",
    };
  }

  // Check for booking confirmation
  if (/book|reserve/i.test(toolName)) {
    return {
      type: "booking_confirmed",
      details: obj as Record<string, unknown>,
    };
  }

  return null;
}
