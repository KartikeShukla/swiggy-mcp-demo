import { Link } from "react-router-dom";
import { Clock, MapPin } from "lucide-react";
import type { ParsedAddress } from "@/lib/types";
import { formatHeaderLocation } from "./header-location";
import { formatHeaderDateTime } from "./header-datetime";
import { VerticalNav } from "./VerticalNav";

function Logo67() {
  return (
    <div className="flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-md bg-stone-100 dark:bg-stone-800">
      <svg viewBox="0 0 28 28" className="h-[29px] w-[29px]" aria-hidden="true">
        {/* "6" in gray */}
        <text
          x="5"
          y="22"
          fontSize="20"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#9ca3af"
        >
          6
        </text>
        {/* "7" in dark, overlapping */}
        <text
          x="13"
          y="22"
          fontSize="20"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#374151"
          className="dark:fill-stone-200"
        >
          7
        </text>
      </svg>
    </div>
  );
}

export function Header({
  right,
  selectedAddress,
  connectionActive = false,
  apiKey,
  swiggyToken,
}: {
  right?: React.ReactNode;
  selectedAddress?: ParsedAddress | null;
  connectionActive?: boolean;
  apiKey: string | null;
  swiggyToken: string | null;
}) {
  const locationText = formatHeaderLocation(selectedAddress);
  const dateTimeText = formatHeaderDateTime();

  return (
    <header className="relative z-50 shrink-0 border-b border-border bg-background/95 backdrop-blur-lg pt-[var(--safe-top)]" aria-label="Main navigation">
      {/* Row 1: Logo + Actions */}
      <div className="flex h-12 items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-3 text-foreground hover:text-foreground/80"
        >
          <Logo67 />
          <div className="flex flex-col">
            <span className="flex items-center gap-2 text-sm font-semibold">
              MCP Demo
              <span
                className={`h-1.5 w-1.5 rounded-full ${connectionActive ? "bg-green-500" : "bg-red-400"}`}
                aria-label={connectionActive ? "Connection active" : "Connection inactive"}
                title={connectionActive ? "Connection active" : "Connection inactive"}
              />
            </span>
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[110px]">{locationText}</span>
              <span className="text-muted-foreground/50">|</span>
              <Clock className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate max-w-[80px]">{dateTimeText}</span>
            </span>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          {right}
        </div>
      </div>

      {/* Row 2: Vertical Nav Tabs */}
      <div className="flex items-center justify-center px-[9.6px] pt-2.5 pb-3">
        <VerticalNav
          apiKey={apiKey}
          swiggyToken={swiggyToken}
          selectedAddress={selectedAddress}
        />
      </div>
    </header>
  );
}
