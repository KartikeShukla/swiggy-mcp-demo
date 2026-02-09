import { render, screen } from "@testing-library/react";
import type { ChatMessage } from "@/lib/types";
import { MessageList } from "../MessageList";

describe("message list layout safety", () => {
  it("uses safe-area aware bottom padding so content clears the composer", () => {
    const messages: ChatMessage[] = [
      {
        role: "assistant",
        content: "Here are some options for you.",
        timestamp: Date.now(),
      },
    ];

    render(
      <MessageList
        messages={messages}
        loading={false}
        verticalId="foodorder"
        onAction={() => {}}
      />,
    );

    expect(screen.getByRole("log")).toBeInTheDocument();
    expect(screen.getByTestId("message-list-content")).toHaveStyle({
      paddingBottom: "calc(var(--safe-bottom) + 8rem)",
    });
  });
});
