import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AddressPicker } from "../AddressPicker";

describe("AddressPicker", () => {
  it("emits a structured select_address action with the real address id", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <AddressPicker
        addresses={[
          {
            id: "addr_789",
            label: "Home",
            address: "Sector 37, Gurugram",
          },
        ]}
        onAction={onAction}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: /Select Home address: Sector 37, Gurugram/i,
      }),
    );

    expect(onAction).toHaveBeenCalledWith({
      kind: "select_address",
      address: {
        id: "addr_789",
        label: "Home",
        address: "Sector 37, Gurugram",
      },
      message: "Use my Home address: Sector 37, Gurugram",
    });
  });
});
