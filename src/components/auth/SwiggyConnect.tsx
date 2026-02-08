import { useState } from "react";
import { Link2, Check, ClipboardPaste } from "lucide-react";

export function SwiggyConnect({
  connected,
  onConnect,
  onPasteToken,
}: {
  connected: boolean;
  onConnect: () => void;
  onPasteToken: (token: string) => void;
}) {
  const [showPaste, setShowPaste] = useState(false);
  const [token, setToken] = useState("");

  if (connected) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-green-700 font-medium">Connected to Swiggy</span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-amber-800">
          Connect your Swiggy account to enable ordering tools
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPaste(!showPaste)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors"
          >
            <ClipboardPaste className="h-3 w-3" />
            Paste token
          </button>
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            <Link2 className="h-3 w-3" />
            Connect Swiggy
          </button>
        </div>
      </div>
      {showPaste && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-amber-700">
            Paste an access token from another MCP client (Cursor, Claude
            Desktop):
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste access token..."
              className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-xs text-gray-900 outline-none focus:border-amber-300"
            />
            <button
              onClick={() => {
                if (token.trim()) {
                  onPasteToken(token.trim());
                  setToken("");
                  setShowPaste(false);
                }
              }}
              disabled={!token.trim()}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
