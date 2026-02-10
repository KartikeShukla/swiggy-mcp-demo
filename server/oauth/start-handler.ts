import type { IncomingMessage, ServerResponse } from "http";
import type { PendingAuth } from "./types";
import { createPkce } from "./pkce";
import { discoverSwiggyOAuth } from "./discovery";

export async function handleAuthStart(
  req: IncomingMessage,
  res: ServerResponse,
  pendingAuths: Map<string, PendingAuth>,
): Promise<void> {
  try {
    const discovery = await discoverSwiggyOAuth();
    const authorizationEndpoint = discovery.authorizationEndpoint;
    const tokenEndpoint = discovery.tokenEndpoint;

    const { codeVerifier, codeChallenge, state } = await createPkce();

    const redirectUri = `http://${req.headers.host}/api/auth/callback`;
    pendingAuths.set(state, {
      codeVerifier,
      redirectUri,
      createdAt: Date.now(),
    });

    res.setHeader(
      "Set-Cookie",
      `mcp_token_endpoint=${encodeURIComponent(tokenEndpoint)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
    );

    const authUrl = new URL(authorizationEndpoint);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set(
      "client_id",
      discovery.clientId || "swiggy-mcp",
    );
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("code_challenge", codeChallenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set(
      "scope",
      discovery.scopes?.join(" ") || "",
    );

    res.writeHead(302, { Location: authUrl.toString() });
    res.end();
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end(`
      <html><body>
        <h3>OAuth discovery failed</h3>
        <p>${err instanceof Error ? err.message : "Unknown error"}.</p>
        <p>Please check your network or VPN and retry.</p>
        <p>Use the "Paste token" option instead.</p>
        <script>setTimeout(() => window.close(), 5000);</script>
      </body></html>
    `);
  }
}
