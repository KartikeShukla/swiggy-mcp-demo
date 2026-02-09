import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { CartState } from "@/lib/types";
import { CartPanel } from "../CartPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const sampleCart: CartState = {
  items: [
    { id: "i1", name: "Paneer Roll", price: 160, quantity: 1 },
    { id: "i2", name: "Masala Fries", price: 120, quantity: 2 },
  ],
  subtotal: 400,
  deliveryFee: 40,
  total: 440,
};

describe("foodorder cart interactions", () => {
  function renderInSheet(onAction: (message: string) => void, onClose: () => void) {
    return render(
      <Sheet open onOpenChange={() => {}}>
        <SheetContent
          side="bottom"
          className="max-h-[84dvh] p-0"
          aria-describedby={undefined}
        >
          <CartPanel
            cart={sampleCart}
            onClose={onClose}
            onAction={onAction}
          />
        </SheetContent>
      </Sheet>,
    );
  }

  it("emits remove and quantity-change action messages", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    renderInSheet(onAction, vi.fn());

    await user.click(screen.getByRole("button", { name: "Remove Paneer Roll from cart" }));
    await user.click(screen.getByRole("button", { name: "Decrease Masala Fries quantity to 1" }));
    await user.click(screen.getByRole("button", { name: "Increase Masala Fries quantity to 3" }));

    expect(onAction).toHaveBeenNthCalledWith(1, "Remove Paneer Roll from my cart");
    expect(onAction).toHaveBeenNthCalledWith(2, "Change Masala Fries quantity to 1");
    expect(onAction).toHaveBeenNthCalledWith(3, "Change Masala Fries quantity to 3");
  });

  it("emits unchanged final confirmation message on continue", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onClose = vi.fn();

    renderInSheet(onAction, onClose);

    await user.click(screen.getByRole("button", { name: "Place Order (COD)" }));
    await user.click(screen.getByRole("button", { name: "Yes, place COD order" }));

    expect(onAction).toHaveBeenCalledWith("I confirm. Please place the order.");
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
