import crypto from "crypto";

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

export async function createPkce() {
  const codeVerifier = base64url(crypto.randomBytes(32));
  const codeChallenge = base64url(await sha256(codeVerifier));
  const state = base64url(crypto.randomBytes(16));
  return { codeVerifier, codeChallenge, state };
}
