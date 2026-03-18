# Ticket 013: Circle Packing Zoom Transitions

## Status
`done`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
012

## Description
Add click-to-zoom interaction to the circle packing visualization. Clicking a group circle smoothly zooms into it, revealing its children. Clicking outside or on the background zooms back out. This is the core navigation model — "Google Maps for your codebase."

## Requirements
- [x] Click a group circle to zoom in:
  - Smooth animated transition (scale + translate) to focus on the clicked group
  - Children of the focused group become the visible circles
  - Parent circles fade or scale away
  - Transition duration: ~750ms with easing
- [x] Click background or current focus to zoom out one level
- [x] Update Zustand store on zoom:
  - `zoomTo(nodeId)` when zooming in
  - `zoomOut()` when zooming out
- [x] Visual feedback during transitions:
  - Circles smoothly interpolate position and size
  - Labels fade in/out during transitions
  - No visual artifacts or flickering
- [x] Support deep zoom: zoom into level 0 → level 1 → level 2 → individual commits
- [x] Keyboard support:
  - Escape to zoom out one level
  - Escape at root level: no-op

## Files to Create/Modify
- `src/components/circle-pack/circle-pack.tsx` — add zoom interaction
- `src/components/circle-pack/zoom.ts` — zoom transition logic

## Acceptance Criteria
- [x] Clicking a group circle triggers a smooth zoom animation
- [x] After zoom, children are clearly visible and interactive
- [x] Clicking background zooms out one level smoothly
- [x] Zoom state is reflected in the Zustand store (`zoomPath`)
- [x] Transitions complete in under 300ms (PRD success metric)
- [x] No visual glitches during rapid click sequences

## Notes
- Reference the D3 zoomable circle packing pattern for transition math
- Use `d3-interpolate-zoom` or manual scale/translate interpolation
- The bounce easing from DESIGN.md (`cubic-bezier(0.34, 1.56, 0.64, 1)`) should be considered for transitions, but test if it feels right for zoom — standard easing may be better for spatial navigation
- Respect `prefers-reduced-motion`: instant transitions (no animation) when enabled
