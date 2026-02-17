import { classifyApiError } from "@/integrations/anthropic/error-classifier";

function makeWrappedMcpError(httpStatus: number): Error & { status: number } {
  const err = new Error(
    `400 {"type":"error","error":{"type":"invalid_request_error","message":"Connection error while communicating with MCP server: Server error: MCP server error (HTTP ${httpStatus})"}}`,
  ) as Error & { status: number };
  err.status = 400;
  return err;
}

describe("classifyApiError wrapped MCP errors", () => {
  it("maps wrapped MCP 500 to a transient service message", () => {
    expect(classifyApiError(makeWrappedMcpError(500))).toEqual({
      status: 529,
      message: "Swiggy service is temporarily unavailable. Please try again in a moment.",
    });
  });

  it("maps wrapped MCP 403 to reconnect guidance", () => {
    expect(classifyApiError(makeWrappedMcpError(403))).toEqual({
      status: 403,
      message: "Your Swiggy session has expired. Please reconnect.",
    });
  });

  it("maps wrapped MCP 429 to rate-limit guidance", () => {
    expect(classifyApiError(makeWrappedMcpError(429))).toEqual({
      status: 429,
      message: "Rate limited — try again in 15s",
      retryAfterMs: 15_000,
    });
  });
});
