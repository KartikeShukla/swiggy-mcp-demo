import { useState, useRef, useEffect } from "react";
import { Settings, KeyRound, Link2Off, Trash2 } from "lucide-react";

export function SettingsMenu({
  hasApiKey,
  hasSwiggyToken,
  onChangeApiKey,
  onDisconnectSwiggy,
  onClearChats,
}: {
  hasApiKey: boolean;
  hasSwiggyToken: boolean;
  onChangeApiKey: () => void;
  onDisconnectSwiggy: () => void;
  onClearChats: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <Settings className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {hasApiKey && (
            <button
              onClick={() => {
                onChangeApiKey();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <KeyRound className="h-4 w-4 text-gray-400" />
              Change API key
            </button>
          )}
          {hasSwiggyToken && (
            <button
              onClick={() => {
                onDisconnectSwiggy();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Link2Off className="h-4 w-4 text-gray-400" />
              Disconnect Swiggy
            </button>
          )}
          <button
            onClick={() => {
              onClearChats();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 text-red-400" />
            Clear all chats
          </button>
        </div>
      )}
    </div>
  );
}
