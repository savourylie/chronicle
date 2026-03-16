# Ticket 015: Hover Tooltips

## Status
`not started`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
012

## Description
Show summary tooltips when hovering over circles in the visualization. Group circles show aggregate info (commit count, date range, top contributors). Leaf circles show individual commit info (message, author, date). Tooltips follow the Playful Geometric design system.

## Requirements
- [ ] Show tooltip on circle hover with a small delay (~200ms):
  - **For CommitGroup**: name, commit count, date range, top 3 authors, grouping strategy
  - **For CommitNode**: short hash, message, author, date, files changed count, +/- lines
- [ ] Tooltip positioning:
  - Appear near the cursor, offset to avoid obscuring the hovered circle
  - Stay within viewport bounds (flip if near edge)
  - Follow cursor if moving within the same circle
- [ ] Tooltip styling (per DESIGN.md):
  - Card background with 2px border
  - Hard shadow (`shadow-hard`)
  - Rounded corners (`radius-md`)
  - Outfit Bold for title, Plus Jakarta Sans for details
- [ ] Dismiss tooltip:
  - On mouse leave
  - On click (selection takes over)
  - On zoom transition start
- [ ] Performance: tooltip should not cause re-renders of the visualization

## Files to Create/Modify
- `src/components/tooltip.tsx` — tooltip component
- `src/components/circle-pack/circle-pack.tsx` — wire hover events

## Acceptance Criteria
- [ ] Hovering a group circle shows commit count, date range, and authors
- [ ] Hovering a leaf circle shows commit message, author, and date
- [ ] Tooltip appears near the cursor without overlapping the circle
- [ ] Tooltip stays within the viewport
- [ ] No visible lag or jank when moving between circles
- [ ] Tooltip styling matches DESIGN.md card/shadow specs

## Notes
- PRD Section 4.2: "Hovering to see summary tooltips (commit count, date range, top contributors, key files)"
- Use a portal or absolutely positioned element — not a child of the SVG
- Consider `pointer-events: none` on the tooltip to prevent it from interfering with hover events
- The tooltip is read-only — clicking opens the detail panel (ticket 016)
