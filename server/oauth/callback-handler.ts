import type { IncomingMessage, ServerResponse } from "http";
import type { PendingAuth } from "./types";
import {
  escapeHtml,
  validateOAuthEndpointUrl,
  writeSecureHtmlResponse,
} from "./security";

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
  void req;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    const reason = escapeHtml(
      url.searchParams.get("error_description") || errorParam,
    );
    writeSecureHtmlResponse(res, 200, `
      <html><body>
        <h3>Authorization failed</h3>
        <p>${reason}</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  if (!code || !state || !pendingAuths.has(state)) {
    writeSecureHtmlResponse(res, 400, `
      <html><body>
        <h3>Invalid callback</h3>
        <p>Missing code or invalid state parameter.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  const { codeVerifier, redirectUri, tokenEndpoint } = pendingAuths.get(state)!;
  pendingAuths.delete(state);

  if (!tokenEndpoint) {
    writeSecureHtmlResponse(res, 400, `
      <html><body>
        <h3>Missing token endpoint</h3>
        <p>OAuth session expired. Please try again.</p>
        <script>setTimeout(() => window.close(), 3000);</script>
      </body></html>
    `);
    return;
  }

  try {
    const safeTokenEndpoint = validateOAuthEndpointUrl(
      tokenEndpoint,
      "token endpoint",
    );

    const tokenRes = await fetch(safeTokenEndpoint, {
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
      writeSecureHtmlResponse(res, 200, `
        <html><body>
          <h3>Connected to Swiggy!</h3>
          <p>You can close this window.</p>
          <script>
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: "swiggy-oauth-token",
                token: ${JSON.stringify(accessToken)}
              }, window.location.origin);
            }
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
    const message = escapeHtml(err instanceof Error ? err.message : "Unknown error");
    writeSecureHtmlResponse(res, 500, `
      <html><body>
        <h3>Token exchange failed</h3>
        <p>${message}</p>
        <p>Use the "Paste token" option instead.</p>
        <script>setTimeout(() => window.close(), 5000);</script>
      </body></html>
    `);
  }
}
