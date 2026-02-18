import type { ChatAction } from "@/lib/types";
import { sanitizeUntrustedPromptText } from "@/lib/prompt-safety";
import {
  getActionMessage,
  isCartAddSelectionAction,
  isCartUpdateItemAction,
  isRestaurantSelectAction,
  isSlotSelectAction,
} from "@/lib/chat-actions";

function toSafeSelectionMetadata(
  items: Extract<ChatAction, { kind: "cart_add_selection" }>["items"],
) {
  return items.map((item) => ({
    ui_product_id: item.uiProductId,
    backend_product_id: item.backendProductId,
    backend_variant_id: item.backendVariantId,
    name: sanitizeUntrustedPromptText(item.name, 80),
    quantity: item.quantity,
    brand: item.brand ? sanitizeUntrustedPromptText(item.brand, 60) : undefined,
    variant: item.variantLabel ? sanitizeUntrustedPromptText(item.variantLabel, 40) : undefined,
    price: item.price,
    restaurant: item.restaurantName ? sanitizeUntrustedPromptText(item.restaurantName, 80) : undefined,
  }));
}

export function buildTransportMessageForAction(
  action: ChatAction,
  verticalId: string,
  lockedRestaurant: string | null,
): string {
  const message = getActionMessage(action).trim();
  if (!message) return "";

  if (isCartAddSelectionAction(action)) {
    const safeItems = toSafeSelectionMetadata(action.items);
    if (safeItems.length === 0) return message;

    if (verticalId === "foodorder") {
      return [
        "Cart update request (menu mode):",
        lockedRestaurant
          ? `Selected restaurant: ${sanitizeUntrustedPromptText(lockedRestaurant, 80)}.`
          : action.restaurantName
            ? `Selected restaurant: ${sanitizeUntrustedPromptText(action.restaurantName, 80)}.`
            : "Selected restaurant: currently opened menu context.",
        `${message}.`,
        `Structured items: ${JSON.stringify(safeItems)}.`,
        "Execute cart update directly from this selected-item metadata.",
        "Treat this as an incremental cart mutation; do not clear unrelated existing cart lines unless the user explicitly asked to clear/remove them.",
        "Do not run restaurant discovery.",
        "Do not run menu discovery or fetch/show menu items for this restaurant again unless the user explicitly asks to see the menu.",
      ].join(" ");
    }

    return [
      `${message}.`,
      `Selected cart items metadata: ${JSON.stringify(safeItems)}.`,
      "Execute cart update directly from this selected-item metadata.",
      "Treat this as an incremental cart mutation; do not clear unrelated existing cart lines unless the user explicitly asked to clear/remove them.",
      "Do not ask to reconfirm size/variant unless selected metadata is missing or conflicting across multiple exact matches.",
    ].join(" ");
  }

  if (isCartUpdateItemAction(action)) {
    const safeItemName = sanitizeUntrustedPromptText(action.itemName, 80);
    return [
      `${message}.`,
      `Cart item metadata: ${JSON.stringify({
        item_id: action.itemId,
        item_name: safeItemName,
        target_quantity: action.targetQuantity,
        restaurant: action.restaurantName ? sanitizeUntrustedPromptText(action.restaurantName, 80) : undefined,
      })}.`,
      "Execute this cart update directly for the referenced item. Do not ask to reconfirm unless the item cannot be resolved.",
    ].join(" ");
  }

  if (isRestaurantSelectAction(action)) {
    return [
      `${message}.`,
      `Selected restaurant metadata: ${JSON.stringify({
        restaurant_id: action.restaurantId,
        restaurant_name: sanitizeUntrustedPromptText(action.restaurantName, 80),
        mode: action.mode,
      })}.`,
      action.mode === "menu"
        ? "Lock this restaurant for all subsequent menu/cart calls unless the user explicitly asks to change restaurant."
        : "Use this exact restaurant identity for availability and booking checks.",
    ].join(" ");
  }

  if (isSlotSelectAction(action)) {
    const commonParts = [
      `${message}.`,
      `Selected slot metadata: ${JSON.stringify({
        slot_time: sanitizeUntrustedPromptText(action.slotTime, 40),
        slot_id: action.slotId,
        slot_token: action.slotToken,
        restaurant_name: action.restaurantName ? sanitizeUntrustedPromptText(action.restaurantName, 80) : undefined,
        restaurant_id: action.restaurantId,
      })}.`,
    ];

    if (verticalId === "dining") {
      return [
        ...commonParts,
        "Treat this slot selection as pre-booking intent only.",
        "Before calling any booking tool, ask one final explicit yes/no confirmation with full booking details.",
        "Only execute booking after that final confirmation.",
      ].join(" ");
    }

    return [
      ...commonParts,
      "Use this slot selection directly for availability/booking flow. Do not ask to reconfirm unless the slot token/id is invalid or unavailable.",
    ].join(" ");
  }

  return message;
}
