import { verticalList } from "@/verticals";
import { VerticalCard } from "./VerticalCard";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-3 pt-1 pb-4 h-full overflow-y-auto">
      <div className="mb-5 text-center">
        <h1 className="mb-1.5 text-xl font-bold tracking-tight text-foreground">
          MCP Vertical Demo
        </h1>
        <p className="mx-auto max-w-2xl text-xs text-muted-foreground leading-relaxed">
          Same MCP tools, different system prompts — four distinct AI-powered
          verticals. Connect your Anthropic API key and Swiggy account to see it
          in action.
        </p>
      </div>
      <div className="grid gap-2.5 grid-cols-1">
        {verticalList.map((v) => (
          <VerticalCard key={v.id} vertical={v} />
        ))}
      </div>
      <Card className="mt-4 rounded-xl">
        <CardContent className="p-3">
          <h2 className="mb-2 text-sm font-semibold text-foreground">
            How it works
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each vertical uses the{" "}
            <span className="font-medium text-foreground">
              Anthropic MCP Connector
            </span>{" "}
            to connect Claude to Swiggy's MCP servers. The same set of tools
            powers completely different product experiences — the only difference
            is the system prompt. Your API key and Swiggy credentials stay on your
            machine (localStorage).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
