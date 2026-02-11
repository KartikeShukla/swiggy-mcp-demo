import type { IncomingMessage } from "http";
import { resolveRequestProtocol } from "../start-handler";

function makeReq(
  options: {
    forwardedProto?: string | string[];
    encrypted?: boolean;
  } = {},
): IncomingMessage {
  return {
    headers: options.forwardedProto ? { "x-forwarded-proto": options.forwardedProto } : {},
    socket: { encrypted: options.encrypted ?? false },
  } as unknown as IncomingMessage;
}

describe("resolveRequestProtocol", () => {
  it("prefers x-forwarded-proto=https", () => {
    const req = makeReq({ forwardedProto: "https", encrypted: false });
    expect(resolveRequestProtocol(req)).toBe("https");
  });

  it("supports comma-separated forwarded proto values", () => {
    const req = makeReq({ forwardedProto: "https,http", encrypted: false });
    expect(resolveRequestProtocol(req)).toBe("https");
  });

  it("uses x-forwarded-proto=http when provided", () => {
    const req = makeReq({ forwardedProto: "http", encrypted: true });
    expect(resolveRequestProtocol(req)).toBe("http");
  });

  it("falls back to socket encryption when no forwarded proto is set", () => {
    const secureReq = makeReq({ encrypted: true });
    const insecureReq = makeReq({ encrypted: false });
    expect(resolveRequestProtocol(secureReq)).toBe("https");
    expect(resolveRequestProtocol(insecureReq)).toBe("http");
  });
});
