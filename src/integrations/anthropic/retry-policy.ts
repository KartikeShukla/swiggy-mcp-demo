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

export function isRetryableAnthropicError(err: unknown): boolean {
  const status = extractStatus(err);
  if (status && RETRYABLE_STATUSES.has(status)) return true;

  const msg = extractMessage(err).toLowerCase();
  return /overload(?:ed)?|overloaded_error|rate[_\s-]?limit|temporarily unavailable|internal server error|timeout|gateway/.test(
    msg,
  );
}

export async function waitForRetryAttempt(attempt: number): Promise<void> {
  // attempt starts from 1 for first retry
  const baseMs = 500 * (2 ** (attempt - 1));
  const jitterMs = Math.floor(baseMs * 0.2 * Math.random());
  const delayMs = Math.min(baseMs + jitterMs, 5000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

