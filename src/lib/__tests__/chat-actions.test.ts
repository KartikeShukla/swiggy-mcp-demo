import {
  getActionMessage,
  isCartAddSelectionAction,
  isCartUpdateItemAction,
  isRestaurantSelectAction,
  isSelectAddressAction,
  isSlotSelectAction,
} from "@/lib/chat-actions";
import type { ChatAction } from "@/lib/types";

describe("chat action helpers", () => {
  it("extracts message from select_address action", () => {
    const action: ChatAction = {
      kind: "select_address",
      address: {
        id: "addr_123",
        label: "Home",
        address: "Sector 37, Gurugram",
      },
      message: "Use my Home address: Sector 37, Gurugram",
    };

    expect(isSelectAddressAction(action)).toBe(true);
    expect(getActionMessage(action)).toBe(
      "Use my Home address: Sector 37, Gurugram",
    );
  });

  it("extracts message from plain string and text actions", () => {
    expect(getActionMessage("Show menu")).toBe("Show menu");
    expect(getActionMessage({ kind: "text", text: "Open cart" })).toBe(
      "Open cart",
    );
  });

  it("extracts message and type-guards for structured actions", () => {
    const addAction: ChatAction = {
      kind: "cart_add_selection",
      message: "Add to cart: 1x Apple",
      items: [{ uiProductId: "p1", name: "Apple", quantity: 1 }],
    };
    const updateAction: ChatAction = {
      kind: "cart_update_item",
      message: "Change Apple quantity to 2",
      itemId: "p1",
      itemName: "Apple",
      targetQuantity: 2,
    };
    const restaurantAction: ChatAction = {
      kind: "restaurant_select",
      message: "Open menu for restaurant: Spice Route",
      restaurantId: "r1",
      restaurantName: "Spice Route",
      mode: "menu",
    };
    const slotAction: ChatAction = {
      kind: "slot_select",
      message: "Book a table at Spice Route for 8:00 PM",
      slotTime: "8:00 PM",
    };

    expect(isCartAddSelectionAction(addAction)).toBe(true);
    expect(isCartUpdateItemAction(updateAction)).toBe(true);
    expect(isRestaurantSelectAction(restaurantAction)).toBe(true);
    expect(isSlotSelectAction(slotAction)).toBe(true);
    expect(getActionMessage(addAction)).toBe("Add to cart: 1x Apple");
    expect(getActionMessage(updateAction)).toBe("Change Apple quantity to 2");
    expect(getActionMessage(restaurantAction)).toBe("Open menu for restaurant: Spice Route");
    expect(getActionMessage(slotAction)).toBe("Book a table at Spice Route for 8:00 PM");
  });
});
