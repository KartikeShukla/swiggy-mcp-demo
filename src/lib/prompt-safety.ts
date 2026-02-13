/**
 * Minimal neutralization for untrusted text that can be re-injected into prompts.
 * Keeps semantics while stripping control chars and collapsing whitespace.
 */
export function sanitizeUntrustedPromptText(
  value: string,
  maxLength = 240,
): string {
  const normalized = value
    .split("")
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 32 || code === 127) return " ";
      return char;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim();

  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).trim();
}

export function quotePromptValue(value: string, maxLength = 240): string {
  return JSON.stringify(sanitizeUntrustedPromptText(value, maxLength));
}
