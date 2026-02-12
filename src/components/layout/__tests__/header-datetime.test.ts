import { formatHeaderDateTime } from "../header-datetime";

describe("formatHeaderDateTime", () => {
  it("returns a non-empty string", () => {
    const result = formatHeaderDateTime();
    expect(result.length).toBeGreaterThan(0);
  });

  it("contains AM or PM", () => {
    const result = formatHeaderDateTime().toLowerCase();
    expect(result).toMatch(/am|pm/);
  });

  it("contains an abbreviated day of week", () => {
    const result = formatHeaderDateTime();
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });
});
