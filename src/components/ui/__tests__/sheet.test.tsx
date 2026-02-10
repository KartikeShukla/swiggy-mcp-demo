import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

describe("Sheet", () => {
  it("shows close icon for bottom sheets", () => {
    const onOpenChange = vi.fn();

    render(
      <Sheet open onOpenChange={onOpenChange}>
        <SheetContent side="bottom" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Bottom content</SheetTitle>
          </SheetHeader>
          <div>Bottom content</div>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it("keeps close icon for side sheets", () => {
    render(
      <Sheet open onOpenChange={() => {}}>
        <SheetContent side="right" aria-describedby={undefined}>
          <SheetHeader>
            <SheetTitle>Side content</SheetTitle>
          </SheetHeader>
          <div>Side content</div>
        </SheetContent>
      </Sheet>,
    );

    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
