import type { ParsedToolResult, ParsedAddress } from "@/lib/types";
import { asArrayOrWrap, str, num } from "./primitives";

export function tryParseAddresses(payload: unknown): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
  if (!arr || arr.length === 0) return null;

  const addresses: ParsedAddress[] = [];
  for (const item of arr) {
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const address = str(obj.address) || str(obj.addressLine) || str(obj.full_address) || str(obj.formatted_address);
    if (!address) continue;

    addresses.push({
      id: str(obj.id) || str(obj.address_id) || String(addresses.length),
      label: str(obj.label) || str(obj.type) || str(obj.tag) || str(obj.annotation) || str(obj.category) || "Address",
      address,
      lat: num(obj.lat) ?? num(obj.latitude),
      lng: num(obj.lng) ?? num(obj.longitude),
    });
  }

  return addresses.length > 0 ? { type: "addresses", addresses } : null;
}
