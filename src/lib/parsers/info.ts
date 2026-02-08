import type { ParsedToolResult, ParsedInfoEntry } from "@/lib/types";
import { humanizeKey, stringifyValue } from "./format";

export function tryParseInfo(payload: unknown): ParsedToolResult | null {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 0) return null;

  const title = (typeof obj.name === "string" && obj.name) ||
    (typeof obj.title === "string" && obj.title) ||
    (typeof obj.label === "string" && obj.label) ||
    "Details";

  const entries: ParsedInfoEntry[] = [];
  for (const key of keys) {
    const val = obj[key];
    if (val == null) continue;
    const valueStr = stringifyValue(val);
    if (!valueStr) continue;
    entries.push({ key: humanizeKey(key), value: valueStr });
  }

  return entries.length > 0 ? { type: "info", title, entries } : null;
}
