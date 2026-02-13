import type { IncomingMessage, ServerResponse } from "http";
import { handleAuthCallback } from "../callback-handler";
import type { PendingAuth } from "../types";

interface MockResponse extends ServerResponse {
  statusCodeSet?: number;
  headersSet?: Record<string, string>;
  body?: string;
}

function makeResponse(): MockResponse {
  return {
    writeHead(status: number, headers: Record<string, string>) {
      this.statusCodeSet = status;
      this.headersSet = headers;
      return this;
    },
    end(body?: string) {
      this.body = body ?? "";
      return this;
    },
  } as unknown as MockResponse;
}

describe("handleAuthCallback", () => {
  it("escapes malicious error_description content in HTML output", async () => {
    const req = { headers: {} } as unknown as IncomingMessage;
    const res = makeResponse();
    const url = new URL(
      "http://localhost/api/auth/callback?error=access_denied&error_description=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E",
    );

    await handleAuthCallback(req, res, url, new Map());

    expect(res.statusCodeSet).toBe(200);
    expect(res.body).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(res.body).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("ignores malformed cookie headers and still completes using pending auth state", async () => {
    const req = {
      headers: {
        cookie: "mcp_token_endpoint=%E0%A4%A",
      },
    } as unknown as IncomingMessage;
    const res = makeResponse();
    const state = "state-1";
    const url = new URL(
      `http://localhost/api/auth/callback?code=test-code&state=${state}`,
    );
    const pending = new Map<string, PendingAuth>([
      [
        state,
        {
          codeVerifier: "verifier-1",
          redirectUri: "http://localhost:5173/api/auth/callback",
          tokenEndpoint: "https://mcp.swiggy.com/oauth/token",
          createdAt: Date.now(),
        },
      ],
    ]);

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    try {
      await handleAuthCallback(req, res, url, pending);
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://mcp.swiggy.com/oauth/token",
      expect.objectContaining({ method: "POST" }),
    );
    expect(res.statusCodeSet).toBe(200);
    expect(res.body).toContain("Connected to Swiggy!");
    expect(pending.has(state)).toBe(false);
  });
});
