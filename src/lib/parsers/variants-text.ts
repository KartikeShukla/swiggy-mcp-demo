import type { TextParseResult, ParsedProduct } from "@/lib/types";

export function parseVariantsFromText(text: string): TextParseResult {
  const segments: TextParseResult["segments"] = [];
  const blockPattern = /\*\*(.+?)(?::?\s*)\*\*\s*\n((?:\s*[-*•]\s+.+\n?)+)/g;
  const variantLinePattern = /[-*•]\s+(.+?)\s*@\s*(?:₹|Rs\.?\s*)([\d,]+(?:\.\d+)?)/;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(text)) !== null) {
    const productName = match[1].trim();
    const variantBlock = match[2];
    const variantLines = variantBlock.split("\n").filter((l) => l.trim());

    const parsedProducts: ParsedProduct[] = [];
    for (let vi = 0; vi < variantLines.length; vi++) {
      const lineMatch = variantLines[vi].match(variantLinePattern);
      if (lineMatch) {
        const quantity = lineMatch[1].trim();
        const price = parseFloat(lineMatch[2].replace(/,/g, ""));
        parsedProducts.push({
          id: `text-variant-${segments.length}-${vi}`,
          name: productName,
          price,
          quantity,
          available: true,
        });
      }
    }

    // Only treat as product block if at least one line has a price match
    if (parsedProducts.length > 0) {
      const before = text.slice(lastIndex, match.index);
      if (before.trim()) {
        segments.push({ type: "text", content: before });
      }
      segments.push({ type: "products", items: parsedProducts });
      lastIndex = match.index + match[0].length;
    }
  }

  // If no products found, return single text segment
  if (segments.length === 0) {
    return { segments: [{ type: "text", content: text }] };
  }

  // Remaining text after last match
  const remaining = text.slice(lastIndex);
  if (remaining.trim()) {
    segments.push({ type: "text", content: remaining });
  }

  return { segments };
}
