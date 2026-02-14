import {
  extractWrappedMcpHttpStatus,
  isRateLimitError,
  isRetryableAnthropicError,
  isWrappedMcpConnectionError,
} from "@/integrations/anthropic/retry-policy";

function makeWrappedMcpError(httpStatus: number): Error & { status: number } {
  const err = new Error(
    `400 {"type":"error","error":{"type":"invalid_request_error","message":"Connection error while communicating with MCP server: Server error: MCP server error (HTTP ${httpStatus})"}}`,
  ) as Error & { status: number };
  err.status = 400;
  return err;
}

describe("retry-policy wrapped MCP errors", () => {
  it("extracts MCP HTTP status from wrapped invalid_request_error payloads", () => {
    const err = makeWrappedMcpError(500);
    expect(extractWrappedMcpHttpStatus(err)).toBe(500);
    expect(isWrappedMcpConnectionError(err)).toBe(true);
  });

  it("marks wrapped MCP 500 errors as retryable", () => {
    expect(isRetryableAnthropicError(makeWrappedMcpError(500))).toBe(true);
  });

  it("does not retry wrapped MCP auth errors", () => {
    expect(isRetryableAnthropicError(makeWrappedMcpError(403))).toBe(false);
  });

  it("treats wrapped MCP 429 as rate limit errors", () => {
    expect(isRateLimitError(makeWrappedMcpError(429))).toBe(true);
  });
});
