import type { ParsedToolResult, ParsedTimeSlot } from "@/lib/types";
import { asArrayOrWrap, str } from "./primitives";

export function tryParseTimeSlots(payload: unknown): ParsedToolResult | null {
  const arr = asArrayOrWrap(payload);
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
    const slot: ParsedTimeSlot = {
      time,
      available: obj.available != null ? Boolean(obj.available) : true,
    };
    const slotId = str(obj.id) || str(obj.slot_id) || str(obj.slotId);
    const slotToken = str(obj.slot_token) || str(obj.slotToken) || str(obj.token);
    const restaurantId = str(obj.restaurant_id) || str(obj.restaurantId);
    if (slotId) slot.slotId = slotId;
    if (slotToken) slot.slotToken = slotToken;
    if (restaurantId) slot.restaurantId = restaurantId;
    slots.push(slot);
  }

  return slots.length > 0 ? { type: "time_slots", slots } : null;
}
