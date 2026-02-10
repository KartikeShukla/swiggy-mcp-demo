import { getActionMessage, isSelectAddressAction } from "@/lib/chat-actions";
import type { ChatAction } from "@/lib/types";

describe("chat action helpers", () => {
  it("extracts message from select_address action", () => {
    const action: ChatAction = {
      kind: "select_address",
      address: {
        id: "addr_123",
        label: "Home",
        address: "Sector 37, Gurugram",
      },
      message: "Use my Home address: Sector 37, Gurugram",
    };

    expect(isSelectAddressAction(action)).toBe(true);
    expect(getActionMessage(action)).toBe(
      "Use my Home address: Sector 37, Gurugram",
    );
  });

  it("extracts message from plain string and text actions", () => {
    expect(getActionMessage("Show menu")).toBe("Show menu");
    expect(getActionMessage({ kind: "text", text: "Open cart" })).toBe(
      "Open cart",
    );
  });
});
