import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ParsedProduct } from "@/lib/types";
import { ProductGrid } from "../ProductGrid";

describe("style product interactions", () => {
  it("preserves bulk-add action message contract for style flows", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const items: ParsedProduct[] = [
      { id: "p1", name: "Hydrating Cleanser", price: 299, brand: "Glow Labs" },
      { id: "p2", name: "SPF 50 Sunscreen", price: 399, brand: "Glow Labs" },
    ];

    render(<ProductGrid items={items} onAction={onAction} verticalId="style" />);

    await user.click(screen.getByRole("button", { name: "Add Hydrating Cleanser to cart" }));
    await user.click(screen.getByRole("button", { name: "Add SPF 50 Sunscreen to cart" }));
    await user.click(screen.getByRole("button", { name: "Add 2 items to cart" }));

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "cart_add_selection",
        message: "Add to cart: 1x Hydrating Cleanser, 1x SPF 50 Sunscreen",
      }),
    );
  });

  it("hides explicit out-of-stock products in styling tab", () => {
    const onAction = vi.fn();
    const items: ParsedProduct[] = [
      { id: "p1", name: "Vitamin C Serum", price: 699, available: false, brand: "Glow Labs" },
      { id: "p2", name: "Niacinamide Gel", price: 499, brand: "Glow Labs" },
    ];

    render(<ProductGrid items={items} onAction={onAction} verticalId="style" />);

    expect(screen.queryByText("Vitamin C Serum")).not.toBeInTheDocument();
    expect(screen.queryByText("Out of stock")).not.toBeInTheDocument();
    expect(screen.queryAllByText("Niacinamide Gel").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Add Vitamin C Serum to cart" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Niacinamide Gel to cart" })).toBeInTheDocument();
  });
});
