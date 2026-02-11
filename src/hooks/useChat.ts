import { useState, useCallback, useEffect, useRef } from "react";
import type { ChatMessage, VerticalConfig, TokenUsage, ParsedAddress } from "@/lib/types";
import { useChatApi } from "./useChatApi";
import { useChatPersistence } from "./useChatPersistence";
import { buildSessionStateSummary } from "@/integrations/anthropic/session-summary";
import type { VerticalId } from "@/verticals/prompt-spec/types";

const SUPPORTED_VERTICAL_IDS: VerticalId[] = [
  "food",
  "style",
  "dining",
  "foodorder",
];

type LoadingContext =
  | "generic"
  | "cart"
  | "menu"
  | "restaurant"
  | "slots"
  | "booking"
  | "address"
  | "auth"
  | "nutrition"
  | "style"
  | "grooming"
  | "order";

const LOADING_LABELS: Record<LoadingContext, string[]> = {
  generic: ["Thinking", "Processing", "Working", "Almost Done"],
  cart: ["Updating Cart", "Syncing Cart", "Checking Stock", "Applying Changes"],
  menu: ["Scanning Menu", "Matching Items", "Filtering Dishes", "Ranking Options"],
  restaurant: ["Finding Restaurants", "Checking Places", "Sorting Results", "Comparing Picks"],
  slots: ["Checking Slots", "Finding Times", "Scanning Availability", "Shortlisting Times"],
  booking: ["Preparing Booking", "Confirming Table", "Saving Details", "Finalizing Request"],
  address: ["Fetching Addresses", "Checking Coverage", "Loading Locations", "Saving Address"],
  auth: ["Verifying Login", "Connecting Account", "Syncing Access", "Validating Session"],
  nutrition: ["Matching Meals", "Counting Macros", "Balancing Nutrition", "Planning Intake"],
  style: ["Matching Style", "Building Looks", "Curating Picks", "Refining Outfit"],
  grooming: ["Matching Products", "Curating Routine", "Scanning Essentials", "Refining Picks"],
  order: ["Placing Order", "Confirming Order", "Validating Cart", "Finalizing Checkout"],
};

function isVerticalId(verticalId: string): verticalId is VerticalId {
  return SUPPORTED_VERTICAL_IDS.includes(verticalId as VerticalId);
}

const LOADING_ADDRESS_RE = /\b(address|location|deliver|delivery|sector|city|area|pin)\b/;
const LOADING_AUTH_RE = /\b(connect|oauth|token|login|signin|auth|swiggy)\b/;
const LOADING_CART_RE = /\b(cart|basket|add|remove|quantity|checkout)\b/;
const LOADING_SLOTS_RE = /\b(slot|time|timeslot|availability)\b/;
const LOADING_BOOKING_RE = /\b(book|booking|reservation|reserve|table)\b/;
const LOADING_RESTAURANT_RE = /\b(restaurant|dine|dining|cafe|nearby)\b/;
const LOADING_ORDER_RE = /\b(order|pay|payment|track)\b/;
const LOADING_MENU_RE = /\b(menu|item|dish|pizza|biryani|burger|meal|cuisine)\b/;
const LOADING_NUTRITION_RE = /\b(calorie|protein|macro|nutrition|diet|keto|vegan|meal prep)\b/;
const LOADING_STYLE_RE = /\b(outfit|style|look|dress|shirt|jeans|fashion)\b/;
const LOADING_GROOMING_RE = /\b(groom|skincare|hair|beard|serum|cleanser)\b/;

function detectLoadingContext(text: string, verticalId: string): LoadingContext {
  const input = text.toLowerCase();

  if (LOADING_ADDRESS_RE.test(input)) return "address";
  if (LOADING_AUTH_RE.test(input)) return "auth";
  if (LOADING_CART_RE.test(input)) return "cart";
  if (LOADING_SLOTS_RE.test(input)) return "slots";
  if (LOADING_BOOKING_RE.test(input)) return "booking";
  if (LOADING_RESTAURANT_RE.test(input)) return "restaurant";
  if (LOADING_ORDER_RE.test(input)) return "order";
  if (LOADING_MENU_RE.test(input)) return "menu";
  if (LOADING_NUTRITION_RE.test(input)) return "nutrition";
  if (LOADING_STYLE_RE.test(input)) return "style";
  if (LOADING_GROOMING_RE.test(input)) return "grooming";

  if (verticalId === "food") return "nutrition";
  if (verticalId === "style") return "style";
  if (verticalId === "dining") return "restaurant";
  if (verticalId === "foodorder") return "menu";

  return "generic";
}

