import type { ParsedToolResult, ParsedTimeSlot } from "@/lib/types";
import { asArray, str } from "./primitives";

export function tryParseTimeSlots(payload: unknown): ParsedToolResult | null {
  const arr = asArray(payload);
  if (!arr || arr.length === 0) return null;

  const slots: ParsedTimeSlot[] = [];
  for (const item of arr) {
    if (typeof item === "string") {
      slots.push({ time: item, available: true });
      continue;
    }
    if (typeof item !== "object" || item === null) continue;
    const obj = item as Record<string, unknown>;
    const time = str(obj.time) || str(obj.slot) || str(obj.label) || str(obj.start_time);
    if (!time) continue;
    slots.push({
      time,
      available: obj.available != null ? Boolean(obj.available) : true,
    });
  }

  return slots.length > 0 ? { type: "time_slots", slots } : null;
}
