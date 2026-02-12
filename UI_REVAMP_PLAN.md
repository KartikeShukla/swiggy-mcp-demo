# UI Revamp Plan: shadcn/ui + Stone/Orange Theme + ChatGPT-style Chat

## Context

The Swiggy MCP Demo currently uses custom-built components with hardcoded gray Tailwind classes and the Inter font. The UI feels generic and lacks a cohesive design system. This revamp will:

- Install **shadcn/ui** with **Radix UI** primitives for accessible, production-quality components
- Apply the **Maia** style (soft, rounded, generous spacing) with **Stone** base color and **Orange** accent
- Switch to **Geist** font (shadcn default)
- Redesign the chat UI to match a **ChatGPT-style** prompt form and message layout
- Keep all existing functionality and vertical-specific accent colors (food=green, style=purple, dining=amber, foodorder=red)

### Design System Reference (from shadcn/ui configurator)

| Setting | Value |
|---|---|
| Component Library | Radix UI |
| Style | Maia ("Soft and rounded, with generous spacing") |
| Base Color | Stone (warm gray palette) |
| Theme/Accent | Orange |
| Icon Library | Lucide (already installed) |
| Font | Geist (replacing Inter) |
| Radius | Default (0.75rem) |
| Menu Color | Default |
| Menu Accent | Subtle |

---

## Phase 0: Git Branch + Pre-flight

1. Create branch `ui-revamp`
2. Verify `pnpm build` passes before any changes

---

## Phase 1: Foundation Setup

### 1.1 Initialize shadcn/ui
- Run `npx shadcn@latest init` (style: new-york, baseColor: stone, cssVariables: true, RSC: false)
- This creates `components.json` and may update `src/lib/utils.ts` (already has `cn()` -- verify identical)
- Generated `components.json`:
  ```json
  {
    "$schema": "https://ui.shadcn.com/schema.json",
    "style": "new-york",
    "rsc": false,
    "tsx": true,
    "tailwind": { "css": "src/index.css", "baseColor": "stone", "cssVariables": true },
    "aliases": {
      "components": "@/components",
      "utils": "@/lib/utils",
      "ui": "@/components/ui",
      "lib": "@/lib",
      "hooks": "@/hooks"
    },
    "iconLibrary": "lucide"
  }
  ```

### 1.2 Install Geist Font
- `pnpm add @fontsource-variable/geist-sans @fontsource-variable/geist-mono`
- **`index.html`**: Remove Google Fonts `<link>` tags for Inter (lines 7-9)
- **`src/main.tsx`**: Add `import "@fontsource-variable/geist-sans"` and `import "@fontsource-variable/geist-mono"`

### 1.3 Rewrite `src/index.css` -- Theme Tokens

Replace entire file with shadcn/ui CSS variable system:

- `:root` block with **Stone neutrals** + **Orange primary/accent** + Maia radius (`--radius: 0.75rem`)
- `@theme inline` block mapping CSS vars to Tailwind color utilities (`--color-background`, `--color-primary`, etc.)
- **Preserve** existing vertical colors (`--color-food`, `--color-style`, etc.) inside the `:root` and `@theme` blocks
- Body: `font-family: "Geist Sans Variable", system-ui, sans-serif`; `@apply bg-background text-foreground antialiased`
- Global `*` selector: `@apply border-border`

**Key color mappings (OKLCH for Tailwind v4):**

| Token | Maps to | Approx Hex |
|---|---|---|
| `--background` | stone-50 | `#fafaf9` |
| `--foreground` | stone-950 | `#0c0a09` |
| `--card` | white | `#ffffff` |
| `--card-foreground` | stone-950 | `#0c0a09` |
| `--popover` | white | `#ffffff` |
| `--popover-foreground` | stone-950 | `#0c0a09` |
| `--primary` | orange-500 | `#f97316` |
| `--primary-foreground` | white | `#ffffff` |
| `--secondary` | stone-100 | `#f5f5f4` |
| `--secondary-foreground` | stone-800 | `#292524` |
| `--muted` | stone-100 | `#f5f5f4` |
| `--muted-foreground` | stone-500 | `#78716c` |
| `--accent` | orange-100 | `#ffedd5` |
| `--accent-foreground` | stone-800 | `#292524` |
| `--border` | stone-200 | `#e7e5e3` |
| `--input` | stone-200 | `#e7e5e3` |
| `--ring` | orange-500 | `#f97316` |
| `--destructive` | red-500 | `#ef4444` |
| `--destructive-foreground` | white | `#ffffff` |
| `--radius` | -- | `0.75rem` |

