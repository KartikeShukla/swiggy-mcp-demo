import type { Plugin } from "vite";
import crypto from "crypto";

interface PendingAuth {
  codeVerifier: string;
  redirectUri: string;
  createdAt: number;
}

function base64url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function sha256(plain: string): Promise<Buffer> {
  return crypto.createHash("sha256").update(plain).digest();
}

export function oauthPlugin(): Plugin {
  const pendingAuths = new Map<string, PendingAuth>();

  // Clean up old entries periodically (older than 10 minutes)
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of pendingAuths.entries()) {
      if (now - val.createdAt > 10 * 60 * 1000) {
        pendingAuths.delete(key);
      }
    }
  }, 60_000);

  return {
    name: "swiggy-oauth",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        if (url.pathname === "/api/auth/start") {
          try {
            // Discover OAuth endpoints from Swiggy
            const wellKnownUrl =
              "https://mcp.swiggy.com/.well-known/oauth-authorization-server";
            const discovery = (await fetch(wellKnownUrl).then((r) => r.json())) as Record<string, unknown>;

            const authorizationEndpoint = discovery.authorization_endpoint as string;
            const tokenEndpoint = discovery.token_endpoint as string;

            // Generate PKCE
            const codeVerifier = base64url(crypto.randomBytes(32));
            const codeChallenge = base64url(await sha256(codeVerifier));
            const state = base64url(crypto.randomBytes(16));

            const redirectUri = `http://${req.headers.host}/api/auth/callback`;

            pendingAuths.set(state, {
              codeVerifier,
              redirectUri,
              createdAt: Date.now(),
            });

            // Store token endpoint in state for callback (encode in a cookie)
            res.setHeader(
              "Set-Cookie",
              `mcp_token_endpoint=${encodeURIComponent(tokenEndpoint)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`,
            );

            const authUrl = new URL(authorizationEndpoint);
            authUrl.searchParams.set("response_type", "code");
            authUrl.searchParams.set(
              "client_id",
              (discovery.client_id as string) || "swiggy-mcp",
            );
            authUrl.searchParams.set(
              "redirect_uri",
              redirectUri,
            );
            authUrl.searchParams.set("code_challenge", codeChallenge);
            authUrl.searchParams.set("code_challenge_method", "S256");
            authUrl.searchParams.set("state", state);
            authUrl.searchParams.set("scope", (discovery.scopes_supported as string[] | undefined)?.join(" ") || "");

            res.writeHead(302, { Location: authUrl.toString() });
            res.end();
          } catch (err) {
            res.writeHead(500, { "Content-Type": "text/html" });
            res.end(`
              <html><body>
                <h3>OAuth discovery failed</h3>
                <p>${err instanceof Error ? err.message : "Unknown error"}</p>
                <p>Use the "Paste token" option instead.</p>
                <script>setTimeout(() => window.close(), 5000);</script>
              </body></html>
            `);
          }
          return;
        }

        if (url.pathname === "/api/auth/callback") {
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

          // Parse token endpoint from cookie
          const cookies = (req.headers.cookie || "").split(";").reduce(
            (acc, c) => {
              const [k, ...v] = c.trim().split("=");
              acc[k] = v.join("=");
              return acc;
            },
            {} as Record<string, string>,
          );
          const tokenEndpoint = decodeURIComponent(
            cookies["mcp_token_endpoint"] || "",
          );

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

            const tokenData = (await tokenRes.json()) as Record<string, unknown>;

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
                    }, "*");
                    setTimeout(() => window.close(), 1500);
                  </script>
                </body></html>
              `);
            } else {
              throw new Error(
                (tokenData.error_description as string) ||
                  (tokenData.error as string) ||
                  "Token exchange failed",
              );
            }
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
          return;
        }

        next();
      });
    },
  };
}
