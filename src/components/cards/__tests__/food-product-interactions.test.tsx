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

    render(<ProductGrid items={items} onAction={onAction} />);

    await user.click(screen.getByRole("button", { name: "Add Apple to cart" }));
    await user.click(screen.getByRole("button", { name: "Increase Apple quantity" }));
    await user.click(screen.getByRole("button", { name: "Add Banana to cart" }));
    await user.click(screen.getByRole("button", { name: "Add 3 items to cart" }));

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(
      "Add the following items to my cart: 2x Apple, 1x Banana",
    );
    expect(screen.getByRole("button", { name: "Add Apple to cart" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Banana to cart" })).toBeInTheDocument();
  });

  it("does not render add controls for unavailable products", () => {
    const onAction = vi.fn();
    const items: ParsedProduct[] = [
      { id: "p1", name: "Dragon Fruit", price: 220, available: false, brand: "Farm Fresh" },
    ];

    render(<ProductGrid items={items} onAction={onAction} />);

    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Dragon Fruit to cart" })).not.toBeInTheDocument();
  });
});
