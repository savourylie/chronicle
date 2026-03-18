# Ticket 015: Hover Tooltips

## Status
`done`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
012

## Description
Show summary tooltips when hovering over circles in the visualization. Group circles show aggregate info (commit count, date range, top contributors). Leaf circles show individual commit info (message, author, date). Tooltips follow the Playful Geometric design system.

## Requirements
- [x] Show tooltip on circle hover with a small delay (~200ms):
  - **For CommitGroup**: name, commit count, date range, top 3 authors, grouping strategy
  - **For CommitNode**: short hash, message, author, date, files changed count, +/- lines
- [x] Tooltip positioning:
  - Appear near the cursor, offset to avoid obscuring the hovered circle
  - Stay within viewport bounds (flip if near edge)
  - Follow cursor if moving within the same circle
- [x] Tooltip styling (per DESIGN.md):
  - Card background with 2px border
  - Hard shadow (`shadow-hard`)
  - Rounded corners (`radius-md`)
  - Outfit Bold for title, Plus Jakarta Sans for details
- [x] Dismiss tooltip:
  - On mouse leave
  - On click (selection takes over)
  - On zoom transition start
- [x] Performance: tooltip should not cause re-renders of the visualization

## Files to Create/Modify
- `src/components/tooltip.tsx` — tooltip component
- `src/components/circle-pack/circle-pack.tsx` — wire hover events

## Acceptance Criteria
- [x] Hovering a group circle shows commit count, date range, and authors
- [x] Hovering a leaf circle shows commit message, author, and date
- [x] Tooltip appears near the cursor without overlapping the circle
- [x] Tooltip stays within the viewport
- [x] No visible lag or jank when moving between circles
- [x] Tooltip styling matches DESIGN.md card/shadow specs

## Notes
- PRD Section 4.2: "Hovering to see summary tooltips (commit count, date range, top contributors, key files)"
- Use a portal or absolutely positioned element — not a child of the SVG
- Consider `pointer-events: none` on the tooltip to prevent it from interfering with hover events
- The tooltip is read-only — clicking opens the detail panel (ticket 016)
