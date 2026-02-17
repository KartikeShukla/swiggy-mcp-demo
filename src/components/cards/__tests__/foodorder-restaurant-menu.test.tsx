import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ParsedToolResult } from "@/lib/types";
import { ItemCardGrid } from "../ItemCardGrid";

describe("foodorder restaurant interactions", () => {
  it("emits menu-intent action message for foodorder restaurant cards", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const result: ParsedToolResult = {
      type: "restaurants",
      items: [
        { id: "r1", name: "Spice Route", cuisine: "North Indian", rating: 4.2 },
      ],
    };

    render(
      <ItemCardGrid
        result={result}
        onAction={onAction}
        verticalId="foodorder"
      />,
    );

    await user.click(screen.getByRole("button", { name: "View Menu Spice Route" }));

    expect(onAction).toHaveBeenCalledWith({
      kind: "restaurant_select",
      message: "Open menu for restaurant: Spice Route",
      restaurantId: "r1",
      restaurantName: "Spice Route",
      mode: "menu",
    });
  });

  it("renders menu cards with add actions (not view-menu actions) for product results", () => {
    const onAction = vi.fn();
    const result: ParsedToolResult = {
      type: "products",
      items: [
        { id: "m1", name: "Falafel-E-Khaas", price: 320, description: "Veg" },
      ],
    };

    render(
      <ItemCardGrid
        result={result}
        onAction={onAction}
        verticalId="foodorder"
      />,
    );

    expect(screen.getByRole("button", { name: "Add Falafel-E-Khaas to cart" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /View Menu/i })).not.toBeInTheDocument();
  });
});