**Sidebar tokens** (for potential future sidebar):
| Token | Maps to |
|---|---|
| `--sidebar` | stone-50 |
| `--sidebar-foreground` | stone-800 |
| `--sidebar-primary` | orange-500 |
| `--sidebar-primary-foreground` | white |
| `--sidebar-accent` | stone-100 |
| `--sidebar-accent-foreground` | stone-800 |
| `--sidebar-border` | stone-200 |
| `--sidebar-ring` | orange-500 |

**Chart colors:**
| Token | Color |
|---|---|
| `--chart-1` | orange |
| `--chart-2` | teal |
| `--chart-3` | blue |
| `--chart-4` | yellow |
| `--chart-5` | amber |

**Vertical-specific colors (preserved from original):**
```css
--color-food: #22c55e;
--color-food-light: #dcfce7;
--color-style: #8b5cf6;
--color-style-light: #ede9fe;
--color-dining: #f59e0b;
--color-dining-light: #fef3c7;
--color-foodorder: #ef4444;
--color-foodorder-light: #fef2f2;
```

### 1.4 Verify Foundation Builds
```bash
pnpm build
```

---

## Phase 2: Install shadcn Components

```bash
npx shadcn@latest add button card input textarea badge separator avatar \
  dialog sheet dropdown-menu popover tooltip scroll-area collapsible label
```

This installs ~15 components to `src/components/ui/`. Each is a fully editable file, not a locked dependency.

**Component-to-usage mapping:**

| shadcn Component | Replaces/Enhances |
|---|---|
| `Button` | All custom `<button>` elements (ChatInput, cards, cart, auth) |
| `Card` + sub-components | ProductCard, RestaurantCard, all card types, VerticalCard |
| `Input` | ApiKeyModal key input, SwiggyConnect token input |
| `Textarea` | ChatInput message area (keep auto-resize logic) |
| `Dialog` | ApiKeyModal (always-open), OrderConfirmation modal |
| `Sheet` | CartPanel (replaces manual side drawer + backdrop) |
| `DropdownMenu` | SettingsMenu (replaces manual dropdown + click-outside) |
| `Popover` | SwiggyConnect dropdown (replaces manual dropdown + click-outside) |
| `ScrollArea` | MessageList (replaces raw overflow div) |
| `Collapsible` | ToolTrace, CollapsibleToolGroup |
| `Avatar` | MessageBubble user/bot icons |
| `Badge` | Tool call pills, restaurant offer tags, cart count |
| `Separator` | CartSummaryCard, CartPanel bill dividers |
| `Tooltip` | Icon-only buttons (settings, send, etc.) |
| `Label` | ApiKeyModal form field |

---

## Phase 3: Layout Revamp

### 3.1 Header (`src/components/layout/Header.tsx`)

**Current:** 23 lines. Hardcoded gray borders, `bg-white/80`, `h-14`.

**Changes:**
| Current | New |
|---|---|
| `border-gray-200` | `border-border` |
| `bg-white/80` | `bg-background/80` |
| `text-gray-900` | `text-foreground` |
| `hover:text-gray-700` | `hover:text-muted-foreground` |
| `h-14` | `h-16` (Maia generous spacing) |
| `px-4` | `px-6` |

### 3.2 VerticalNav (`src/components/layout/VerticalNav.tsx`)

**Current:** 39 lines. Pill-shaped NavLinks with vertical-specific colors.

**Changes:**
| Current | New |
|---|---|
| `text-gray-600` | `text-muted-foreground` |
| `px-3 py-1.5` | `px-4 py-2` (Maia spacing) |
| `rounded-lg` | `rounded-xl` (Maia radius) |

