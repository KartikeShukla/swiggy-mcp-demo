import { verticalList } from "@/verticals";
import { VerticalCard } from "./VerticalCard";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 pt-2 pb-8 h-full overflow-y-auto">
      <div className="mb-5 text-center">
        <h1 className="mb-3 text-2xl font-bold tracking-tight text-foreground">
          MCP Vertical Demo
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Same MCP tools, different system prompts — three distinct AI-powered
          verticals. Connect your Anthropic API key and Swiggy account to see it
          in action.
        </p>
      </div>
      <div className="grid gap-4 grid-cols-1">
        {verticalList.map((v) => (
          <VerticalCard key={v.id} vertical={v} />
        ))}
      </div>
      <Card className="mt-6 rounded-2xl">
        <CardContent className="p-4">
          <h2 className="mb-2 text-base font-semibold text-foreground">
            How it works
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
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
