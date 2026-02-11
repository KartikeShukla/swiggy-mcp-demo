import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ParsedProduct } from "@/lib/types";
import { ProductGrid } from "../ProductGrid";

describe("instamart product grouping", () => {
  it("groups nutrition/style products by item type instead of brand", () => {
    const items: ParsedProduct[] = [
      {
        id: "n1",
        name: "Neutrogena Deep Clean Face Wash",
        brand: "Neutrogena",
        price: 462,
      },
      {
        id: "c1",
        name: "Cetaphil Deep Clean Face Wash",
        brand: "Cetaphil",
        price: 499,
      },
      {
        id: "n2",
        name: "Neutrogena Oil Free Acne Face Wash",
        brand: "Neutrogena",
        price: 748,
      },
    ];

    render(<ProductGrid items={items} onAction={vi.fn()} verticalId="style" />);

    expect(screen.getByText("Deep Clean Face Wash")).toBeInTheDocument();
    expect(screen.getByText("Oil Free Acne Face")).toBeInTheDocument();
    expect(screen.queryByText("Neutrogena", { selector: "h4" })).not.toBeInTheDocument();
    expect(screen.queryByText("Cetaphil", { selector: "h4" })).not.toBeInTheDocument();
  });

  it("uses orange rail treatment and 1.5-card sizing in nutrition/style", () => {
    const items: ParsedProduct[] = [
      { id: "p1", name: "Hydrating Cleanser", brand: "Glow Labs", price: 299, itemType: "Cleanser" },
      { id: "p2", name: "Barrier Cream", brand: "Derma Co", price: 399, itemType: "Cleanser" },
      { id: "p3", name: "Foam Wash", brand: "SkinLab", price: 349, itemType: "Cleanser" },
    ];

    render(<ProductGrid items={items} onAction={vi.fn()} verticalId="food" />);

    const title = screen.getByText("Hydrating Cleanser");
    const wrapper = title.closest(".snap-start");
    const sectionCard = screen.getByText("Cleanser").closest('[data-slot="card"]');

    expect(wrapper).not.toBeNull();
    expect(wrapper?.className).toContain("w-[calc(66.666%_-_6.667px)]");
    expect(sectionCard?.className).toContain("border-orange-500/20");
    expect(sectionCard?.className).toContain("bg-orange-500/6");
  });

  it("groups order-tab menu items by category as horizontal rails", () => {
    const items: ParsedProduct[] = [
      { id: "m1", name: "Margherita Pizza", price: 299, groupLabel: "Pizzas", groupKey: "pizzas", groupOrder: 1 },
      { id: "m2", name: "Farmhouse Pizza", price: 349, groupLabel: "Pizzas", groupKey: "pizzas", groupOrder: 1 },
      { id: "m3", name: "Garlic Bread", price: 129, groupLabel: "Sides", groupKey: "sides", groupOrder: 0 },
    ];

    render(<ProductGrid items={items} onAction={vi.fn()} verticalId="foodorder" />);

    const titles = screen.getAllByText(/Pizzas|Sides/).map((node) => node.textContent);
    expect(titles).toEqual(["Sides", "Pizzas"]);
    expect(screen.getByText("Margherita Pizza")).toBeInTheDocument();
    expect(screen.getByText("Garlic Bread")).toBeInTheDocument();
  });
});
