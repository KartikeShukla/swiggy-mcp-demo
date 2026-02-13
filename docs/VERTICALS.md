# Verticals

Four verticals share one runtime architecture and differ through prompt profiles, UX defaults, and parser nuances.

## Vertical Registry
| Vertical | ID | MCP Server | Prompt Profile |
|---|---|---|---|
| NutriCart | `food` | `swiggy-instamart` | `foodPromptProfile` |
| StyleKit | `style` | `swiggy-instamart` | `stylePromptProfile` |
| TableScout | `dining` | `swiggy-dineout` | `diningPromptProfile` |
| FeedMe | `foodorder` | `swiggy-food` | `foodOrderPromptProfile` |

## Shared Prompt Policies
All vertical prompts are built by:
1. Compiling profile sections from prompt-spec.
2. Appending shared rules:
   - search efficiency
   - card-first rendering
   - tool error handling
   - location lock
3. Appending COD cancellation notice where enabled.

## Behavioral Differences
### `food`
- Supports advisory nutrition flow and direct product-order flow.
- Emphasizes nutrition context before advisory execution.

### `style`
- Supports grooming advisory flow and direct shopping flow.
- Supports skin/hair context-driven routine recommendations.

### `dining`
- Focused on discovery -> availability -> booking progression.
- Booking should be preceded by explicit slot confirmation.

### `foodorder`
- Focused on craving -> restaurant -> menu -> cart -> order progression.
- Includes menu-vs-restaurant parsing disambiguation.

## Session Summary Slot Detection
The summary system tracks intent hints and slot coverage from recent user text and selected address context. This supports continuity without long history replay.

## Legacy Prompt Files
- `src/verticals/prompts/*.md` are present in repo but not used for runtime prompt assembly.
- Runtime assembly path is `src/verticals/prompt-spec/*` + `src/verticals/shared-prompt.ts`.

## Deep Dives
- [food](./verticals/food.md)
- [style](./verticals/style.md)
- [dining](./verticals/dining.md)
- [foodorder](./verticals/foodorder.md)

## Related Docs
- [Prompt Runtime](./architecture/ai-prompt-runtime.md)
- [Prompt Contract](./contracts/prompt-contract.md)
