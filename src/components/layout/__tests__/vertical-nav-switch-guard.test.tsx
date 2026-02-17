import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { VerticalNav } from "@/components/layout/VerticalNav";
import { getChatHistory, setChatHistory } from "@/lib/storage";

vi.mock("@/lib/cart/remote-clear", () => ({
  triggerBestEffortInstamartCartClear: vi.fn(() => Promise.resolve()),
}));

import { triggerBestEffortInstamartCartClear } from "@/lib/cart/remote-clear";

const mockedTriggerBestEffortInstamartCartClear = vi.mocked(
  triggerBestEffortInstamartCartClear,
);

function PathnameProbe() {
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

function renderNav(initialPath = "/food") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="*"
          element={(
            <>
              <VerticalNav
                apiKey="sk-test"
                swiggyToken="swiggy-token"
                selectedAddress={{ id: "addr-1", label: "Home", address: "HSR Layout" }}
              />
              <PathnameProbe />
            </>
          )}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VerticalNav Nutrition/Style switch guard", () => {
  const confirmHeadingPattern = /Switch tab and clear\s*current session\?/i;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("opens confirmation dialog and stays on current tab when canceled", async () => {
    const user = userEvent.setup();
    setChatHistory("food", [
      { role: "user", content: "find whey protein", timestamp: 1 },
    ]);

    renderNav("/food");

    await user.click(screen.getByRole("link", { name: "Styling" }));

    expect(screen.getByTestId("pathname")).toHaveTextContent("/food");
    expect(
      screen.getByRole("heading", { name: confirmHeadingPattern }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stay here" }));

    expect(screen.getByTestId("pathname")).toHaveTextContent("/food");
    expect(
      screen.queryByRole("heading", { name: confirmHeadingPattern }),
    ).not.toBeInTheDocument();
  });

  it("clears source chat and switches tabs on confirmation", async () => {
    const user = userEvent.setup();
    setChatHistory("food", [
      { role: "user", content: "add oats", timestamp: 1 },
    ]);

    renderNav("/food");

    await user.click(screen.getByRole("link", { name: "Styling" }));
    await user.click(screen.getByRole("button", { name: "Clear and switch" }));

    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/style");
    });

    expect(getChatHistory("food")).toHaveLength(0);
    expect(mockedTriggerBestEffortInstamartCartClear).toHaveBeenCalledWith(
      expect.objectContaining({
        verticalId: "food",
        apiKey: "sk-test",
        swiggyToken: "swiggy-token",
      }),
    );
  });

  it("switches directly without prompt when there is no clearable source state", async () => {
    const user = userEvent.setup();
    renderNav("/food");

    await user.click(screen.getByRole("link", { name: "Styling" }));

    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/style");
    });
    expect(
      screen.queryByRole("heading", { name: confirmHeadingPattern }),
    ).not.toBeInTheDocument();
    expect(mockedTriggerBestEffortInstamartCartClear).not.toHaveBeenCalled();
  });

  it("does not guard non Nutrition/Style tab switches", async () => {
    const user = userEvent.setup();
    setChatHistory("food", [
      { role: "user", content: "find milk", timestamp: 1 },
    ]);

    renderNav("/food");

    await user.click(screen.getByRole("link", { name: "Dine" }));

    await waitFor(() => {
      expect(screen.getByTestId("pathname")).toHaveTextContent("/dining");
    });
    expect(
      screen.queryByRole("heading", { name: confirmHeadingPattern }),
    ).not.toBeInTheDocument();
  });
});
