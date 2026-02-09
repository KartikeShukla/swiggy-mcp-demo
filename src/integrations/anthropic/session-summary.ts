import type { ChatMessage } from "@/lib/types";
import type { VerticalId } from "@/verticals/prompt-spec/types";

interface SummarySignals {
  slots: string[];
  pendingConfirmation: boolean;
}

function extractRecentUserText(messages: ChatMessage[], maxMessages = 8): string {
  const userMessages = messages
    .filter((message) => message.role === "user" && typeof message.content === "string")
    .slice(-maxMessages)
    .map((message) => message.content);
  return userMessages.join(" \n ").toLowerCase();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function detectSignals(text: string, verticalId: VerticalId): SummarySignals {
  const slots: string[] = [];

  if (verticalId === "food") {
    if (hasAny(text, [/meal prep/, /recipe/, /diet/, /dinner/, /lunch/, /breakfast/, /calori/, /protein/])) slots.push("goal");
    if (hasAny(text, [/vegan/, /vegetarian/, /gluten/, /allerg/, /keto/, /low[- ]?carb/, /diabetic/, /jain/])) slots.push("diet");
    if (hasAny(text, [/for\s+\d+/, /\d+\s*(people|persons|servings?|portions?)/])) slots.push("servings");
    if (hasAny(text, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "style") {
    if (hasAny(text, [/acne/, /routine/, /wedding/, /beard/, /groom/, /haircare/, /skincare/, /dandruff/])) slots.push("concern");
    if (hasAny(text, [/oily skin/, /dry skin/, /combination skin/, /sensitive skin/])) slots.push("skin_type");
    if (hasAny(text, [/straight hair/, /wavy hair/, /curly hair/, /coily hair/, /oily scalp/, /dry scalp/])) slots.push("hair_type");
    if (hasAny(text, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "dining") {
    if (hasAny(text, [/italian/, /asian/, /north indian/, /south indian/, /fine[- ]?dining/, /rooftop/, /casual/, /romantic/])) slots.push("cuisine_or_vibe");
    if (hasAny(text, [/ in [a-z]/, /near /, /area/, /koramangala/, /indiranagar/, /whitefield/, /btm/])) slots.push("location");
    if (hasAny(text, [/for\s+\d+/, /\d+\s*(people|persons|guests)/])) slots.push("party_size");
    if (hasAny(text, [/today/, /tomorrow/, /tonight/, /weekend/, /\d{1,2}\s*(am|pm)/, /saturday/, /sunday/])) slots.push("date_time");
    if (hasAny(text, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
  }

  if (verticalId === "foodorder") {
    if (hasAny(text, [/craving/, /biryani/, /pizza/, /burger/, /butter chicken/, /dish/, /cuisine/, /hungry/])) slots.push("craving");
    if (hasAny(text, [/veg/, /non[- ]?veg/, /vegan/, /allerg/])) slots.push("diet");
    if (hasAny(text, [/budget/, /under\s+\d+/, /₹\s*\d+/, /inr\s*\d+/, /rupees?/])) slots.push("budget");
    if (hasAny(text, [/fast/, /quick/, /under\s*30\s*min/, /delivery\s*time/])) slots.push("speed");
  }

  return {
    slots,
    pendingConfirmation: hasAny(text, [
      /confirm/, /go ahead/, /place (it|order)/, /book (it|table)/, /checkout/, /yes do it/,
    ]),
  };
}

export function buildSessionStateSummary(
  messages: ChatMessage[],
  verticalId: VerticalId,
): string | null {
  const text = extractRecentUserText(messages);
  if (!text) return null;

  const signals = detectSignals(text, verticalId);
  const slotList = [...new Set(signals.slots)].sort();

  // Keep summary tiny; skip when state confidence is too low.
  if (slotList.length < 2 && !signals.pendingConfirmation) {
    return null;
  }

  return `slots=${slotList.join(",")}; confirm=${signals.pendingConfirmation ? "yes" : "no"}`;
}