**Keep as-is:** All vertical-specific `activeClasses` and `hoverClasses` maps -- these are essential for branded theming.

---

## Phase 4: Chat UI Revamp (Highest Priority)

### 4.1 ChatView (`src/components/chat/ChatView.tsx`)

**Current:** 122 lines. Full-height flex layout with empty state, message list, cart FAB, and input.

**Changes:**
- Empty state heading: `text-gray-900` -> `text-foreground`
- Empty state description: `text-gray-500` -> `text-muted-foreground`
- Example prompt buttons: Replace `<button>` with `<Button variant="outline" className="rounded-full">`
- Error bar: `bg-red-50 text-red-600` -> `bg-destructive/10 text-destructive`
- Cart panel: Wire `isOpen`/`setIsOpen` to Sheet's `open`/`onOpenChange` (Sheet handles backdrop automatically)

### 4.2 ChatInput (`src/components/chat/ChatInput.tsx`) -- ChatGPT-style Prompt Form

**Current:** 72 lines. Simple textarea with border-top separator and vertical-colored send button.

**Target:** ChatGPT-style "floating" rounded input container with orange send button.

**Complete redesign:**
```
Before:
┌─────────────────────────────────┐  <- border-t
│ [textarea          ] [Send btn] │
└─────────────────────────────────┘

After:
                                      <- no border-t, floats at bottom
    ╭─────────────────────────────╮   <- rounded-2xl container with shadow
    │ Ask anything...       [🔼]  │   <- orange send button
    ╰─────────────────────────────╯
```

**Specific changes:**
- Remove outer `border-t border-gray-200 bg-white p-4`
- New structure: `p-4 pb-6` wrapper -> `max-w-3xl mx-auto` -> `rounded-2xl border border-border bg-card p-3 shadow-sm` container
- Textarea: Remove borders, transparent background: `border-0 bg-transparent placeholder:text-muted-foreground outline-none focus:ring-0`
- Placeholder: "Type a message..." -> "Ask anything..."
- Send button: Always **orange** (`bg-primary text-primary-foreground`) regardless of vertical. Remove the `buttonColorClass` switch.
- Use shadcn `<Button size="icon" className="rounded-xl bg-primary">`

### 4.3 MessageList (`src/components/chat/MessageList.tsx`)

**Current:** 40 lines. Simple flex overflow container.

**Changes:**
- Replace `<div className="overflow-y-auto">` with `<ScrollArea className="flex-1">`
- Add `space-y-1` for consistent message spacing
- Keep auto-scroll-to-bottom logic (useRef + useEffect)

### 4.4 MessageBubble (`src/components/chat/MessageBubble.tsx`) -- Most Complex (409 lines)

This component contains 6 internal functions/components. Changes organized by sub-component:

**`renderMarkdownLite` function (lines 11-98):**
- Heading text: `text-gray-900` -> `text-foreground`
- No other changes needed (rendering logic stays identical)

**`renderInline` function (lines 101-121):**
- Inline code: `bg-gray-100 text-gray-700` -> `bg-muted text-muted-foreground`

**`CollapsibleText` component (lines 123-164):**
| Current | New |
|---|---|
| `bg-white` | `bg-card` |
| `ring-1 ring-gray-100` | `ring-1 ring-border` |
| `text-gray-800` | `text-card-foreground` |
| `text-gray-400 hover:text-gray-600` | `text-muted-foreground hover:text-foreground` |

**`CollapsibleToolGroup` component (lines 209-287):**
- Tool pill button (line 249-264): Replace `<button>` with `<Badge variant="secondary" className="rounded-full gap-1.5 cursor-pointer">`
- Expanded traces border: `border-gray-100` -> `border-border`

**User messages (lines 302-314):**
- Avatar (line 310-312): Replace `<div className="rounded-full bg-gray-200">` with:
  ```tsx
  <Avatar className="h-8 w-8">
    <AvatarFallback className="bg-muted text-muted-foreground">
      <User className="h-4 w-4" />
    </AvatarFallback>
  </Avatar>
  ```
- Bubble: `bg-gray-900 text-white` -> `bg-foreground text-background`

