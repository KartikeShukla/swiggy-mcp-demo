import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { ParsedToolResult } from "@/lib/types";
import { ItemCardGrid } from "../ItemCardGrid";
import { TimeSlotPicker } from "../TimeSlotPicker";

describe("dining interactions", () => {
  it("emits availability action message for dining restaurant cards", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const result: ParsedToolResult = {
      type: "restaurants",
      items: [
        { id: "r1", name: "Saffron Table", cuisine: "Indian", rating: 4.5 },
      ],
    };

    render(
      <ItemCardGrid
        result={result}
        onAction={onAction}
        verticalId="dining"
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Check Availability Saffron Table" }),
    );

    expect(onAction).toHaveBeenCalledWith("Check availability at Saffron Table");
  });

  it("requires confirmation before emitting a booking message", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <TimeSlotPicker
        slots={[
          { time: "7:30 PM", available: true },
          { time: "8:00 PM", available: false },
        ]}
        restaurantName="Saffron Table"
        onAction={onAction}
      />,
    );

    const unavailableSlot = screen.getByRole("button", { name: "8:00 PM (unavailable)" });
    expect(unavailableSlot).toBeDisabled();
    await user.click(unavailableSlot);
    expect(onAction).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "7:30 PM" }));
    expect(onAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Are you sure you want to book this slot?" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Yes, book this slot" }));
    expect(onAction).toHaveBeenCalledWith("Book a table at Saffron Table for 7:30 PM");
  });
});
