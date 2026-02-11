import type { ParsedAddress, ChatMessage } from "@/lib/types";
import type { VerticalId } from "@/verticals/prompt-spec/types";

// Module-scope regex constants (avoid per-call RegExp allocation)
const RESTAURANT_SELECT_PATTERNS = [
  /open menu for restaurant:\s*"?(.*?)"?$/i,
  /show(?: me)? the menu at\s+(.+)$/i,
  /menu at\s+(.+)$/i,
  /check availability at\s+(.+)$/i,
  /book a table at\s+(.+)$/i,
];

const CONFIRM_INTENT_PATTERNS = [/confirm/, /go ahead/, /place order/, /book it/, /yes do it/];
const FOOD_MENU_PATTERNS = [/open menu for restaurant:/, /menu at /];
const DINING_AVAIL_PATTERNS = [/availability/, /time slot/, /book a table/];
const CART_INTENT_PATTERNS = [/add /, /remove /, /cart/, /basket/];

const FOOD_GOAL_PATTERNS = [/meal prep/, /recipe/, /diet/, /calori/, /protein/, /nutrition/];
const FOOD_DIET_PATTERNS = [/vegan/, /vegetarian/, /gluten/, /allerg/, /keto/, /low[- ]?carb/, /diabetic/, /jain/];
const FOOD_SERVINGS_PATTERNS = [/for\s+\d+/, /\d+\s*(people|persons|servings?|portions?)/];
const BUDGET_PATTERNS = [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/];

const STYLE_CONCERN_PATTERNS = [/acne/, /routine/, /wedding/, /beard/, /groom/, /haircare/, /skincare/, /dandruff/];
const STYLE_SKIN_PATTERNS = [/oily skin/, /dry skin/, /combination skin/, /sensitive skin/];
const STYLE_HAIR_PATTERNS = [/straight hair/, /wavy hair/, /curly hair/, /coily hair/, /oily scalp/, /dry scalp/];

const DINING_CUISINE_PATTERNS = [/italian/, /asian/, /north indian/, /south indian/, /fine[- ]?dining/, /rooftop/, /casual/, /romantic/];
const DINING_LOCATION_PATTERNS = [/ in [a-z]/, /near /, /area/, /sector/, /koramangala/, /indiranagar/, /whitefield/, /gurugram/, /gurgaon/];
const DINING_PARTY_PATTERNS = [/for\s+\d+/, /\d+\s*(people|persons|guests)/];
const DINING_DATE_PATTERNS = [/today/, /tomorrow/, /tonight/, /weekend/, /\d{1,2}\s*(am|pm)/, /saturday/, /sunday/];

const FOODORDER_CRAVING_PATTERNS = [/craving/, /biryani/, /pizza/, /burger/, /butter chicken/, /dish/, /cuisine/, /hungry/];
const FOODORDER_DIET_PATTERNS = [/veg/, /non[- ]?veg/, /vegan/, /allerg/];
const FOODORDER_SPEED_PATTERNS = [/fast/, /quick/, /under\s*30\s*min/, /delivery\s*time/];

const PENDING_CONFIRM_PATTERNS = [
  /confirm/,
  /go ahead/,
  /place (it|order)/,
  /book (it|table)/,
  /checkout/,
  /yes do it/,
];

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

function recentUserMessages(messages: ChatMessage[], maxMessages = 16): string[] {
  return messages
    .filter(isUserTextMessage)
    .slice(-maxMessages)
    .map((message) => message.content);
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function detectSelectedRestaurantFromMessage(message: string): string | null {
  for (const pattern of RESTAURANT_SELECT_PATTERNS) {
    const match = message.match(pattern);
    if (!match?.[1]) continue;
    const value = match[1].replace(/[.?!]$/, "").trim();
    if (value) return compactText(value);
  }
  return null;
}

function detectLatestSelectedRestaurant(userMessages: string[]): string | null {
  for (let i = userMessages.length - 1; i >= 0; i--) {
    const selectedRestaurant = detectSelectedRestaurantFromMessage(userMessages[i]);
    if (selectedRestaurant) return selectedRestaurant;
  }
  return null;
}

function detectIntent(lastUserText: string, verticalId: VerticalId): SummarySignals["intent"] {
  if (hasAny(lastUserText, CONFIRM_INTENT_PATTERNS)) {
    return "confirm";
  }
  if (verticalId === "foodorder" && hasAny(lastUserText, FOOD_MENU_PATTERNS)) {
    return "menu";
  }
  if (verticalId === "dining" && hasAny(lastUserText, DINING_AVAIL_PATTERNS)) {
    return "availability";
  }
  if (hasAny(lastUserText, CART_INTENT_PATTERNS)) {
    return "cart";
  }
  return "discover";
}

function detectSlots(allUserText: string, verticalId: VerticalId): string[] {
  const slots: string[] = [];

  if (verticalId === "food") {
    if (hasAny(allUserText, FOOD_GOAL_PATTERNS)) slots.push("goal");
    if (hasAny(allUserText, FOOD_DIET_PATTERNS)) slots.push("diet");
    if (hasAny(allUserText, FOOD_SERVINGS_PATTERNS)) slots.push("servings");
    if (hasAny(allUserText, BUDGET_PATTERNS)) slots.push("budget");
  }

  if (verticalId === "style") {
    if (hasAny(allUserText, STYLE_CONCERN_PATTERNS)) slots.push("concern");
    if (hasAny(allUserText, STYLE_SKIN_PATTERNS)) slots.push("skin_type");
    if (hasAny(allUserText, STYLE_HAIR_PATTERNS)) slots.push("hair_type");
    if (hasAny(allUserText, BUDGET_PATTERNS)) slots.push("budget");
  }

  if (verticalId === "dining") {
    if (hasAny(allUserText, DINING_CUISINE_PATTERNS)) slots.push("cuisine_or_vibe");
    if (hasAny(allUserText, DINING_LOCATION_PATTERNS)) slots.push("location");
    if (hasAny(allUserText, DINING_PARTY_PATTERNS)) slots.push("party_size");
    if (hasAny(allUserText, DINING_DATE_PATTERNS)) slots.push("date_time");
    if (hasAny(allUserText, BUDGET_PATTERNS)) slots.push("budget");
  }

  if (verticalId === "foodorder") {
    if (hasAny(allUserText, FOODORDER_CRAVING_PATTERNS)) slots.push("craving");
    if (hasAny(allUserText, FOODORDER_DIET_PATTERNS)) slots.push("diet");
    if (hasAny(allUserText, BUDGET_PATTERNS)) slots.push("budget");
    if (hasAny(allUserText, FOODORDER_SPEED_PATTERNS)) slots.push("speed");
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
  const pendingConfirmation = hasAny(lastUserLower, PENDING_CONFIRM_PATTERNS);
  const selectedRestaurant = detectLatestSelectedRestaurant(userMessages);
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
