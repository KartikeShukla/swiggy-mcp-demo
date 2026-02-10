import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatApi } from "@/hooks/useChatApi";
import { foodVertical } from "@/verticals/food";
import type { ChatMessage, ParsedAddress } from "@/lib/types";

vi.mock("@/lib/anthropic", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/integrations/anthropic/request-builder", () => ({
  buildMessageStreamParams: vi.fn(),
}));

vi.mock("@/integrations/anthropic/stream-runner", () => ({
  runMessageStream: vi.fn(),
}));

vi.mock("@/integrations/anthropic/error-classifier", () => ({
  classifyApiError: vi.fn((err: unknown) => ({
    message: err instanceof Error ? err.message : "unknown",
  })),
}));

import { createClient } from "@/lib/anthropic";
import { buildMessageStreamParams } from "@/integrations/anthropic/request-builder";
import { runMessageStream } from "@/integrations/anthropic/stream-runner";
import { classifyApiError } from "@/integrations/anthropic/error-classifier";

describe("useChatApi", () => {
  const mockedCreateClient = vi.mocked(createClient);
  const mockedBuildParams = vi.mocked(buildMessageStreamParams);
  const mockedRunMessageStream = vi.mocked(runMessageStream);

  const sampleMessages: ChatMessage[] = [
    { role: "user", content: "hello", timestamp: Date.now() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when api key is missing", async () => {
    const { result } = renderHook(() =>
      useChatApi(null, foodVertical, "swiggy-token"),
    );

    await expect(result.current.sendToApi(sampleMessages)).rejects.toThrow(
      "API key required",
    );
  });

  it("builds params with selected address and delegates to stream runner", async () => {
    const fakeClient = { id: "client" } as never;
    const fakeParams = { model: "x", messages: [] };
    const fakeResponse = {
      content: [{ type: "text" as const, text: "ok" }],
      usage: { input_tokens: 1, output_tokens: 1 },
    };

    mockedCreateClient.mockReturnValue(fakeClient);
    mockedBuildParams.mockReturnValue(fakeParams);
    mockedRunMessageStream.mockResolvedValue(fakeResponse);

    const onAuthError = vi.fn();
    const onAddressError = vi.fn();
    const selectedAddress: ParsedAddress = {
      id: "addr-1",
      label: "Home",
      address: "Sector 37, Gurugram",
    };

    const { result } = renderHook(() =>
      useChatApi(
        "anthropic-key",
        foodVertical,
        "swiggy-token",
        onAuthError,
        onAddressError,
        selectedAddress,
      ),
    );

    const response = await result.current.sendToApi(sampleMessages, "slots=goal,diet");

    expect(mockedCreateClient).toHaveBeenCalledWith("anthropic-key");
    expect(mockedBuildParams).toHaveBeenCalledWith(
      sampleMessages,
      foodVertical,
      "swiggy-token",
      selectedAddress,
      "slots=goal,diet",
    );
    expect(mockedRunMessageStream).toHaveBeenCalledWith(
      fakeClient,
      fakeParams,
      onAuthError,
      onAddressError,
    );
    expect(response).toEqual(fakeResponse);
  });

  it("exposes the shared error classifier", () => {
    const { result } = renderHook(() =>
      useChatApi("anthropic-key", foodVertical, "swiggy-token"),
    );

    const classified = result.current.classifyError(new Error("boom"));

    expect(classifyApiError).toHaveBeenCalledTimes(1);
    expect(classified).toEqual({ message: "boom" });
  });
});
