import { validateOAuthEndpointUrl } from "./security";

export interface OAuthDiscoveryResult {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  clientId?: string;
  scopes?: string[];
}

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function asStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const items = value.filter(
    (v): v is string => typeof v === "string" && v.trim().length > 0,
  );
  return items.length > 0 ? items : undefined;
}

function shapeDiscoveryDocument(doc: Record<string, unknown>): OAuthDiscoveryResult | null {
  const rawAuthorizationEndpoint = asNonEmptyString(doc.authorization_endpoint);
  const rawTokenEndpoint = asNonEmptyString(doc.token_endpoint);
  if (!rawAuthorizationEndpoint || !rawTokenEndpoint) return null;

  let authorizationEndpoint: string;
  let tokenEndpoint: string;
  try {
    authorizationEndpoint = validateOAuthEndpointUrl(
      rawAuthorizationEndpoint,
      "authorization endpoint",
    );
    tokenEndpoint = validateOAuthEndpointUrl(rawTokenEndpoint, "token endpoint");
  } catch {
    return null;
  }

  return {
    authorizationEndpoint,
    tokenEndpoint,
    clientId: asNonEmptyString(doc.client_id),
    scopes: asStringArray(doc.scopes_supported),
  };
}

async function fetchJsonObject(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url);
  const text = await res.text();

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  if (!text.trim()) {
    throw new Error(`Empty response from ${url}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid JSON";
    throw new Error(`Invalid JSON from ${url}: ${message}`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`Unexpected JSON shape from ${url}`);
  }

  return parsed as Record<string, unknown>;
}

function buildWellKnownCandidates(): string[] {
  const root = "https://mcp.swiggy.com";
  const baseCandidates = [
    `${root}/.well-known/oauth-authorization-server`,
    `${root}/.well-known/openid-configuration`,
  ];

  const resourcePaths = ["im", "food", "dineout"];

  for (const path of resourcePaths) {
    // RFC-style with path component after well-known
    baseCandidates.push(`${root}/.well-known/oauth-authorization-server/${path}`);
    baseCandidates.push(`${root}/.well-known/openid-configuration/${path}`);
    // Common alternative deployments
    baseCandidates.push(`${root}/${path}/.well-known/oauth-authorization-server`);
    baseCandidates.push(`${root}/${path}/.well-known/openid-configuration`);
  }

  return [...new Set(baseCandidates)];
}

async function tryAuthServerFromProtectedResource(
  baseUrl: string,
): Promise<OAuthDiscoveryResult | null> {
  let protectedResourceDoc: Record<string, unknown>;
  try {
    protectedResourceDoc = await fetchJsonObject(baseUrl);
  } catch {
    return null;
  }

  const authServersRaw = protectedResourceDoc.authorization_servers;
  if (!Array.isArray(authServersRaw) || authServersRaw.length === 0) {
    return null;
  }

  for (const authServer of authServersRaw) {
    if (typeof authServer !== "string" || authServer.trim().length === 0) continue;
    const issuer = authServer.replace(/\/+$/, "");
    const candidates = [
      `${issuer}/.well-known/oauth-authorization-server`,
      `${issuer}/.well-known/openid-configuration`,
    ];
    for (const candidate of candidates) {
      try {
        const doc = await fetchJsonObject(candidate);
        const shaped = shapeDiscoveryDocument(doc);
        if (shaped) return shaped;
      } catch {
        // Keep trying remaining candidates
      }
    }
  }

  return null;
}

/**
 * Resolve OAuth metadata robustly across multiple discovery URL layouts.
 * This avoids brittle `response.json()` failures when providers return empty or non-JSON payloads.
 */
export async function discoverSwiggyOAuth(): Promise<OAuthDiscoveryResult> {
  // Optional explicit override for local debugging / provider changes.
  const envAuthorizationEndpoint = asNonEmptyString(
    process.env.SWIGGY_OAUTH_AUTHORIZATION_ENDPOINT,
  );
  const envTokenEndpoint = asNonEmptyString(process.env.SWIGGY_OAUTH_TOKEN_ENDPOINT);
  const envClientId = asNonEmptyString(process.env.SWIGGY_OAUTH_CLIENT_ID);
  const envScopes = asStringArray(
    asNonEmptyString(process.env.SWIGGY_OAUTH_SCOPES)?.split(/[,\s]+/).filter(Boolean),
  );
  if (envAuthorizationEndpoint && envTokenEndpoint) {
    const authorizationEndpoint = validateOAuthEndpointUrl(
      envAuthorizationEndpoint,
      "authorization endpoint",
    );
    const tokenEndpoint = validateOAuthEndpointUrl(
      envTokenEndpoint,
      "token endpoint",
    );
    return {
      authorizationEndpoint,
      tokenEndpoint,
      clientId: envClientId,
      scopes: envScopes,
    };
  }

  const manualDiscoveryUrl = asNonEmptyString(process.env.SWIGGY_OAUTH_DISCOVERY_URL);
  const discoveryCandidates = manualDiscoveryUrl
    ? [manualDiscoveryUrl]
    : buildWellKnownCandidates();

  const errors: string[] = [];
  for (const candidate of discoveryCandidates) {
    try {
      const doc = await fetchJsonObject(candidate);
      const shaped = shapeDiscoveryDocument(doc);
      if (shaped) return shaped;
      errors.push(`Missing authorization/token endpoints in ${candidate}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push(message);
    }
  }

  // Fallback path: protected resource metadata can point to auth server(s).
  const protectedResourceCandidates = [
    "https://mcp.swiggy.com/.well-known/oauth-protected-resource",
    "https://mcp.swiggy.com/.well-known/oauth-protected-resource/im",
    "https://mcp.swiggy.com/.well-known/oauth-protected-resource/food",
    "https://mcp.swiggy.com/.well-known/oauth-protected-resource/dineout",
  ];
  for (const candidate of protectedResourceCandidates) {
    const discovered = await tryAuthServerFromProtectedResource(candidate);
    if (discovered) return discovered;
  }

  const prefix = errors.length > 0 ? `${errors[0]}. ` : "";
  throw new Error(`${prefix}Could not discover OAuth endpoints from Swiggy`);
}
