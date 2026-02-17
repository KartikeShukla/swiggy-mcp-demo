const STOP_WORDS = new Set([
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "of",
  "on",
  "in",
  "at",
  "with",
  "from",
  "want",
  "need",
  "please",
  "show",
  "find",
  "order",
  "food",
  "something",
  "some",
  "eat",
  "like",
  "would",
  "could",
  "can",
  "am",
  "is",
  "are",
  "it",
  "that",
  "this",
  "under",
  "near",
  "nearby",
]);

export function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export function tokenizeQuery(text: string, maxTerms = 24): string[] {
  if (!text) return [];
  const terms = normalizeText(text)
    .split(" ")
    .filter((term) => term.length > 1 && !STOP_WORDS.has(term));
  return [...new Set(terms)].slice(0, maxTerms);
}

export function textOverlapScore(text: string, terms: string[]): number {
  if (!text || terms.length === 0) return 0;
  const normalized = normalizeText(text);
  let score = 0;
  for (const term of terms) {
    if (normalized.includes(term)) score++;
  }
  return score;
}

export function extractNumberFromText(text?: string): number | undefined {
  if (!text) return undefined;
  const match = text.replace(/,/g, "").match(/(\d{2,5})/);
  if (!match) return undefined;
  const value = Number.parseInt(match[1], 10);
  return Number.isFinite(value) ? value : undefined;
}

