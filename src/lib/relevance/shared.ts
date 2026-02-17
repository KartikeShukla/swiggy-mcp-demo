import type { RelevanceDebugTrace, ToolRenderContext } from "@/lib/types";

/** Generic relevance result returned by all reranking functions. */
export interface RelevanceResult<T> {
  items: T[];
  debug: RelevanceDebugTrace;
  requireBroadenPrompt: boolean;
}

/** Deduplicate and remove empty strings from a list. */
export function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

/** Sort items by a scoring function, preserving original order for ties. */
export function rankItems<T>(items: T[], scoreFn: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreFn(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

/** Build a standard debug trace object for relevance operations. */
export function buildRelevanceDebug(
  strategy: string,
  renderContext: ToolRenderContext | undefined,
  strictApplied: string[],
  strictSatisfied: boolean,
  beforeCount: number,
  afterCount: number,
  note?: string,
): RelevanceDebugTrace {
  return {
    strategy,
    query: renderContext?.latestUserQuery,
    mode: renderContext?.mode,
    strictApplied,
    strictSatisfied,
    beforeCount,
    afterCount,
    note,
  };
}
