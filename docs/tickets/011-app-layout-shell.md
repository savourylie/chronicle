# Ticket 011: App Layout Shell

## Status
`not started`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
002

## Description
Build the main application layout with the "Playful Geometric" design system. This includes the root page, main visualization area, slots for the detail panel and timeline minimap, and decorative elements per DESIGN.md.

## Requirements
- [ ] Create the root layout (`src/app/layout.tsx`):
  - Apply `font-heading` (Outfit) and `font-body` (Plus Jakarta Sans)
  - Set `bg-background` on the body
  - Wrap with TanStack Query provider
- [ ] Create the main page (`src/app/page.tsx`):
  - Full-viewport visualization area (the circle packing canvas goes here)
  - Right-side slot for the detail panel (slide-out)
  - Bottom slot for the timeline minimap
  - Top bar with app title and toolbar slot
- [ ] Apply DESIGN.md visual signatures:
  - Warm cream background (`#FFFDF5`)
  - Header with Outfit Bold typography
  - Decorative background elements (dot grid, subtle confetti shapes)
  - `prefers-reduced-motion` media query to disable decorative animations
- [ ] Layout is responsive:
  - Desktop: full decorative treatment
  - Mobile: stacked layout, reduced shadows, hidden complex decorations
- [ ] Set up component slots as empty containers with proper sizing:
  - Visualization area: flex-grow, fills remaining space
  - Detail panel: fixed width (400px), slides from right
  - Timeline: fixed height (~120px), full width at bottom
  - Toolbar: fixed height, full width at top

## Files to Create/Modify
- `src/app/layout.tsx` — root layout with providers and fonts
- `src/app/page.tsx` — main page with layout slots
- `src/components/layout/header.tsx` — top bar with title
- `src/components/providers.tsx` — TanStack Query provider wrapper

## Acceptance Criteria
- [ ] Page renders with warm cream background and correct typography
- [ ] Visualization area fills the available viewport
- [ ] Panel and timeline slots are positioned correctly (even if empty)
- [ ] Layout looks correct at desktop (1440px) and mobile (375px) widths
- [ ] No layout shift or scroll issues

## Notes
- The layout is a shell — actual components (circle pack, timeline, panel) are added in later tickets
- Use CSS Grid or Flexbox for the main layout structure
- The detail panel slot should support a slide-in animation (implemented in ticket 016)
- Keep the decorative elements lightweight — they're nice-to-have, not blockers
