import type { McpErrorCategory } from "@/lib/types";

/** Extract searchable text from an MCP tool result content field. */
function extractMcpErrorText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter(
        (item): item is { type: "text"; text: string } =>
          item?.type === "text" && typeof item.text === "string",
      )
      .map((item) => item.text)
      .join(" ");
  }
  if (content && typeof content === "object") {
    try {
      return JSON.stringify(content);
    } catch {
      return "";
    }
  }
  return "";
}

/** Classify an MCP tool error into auth / server / validation. */
export function classifyMcpError(content: unknown): McpErrorCategory {
  const text = extractMcpErrorText(content).toLowerCase();

  const addressPatterns = [
    "address with id",
    "address not found",
    "invalid address",
    "delivery address",
  ];
  if (addressPatterns.some((p) => text.includes(p))) return "address";

  const authPatterns = [
    "403",
    "401",
    "forbidden",
    "unauthorized",
    "expired",
    "access denied",
    "invalid token",
    "not authenticated",
  ];
  if (authPatterns.some((p) => text.includes(p))) return "auth";

  const serverPatterns = [
    "500",
    "502",
    "503",
    "504",
    "529",
    "overload",
    "overloaded_error",
    "internal server error",
    "service unavailable",
    "timeout",
    "gateway",
  ];
  if (serverPatterns.some((p) => text.includes(p))) return "server";

  return "validation";
}

export const ABORT_MESSAGES: Record<McpErrorCategory, string> = {
  auth: "Your Swiggy session has expired. Please click **Reconnect** at the top of the page to log in again, then retry your request.",
  server:
    "The Swiggy service is temporarily unavailable. Please try again in a moment.",
  validation:
    "I encountered repeated errors from the service and stopped retrying. Please try a different request — for example, different search terms or options.",
  address:
    "Your saved location seems invalid for Swiggy right now. Please open **Settings → Change location**, pick a valid address, and retry.",
};
