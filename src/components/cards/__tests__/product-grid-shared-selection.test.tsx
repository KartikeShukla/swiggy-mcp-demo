import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ParsedProduct } from "@/lib/types";
import { ProductGrid } from "../ProductGrid";

describe("ProductGrid shared selection mode", () => {
  it("hides per-section add-to-cart button and delegates quantity updates to shared handlers", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onIncrement = vi.fn();
    const onDecrement = vi.fn();

    const items: ParsedProduct[] = [
      { id: "p1", name: "Cheddar Cheese", itemType: "Cheese", price: 200 },
    ];

    render(
      <ProductGrid
        items={items}
        onAction={onAction}
        verticalId="food"
        sharedSelection={{
          quantities: { p1: 1 },
          onIncrement,
          onDecrement,
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /Add \d+ items to cart/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Increase Cheddar Cheese quantity" }));
    expect(onIncrement).toHaveBeenCalledWith(items[0]);

    await user.click(screen.getByRole("button", { name: "Decrease Cheddar Cheese quantity" }));
    expect(onDecrement).toHaveBeenCalledWith("p1");
    expect(onAction).not.toHaveBeenCalled();
  });
});

