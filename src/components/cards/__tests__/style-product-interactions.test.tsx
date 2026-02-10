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

    render(<ProductGrid items={items} onAction={onAction} />);

    await user.click(screen.getByRole("button", { name: "Add Hydrating Cleanser to cart" }));
    await user.click(screen.getByRole("button", { name: "Add SPF 50 Sunscreen to cart" }));
    await user.click(screen.getByRole("button", { name: "Add 2 items to cart" }));

    expect(onAction).toHaveBeenCalledWith("Add to cart: 1x Hydrating Cleanser, 1x SPF 50 Sunscreen");
  });
});
