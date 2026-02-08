import type { ParsedToolResult } from "@/lib/types";
import { MAX_STATUS_DETAILS } from "@/lib/constants";

export function tryParseStatus(payload: unknown): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;

  // Must have a success/status boolean or a message string
  const hasSuccess = typeof obj.success === "boolean";
  const hasStatus = typeof obj.status === "string" || typeof obj.status === "boolean";
  const hasMessage = typeof obj.message === "string" && obj.message.length > 0;

  if (!hasMessage && !hasSuccess && !hasStatus) return null;
  // Need at least a message or a success indicator
  if (!hasMessage && !hasSuccess) return null;

  const success = hasSuccess
    ? Boolean(obj.success)
    : hasStatus
      ? obj.status === true || obj.status === "success" || obj.status === "ok"
      : true;

  const message = (typeof obj.message === "string" && obj.message) ||
    (typeof obj.status === "string" && obj.status) ||
    (success ? "Operation completed successfully" : "Operation failed");

  // Collect remaining fields as details
  const details: Record<string, unknown> = {};
  let count = 0;
  for (const [k, v] of Object.entries(obj)) {
    if (k === "success" || k === "message" || k === "status") continue;
    if (v == null) continue;
    if (count >= MAX_STATUS_DETAILS) break;
    details[k] = v;
    count++;
  }

  return {
    type: "status",
    status: {
      success,
      message,
      details: count > 0 ? details : undefined,
    },
  };
}
