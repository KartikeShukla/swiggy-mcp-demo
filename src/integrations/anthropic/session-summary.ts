import type { ParsedAddress, ChatMessage } from "@/lib/types";
import type { VerticalId } from "@/verticals/prompt-spec/types";

interface SummarySignals {
  slots: string[];
  intent: "discover" | "menu" | "availability" | "cart" | "confirm";
  pendingConfirmation: boolean;
  selectedRestaurant: string | null;
}

function isUserTextMessage(
  message: ChatMessage,
): message is ChatMessage & { role: "user"; content: string } {
  return message.role === "user" && typeof message.content === "string";
}

function compactText(text: string, max = 36): string {
  const clean = text.replace(/[\n\r;=]+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function recentUserMessages(messages: ChatMessage[], maxMessages = 8): string[] {
  return messages
    .filter(isUserTextMessage)
    .slice(-maxMessages)
    .map((message) => message.content);
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function detectSelectedRestaurant(lastUserMessage: string): string | null {
  const patterns = [
    /open menu for restaurant:\s*"?(.*?)"?$/i,
    /show(?: me)? the menu at\s+(.+)$/i,
    /menu at\s+(.+)$/i,
    /check availability at\s+(.+)$/i,
    /book a table at\s+(.+)$/i,
  ];

  for (const pattern of patterns) {
    const match = lastUserMessage.match(pattern);
    if (!match?.[1]) continue;
    const value = match[1].replace(/[.?!]$/, "").trim();
    if (value) return compactText(value);
  }
  return null;
}

function detectIntent(lastUserText: string, verticalId: VerticalId): SummarySignals["intent"] {
  if (hasAny(lastUserText, [/confirm/, /go ahead/, /place order/, /book it/, /yes do it/])) {
    return "confirm";
  }
  if (verticalId === "foodorder" && hasAny(lastUserText, [/open menu for restaurant:/, /menu at /])) {
    return "menu";
  }
  if (verticalId === "dining" && hasAny(lastUserText, [/availability/, /time slot/, /book a table/])) {
    return "availability";
  }
  if (hasAny(lastUserText, [/add /, /remove /, /cart/, /basket/])) {
    return "cart";
  }
  return "discover";
}

function detectSlots(allUserText: string, verticalId: VerticalId): string[] {
  const slots: string[] = [];

  if (verticalId === "food") {
    if (hasAny(allUserText, [/meal prep/, /recipe/, /diet/, /calori/, /protein/, /nutrition/])) slots.push("goal");
    if (hasAny(allUserText, [/vegan/, /vegetarian/, /gluten/, /allerg/, /keto/, /low[- ]?carb/, /diabetic/, /jain/])) slots.push("diet");
    if (hasAny(allUserText, [/for\s+\d+/, /\d+\s*(people|persons|servings?|portions?)/])) slots.push("servings");
    if (hasAny(allUserText, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "style") {
    if (hasAny(allUserText, [/acne/, /routine/, /wedding/, /beard/, /groom/, /haircare/, /skincare/, /dandruff/])) slots.push("concern");
    if (hasAny(allUserText, [/oily skin/, /dry skin/, /combination skin/, /sensitive skin/])) slots.push("skin_type");
    if (hasAny(allUserText, [/straight hair/, /wavy hair/, /curly hair/, /coily hair/, /oily scalp/, /dry scalp/])) slots.push("hair_type");
    if (hasAny(allUserText, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "dining") {
    if (hasAny(allUserText, [/italian/, /asian/, /north indian/, /south indian/, /fine[- ]?dining/, /rooftop/, /casual/, /romantic/])) slots.push("cuisine_or_vibe");
    if (hasAny(allUserText, [/ in [a-z]/, /near /, /area/, /sector/, /koramangala/, /indiranagar/, /whitefield/, /gurugram/, /gurgaon/])) slots.push("location");
    if (hasAny(allUserText, [/for\s+\d+/, /\d+\s*(people|persons|guests)/])) slots.push("party_size");
    if (hasAny(allUserText, [/today/, /tomorrow/, /tonight/, /weekend/, /\d{1,2}\s*(am|pm)/, /saturday/, /sunday/])) slots.push("date_time");
    if (hasAny(allUserText, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "foodorder") {
    if (hasAny(allUserText, [/craving/, /biryani/, /pizza/, /burger/, /butter chicken/, /dish/, /cuisine/, /hungry/])) slots.push("craving");
    if (hasAny(allUserText, [/veg/, /non[- ]?veg/, /vegan/, /allerg/])) slots.push("diet");
    if (hasAny(allUserText, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
    if (hasAny(allUserText, [/fast/, /quick/, /under\s*30\s*min/, /delivery\s*time/])) slots.push("speed");
  }

  return [...new Set(slots)].sort();
}

function formatLocationSignal(selectedAddress?: ParsedAddress | null): string | null {
  if (!selectedAddress?.address) return null;
  const label = compactText(selectedAddress.label || "address", 20);
  const id = compactText(selectedAddress.id || "unknown", 24);
  return `locked:${label}:${id}`;
}

export function buildSessionStateSummary(
  messages: ChatMessage[],
  verticalId: VerticalId,
  selectedAddress?: ParsedAddress | null,
): string | null {
  const userMessages = recentUserMessages(messages);
  if (userMessages.length === 0) return null;

  const allUserText = userMessages.join(" \n ").toLowerCase();
  const lastUserMessage = userMessages[userMessages.length - 1] ?? "";
  const lastUserLower = lastUserMessage.toLowerCase();

  const slots = detectSlots(allUserText, verticalId);
  const pendingConfirmation = hasAny(lastUserLower, [
    /confirm/,
    /go ahead/,
    /place (it|order)/,
    /book (it|table)/,
    /checkout/,
    /yes do it/,
  ]);
  const selectedRestaurant = detectSelectedRestaurant(lastUserMessage);
  const intent = detectIntent(lastUserLower, verticalId);
  const locationSignal = formatLocationSignal(selectedAddress);

  if (!slots.length && !pendingConfirmation && !selectedRestaurant && !locationSignal) {
    return null;
  }

  const parts = [
    `slots=${slots.join(",") || "-"}`,
    `intent=${intent}`,
    `confirm=${pendingConfirmation ? "yes" : "no"}`,
  ];

  if (selectedRestaurant) {
    parts.push(`restaurant=${selectedRestaurant}`);
  }
  if (locationSignal) {
    parts.push(`location=${locationSignal}`);
  }

  return parts.join(";");
}
