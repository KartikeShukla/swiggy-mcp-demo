import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { VerticalNav } from "./VerticalNav";

export function Header({ right }: { right?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm" aria-label="Main navigation">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700"
          >
            <Layers className="h-5 w-5" />
            <span className="text-sm font-semibold">MCP Demo</span>
          </Link>
          <VerticalNav />
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
    </header>
  );
}
