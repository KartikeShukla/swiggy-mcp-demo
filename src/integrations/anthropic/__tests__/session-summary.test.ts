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
  it("returns summary without datetime for simple messages", () => {
    const summary = buildSessionStateSummary([user("hello")], "food");
    expect(summary).not.toBeNull();
    expect(summary).not.toContain("datetime=");
    expect(summary).toContain("slots=");
    expect(summary).toContain("intent=");
    expect(summary).toContain("confirm=");
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
    expect(summary).toContain("mode=menu");
    expect(summary).toContain("restaurant=Behrouz Biryani");
    expect(summary).toContain("dish:biryani");
  });

  it("keeps latest selected restaurant even after subsequent cart actions", () => {
    const summary = buildSessionStateSummary(
      [
        user("Open menu for restaurant: Behrouz Biryani"),
        user("Add to cart: 1x Chicken Biryani"),
      ],
      "foodorder",
    );

    expect(summary).toContain("intent=cart");
    expect(summary).toContain("mode=cart");
    expect(summary).toContain("restaurant=Behrouz Biryani");
  });

  it("does not include datetime signal (handled by request-builder)", () => {
    const summary = buildSessionStateSummary(
      [user("Need a high-protein vegan dinner for 3 people under 700 rupees")],
      "food",
    );

    expect(summary).not.toContain("datetime=");
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

  it("captures foodorder constraint filters for strict-first relevance", () => {
    const summary = buildSessionStateSummary(
      [user("I want spicy south indian food and dosa under 300")],
      "foodorder",
    );

    expect(summary).toContain("filters=");
    expect(summary).toContain("cuisine:south indian");
    expect(summary).toContain("dish:dosa");
    expect(summary).toContain("spicy:true");
    expect(summary).toContain("budget:300");
  });

  it("captures dining strict-first filters for cuisine, vibe, area, and party context", () => {
    const summary = buildSessionStateSummary(
      [user("Romantic south indian dinner in Koramangala for 4 under 1500 tonight")],
      "dining",
    );

    expect(summary).toContain("filters=");
    expect(summary).toContain("cuisine:south indian");
    expect(summary).toContain("vibe:romantic");
    expect(summary).toContain("area:koramangala");
    expect(summary).toContain("budget:1500");
    expect(summary).toContain("party:4");
    expect(summary).toContain("time:tonight|dinner");
  });

  it("captures sunday in dining time filters", () => {
    const summary = buildSessionStateSummary(
      [user("South Indian in Koramangala Sunday dinner for 2")],
      "dining",
    );

    expect(summary).toContain("filters=");
    expect(summary).toContain("area:koramangala");
    expect(summary).toContain("time:sunday|dinner");
  });
});
