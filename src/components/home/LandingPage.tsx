import { verticalList } from "@/verticals";
import { VerticalCard } from "./VerticalCard";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-3 pt-4 pb-4 h-full overflow-y-auto">
      <div className="mb-4 px-1">
        <h1 className="text-base font-semibold text-foreground">
          Choose a vertical
        </h1>
        <p className="text-xs text-muted-foreground">
          Same tools, different AI — pick one to start.
        </p>
      </div>
      <div className="grid gap-2.5 grid-cols-1">
        {verticalList.map((v) => (
          <VerticalCard key={v.id} vertical={v} />
        ))}
      </div>
    </div>
  );
}