**Assistant messages (lines 317-406):**
- Bot avatar (lines 335-343): Replace raw div with:
  ```tsx
  <Avatar className="h-8 w-8">
    <AvatarFallback className="text-white" style={{ backgroundColor: `var(--color-${accentColor})` }}>
      <Bot className="h-4 w-4" />
    </AvatarFallback>
  </Avatar>
  ```
- Mixed text segments (line 368): `bg-white ring-gray-100 text-gray-800` -> `bg-card ring-border text-card-foreground`

### 4.5 ToolTrace (`src/components/chat/ToolTrace.tsx`)

**Current:** 74 lines. Custom collapsible with tool name and expandable JSON.

**Changes:**
- Wrap in shadcn `<Collapsible>` / `<CollapsibleTrigger>` / `<CollapsibleContent>`
- Tool name button: Use `bg-muted text-muted-foreground hover:bg-accent`
- Success results: `bg-green-50 text-green-700` -> `bg-primary/10 text-primary`
- Error results: `bg-red-50 text-red-600` -> `bg-destructive/10 text-destructive`
- JSON display: `font-mono` with `bg-muted` background

### 4.6 LoadingIndicator (`src/components/chat/LoadingIndicator.tsx`)

**Current:** 9 lines. Three pulsing dots.

**Changes:**
- Wrap dots in pill-shaped container: `rounded-full bg-muted px-4 py-2`
- Dot color: `bg-gray-300` -> `bg-muted-foreground/60`
- Slightly larger dots for Maia feel

---

## Phase 5: Card Components Revamp (10 components)

### General Pattern for All Cards

Every card component follows this migration pattern:

| Category | Current | New |
|---|---|---|
| Container | `<div className="rounded-xl border shadow-sm">` | `<Card className="rounded-2xl">` with `<CardContent>` |
| Title text | `text-gray-900` | `text-card-foreground` |
| Subtitle/meta | `text-gray-600` / `text-gray-500` | `text-muted-foreground` |
| Faint text | `text-gray-400` | `text-muted-foreground/70` |
| Background | `bg-white` | `bg-card` |
| Placeholder bg | `bg-gray-100` | `bg-muted` |
| Borders | `border-gray-200` | `border-border` |
| Hover bg | `hover:bg-gray-50` | `hover:bg-accent` |
| Action buttons | Raw `<button>` with inline styles | `<Button>` with inline `style={{ backgroundColor: var(--color-${accentColor}) }}` |
| Dividers | `<div className="border-t">` | `<Separator />` |
| Offer tags | Raw `<span>` | `<Badge variant="secondary">` |

### 5.1 ProductCard (`src/components/cards/ProductCard.tsx`, 102 lines)
- Wrap in `<Card className="w-48 shrink-0 overflow-hidden rounded-2xl">`
- Image placeholder: `bg-muted` with muted icon
- Price: `text-card-foreground` for selling price, `text-muted-foreground line-through` for MRP
- Add button: `<Button size="sm" className="w-full">` with vertical accent

### 5.2 RestaurantCard (`src/components/cards/RestaurantCard.tsx`, 84 lines)
- Wrap in `<Card className="w-64 shrink-0 rounded-2xl">`
- Offers: `<Badge variant="secondary" className="gap-0.5 text-[10px]">`
- CTA: `<Button>` with vertical accent
- Keep star rating `fill-amber-400` (universal convention)

### 5.3 TimeSlotPicker (`src/components/cards/TimeSlotPicker.tsx`, 51 lines)
- Wrap in `<Card>` + `<CardHeader>` + `<CardContent>`
- Slot buttons: `<Button variant="outline" size="sm">` with vertical color for available slots

### 5.4 AddressPicker (`src/components/cards/AddressPicker.tsx`, 44 lines)
- Wrap in `<Card>` + `<CardHeader>` + `<CardContent>`
- Address rows: Clickable with `hover:border-primary/50 hover:bg-accent`

### 5.5 CartSummaryCard (`src/components/cards/CartSummaryCard.tsx`, 52 lines)
- Wrap in `<Card>` + `<CardContent>`
- Bill divider: `<Separator />`

