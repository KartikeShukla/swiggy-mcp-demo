import { tryParseTimeSlots } from "@/lib/parsers/time-slots";

describe("tryParseTimeSlots()", () => {
  it("parses string arrays as available time slots", () => {
    const result = tryParseTimeSlots(["10:00 AM", "11:00 AM", "12:00 PM"]);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("time_slots");
    if (result!.type !== "time_slots") return;
    expect(result!.slots).toHaveLength(3);
    expect(result!.slots[0]).toEqual({ time: "10:00 AM", available: true });
    expect(result!.slots[1]).toEqual({ time: "11:00 AM", available: true });
    expect(result!.slots[2]).toEqual({ time: "12:00 PM", available: true });
  });

  it("parses object arrays with time and available fields", () => {
    const result = tryParseTimeSlots([
      { time: "10:00 AM", available: true },
      { time: "11:00 AM", available: false },
    ]);
    expect(result).not.toBeNull();
    if (result!.type !== "time_slots") return;
    expect(result!.slots).toHaveLength(2);
    expect(result!.slots[0]).toEqual({ time: "10:00 AM", available: true });
    expect(result!.slots[1]).toEqual({ time: "11:00 AM", available: false });
  });

  it("resolves time from slot key", () => {
    const result = tryParseTimeSlots([{ slot: "2:00 PM" }]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots[0].time).toBe("2:00 PM");
  });

  it("resolves time from label key", () => {
    const result = tryParseTimeSlots([{ label: "Evening" }]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots[0].time).toBe("Evening");
  });

  it("resolves time from start_time key", () => {
    const result = tryParseTimeSlots([{ start_time: "09:00" }]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots[0].time).toBe("09:00");
  });

  it("defaults available to true when not provided in object", () => {
    const result = tryParseTimeSlots([{ time: "3:00 PM" }]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots[0].available).toBe(true);
  });

  it("returns null for empty array", () => {
    expect(tryParseTimeSlots([])).toBeNull();
  });

  it("returns null for non-array input", () => {
    expect(tryParseTimeSlots("not array")).toBeNull();
    expect(tryParseTimeSlots(null)).toBeNull();
    expect(tryParseTimeSlots(42)).toBeNull();
    expect(tryParseTimeSlots({ time: "10:00" })).toBeNull();
  });

  it("skips objects without a recognized time key", () => {
    const result = tryParseTimeSlots([
      { someKey: "value" },
      { time: "4:00 PM" },
    ]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots).toHaveLength(1);
    expect(result!.slots[0].time).toBe("4:00 PM");
  });

  it("returns null when all items are skipped", () => {
    expect(tryParseTimeSlots([{ foo: "bar" }, { baz: 123 }])).toBeNull();
  });

  it("handles mixed string and object items", () => {
    const result = tryParseTimeSlots([
      "9:00 AM",
      { time: "10:00 AM", available: false },
      "11:00 AM",
    ]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots).toHaveLength(3);
    expect(result!.slots[0]).toEqual({ time: "9:00 AM", available: true });
    expect(result!.slots[1]).toEqual({ time: "10:00 AM", available: false });
    expect(result!.slots[2]).toEqual({ time: "11:00 AM", available: true });
  });

  it("skips null and non-object/non-string items", () => {
    const result = tryParseTimeSlots([null, 42, { time: "5:00 PM" }]);
    if (result!.type !== "time_slots") return;
    expect(result!.slots).toHaveLength(1);
  });
});
