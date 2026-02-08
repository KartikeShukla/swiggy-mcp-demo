import { useState } from "react";
import { KeyRound, ExternalLink } from "lucide-react";

export function ApiKeyModal({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed.startsWith("sk-ant-")) {
      setError('API key should start with "sk-ant-"');
      return;
    }
    setError("");
    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="api-key-modal-title">
      <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
            <KeyRound className="h-5 w-5 text-gray-700" />
          </div>
          <div>
            <h2 id="api-key-modal-title" className="text-lg font-semibold text-gray-900">
              Enter your API key
            </h2>
            <p className="text-sm text-gray-500">
              Required to connect to Claude
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError("");
              }}
              placeholder="sk-ant-..."
              autoFocus
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-300 focus:ring-1 focus:ring-gray-300"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            Connect
          </button>
        </form>

        <a
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          Get an API key from Anthropic Console
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