### 5.6 OrderConfirmationCard (`src/components/cards/OrderConfirmationCard.tsx`, 42 lines)
- Wrap in `<Card className="rounded-2xl border-2">` with vertical accent border

### 5.7 BookingConfirmedCard (`src/components/cards/BookingConfirmedCard.tsx`, 45 lines)
- Same treatment as OrderConfirmationCard

### 5.8 StatusCard (`src/components/cards/StatusCard.tsx`, 69 lines)
- Wrap in `<Card className="border-2">` with dynamic success/error color
- Error state: `--destructive` for border and icon

### 5.9 InfoCard (`src/components/cards/InfoCard.tsx`, 37 lines)
- Wrap in `<Card>` + `<CardHeader>` + `<CardContent>`
- Use `<Separator>` between header and entries

### 5.10 ItemCardGrid (`src/components/cards/ItemCardGrid.tsx`, 184 lines)
- "Add X items to cart" button: `<Button className="w-full gap-2">` with vertical accent
- Keep horizontal scroll `overflow-x-auto` (simpler than ScrollArea for this pattern)
- Increase spacing `my-2` -> `my-3` (Maia)

---

## Phase 6: Cart & Auth Revamp

### 6.1 CartPanel (`src/components/cart/CartPanel.tsx`, 131 lines)

**Major architectural change:** Replace manual side drawer with shadcn `<Sheet>`.

**Before:**
- Manual `fixed inset-0 z-40 bg-black/30` backdrop div
- Manual `fixed right-0 top-0 h-full w-80 z-40` panel div
- Manual close-on-backdrop-click handler

**After:**
```tsx
<Sheet open={isOpen} onOpenChange={onClose}>
  <SheetContent side="right" className="flex w-80 flex-col p-0">
    <SheetHeader>Cart title + count</SheetHeader>
    <ScrollArea>Cart items</ScrollArea>
    <div>Bill summary + Place Order button</div>
  </SheetContent>
</Sheet>
```

**Benefits:** Eliminates manual backdrop, positioning, z-index management, and close handling. Sheet handles all of this automatically + adds keyboard dismiss (Escape) and focus trapping.

- Cart item quantity buttons: `<Button variant="outline" size="icon">`
- Place Order CTA: `<Button className="w-full">`
- Bill dividers: `<Separator />`

### 6.2 CartFloatingButton (`src/components/cart/CartFloatingButton.tsx`, 38 lines)
- Use `<Button size="icon" className="rounded-full shadow-lg h-12 w-12">`
- Count: `<Badge>` positioned absolutely at top-right

### 6.3 OrderConfirmation (`src/components/cart/OrderConfirmation.tsx`, 72 lines)

**Replace manual modal with shadcn `<Dialog>`:**

**Before:**
- Manual `fixed inset-0 z-50 bg-black/40` backdrop
- Manual `fixed centered rounded-2xl` dialog
- Manual click-outside-to-close

