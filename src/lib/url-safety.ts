const SCHEME_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;

/**
 * Allow only http/https absolute URLs, or root-relative same-origin paths.
 */
export function getSafeImageSrc(input: string | null | undefined): string | undefined {
  if (!input) return undefined;

  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Block protocol-relative URLs like //example.com
  if (trimmed.startsWith("//")) return undefined;

  // Allow same-origin root-relative paths only.
  if (!SCHEME_RE.test(trimmed)) {
    if (trimmed.startsWith("/")) return trimmed;
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return undefined;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return undefined;
  }

  return parsed.toString();
}
