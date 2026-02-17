/**
 * Relevance post-processing for parsed tool results.
 *
 * After the parser orchestrator produces a `ParsedToolResult`, this module
 * applies vertical-specific reranking to improve result quality. It routes
 * to the appropriate reranker based on vertical and result type, and handles
 * the "broaden prompt" case when strict constraints eliminate all results.
 *
 * @module relevance-postprocess
 */
import type { ParsedToolResult, RelevanceDebugTrace, ToolRenderContext } from "@/lib/types";
import { logger } from "@/lib/logger";
import { rerankDiningRestaurants } from "@/lib/relevance/dining";
import {
  rerankFoodorderMenuItems,
  rerankFoodorderRestaurants,
} from "@/lib/relevance/foodorder";
import { rerankProductsByQuery } from "@/lib/relevance/generic";

const MENU_INTENT_TOOL_RE = /menu|dish|item/i;

/** Attaches a relevance debug trace to a parsed result for diagnostics. */
function attachDebug<T extends ParsedToolResult>(
  result: T,
  debug?: RelevanceDebugTrace,
): T {
  if (!debug) return result;
  return { ...result, debug } as T;
}

/**
 * Generates an informational card when strict-first reranking yields zero
 * results. This tells the user which filters are active and suggests how
 * to broaden their search (e.g. "say 'broaden results'").
 *
 * The card summarizes the active strict constraints (cuisines, vibes, areas,
 * dishes, diet, spice, budget, party size, time hints) extracted from the
 * render context.
 *
 * @param title - Card heading (e.g. "No strict dining matches yet").
 * @param note - Actionable suggestion for the user.
 * @param renderContext - Render context carrying the strict constraints to display.
 * @param debug - Optional debug trace from the reranker.
 */
function buildStrictMatchInfo(
  title: string,
  note: string,
  renderContext?: ToolRenderContext,
  debug?: RelevanceDebugTrace,
): ParsedToolResult {
  const strict = renderContext?.strictConstraints;
  const filters = renderContext?.strictConstraints
    ? [
        strict?.cuisines?.length
          ? `cuisine: ${strict.cuisines.join(", ")}`
          : "",
        strict?.vibes?.length
          ? `vibe: ${strict.vibes.join(", ")}`
          : "",
        strict?.areas?.length
          ? `area: ${strict.areas.join(", ")}`
          : "",
        strict?.dishes?.length
          ? `dish: ${strict.dishes.join(", ")}`
          : "",
        strict?.diet ? `diet: ${strict.diet}` : "",
        strict?.spicy ? "spice: spicy" : "",
        strict?.budgetMax != null ? `budget: ${strict.budgetMax}` : "",
        strict?.partySize != null ? `party size: ${strict.partySize}` : "",
        strict?.timeHints?.length ? `time: ${strict.timeHints.join(", ")}` : "",
      ]
        .filter(Boolean)
        .join(" | ")
    : "";

  return {
    type: "info",
    title,
    entries: [
      {
        key: "Current filters",
        value: filters || "Strict preference matching is active.",
      },
      {
        key: "Next step",
        value: note,
      },
    ],
    debug,
  };
}

/**
 * Applies vertical-specific relevance reranking to a parsed tool result.
 *
 * Routing logic:
 * - **foodorder restaurants** -> `rerankFoodorderRestaurants` (strict-first).
 * - **foodorder products (menu mode)** -> `rerankFoodorderMenuItems` (strict-first).
 * - **foodorder products (discover mode)** -> `rerankProductsByQuery` (query-based).
 * - **food / style products** -> `rerankProductsByQuery` (query-based).
 * - **dining restaurants** -> `rerankDiningRestaurants` (strict-first).
 *
 * When a strict-first reranker returns `requireBroadenPrompt`, this function
 * substitutes the result with an info card via `buildStrictMatchInfo`.
 *
 * No-ops (returns `parsed` unchanged) when reranking is disabled or the
 * result type is `"raw"`.
 */
export function postProcessParsedResult(
  parsed: ParsedToolResult,
  toolName: string,
  verticalId: string,
  renderContext: ToolRenderContext | undefined,
  enableRelevanceReranking: boolean,
): ParsedToolResult {
  if (!enableRelevanceReranking || parsed.type === "raw") return parsed;
  const query = renderContext?.latestUserQuery ?? "";

  if (verticalId === "foodorder") {
    const mode = renderContext?.mode ?? (MENU_INTENT_TOOL_RE.test(toolName) ? "menu" : "discover");

    if (parsed.type === "restaurants") {
      const ranked = rerankFoodorderRestaurants(parsed.items, renderContext);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "restaurants",
        toolName,
        debug: ranked.debug,
      });
      if (ranked.requireBroadenPrompt) {
        return buildStrictMatchInfo(
          "No strict restaurant matches yet",
          "Say 'broaden results' to relax one filter, or refine with a specific area/budget.",
          renderContext,
          ranked.debug,
        );
      }
      return {
        type: "restaurants",
        items: ranked.items,
        debug: ranked.debug,
      };
    }

    if (parsed.type === "products" && mode === "menu") {
      const ranked = rerankFoodorderMenuItems(parsed.items, renderContext);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "products",
        toolName,
        debug: ranked.debug,
      });
      if (ranked.requireBroadenPrompt) {
        return buildStrictMatchInfo(
          "No strict menu matches yet",
          "Say 'broaden menu' to relax one filter, or name another dish/cuisine.",
          renderContext,
          ranked.debug,
        );
      }
      return {
        type: "products",
        items: ranked.items,
        debug: ranked.debug,
      };
    }

    if (parsed.type === "products" && query) {
      const rerankedItems = rerankProductsByQuery(parsed.items, query);
      logger.debug("[Parser Relevance]", {
        verticalId,
        mode,
        type: "products",
        toolName,
        before: parsed.items.length,
        after: rerankedItems.length,
      });
      return attachDebug(
        {
          type: "products",
          items: rerankedItems,
        },
        {
          strategy: "foodorder:discover-products",
          query,
          mode,
          beforeCount: parsed.items.length,
          afterCount: rerankedItems.length,
        },
      );
    }
  }

  if ((verticalId === "food" || verticalId === "style") && parsed.type === "products" && query) {
    const rerankedItems = rerankProductsByQuery(parsed.items, query);
    logger.debug("[Parser Relevance]", {
      verticalId,
      type: "products",
      toolName,
      before: parsed.items.length,
      after: rerankedItems.length,
    });
    return attachDebug(
      {
        type: "products",
        items: rerankedItems,
      },
      {
        strategy: `${verticalId}:products`,
        query,
        mode: renderContext?.mode,
        beforeCount: parsed.items.length,
        afterCount: rerankedItems.length,
      },
    );
  }

  if (verticalId === "dining" && parsed.type === "restaurants") {
    const ranked = rerankDiningRestaurants(parsed.items, renderContext);
    logger.debug("[Parser Relevance]", {
      verticalId,
      type: "restaurants",
      toolName,
      debug: ranked.debug,
    });
    if (ranked.requireBroadenPrompt) {
      return buildStrictMatchInfo(
        "No strict dining matches yet",
        "Relax one filter: cuisine/vibe, area, budget, or time window. For dish-specific intent, I can broaden to nearby cuisine matches.",
        renderContext,
        ranked.debug,
      );
    }
    return {
      type: "restaurants",
      items: ranked.items,
      debug: ranked.debug,
    };
  }

  return parsed;
}
