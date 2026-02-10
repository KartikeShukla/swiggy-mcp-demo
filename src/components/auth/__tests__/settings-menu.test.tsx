import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { SettingsMenu } from "../SettingsMenu";

describe("SettingsMenu swiggy toggle", () => {
  it("disconnects when connected", async () => {
    const user = userEvent.setup();
    const onConnectSwiggy = vi.fn();
    const onDisconnectSwiggy = vi.fn();

    render(
      <SettingsMenu
        hasApiKey
        hasSwiggyToken
        hasAddress
        onChangeApiKey={vi.fn()}
        onConnectSwiggy={onConnectSwiggy}
        onDisconnectSwiggy={onDisconnectSwiggy}
        onClearChats={vi.fn()}
        onChangeAddress={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(await screen.findByRole("button", { name: "Disconnect Swiggy" }));

    expect(onDisconnectSwiggy).toHaveBeenCalledTimes(1);
    expect(onConnectSwiggy).not.toHaveBeenCalled();
  });

  it("reconnects when disconnected", async () => {
    const user = userEvent.setup();
    const onConnectSwiggy = vi.fn();
    const onDisconnectSwiggy = vi.fn();

    render(
      <SettingsMenu
        hasApiKey
        hasSwiggyToken={false}
        hasAddress={false}
        onChangeApiKey={vi.fn()}
        onConnectSwiggy={onConnectSwiggy}
        onDisconnectSwiggy={onDisconnectSwiggy}
        onClearChats={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: /settings/i }));
    await user.click(await screen.findByRole("button", { name: "Connect Swiggy" }));

    expect(onConnectSwiggy).toHaveBeenCalledTimes(1);
    expect(onDisconnectSwiggy).not.toHaveBeenCalled();
  });
});

