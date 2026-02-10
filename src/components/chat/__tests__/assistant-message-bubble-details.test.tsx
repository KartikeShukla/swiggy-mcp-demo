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
});
