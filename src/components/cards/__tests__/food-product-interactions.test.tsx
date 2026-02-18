import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ParsedProduct } from "@/lib/types";
import { ProductGrid } from "../ProductGrid";

describe("food product interactions", () => {
  it("updates quantities and emits deterministic bulk-add message", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const items: ParsedProduct[] = [
      { id: "p1", name: "Apple", price: 80, brand: "Farm Fresh" },
      { id: "p2", name: "Banana", price: 50, brand: "Farm Fresh" },
    ];

    render(<ProductGrid items={items} onAction={onAction} verticalId="food" />);

    await user.click(screen.getByRole("button", { name: "Add Apple to cart" }));
    await user.click(screen.getByRole("button", { name: "Increase Apple quantity" }));
    await user.click(screen.getByRole("button", { name: "Add Banana to cart" }));
    await user.click(screen.getByRole("button", { name: "Add 3 items to cart" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "cart_add_selection",
        message: "Add to cart: 2x Apple, 1x Banana",
      }),
    );
    const emitted = onAction.mock.calls[0][0];
    expect(emitted.kind).toBe("cart_add_selection");
    if (emitted.kind !== "cart_add_selection") return;
    expect(emitted.items).toHaveLength(2);
    expect(emitted.items[0]).toEqual(expect.objectContaining({
      uiProductId: "p1",
      name: "Apple",
      quantity: 2,
    }));
    expect(screen.getByRole("button", { name: "Add Apple to cart" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Banana to cart" })).toBeInTheDocument();
  });

  it("hides explicit out-of-stock products in nutrition tab", () => {
    const onAction = vi.fn();
    const items: ParsedProduct[] = [
      { id: "p1", name: "Dragon Fruit", price: 220, available: false, brand: "Farm Fresh" },
      { id: "p2", name: "Blueberries", price: 340, brand: "Farm Fresh" },
    ];

    render(<ProductGrid items={items} onAction={onAction} verticalId="food" />);

    expect(screen.queryByText("Dragon Fruit")).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
    expect(screen.queryAllByText("Blueberries").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add Dragon Fruit to cart" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Blueberries to cart" })).toBeInTheDocument();
  });
});
