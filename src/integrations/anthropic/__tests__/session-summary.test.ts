import { buildSessionStateSummary } from "@/integrations/anthropic/session-summary";
import type { ChatMessage } from "@/lib/types";

function user(content: string): ChatMessage {
  return {
    role: "user",
    content,
    timestamp: Date.now(),
  };
}

describe("buildSessionStateSummary", () => {
  it("returns null when confidence is low", () => {
    const summary = buildSessionStateSummary([user("hello")], "food");
    expect(summary).toBeNull();
  });

  it("summarizes food context when key slots are present", () => {
    const summary = buildSessionStateSummary(
      [user("Need a high-protein vegan dinner for 3 people under 700 rupees")],
      "food",
    );

    expect(summary).toContain("slots=");
    expect(summary).toContain("diet");
    expect(summary).toContain("servings");
    expect(summary).toContain("intent=discover");
    expect(summary).toContain("confirm=no");
  });

  it("includes confirmation signal when detected", () => {
    const summary = buildSessionStateSummary(
      [
        user("Find italian in indiranagar for 4 tomorrow 8 pm"),
        user("yes confirm and book it"),
      ],
      "dining",
    );

    expect(summary).toContain("slots=");
    expect(summary).toContain("confirm=yes");
    expect(summary).toContain("intent=confirm");
  });

  it("captures foodorder menu intent and selected restaurant", () => {
    const summary = buildSessionStateSummary(
      [user("Open menu for restaurant: Behrouz Biryani")],
      "foodorder",
    );

    expect(summary).toContain("intent=menu");
    expect(summary).toContain("restaurant=Behrouz Biryani");
  });

  it("adds location lock when selected address exists", () => {
    const summary = buildSessionStateSummary(
      [user("find top biryani places")],
      "foodorder",
      {
        id: "a1",
        label: "Home",
        address: "Sector 37, Gurugram",
      },
    );

    expect(summary).toContain("location=locked:Home");
    expect(summary).toContain("a1");
  });
});
