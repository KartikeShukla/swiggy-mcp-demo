import {
  extractRetryAfterMs,
  extractWrappedMcpHttpStatus,
  isWrappedMcpConnectionError,
} from "./retry-policy";

export interface ApiError {
  status?: number;
  message: string;
  retryAfterMs?: number;
}

function formatRateLimitMessage(err: unknown): ApiError {
  const retryAfterMs = extractRetryAfterMs(err) ?? 15_000;
  const waitSeconds = Math.ceil(retryAfterMs / 1000);
  return {
    status: 429,
    message: `Rate limited — try again in ${waitSeconds}s`,
    retryAfterMs,
  };
}

interface ErrorRule {
  match: (status: number | undefined, msg: string, wrappedMcpStatus: number | null, isWrappedMcp: boolean) => boolean;
  classify: (err: unknown) => ApiError;
}

/**
 * Ordered rule table for API error classification.  Rules are evaluated
 * top-to-bottom; the **first match wins**.
 *
 * Priority tiers (in evaluation order):
 * 1. Wrapped MCP errors — Swiggy-side failures surfaced through the
 *    Anthropic MCP bridge (auth 401/403, rate-limit 429, generic).
 * 2. Direct HTTP status codes — Anthropic API responses (403, 401, 429,
 *    529, 500).
 * 3. Message-based heuristics — substring and regex matches on the error
 *    message text for cases where the status code is absent.
 * 4. Network errors — "Failed to fetch", "NetworkError", "net::".
 *
 * Wrapped MCP rules are checked first because an MCP 401 arrives as an
 * Anthropic 400 and would otherwise be misclassified.
 */
const ERROR_RULES: ErrorRule[] = [
  // Wrapped MCP auth errors (401/403 from Swiggy)
  {
    match: (_s, _m, wms, isMcp) => isMcp && (wms === 401 || wms === 403),
    classify: () => ({
      status: 403,
      message: "Your Swiggy session has expired. Please reconnect.",
    }),
  },
  // Wrapped MCP rate limit (429 from Swiggy)
  {
    match: (_s, _m, wms, isMcp) => isMcp && wms === 429,
    classify: (err) => formatRateLimitMessage(err),
  },
  // Wrapped MCP generic connection error
  {
    match: (_s, _m, _wms, isMcp) => isMcp,
    classify: () => ({
      status: 529,
      message: "Swiggy service is temporarily unavailable. Please try again in a moment.",
    }),
  },
  // Direct Anthropic 403
  {
    match: (s) => s === 403,
    classify: () => ({
      status: 403,
      message: "Your Swiggy session has expired. Please reconnect.",
    }),
  },
  // Direct Anthropic 401
  {
    match: (s) => s === 401,
    classify: () => ({
      status: 401,
      message: "Invalid API key. Please check your Anthropic API key.",
    }),
  },
  // Direct Anthropic 429
  {
    match: (s) => s === 429,
    classify: (err) => formatRateLimitMessage(err),
  },
  // Direct Anthropic 529 (overloaded)
  {
    match: (s) => s === 529,
    classify: () => ({
      status: 529,
      message: "Service is temporarily overloaded. Please try again in a moment.",
    }),
  },
  // Direct Anthropic 500
  {
    match: (s) => s === 500,
    classify: () => ({ status: 500, message: "Server error. Please try again later." }),
  },
  // Message-based: 403 or Forbidden in text
  {
    match: (_s, msg) => msg.includes("403") || msg.includes("Forbidden"),
    classify: () => ({
      status: 403,
      message: "Your Swiggy session has expired. Please reconnect.",
    }),
  },
  // Message-based: 401 in text
  {
    match: (_s, msg) => msg.includes("401"),
    classify: () => ({
      status: 401,
      message: "Invalid API key. Please check your Anthropic API key.",
    }),
  },
  // Message-based: 429 in text or rate limit language
  {
    match: (_s, msg) => msg.includes("429") || /(rate[_\s-]?limit|exceed(?:ed|s)?)/i.test(msg),
    classify: (err) => formatRateLimitMessage(err),
  },
  // Message-based: overload/capacity
  {
    match: (_s, msg) =>
      /(overload(?:ed)?|overloaded_error|capacity|temporarily unavailable|internal server error|api_error)/i.test(msg),
    classify: () => ({
      status: 529,
      message: "Service is temporarily overloaded. Please try again in a moment.",
    }),
  },
  // Network errors
  {
    match: (_s, msg) =>
      msg.includes("Failed to fetch") ||
      msg.includes("NetworkError") ||
      msg.includes("net::"),
    classify: () => ({
      message: "Network error. Please check your connection and try again.",
    }),
  },
];

/**
 * Classifies an unknown error into a structured `ApiError` with a
 * user-friendly message and optional HTTP status.
 *
 * For `Error` instances, the function extracts the HTTP status (if
 * present), checks for wrapped MCP connection errors and their inner
 * HTTP status, then runs the error through `ERROR_RULES` (first match
 * wins).  If no rule matches, the raw error message is returned,
 * truncated to 200 characters for safety.
 *
 * Non-Error values produce a generic "Something went wrong" message.
 */
export function classifyApiError(err: unknown): ApiError {
  if (err instanceof Error) {
    const msg = err.message;
    const status = "status" in err ? (err as { status: number }).status : undefined;
    const wrappedMcpStatus = extractWrappedMcpHttpStatus(err);
    const isWrappedMcp = isWrappedMcpConnectionError(err);

    for (const rule of ERROR_RULES) {
      if (rule.match(status, msg, wrappedMcpStatus, isWrappedMcp)) {
        return rule.classify(err);
      }
    }

    const MAX_ERROR_LENGTH = 200;
    const safeMsg = msg.length > MAX_ERROR_LENGTH
      ? msg.slice(0, MAX_ERROR_LENGTH) + "…"
      : msg;
    return { message: safeMsg };
  }
  return { message: "Something went wrong" };
}
