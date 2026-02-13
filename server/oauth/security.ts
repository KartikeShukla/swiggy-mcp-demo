import type { ServerResponse } from "http";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function normalizeHostname(hostname: string): string {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOSTS.has(normalizeHostname(hostname));
}

function isAllowedEndpointProtocol(url: URL): boolean {
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && isLoopbackHost(url.hostname);
}

export function validateOAuthEndpointUrl(endpoint: string, label: string): string {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error(`Invalid ${label} URL`);
  }

  if (!isAllowedEndpointProtocol(parsed)) {
    throw new Error(
      `Invalid ${label} protocol (only https is allowed, except http on localhost)`,
    );
  }
  if (parsed.username || parsed.password) {
    throw new Error(`Invalid ${label} URL (credentials are not allowed)`);
  }

  return parsed.toString();
}

export function sanitizeHostHeader(hostHeader: string): string | null {
  const trimmed = hostHeader.trim();
  if (!trimmed) return null;
  if (/[\s/\\]/.test(trimmed)) return null;

  try {
    const parsed = new URL(`http://${trimmed}`);
    if (!parsed.hostname) return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.pathname !== "/" || parsed.search || parsed.hash) return null;
    return parsed.host;
  } catch {
    return null;
  }
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function writeSecureHtmlResponse(
  res: ServerResponse,
  status: number,
  body: string,
): void {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy":
      "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  });
  res.end(body);
}
