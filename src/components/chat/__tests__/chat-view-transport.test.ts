import type { ChatAction } from "@/lib/types";
import { buildTransportMessageForAction } from "../transport-message";

describe("buildTransportMessageForAction", () => {
  it("requires one final explicit confirmation before booking for dining slot selections", () => {
    const action: ChatAction = {
      kind: "slot_select",
      message: "Book a table at Saffron Table for 7:30 PM",
      slotTime: "7:30 PM",
      slotId: "slot-1",
      slotToken: "tok-1",
      restaurantName: "Saffron Table",
      restaurantId: "rest-1",
    };

    const transport = buildTransportMessageForAction(action, "dining", null);
    expect(transport).toContain("Treat this slot selection as pre-booking intent only.");
    expect(transport).toContain("ask one final explicit yes/no confirmation");
    expect(transport).toContain("Only execute booking after that final confirmation.");
    expect(transport).not.toContain("Do not ask to reconfirm");
  });

  it("keeps non-dining slot behavior unchanged", () => {
    const action: ChatAction = {
      kind: "slot_select",
      message: "Book a table at Saffron Table for 7:30 PM",
      slotTime: "7:30 PM",
      slotId: "slot-1",
      slotToken: "tok-1",
      restaurantName: "Saffron Table",
      restaurantId: "rest-1",
    };

    const transport = buildTransportMessageForAction(action, "foodorder", null);
    expect(transport).toContain("Use this slot selection directly for availability/booking flow.");
  });
});
