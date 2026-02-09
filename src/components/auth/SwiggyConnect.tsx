import { useState } from "react";
import { Link2, ClipboardPaste } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function SwiggyConnect({
  connected,
  isTokenStale,
  onConnect,
  onPasteToken,
}: {
  connected: boolean;
  isTokenStale?: boolean;
  onConnect: () => void;
  onPasteToken: (token: string) => void;
}) {
  const [token, setToken] = useState("");

  if (connected) {
    const stale = isTokenStale;
    return (
      <Badge variant="outline" className="gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${stale ? "bg-amber-400" : "bg-green-500"}`}
        />
        <span className={stale ? "text-amber-600 dark:text-amber-400" : "text-green-700 dark:text-green-400"}>
          {stale ? "Reconnect" : "Connected"}
        </span>
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary/10 transition-colors dark:bg-primary-100 dark:text-primary dark:border-primary/30">
          <Link2 className="h-3 w-3" />
          Connect Swiggy
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <Button
          onClick={onConnect}
          className="w-full gap-1.5"
        >
          <Link2 className="h-4 w-4" />
          Connect via OAuth
        </Button>

        <div className="my-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          or
          <Separator className="flex-1" />
        </div>

        <p className="mb-2 text-xs text-muted-foreground">
          Paste an access token from another MCP client:
        </p>
        <div className="flex gap-2">
          <Input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste access token..."
            className="text-xs"
          />
          <Button
            onClick={() => {
              if (token.trim()) {
                onPasteToken(token.trim());
                setToken("");
              }
            }}
            disabled={!token.trim()}
            size="sm"
            className="gap-1"
          >
            <ClipboardPaste className="h-3 w-3" />
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
