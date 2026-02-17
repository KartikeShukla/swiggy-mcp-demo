import { beforeEach, describe, expect, it, vi } from "vitest";
import { triggerBestEffortInstamartCartClear } from "@/lib/cart/remote-clear";
import { verticals } from "@/verticals";

vi.mock("@/lib/anthropic", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/integrations/anthropic/request-builder", () => ({
  buildMessageStreamParams: vi.fn(),
}));

vi.mock("@/integrations/anthropic/stream-runner", () => ({
  runMessageStream: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

import { createClient } from "@/lib/anthropic";
import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { runMessageStream } from "@/integrations/anthropic/stream-runner";
import { logger } from "@/lib/logger";

const mockedCreateClient = vi.mocked(createClient);
const mockedBuildMessageStreamParams = vi.mocked(buildMessageStreamParams);
const mockedRunMessageStream = vi.mocked(runMessageStream);
const mockedLogger = vi.mocked(logger);

describe("triggerBestEffortInstamartCartClear", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClient.mockReturnValue({} as never);
    mockedBuildMessageStreamParams.mockReturnValue({ model: "mock" });
    mockedRunMessageStream.mockResolvedValue({
      content: [],
      usage: { input_tokens: 0, output_tokens: 0 },
    });
  });

  it("no-ops when vertical is outside Nutrition/Style", async () => {
    await triggerBestEffortInstamartCartClear({
      verticalId: "dining",
      apiKey: "sk-test",
      swiggyToken: "swiggy-token",
    });

    expect(mockedCreateClient).not.toHaveBeenCalled();
    expect(mockedBuildMessageStreamParams).not.toHaveBeenCalled();
    expect(mockedRunMessageStream).not.toHaveBeenCalled();
  });

  it("no-ops when credentials are missing", async () => {
    await triggerBestEffortInstamartCartClear({
      verticalId: "food",
      apiKey: null,
      swiggyToken: "swiggy-token",
    });
    await triggerBestEffortInstamartCartClear({
      verticalId: "style",
      apiKey: "sk-test",
      swiggyToken: null,
    });

    expect(mockedCreateClient).not.toHaveBeenCalled();
    expect(mockedBuildMessageStreamParams).not.toHaveBeenCalled();
    expect(mockedRunMessageStream).not.toHaveBeenCalled();
  });

  it("builds and runs a best-effort clear-cart request", async () => {
    const address = {
      id: "addr-1",
      label: "Home",
      address: "HSR Layout",
    };

    await triggerBestEffortInstamartCartClear({
      verticalId: "food",
      apiKey: "sk-test",
      swiggyToken: "swiggy-token",
      selectedAddress: address,
    });

    expect(mockedCreateClient).toHaveBeenCalledWith("sk-test");
    expect(mockedBuildMessageStreamParams).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          role: "user",
          content: expect.stringContaining("Clear my Instamart cart completely."),
        }),
      ],
      verticals.food,
      "swiggy-token",
      address,
      null,
    );
    expect(mockedRunMessageStream).toHaveBeenCalledWith(
      expect.anything(),
      { model: "mock" },
    );
    expect(mockedLogger.debug).toHaveBeenCalledWith(
      "[Tab Switch] Background cart clear completed",
      { verticalId: "food" },
    );
  });

  it("swallows background clear errors and logs warning", async () => {
    mockedRunMessageStream.mockRejectedValue(new Error("network"));

    await expect(
      triggerBestEffortInstamartCartClear({
        verticalId: "style",
        apiKey: "sk-test",
        swiggyToken: "swiggy-token",
      }),
    ).resolves.toBeUndefined();

    expect(mockedLogger.warn).toHaveBeenCalledWith(
      "[Tab Switch] Background cart clear failed",
      expect.objectContaining({
        verticalId: "style",
      }),
    );
  });
});
