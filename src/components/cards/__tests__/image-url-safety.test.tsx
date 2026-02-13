import { render, screen } from "@testing-library/react";
import { ProductCard } from "@/components/cards/ProductCard";
import { RestaurantCard } from "@/components/cards/RestaurantCard";

describe("image URL safety in cards", () => {
  it("does not render product image for unsafe URL schemes", () => {
    render(
      <ProductCard
        product={{
          id: "p-1",
          name: "Unsafe Product",
          image: "javascript:alert(1)",
          price: 10,
        }}
        quantity={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />,
    );

    expect(
      screen.queryByRole("img", { name: "Unsafe Product" }),
    ).not.toBeInTheDocument();
  });

  it("does not render restaurant image for unsafe URL schemes", () => {
    render(
      <RestaurantCard
        restaurant={{
          id: "r-1",
          name: "Unsafe Restaurant",
          image: "data:image/png;base64,AAAA",
        }}
        onAction={() => {}}
      />,
    );

    expect(
      screen.queryByRole("img", { name: "Unsafe Restaurant" }),
    ).not.toBeInTheDocument();
  });

  it("renders image when URL is safe", () => {
    render(
      <ProductCard
        product={{
          id: "p-2",
          name: "Safe Product",
          image: "https://example.com/safe.png",
          price: 10,
        }}
        quantity={0}
        onIncrement={() => {}}
        onDecrement={() => {}}
      />,
    );

    expect(screen.getByRole("img", { name: "Safe Product" })).toBeInTheDocument();
  });
});
