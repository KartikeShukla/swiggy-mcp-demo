const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504, 529]);

function extractStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const status = (err as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

function extractMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "";
  }
}

export function isRateLimitError(err: unknown): boolean {
  const status = extractStatus(err);
  if (status === 429) return true;
  const msg = extractMessage(err).toLowerCase();
  return /rate[_\s-]?limit/.test(msg);
}

export function extractRetryAfterMs(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const headers = (err as { headers?: Record<string, string> }).headers;
  if (!headers) return null;
  const value = headers["retry-after"];
  if (!value) return null;
  const seconds = Number.parseFloat(value);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : null;
}

export function isRetryableAnthropicError(err: unknown): boolean {
  const status = extractStatus(err);
  if (status && RETRYABLE_STATUSES.has(status)) return true;

  const msg = extractMessage(err).toLowerCase();
  return /overload(?:ed)?|overloaded_error|temporarily unavailable|internal server error|timeout|gateway|rate[_\s-]?limit/.test(
    msg,
  );
}

export interface RateLimitInfo {
  retryAfter?: string;
  inputTokensRemaining?: string;
  inputTokensLimit?: string;
  outputTokensRemaining?: string;
  outputTokensLimit?: string;
  requestsRemaining?: string;
  requestsLimit?: string;
}

export function extractRateLimitHeaders(err: unknown): RateLimitInfo | null {
  if (!err || typeof err !== "object") return null;
  const headers = (err as { headers?: Record<string, string> }).headers;
  if (!headers) return null;

  const info: RateLimitInfo = {};
  let hasAny = false;

  const mapping: Array<[keyof RateLimitInfo, string]> = [
    ["retryAfter", "retry-after"],
    ["inputTokensRemaining", "anthropic-ratelimit-input-tokens-remaining"],
    ["inputTokensLimit", "anthropic-ratelimit-input-tokens-limit"],
    ["outputTokensRemaining", "anthropic-ratelimit-output-tokens-remaining"],
    ["outputTokensLimit", "anthropic-ratelimit-output-tokens-limit"],
    ["requestsRemaining", "anthropic-ratelimit-requests-remaining"],
    ["requestsLimit", "anthropic-ratelimit-requests-limit"],
  ];

  for (const [key, header] of mapping) {
    const value = headers[header];
    if (value) {
      info[key] = value;
      hasAny = true;
    }
  }

  return hasAny ? info : null;
}

export async function waitForRetryAttempt(attempt: number, retryAfterMs?: number | null): Promise<void> {
  if (retryAfterMs && retryAfterMs > 0) {
    const delayMs = Math.min(retryAfterMs, 30_000);
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return;
  }
  // attempt starts from 1 for first retry
  const baseMs = 500 * (2 ** (attempt - 1));
  const jitterMs = Math.floor(baseMs * 0.2 * Math.random());
  const delayMs = Math.min(baseMs + jitterMs, 5000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

