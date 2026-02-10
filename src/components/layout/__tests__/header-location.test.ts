import { formatHeaderLocation } from "../header-location";

describe("formatHeaderLocation()", () => {
  it("returns fallback text when no address is selected", () => {
    expect(formatHeaderLocation(null)).toBe("No address");
  });

  it("renders shortened locality from selected address", () => {
    const location = formatHeaderLocation({
      id: "addr-1",
      label: "Home",
      address: "Room 5, First Floor, 1009/40, Huda Market, Sector 37, Gurugram, Haryana 122001, India",
    });

    expect(location).toBe("Huda Market");
  });

  it("uses shortened locality when label is empty", () => {
    const location = formatHeaderLocation({
      id: "addr-2",
      label: "",
      address: "11th Main Road, Koramangala, Bengaluru, Karnataka 560095, India",
    });

    expect(location).toBe("11th Main Road");
  });
});
