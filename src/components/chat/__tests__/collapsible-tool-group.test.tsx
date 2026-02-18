import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { ContentBlock } from "@/lib/types";
import { CollapsibleToolGroup } from "../CollapsibleToolGroup";

describe("CollapsibleToolGroup", () => {
  it("merges nutrition/style product results from multiple tool calls into one grouped rail set", () => {
    const allBlocks: ContentBlock[] = [
      {
        type: "mcp_tool_use",
        id: "tu-1",
        name: "search_products",
        input: { query: "bread for toast" },
      },
      {
        type: "mcp_tool_result",
        tool_use_id: "tu-1",
        content: JSON.stringify([
          { id: "b1", name: "Harvest Gold Bread", brand: "Harvest Gold", price: 80, item_type: "Bread" },
        ]),
      },
      {
        type: "mcp_tool_use",
        id: "tu-2",
        name: "search_products",
        input: { query: "cheese for toast" },
      },
      {
        type: "mcp_tool_result",
        tool_use_id: "tu-2",
        content: JSON.stringify([
          { id: "b2", name: "Britannia Bread", brand: "Britannia", price: 70, item_type: "Bread" },
          { id: "c0", name: "Processed Cheese Cubes", brand: "Amul", price: 115, item_type: "Cheese", available: false },
          { id: "c1", name: "Amul Cheese Slices", brand: "Amul", price: 125, item_type: "Cheese" },
        ]),
      },
    ];

    const blocks = allBlocks.map((block, index) => ({ block, index }));

    render(
      <CollapsibleToolGroup
        blocks={blocks}
        allBlocks={allBlocks}
        verticalId="food"
        onAction={vi.fn()}
      />,
    );

    expect(screen.getAllByText("Bread")).toHaveLength(1);
    expect(screen.getByText("Cheese")).toBeInTheDocument();
    expect(screen.getByText("Harvest Gold Bread")).toBeInTheDocument();
    expect(screen.getByText("Britannia Bread")).toBeInTheDocument();
    expect(screen.getByText("Amul Cheese Slices")).toBeInTheDocument();
    expect(screen.queryByText("Processed Cheese Cubes")).not.toBeInTheDocument();
  });
});