**After:**
```tsx
<Dialog open={showConfirm} onOpenChange={onClose}>
  <DialogContent className="max-w-sm">
    <DialogHeader><DialogTitle>Confirm Order</DialogTitle></DialogHeader>
    {/* Order summary */}
    <Separator />
    {/* COD warning with AlertTriangle icon */}
    <DialogFooter>
      <Button variant="outline">Go Back</Button>
      <Button>Confirm Order</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 6.4 ApiKeyModal (`src/components/auth/ApiKeyModal.tsx`, 74 lines)

**Replace manual modal with shadcn `<Dialog open={true}>`:**

- `open` is always `true` (mandatory modal -- no close button)
- Use `<Input type="password">` for API key field
- Use `<Label>` for form field
- Error text: `text-destructive`
- Submit: `<Button type="submit" className="w-full">`

### 6.5 SettingsMenu (`src/components/auth/SettingsMenu.tsx`, 79 lines)

**Replace entirely with shadcn `<DropdownMenu>`:**

**Lines eliminated:**
- `const [open, setOpen] = useState(false)` -- Radix manages this
- `const ref = useRef<HTMLDivElement>(null)` -- Radix handles click-outside
- `useEffect(() => { function handleClick...` -- ~15 lines of click-outside handler

**New structure:**
```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon"><Settings /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="w-56">
    <DropdownMenuItem>Change API key</DropdownMenuItem>
    <DropdownMenuItem>Disconnect Swiggy</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem className="text-destructive">Clear all chats</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Benefits:** Gains keyboard navigation, focus management, accessibility attributes for free.

### 6.6 SwiggyConnect (`src/components/auth/SwiggyConnect.tsx`, 104 lines)

**Connected state:**
- `<Badge variant="outline">` with green/amber status dot

**Disconnected state -- Replace manual dropdown with shadcn `<Popover>`:**

**Lines eliminated:**
- Same pattern as SettingsMenu: `useState`, `useRef`, `useEffect` click-outside (~20 lines)

**New structure:**
```tsx
<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger asChild>
    <Button variant="outline" size="sm" className="rounded-full">Connect Swiggy</Button>
  </PopoverTrigger>
  <PopoverContent align="end" className="w-72 p-4">
    <Button>Connect via OAuth</Button>
    <Separator />
    <Input placeholder="Paste access token..." />
    <Button size="sm">Save</Button>
  </PopoverContent>
</Popover>
```

---

## Phase 7: Landing Page Revamp

### 7.1 LandingPage (`src/components/home/LandingPage.tsx`, 39 lines)
- `text-gray-900` -> `text-foreground`
- `text-gray-600` -> `text-muted-foreground`
- "How it works" box: Wrap in `<Card>` + `<CardHeader>` + `<CardContent>`
- Increase padding: `py-12` -> `py-16` (Maia generous spacing)

### 7.2 VerticalCard (`src/components/home/VerticalCard.tsx`, 76 lines)
- Wrap in `<Card className="rounded-2xl border-2">` with hover shadow
- Replace gray text with semantic tokens
- **Keep** the vertical-specific `colorClasses` map as-is (essential for branded look)

---

## Phase 8: Cross-cutting Cleanup

### Global Color Token Migration

Run search-and-replace across all `.tsx` files:

| Find | Replace With |
|---|---|
| `bg-white` | `bg-card` or `bg-background` |
| `text-gray-900` | `text-foreground` |
| `text-gray-800` | `text-foreground` |
| `text-gray-700` | `text-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-400` | `text-muted-foreground/70` |
| `border-gray-200` | `border-border` |
| `border-gray-100` | `border-border` |
| `bg-gray-50` | `bg-muted` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-200` | `bg-muted` |
| `hover:bg-gray-50` | `hover:bg-accent` |
| `hover:bg-gray-100` | `hover:bg-accent` |
| `hover:border-gray-300` | `hover:border-border` |
| `focus:border-gray-300` | `focus:border-input` |
| `focus:ring-gray-300` | `focus:ring-ring` |
| `placeholder-gray-400` | `placeholder:text-muted-foreground` |
| `ring-gray-100` | `ring-border` |

### Exceptions (keep as-is)
- Amber colors in SwiggyConnect (Swiggy brand orange)
- Star rating colors (`fill-amber-400`, `text-amber-400`)
- Context-specific green/red indicators that aren't part of the base theme

---

## Files NOT Modified (pure business logic)

These files contain only business logic, types, or server code and require zero UI changes:

| File | Purpose |
|---|---|
| `src/lib/types.ts` | TypeScript type definitions |
| `src/lib/parsers.ts` | Tool result parsing (669 lines) |
| `src/lib/anthropic.ts` | Anthropic SDK client factory |
| `src/lib/storage.ts` | localStorage helpers |
| `src/lib/constants.ts` | Model ID, MCP servers, storage keys |
| `src/hooks/useChat.ts` | Chat state management & API calls |
| `src/hooks/useCart.ts` | Cart extraction from messages |
| `src/hooks/useAuth.ts` | Auth state & OAuth flow |
| `src/verticals/food.ts` | NutriCart vertical config |
| `src/verticals/style.ts` | StyleKit vertical config |
| `src/verticals/dining.ts` | TableScout vertical config |
| `src/verticals/foodOrder.ts` | FeedMe vertical config |
| `src/verticals/index.ts` | Vertical registry |
| `server/oauth-plugin.ts` | Vite OAuth plugin |

---

## New Dependencies

| Package | Purpose |
|---|---|
| `@fontsource-variable/geist-sans` | Geist font (variable weight) |
| `@fontsource-variable/geist-mono` | Geist Mono for code blocks |
| `@radix-ui/react-dialog` | Dialog primitive (auto-installed by shadcn) |
| `@radix-ui/react-dropdown-menu` | DropdownMenu primitive (auto) |
| `@radix-ui/react-popover` | Popover primitive (auto) |
| `@radix-ui/react-scroll-area` | ScrollArea primitive (auto) |
| `@radix-ui/react-collapsible` | Collapsible primitive (auto) |
| `@radix-ui/react-avatar` | Avatar primitive (auto) |
| `@radix-ui/react-separator` | Separator primitive (auto) |
| `@radix-ui/react-tooltip` | Tooltip primitive (auto) |
| `@radix-ui/react-label` | Label primitive (auto) |
| `@radix-ui/react-slot` | Slot utility (auto, used by Button) |
| `class-variance-authority` | CVA for variant system (auto) |

**Already installed (no change):** `clsx`, `tailwind-merge`, `lucide-react`

---

## Summary of Benefits

### Accessibility
- shadcn/Radix components provide keyboard navigation, focus trapping, ARIA attributes, and screen reader support out of the box
- DropdownMenu, Dialog, Sheet, Popover all get Escape-to-close, focus management, and proper ARIA roles

### Code Reduction
- **~90 lines** of manual click-outside / dropdown / modal handling eliminated (SettingsMenu, SwiggyConnect, CartPanel, OrderConfirmation, ApiKeyModal)
- `useState` + `useRef` + `useEffect` patterns replaced by Radix's built-in state management

### Design Consistency
- All components draw from the same CSS variable token system
- Consistent border radius (Maia 0.75rem), spacing, and color usage
- Single source of truth for colors -- change one CSS variable, whole app updates

### UX Improvements
- ChatGPT-style floating prompt form feels more modern and spacious
- Sheet-based cart drawer has proper focus trapping and keyboard dismiss
- Avatar components give messages a polished, app-like feel
- Collapsible tool traces use proper animation/transition patterns

---

## Verification Checklist

1. `pnpm build` -- TypeScript compiles with no errors
2. `pnpm test` -- Existing tests pass
3. Manual testing:
   - [ ] Landing page: Stone background, Geist font, rounded cards with vertical colors
   - [ ] Each vertical route (/food, /style, /dining, /foodorder): Correct accent colors preserved
   - [ ] Chat empty state: Welcome layout with outline pill buttons
   - [ ] Chat input: Rounded container, orange send button, "Ask anything..." placeholder
   - [ ] User messages: Dark foreground bubble with Avatar
   - [ ] Assistant messages: Card-style bubble with colored bot Avatar
   - [ ] Tool traces: Collapsible with Badge pill and smooth animations
   - [ ] Product/Restaurant cards: shadcn Card with proper hover and spacing
   - [ ] Cart FAB: Round button with Badge count
   - [ ] Cart drawer: Sheet slides from right, has scroll area and bill summary
   - [ ] Order confirmation: Dialog with proper focus trapping
   - [ ] Settings gear: DropdownMenu with keyboard navigation
   - [ ] API key modal: Dialog, always open, proper form with Input + Label
   - [ ] SwiggyConnect: Popover with OAuth + paste-token sections
   - [ ] Mobile responsive: All components work on small screens

---

## Research Sources

- [shadcn/ui Theming Docs](https://ui.shadcn.com/docs/theming)
- [shadcn/ui Themes](https://ui.shadcn.com/themes)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [shadcn/ui Blocks](https://ui.shadcn.com/docs/blocks)
- [shadcn/ui Colors (Tailwind)](https://ui.shadcn.com/colors)
- [shadcn/ui December 2025 -- npx shadcn create](https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create)
- [shadcn/ui components.json Config](https://ui.shadcn.com/docs/components-json)
