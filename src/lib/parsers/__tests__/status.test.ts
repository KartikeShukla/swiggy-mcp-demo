import { tryParseStatus } from "@/lib/parsers/status";

describe("tryParseStatus()", () => {
  it("parses success=true with a message", () => {
    const result = tryParseStatus({ success: true, message: "Item added" });
    expect(result).not.toBeNull();
    expect(result!.type).toBe("status");
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(true);
    expect(result!.status.message).toBe("Item added");
  });

  it("parses success=false with a message", () => {
    const result = tryParseStatus({ success: false, message: "Failed to add" });
    expect(result).not.toBeNull();
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(false);
    expect(result!.status.message).toBe("Failed to add");
  });

  it("uses status string as message when no message field", () => {
    const result = tryParseStatus({ success: true, status: "completed" });
    if (result!.type !== "status") return;
    expect(result!.status.message).toBe("completed");
  });

  it("defaults message for success=true when no message or status string", () => {
    const result = tryParseStatus({ success: true });
    if (result!.type !== "status") return;
    expect(result!.status.message).toBe("Operation completed successfully");
  });

  it("defaults message for success=false when no message or status string", () => {
    const result = tryParseStatus({ success: false });
    if (result!.type !== "status") return;
    expect(result!.status.message).toBe("Operation failed");
  });

  it("infers success from status='success'", () => {
    const result = tryParseStatus({ status: "success", message: "Done" });
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(true);
  });

  it("infers success from status='ok'", () => {
    const result = tryParseStatus({ status: "ok", message: "All good" });
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(true);
  });

  it("infers success=false from non-success status string", () => {
    const result = tryParseStatus({ status: "error", message: "Something broke" });
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(false);
  });

  it("infers success from status=true (boolean)", () => {
    const result = tryParseStatus({ status: true, message: "OK" });
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(true);
  });

  it("collects extra fields as details", () => {
    const result = tryParseStatus({
      success: true,
      message: "Updated",
      orderId: "O1",
      timestamp: "2024-01-01",
    });
    if (result!.type !== "status") return;
    expect(result!.status.details).toEqual({
      orderId: "O1",
      timestamp: "2024-01-01",
    });
  });

  it("limits details to MAX_STATUS_DETAILS (6)", () => {
    const payload: Record<string, unknown> = {
      success: true,
      message: "OK",
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
      g: 7, // should be excluded
      h: 8, // should be excluded
    };
    const result = tryParseStatus(payload);
    if (result!.type !== "status") return;
    const detailKeys = Object.keys(result!.status.details!);
    expect(detailKeys).toHaveLength(6);
    expect(detailKeys).not.toContain("g");
    expect(detailKeys).not.toContain("h");
  });

  it("excludes success, message, and status from details", () => {
    const result = tryParseStatus({
      success: true,
      message: "Done",
      status: "ok",
      extra: "value",
    });
    if (result!.type !== "status") return;
    expect(result!.status.details).toEqual({ extra: "value" });
  });

  it("omits details when no extra fields exist", () => {
    const result = tryParseStatus({ success: true, message: "Simple" });
    if (result!.type !== "status") return;
    expect(result!.status.details).toBeUndefined();
  });

  it("skips null-valued extra fields", () => {
    const result = tryParseStatus({
      success: true,
      message: "OK",
      nullField: null,
      undefinedField: undefined,
      validField: "yes",
    });
    if (result!.type !== "status") return;
    expect(result!.status.details).toEqual({ validField: "yes" });
  });

  it("returns null for non-status objects (no message, no success)", () => {
    expect(tryParseStatus({ name: "test", price: 100 })).toBeNull();
  });

  it("returns null for arrays", () => {
    expect(tryParseStatus([{ success: true }])).toBeNull();
  });

  it("returns null for null", () => {
    expect(tryParseStatus(null)).toBeNull();
  });

  it("returns null for non-objects", () => {
    expect(tryParseStatus("string")).toBeNull();
    expect(tryParseStatus(42)).toBeNull();
    expect(tryParseStatus(undefined)).toBeNull();
  });

  it("returns null when there's only a status string (no message, no success boolean)", () => {
    // hasMessage is false, hasSuccess is false -> second guard triggers
    expect(tryParseStatus({ status: "pending" })).toBeNull();
  });

  it("parses when only message is present (no success field)", () => {
    const result = tryParseStatus({ message: "Something happened" });
    if (result!.type !== "status") return;
    expect(result!.status.success).toBe(true); // defaults to true
    expect(result!.status.message).toBe("Something happened");
  });
});
