import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ParsedProduct, ParsedToolResult } from "@/lib/types";
import { ProductGrid } from "../ProductGrid";
import { ItemCardGrid } from "../ItemCardGrid";

const baseProducts: ParsedProduct[] = [
  { id: "p1", name: "Tomato", price: 40, brand: "Fresh Farm" },
  { id: "p2", name: "Onion", price: 30, brand: "Fresh Farm" },
  { id: "p3", name: "Potato", price: 35, brand: "Fresh Farm" },
  { id: "p4", name: "Garlic", price: 50, brand: "Fresh Farm" },
];

describe("card rail layout sizing", () => {
  it("keeps product cards full-width in multi-row rail mode", () => {
    render(<ProductGrid items={baseProducts} onAction={vi.fn()} />);

    const title = screen.getByText("Tomato");
    const wrapper = title.closest(".snap-start");
    const card = title.closest('[data-slot="card"]');

    expect(wrapper).not.toBeNull();
    expect(card).not.toBeNull();
    expect(wrapper?.className).toContain("w-full");
    expect(wrapper?.className).toContain("h-full");
    expect(card?.className).toContain("w-full");
    expect(card?.className).toContain("h-full");
    expect(card?.className).not.toContain("w-[calc(50%_-_5px)]");
  });

  it("applies explicit two-up width only in single-row flex rail mode", () => {
    render(<ProductGrid items={baseProducts.slice(0, 2)} onAction={vi.fn()} />);

    const title = screen.getByText("Tomato");
    const wrapper = title.closest(".snap-start");
    const card = title.closest('[data-slot="card"]');

    expect(wrapper).not.toBeNull();
    expect(card).not.toBeNull();
    expect(wrapper?.className).toContain("w-[calc(50%_-_5px)]");
    expect(wrapper?.className).toContain("shrink-0");
    expect(wrapper?.className).toContain("h-full");
    expect(card?.className).toContain("w-full");
    expect(card?.className).toContain("h-full");
  });

  it("keeps restaurant cards readable in foodorder multi-row rails", () => {
    const result: ParsedToolResult = {
      type: "restaurants",
      items: [
        { id: "r1", name: "Bistro Alpha", rating: 4.2 },
        { id: "r2", name: "Bistro Beta", rating: 4.1 },
        { id: "r3", name: "Bistro Gamma", rating: 4.0 },
        { id: "r4", name: "Bistro Delta", rating: 3.9 },
      ],
    };

    render(
      <ItemCardGrid
        result={result}
        onAction={vi.fn()}
        verticalId="foodorder"
      />,
    );

    const title = screen.getByText("Bistro Alpha");
    const wrapper = title.closest(".snap-start");
    const card = title.closest('[data-slot="card"]');

    expect(wrapper).not.toBeNull();
    expect(card).not.toBeNull();
    expect(wrapper?.className).toContain("w-full");
    expect(wrapper?.className).toContain("h-full");
    expect(card?.className).toContain("w-full");
    expect(card?.className).toContain("h-full");
    expect(screen.getAllByRole("button", { name: /View Menu/i })).toHaveLength(4);
  });
});
