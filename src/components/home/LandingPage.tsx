import { verticalList } from "@/verticals";
import { VerticalCard } from "./VerticalCard";

export function LandingPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-gray-900">
          MCP Vertical Demo
        </h1>
        <p className="mx-auto max-w-2xl text-gray-600 leading-relaxed">
          Same MCP tools, different system prompts — three distinct AI-powered
          verticals. Connect your Anthropic API key and Swiggy account to see it
          in action.
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {verticalList.map((v) => (
          <VerticalCard key={v.id} vertical={v} />
        ))}
      </div>
      <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          How it works
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          Each vertical uses the{" "}
          <span className="font-medium text-gray-900">
            Anthropic MCP Connector
          </span>{" "}
          to connect Claude to Swiggy's MCP servers. The same set of tools
          powers completely different product experiences — the only difference
          is the system prompt. Your API key and Swiggy credentials stay on your
          machine (localStorage).
        </p>
      </div>
    </div>
  );
}
