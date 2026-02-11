import type { IncomingMessage, ServerResponse } from "http";
import { parseCookies } from "./cookies";
import type { PendingAuth } from "./types";

function parseJsonObject(text: string, source: string): Record<string, unknown> {
  if (!text.trim()) {
    throw new Error(`${source} returned an empty response`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid JSON";
    throw new Error(`${source} returned invalid JSON: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${source} returned unexpected JSON shape`);
  }

  return parsed as Record<string, unknown>;
}

export async function handleAuthCallback(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  pendingAuths: Map<string, PendingAuth>,
): Promise<void> {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <html><body>
        <h3>Authorization failed</h3>
        <p>${url.searchParams.get("error_description") || errorParam}</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  if (!code || !state || !pendingAuths.has(state)) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`
      <html><body>
        <h3>Invalid callback</h3>
        <p>Missing code or invalid state parameter.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  const { codeVerifier, redirectUri } = pendingAuths.get(state)!;
  pendingAuths.delete(state);

  const cookies = parseCookies(req.headers.cookie);
  const tokenEndpoint = decodeURIComponent(cookies.mcp_token_endpoint || "");

  if (!tokenEndpoint) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end(`
      <html><body>
        <h3>Missing token endpoint</h3>
        <p>Cookie expired. Please try again.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  try {
    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenBody = await tokenRes.text();
    const tokenData = parseJsonObject(tokenBody, "Token endpoint");
    if (!tokenRes.ok) {
      const reason = (tokenData.error_description as string) ||
        (tokenData.error as string);
      throw new Error(
        reason
          ? `Token endpoint request failed with HTTP ${tokenRes.status}: ${reason}`
          : `Token endpoint request failed with HTTP ${tokenRes.status}`,
      );
    }

    if (tokenData.access_token) {
      const accessToken = tokenData.access_token as string;
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <html><body>
          <h3>Connected to Swiggy!</h3>
          <p>You can close this window.</p>
          <script>
            window.opener.postMessage({
              type: "swiggy-oauth-token",
              token: ${JSON.stringify(accessToken)}
            }, window.location.origin);
            setTimeout(() => window.close(), 1500);
          </script>
        </body></html>
      `);
      return;
    }

    throw new Error(
      (tokenData.error_description as string) ||
        (tokenData.error as string) ||
        "Token exchange failed",
    );
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`
      <html><body>
        <h3>Token exchange failed</h3>
        <p>${err instanceof Error ? err.message : "Unknown error"}</p>
        <p>Use the "Paste token" option instead.</p>
        <script>setTimeout(() => window.close(), 5000);</script>
      </body></html>
    `);
  }
}
