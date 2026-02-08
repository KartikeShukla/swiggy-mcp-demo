export function asArray(val: unknown): unknown[] | null {
  if (Array.isArray(val)) return val;
  return null;
}

export function str(val: unknown): string | undefined {
  if (typeof val === "string" && val.length > 0) return val;
  if (typeof val === "number") return String(val);
  return undefined;
}

export function num(val: unknown): number | undefined {
  if (typeof val === "number" && !isNaN(val)) return val;
  if (typeof val === "string") {
    const n = parseFloat(val);
    if (!isNaN(n)) return n;
  }
  return undefined;
}

export function numFromCurrency(val: unknown): number | undefined {
  if (typeof val !== "string") return undefined;
  const cleaned = val.replace(/[₹,\s]/g, "");
  const n = parseFloat(cleaned);
  return !isNaN(n) ? n : undefined;
}

/** Generic fallback: scan own properties for keys containing price/cost/amount/mrp */
export function scanForPrice(obj: Record<string, unknown>): number | undefined {
  for (const [key, val] of Object.entries(obj)) {
    if (/price|cost|amount|mrp/i.test(key) && key !== "priceForTwo" && key !== "price_for_two") {
      const n = num(val) ?? numFromCurrency(val);
      if (n != null && n > 0) return n;
    }
  }
  return undefined;
}
