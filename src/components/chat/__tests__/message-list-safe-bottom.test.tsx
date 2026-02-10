import { render, screen } from "@testing-library/react";
import type { ChatMessage } from "@/lib/types";
import { MessageList } from "../MessageList";

describe("message list layout safety", () => {
  it("uses top and safe-area-aware bottom padding so content clears header and composer", () => {
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
    const content = screen.getByTestId("message-list-content");

    expect(content).toHaveStyle({
      paddingTop: "1rem",
      paddingBottom: "calc(var(--safe-bottom) + 8rem)",
    });
    expect(content.style.getPropertyValue("--tool-section-max-h")).toMatch(/^\d+px$/);
  });
});
