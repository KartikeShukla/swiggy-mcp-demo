import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ChatMessage } from "@/lib/types";
import { AssistantMessageBubble } from "../AssistantMessageBubble";

describe("AssistantMessageBubble details trigger", () => {
  it("renders See Details in header and opens detail sheet", async () => {
    const user = userEvent.setup();
    const message: ChatMessage = {
      role: "assistant",
      timestamp: Date.now(),
      content: [
        { type: "text", text: "I found options for you." },
        {
          type: "mcp_tool_use",
          id: "tool_1",
          name: "search_products",
          input: { query: "bread" },
        },
        {
          type: "mcp_tool_result",
          tool_use_id: "tool_1",
          content: [{ id: "p1", name: "Bread", price: 40 }],
        },
      ],
    };

    render(
      <AssistantMessageBubble
        message={message}
        verticalId="food"
        onAction={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "See Details" })).toBeInTheDocument();
    expect(screen.queryByText(/tool call/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "See Details" }));

    expect(await screen.findByRole("button", { name: "Tool Calls" })).toBeInTheDocument();
  });

  it("uses tool_use_id tool input when precomputing tool results", () => {
    const message: ChatMessage = {
      role: "assistant",
      timestamp: Date.now(),
      content: [
        {
          type: "mcp_tool_use",
          id: "tool_1",
          name: "search_products",
          input: { query: "bread" },
        },
        {
          type: "mcp_tool_use",
          id: "tool_2",
          name: "search_products",
          input: { query: "cheddar cheese" },
        },
        {
          // tool_2 appears before this result; correct grouping must still come from tool_1 input.
          type: "mcp_tool_result",
          tool_use_id: "tool_1",
          content: [{ id: "p1", name: "Classic Pack", price: 40 }],
        },
      ],
    };

    render(
      <AssistantMessageBubble
        message={message}
        verticalId="food"
        onAction={() => {}}
      />,
    );

    expect(screen.getByText("Bread")).toBeInTheDocument();
    expect(screen.queryByText("Cheddar Cheese")).not.toBeInTheDocument();
  });

  it("uses grounded summary copy for dining tool responses", () => {
    const message: ChatMessage = {
      role: "assistant",
      timestamp: Date.now(),
      content: [
        {
          type: "text",
          text: "Great! I found your exact 8 PM match and it is ready to book right away.",
        },
        {
          type: "mcp_tool_use",
          id: "tool_1",
          name: "search_restaurants",
          input: { query: "romantic italian koramangala" },
        },
        {
          type: "mcp_tool_result",
          tool_use_id: "tool_1",
          content: [{ id: "r1", name: "Saffron Table", cuisine: "Italian", locality: "Koramangala" }],
        },
      ],
    };

    render(
      <AssistantMessageBubble
        message={message}
        verticalId="dining"
        onAction={() => {}}
      />,
    );

    expect(screen.getByText("Here are restaurant options that best match your request.")).toBeInTheDocument();
    expect(screen.queryByText(/exact 8 PM match/i)).not.toBeInTheDocument();
  });
});
