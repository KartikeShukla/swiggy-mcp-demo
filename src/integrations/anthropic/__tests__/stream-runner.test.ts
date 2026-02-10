import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@anthropic-ai/sdk", () => {
  class APIUserAbortError extends Error {
    constructor(message = "aborted") {
      super(message);
      this.name = "APIUserAbortError";
    }
  }

  return {
    default: class Anthropic {},
    APIUserAbortError,
  };
});

import { APIUserAbortError } from "@anthropic-ai/sdk";
import { runMessageStream } from "@/integrations/anthropic/stream-runner";
import { ABORT_MESSAGES } from "@/integrations/anthropic/mcp-tool-errors";
import type { ContentBlock } from "@/lib/types";

type Handler = (payload: unknown) => void;

class FakeStream {
  public currentMessage?: {
    content: ContentBlock[];
    usage: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };

  private handlers = new Map<string, Handler[]>();

  constructor(
    private readonly cfg: {
      contentBlocks?: unknown[];
      finalMessage?: {
        content: ContentBlock[];
        usage: {
          input_tokens: number;
          output_tokens: number;
          cache_creation_input_tokens?: number;
          cache_read_input_tokens?: number;
        };
      };
      finalError?: Error;
      currentMessage?: {
        content: ContentBlock[];
        usage: {
          input_tokens: number;
          output_tokens: number;
          cache_creation_input_tokens?: number;
          cache_read_input_tokens?: number;
        };
      };
    } = {},
  ) {
    this.currentMessage = cfg.currentMessage;
  }

  on(event: string, handler: Handler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  abort(): void {
    this.cfg.finalError = new APIUserAbortError("aborted");
  }

  async finalMessage() {
    for (const block of this.cfg.contentBlocks ?? []) {
      for (const handler of this.handlers.get("contentBlock") ?? []) {
        handler(block);
      }
    }

    if (this.cfg.finalError) {
      throw this.cfg.finalError;
    }

    if (!this.cfg.finalMessage) {
      throw new Error("missing final message");
    }

    return this.cfg.finalMessage;
  }
}

function makeClient(stream: FakeStream) {
  return {
    beta: {
      messages: {
        stream: vi.fn(() => stream),
      },
    },
  };
}

describe("runMessageStream", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns sanitized final content and usage when stream completes", async () => {
    const stream = new FakeStream({
      finalMessage: {
        content: [
          { type: "text", text: "done" },
          {
            type: "mcp_tool_result",
            tool_use_id: "missing",
            content: [{ type: "text", text: "orphan" }],
          },
        ],
        usage: { input_tokens: 11, output_tokens: 7 },
      },
    });

    const result = await runMessageStream(
      makeClient(stream) as never,
      {},
      undefined,
      undefined,
    );

    expect(result.content).toEqual([{ type: "text", text: "done" }]);
    expect(result.usage).toEqual({
      input_tokens: 11,
      output_tokens: 7,
      cache_creation_input_tokens: undefined,
      cache_read_input_tokens: undefined,
    });
  });

  it("returns partial content when stream ends without assistant message", async () => {
    const stream = new FakeStream({
      finalError: new Error("stream ended without producing a Message with role=assistant"),
      currentMessage: {
        content: [{ type: "text", text: "partial response" }],
        usage: { input_tokens: 22, output_tokens: 9 },
      },
    });

    const result = await runMessageStream(makeClient(stream) as never, {});

    expect(result.content).toEqual([{ type: "text", text: "partial response" }]);
    expect(result.usage.input_tokens).toBe(22);
    expect(result.usage.output_tokens).toBe(9);
  });

  it("aborts on auth MCP tool error and returns auth guidance", async () => {
    const onAuthError = vi.fn();
    const onAddressError = vi.fn();

    const stream = new FakeStream({
      contentBlocks: [
        {
          type: "mcp_tool_result",
          is_error: true,
          content: [{ type: "text", text: "401 Unauthorized token expired" }],
        },
      ],
      currentMessage: {
        content: [{ type: "text", text: "partial" }],
        usage: { input_tokens: 50, output_tokens: 5 },
      },
    });

    const result = await runMessageStream(
      makeClient(stream) as never,
      {},
      onAuthError,
      onAddressError,
    );

    expect(onAuthError).toHaveBeenCalledTimes(1);
    expect(onAddressError).not.toHaveBeenCalled();
    expect(result.content.at(-1)).toEqual({
      type: "text",
      text: ABORT_MESSAGES.auth,
    });
  });

  it("aborts on address MCP tool error and returns address guidance", async () => {
    const onAuthError = vi.fn();
    const onAddressError = vi.fn();

    const stream = new FakeStream({
      contentBlocks: [
        {
          type: "mcp_tool_result",
          is_error: true,
          content: [{ type: "text", text: "Address with ID not found for user" }],
        },
      ],
      currentMessage: {
        content: [{ type: "text", text: "partial" }],
        usage: { input_tokens: 39, output_tokens: 3 },
      },
    });

    const result = await runMessageStream(
      makeClient(stream) as never,
      {},
      onAuthError,
      onAddressError,
    );

    expect(onAddressError).toHaveBeenCalledTimes(1);
    expect(onAuthError).not.toHaveBeenCalled();
    expect(result.content.at(-1)).toEqual({
      type: "text",
      text: ABORT_MESSAGES.address,
    });
  });
});
