import type { IncomingMessage, ServerResponse } from "http";
import type { PendingAuth } from "./types";
import { createPkce } from "./pkce";
import { discoverSwiggyOAuth } from "./discovery";

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function resolveRequestProtocol(req: IncomingMessage): "http" | "https" {
  const forwardedProtoRaw = firstHeaderValue(req.headers["x-forwarded-proto"]);
  const forwardedProto = forwardedProtoRaw?.split(",")[0]?.trim().toLowerCase();
  if (forwardedProto === "https") return "https";
  if (forwardedProto === "http") return "http";

  const socket = req.socket as IncomingMessage["socket"] & { encrypted?: boolean };
  return socket.encrypted ? "https" : "http";
}

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
    const protocol = resolveRequestProtocol(req);
    const host = req.headers.host;
    if (!host) {
      throw new Error("Missing Host header");
    }

    const redirectUri = `${protocol}://${host}/api/auth/callback`;
    pendingAuths.set(state, {
      codeVerifier,
      redirectUri,
      createdAt: Date.now(),
    });

    const isSecure = protocol === "https";
    const secureSuffix = isSecure ? "; Secure" : "";
    res.setHeader(
      "Set-Cookie",
      `mcp_token_endpoint=${encodeURIComponent(tokenEndpoint)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secureSuffix}`,
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
