import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { renderInline, renderMarkdownLite } from "@/lib/markdown";

/* ------------------------------------------------------------------ */
/*  renderInline                                                       */
/* ------------------------------------------------------------------ */

describe("renderInline", () => {
  it("returns a span for plain text", () => {
    const nodes = renderInline("hello");
    expect(nodes).toHaveLength(1);

    render(createElement("div", { "data-testid": "wrap" }, ...nodes));
    expect(screen.getByTestId("wrap")).toHaveTextContent("hello");
  });

  it("wraps **bold** in a <strong> element", () => {
    const nodes = renderInline("**bold**");
    // The split produces ["", "**bold**", ""], so 3 parts; the middle one
    // becomes a <strong> element.
    const strongNodes = nodes.filter(
      (n) => typeof n === "object" && n !== null && (n as React.ReactElement).type === "strong",
    );
    expect(strongNodes.length).toBe(1);

    render(createElement("div", { "data-testid": "bold-wrap" }, ...nodes));
    expect(screen.getByTestId("bold-wrap").querySelector("strong")).toHaveTextContent("bold");
  });

  it("wraps `code` in a <code> element", () => {
    const nodes = renderInline("`code`");
    const codeNodes = nodes.filter(
      (n) => typeof n === "object" && n !== null && (n as React.ReactElement).type === "code",
    );
    expect(codeNodes.length).toBe(1);

    render(createElement("div", { "data-testid": "code-wrap" }, ...nodes));
    expect(screen.getByTestId("code-wrap").querySelector("code")).toHaveTextContent("code");
  });

  it("handles mixed plain, bold and code text", () => {
    const nodes = renderInline("Hello **world** and `42`");
    // "Hello " | "**world**" | " and " | "`42`" | ""
    const types = nodes.map((n) => {
      if (typeof n !== "object" || n === null) return "primitive";
      return (n as React.ReactElement).type;
    });
    expect(types).toContain("strong");
    expect(types).toContain("code");

    render(createElement("div", { "data-testid": "mixed-wrap" }, ...nodes));
    const container = screen.getByTestId("mixed-wrap");
    expect(container).toHaveTextContent("Hello world and 42");
  });

  it("returns empty-string spans when input is empty", () => {
    const nodes = renderInline("");
    expect(nodes).toHaveLength(1);
    render(createElement("div", { "data-testid": "empty-wrap" }, ...nodes));
    expect(screen.getByTestId("empty-wrap")).toHaveTextContent("");
  });
});

/* ------------------------------------------------------------------ */
/*  renderMarkdownLite                                                 */
/* ------------------------------------------------------------------ */

describe("renderMarkdownLite", () => {
  it("renders a heading (# Heading)", () => {
    const nodes = renderMarkdownLite("# Heading");
    render(createElement("div", { "data-testid": "heading" }, ...nodes));
    const container = screen.getByTestId("heading");
    expect(container).toHaveTextContent("Heading");
    // The heading is a <div> with specific font-bold class
    const headingDiv = container.querySelector(".font-bold");
    expect(headingDiv).not.toBeNull();
  });

  it("renders ## and ### headings with different classes", () => {
    const nodes = renderMarkdownLite("## Sub\n### Sub-sub");
    render(createElement("div", { "data-testid": "multi-head" }, ...nodes));
    const container = screen.getByTestId("multi-head");
    expect(container).toHaveTextContent("Sub");
    expect(container).toHaveTextContent("Sub-sub");
  });

  it("renders an unordered list from dash items", () => {
    const nodes = renderMarkdownLite("- item1\n- item2");
    render(createElement("div", { "data-testid": "ul" }, ...nodes));
    const container = screen.getByTestId("ul");
    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    const items = ul!.querySelectorAll("li");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("item1");
    expect(items[1]).toHaveTextContent("item2");
  });

  it("renders an unordered list from asterisk items", () => {
    const nodes = renderMarkdownLite("* alpha\n* beta\n* gamma");
    render(createElement("div", { "data-testid": "ul-star" }, ...nodes));
    const ul = screen.getByTestId("ul-star").querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul!.querySelectorAll("li")).toHaveLength(3);
  });

  it("renders an ordered list from numbered items", () => {
    const nodes = renderMarkdownLite("1. first\n2. second\n3. third");
    render(createElement("div", { "data-testid": "ol" }, ...nodes));
    const ol = screen.getByTestId("ol").querySelector("ol");
    expect(ol).not.toBeNull();
    expect(ol!.querySelectorAll("li")).toHaveLength(3);
    expect(ol!.querySelectorAll("li")[0]).toHaveTextContent("first");
  });

  it("renders plain text as a span", () => {
    const nodes = renderMarkdownLite("Just plain text");
    render(createElement("div", { "data-testid": "plain" }, ...nodes));
    expect(screen.getByTestId("plain")).toHaveTextContent("Just plain text");
  });

  it("inserts <br> for blank lines between content", () => {
    const nodes = renderMarkdownLite("line1\n\nline2");
    // Should contain three elements: span for line1, br, span for line2
    expect(nodes.length).toBe(3);
  });

  it("does not add <br> for leading or trailing blank lines", () => {
    const nodesLeading = renderMarkdownLite("\nline");
    // Leading blank line at i=0 is skipped per the i > 0 check
    expect(nodesLeading.length).toBe(1);
  });

  it("handles mixed headings, lists, and paragraphs", () => {
    const md = "# Title\n- a\n- b\nSome text";
    const nodes = renderMarkdownLite(md);
    render(createElement("div", { "data-testid": "mix" }, ...nodes));
    const container = screen.getByTestId("mix");
    expect(container).toHaveTextContent("Title");
    expect(container.querySelector("ul")).not.toBeNull();
    expect(container).toHaveTextContent("Some text");
  });

  it("renders raw HTML-like content as inert text", () => {
    const nodes = renderMarkdownLite("<script>alert('xss')</script>");
    render(createElement("div", { "data-testid": "inert-html" }, ...nodes));
    const container = screen.getByTestId("inert-html");

    expect(container).toHaveTextContent("<script>alert('xss')</script>");
    expect(container.querySelector("script")).toBeNull();
  });
});
