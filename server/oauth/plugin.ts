import type { Plugin } from "vite";
import { handleAuthStart } from "./start-handler";
import { handleAuthCallback } from "./callback-handler";
import type { PendingAuth } from "./types";

const PENDING_AUTH_TTL_MS = 10 * 60 * 1000;
const PENDING_AUTH_CLEANUP_MS = 60_000;

function clearExpiredPendingAuths(pendingAuths: Map<string, PendingAuth>) {
  const now = Date.now();
  for (const [key, val] of pendingAuths.entries()) {
    if (now - val.createdAt > PENDING_AUTH_TTL_MS) {
      pendingAuths.delete(key);
    }
  }
}

export function oauthPlugin(): Plugin {
  const pendingAuths = new Map<string, PendingAuth>();

  return {
    name: "swiggy-oauth",
    configureServer(server) {
      const cleanupTimer = setInterval(
        () => clearExpiredPendingAuths(pendingAuths),
        PENDING_AUTH_CLEANUP_MS,
      );
      cleanupTimer.unref?.();
      server.httpServer?.once("close", () => clearInterval(cleanupTimer));

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        if (url.pathname === "/api/auth/start") {
          await handleAuthStart(req, res, pendingAuths);
          return;
        }

        if (url.pathname === "/api/auth/callback") {
          await handleAuthCallback(req, res, url, pendingAuths);
          return;
        }

        next();
      });
    },
  };
}