function getLoadingLabel(context: LoadingContext, elapsedMs: number): string {
  const labels = LOADING_LABELS[context] ?? LOADING_LABELS.generic;
  const index = Math.floor(elapsedMs / 1800) % labels.length;
  return labels[index];
}

export function useChat(
  vertical: VerticalConfig,
  apiKey: string | null,
  swiggyToken: string | null,
  onAuthError?: () => void,
  onAddressError?: () => void,
  selectedAddress?: ParsedAddress | null,
) {
  const { messages, setMessages } = useChatPersistence(vertical.id);
  const { sendToApi, classifyError } = useChatApi(
    apiKey,
    vertical,
    swiggyToken,
    onAuthError,
    onAddressError,
    selectedAddress,
  );
  const [loading, setLoading] = useState(false);
  const [loadingElapsedMs, setLoadingElapsedMs] = useState(0);
  const loadingContextRef = useRef<LoadingContext>("generic");
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const cumulativeUsageRef = useRef({ input_tokens: 0, output_tokens: 0 });
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Clear error when vertical changes
  useEffect(() => {
    setError(null);
    setTokenUsage(null);
    setLoadingElapsedMs(0);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [vertical.id]);

  useEffect(() => {
    if (!loading) {
      setLoadingElapsedMs(0);
      return;
    }
    const startedAt = Date.now();
    setLoadingElapsedMs(0);
    const timer = window.setInterval(() => {
      setLoadingElapsedMs(Date.now() - startedAt);
    }, 400);
    return () => window.clearInterval(timer);
  }, [loading]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!apiKey) {
        setError("API key required");
        return;
      }
      if (loading) return;

      const userMessage: ChatMessage = {
        role: "user",
        content: text,
        timestamp: Date.now(),
      };

      loadingContextRef.current = detectLoadingContext(text, vertical.id);

      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        // Pass all messages including the new user message
        const allMessages = [...messagesRef.current, userMessage];
        const sessionStateSummary = isVerticalId(vertical.id)
          ? buildSessionStateSummary(allMessages, vertical.id, selectedAddress)
          : null;
        const response = await sendToApi(allMessages, sessionStateSummary);

        // stream-runner.ts already sanitizes and ensures non-empty content;
        // only guard against the edge case of an empty array here.
        const normalizedContent = response.content.length > 0
          ? response.content
          : [
              {
                type: "text" as const,
                text: "I completed that request but the final response was empty. Please try once.",
              },
            ];

        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: normalizedContent,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Track token usage
        setTokenUsage(response.usage);
        cumulativeUsageRef.current.input_tokens += response.usage.input_tokens;
        cumulativeUsageRef.current.output_tokens += response.usage.output_tokens;
        console.log("[Cumulative Token Usage]", { ...cumulativeUsageRef.current });
      } catch (err) {
        const classified = classifyError(err);
        setError(classified.message);
      } finally {
        setLoading(false);
      }
    },
    [
      apiKey,
      loading,
      sendToApi,
      classifyError,
      setMessages,
      vertical.id,
      selectedAddress,
    ],
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    setTokenUsage(null);
    setLoadingElapsedMs(0);
    cumulativeUsageRef.current = { input_tokens: 0, output_tokens: 0 };
  }, [setMessages]);

  const loadingLabel = loading
    ? getLoadingLabel(loadingContextRef.current, loadingElapsedMs)
    : null;

  return {
    messages,
    loading,
    loadingLabel,
    loadingElapsedMs,
    error,
    sendMessage,
    clearHistory,
    tokenUsage,
  };
}
