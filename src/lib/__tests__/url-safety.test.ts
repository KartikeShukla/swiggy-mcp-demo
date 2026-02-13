import { getSafeImageSrc } from "@/lib/url-safety";

describe("getSafeImageSrc", () => {
  it("allows absolute https/http URLs", () => {
    expect(getSafeImageSrc("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
    expect(getSafeImageSrc("http://localhost:5173/a.png")).toBe(
      "http://localhost:5173/a.png",
    );
  });

  it("allows root-relative URLs", () => {
    expect(getSafeImageSrc("/images/a.png")).toBe("/images/a.png");
  });

  it("rejects non-http schemes and protocol-relative URLs", () => {
    expect(getSafeImageSrc("javascript:alert(1)")).toBeUndefined();
    expect(getSafeImageSrc("data:image/png;base64,AAAA")).toBeUndefined();
    expect(getSafeImageSrc("//evil.example.com/a.png")).toBeUndefined();
  });

  it("rejects empty and malformed values", () => {
    expect(getSafeImageSrc("")).toBeUndefined();
    expect(getSafeImageSrc("   ")).toBeUndefined();
    expect(getSafeImageSrc("not a url")).toBeUndefined();
  });
});
