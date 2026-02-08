import { useState, useRef, useEffect } from "react";
import { Link2, ClipboardPaste } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (connected) {
    const stale = isTokenStale;
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2.5 py-1 text-xs font-medium">
        <span
          className={`h-2 w-2 rounded-full ${stale ? "bg-amber-400" : "bg-green-500"}`}
        />
        <span className={stale ? "text-amber-600" : "text-green-700"}>
          {stale ? "Reconnect" : "Connected"}
        </span>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
      >
        <Link2 className="h-3 w-3" />
        Connect Swiggy
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-4 shadow-lg z-50">
          <button
            onClick={() => {
              onConnect();
              setOpen(false);
            }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
          >
            <Link2 className="h-4 w-4" />
            Connect via OAuth
          </button>

          <div className="my-3 flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 border-t border-gray-200" />
            or
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <p className="mb-2 text-xs text-gray-500">
            Paste an access token from another MCP client:
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste access token..."
              className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-amber-300"
            />
            <button
              onClick={() => {
                if (token.trim()) {
                  onPasteToken(token.trim());
                  setToken("");
                  setOpen(false);
                }
              }}
              disabled={!token.trim()}
              className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              <ClipboardPaste className="h-3 w-3" />
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
