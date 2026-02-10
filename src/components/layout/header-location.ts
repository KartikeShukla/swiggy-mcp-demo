import type { ParsedAddress } from "@/lib/types";

const MAX_LOCATION_LEN = 30;

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return `${str.slice(0, maxLen - 1)}…`;
}

function extractLocality(address: string): string {
  const segments = address
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const preferred = segments.find((segment) =>
    /\b(sector|market|nagar|layout|phase|road|street|avenue|colony|vihar|extension|block|park|cross|main)\b/i.test(segment),
  );
  if (preferred) return truncate(preferred, MAX_LOCATION_LEN);

  const candidate = [...segments]
    .reverse()
    .find((segment) => (
      /[a-zA-Z]/.test(segment) &&
      !/\b(india|bharat)\b/i.test(segment) &&
      !/\d{5,}/.test(segment)
    )) || segments[0] || address;

  return truncate(candidate, MAX_LOCATION_LEN);
}

export function formatHeaderLocation(selectedAddress?: ParsedAddress | null): string {
  if (!selectedAddress) return "No address";
  const address = selectedAddress.address?.trim();

  if (address) return extractLocality(address);
  const label = selectedAddress.label?.trim();
  if (label) return truncate(label, MAX_LOCATION_LEN);
  return "No address";
}
