import type { ParsedToolResult } from "@/lib/types";
import { MAX_STATUS_DETAILS } from "@/lib/constants";

function extractNestedErrorMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!(trimmed.startsWith("{") || trimmed.startsWith("["))) return null;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      const errorObj = parsed.error;
      if (
        errorObj &&
        typeof errorObj === "object" &&
        typeof (errorObj as Record<string, unknown>).message === "string"
      ) {
        return ((errorObj as Record<string, unknown>).message as string).trim();
      }
      if (typeof parsed.message === "string") {
        return (parsed.message as string).trim();
      }
    }
  } catch {
    return null;
  }
  return null;
}

function normalizeStatusMessage(message: string, success: boolean): string {
  const nested = extractNestedErrorMessage(message);
  const source = nested || message;
  const text = source.trim();
  if (!text) {
    return success ? "Operation completed successfully" : "Operation failed";
  }

  if (!success) {
    if (/(overload(?:ed)?|overloaded_error|rate[_\s-]?limit|exceed(?:ed|s)?)/i.test(text)) {
      return "Service is temporarily overloaded. Please retry in a moment.";
    }
    if (/(internal server error|service unavailable|timeout|gateway|api_error)/i.test(text)) {
      return "Service is temporarily unavailable. Please retry in a moment.";
    }
  }

  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

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

  const rawMessage = (typeof obj.message === "string" && obj.message) ||
    (typeof obj.status === "string" && obj.status) ||
    (success ? "Operation completed successfully" : "Operation failed");
  const message = normalizeStatusMessage(rawMessage, success);

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
