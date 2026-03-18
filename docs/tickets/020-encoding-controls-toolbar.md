# Ticket 020: Encoding Controls Toolbar

## Status
`done`

## Phase
Phase 5: Integration & Polish

## Dependencies
002, 014

## Description
Build a toolbar UI that lets users toggle the color and size encoding of the visualization. This is the user-facing control for the encoding logic implemented in ticket 014.

## Requirements
- [x] Toolbar positioned at the top of the visualization area (or in the header):
  - Size encoding selector: dropdown or segmented control
    - Options: "Lines Changed", "File Count", "Commit Count"
  - Color encoding selector: dropdown or segmented control
    - Options: "Type", "Author", "Recency", "Churn"
- [x] Update Zustand store on selection:
  - `setEncoding("size", value)` and `setEncoding("color", value)`
- [x] Visual styling per DESIGN.md:
  - Segmented controls with pill shape (`radius-full`)
  - 2px borders, hard shadow on active segment
  - Accent color for active selection
  - Phosphor icons for each option (Palette for color, Resize for size)
  - Plus Jakarta Sans labels
- [x] Show current encoding in the button/segment as active state
- [x] Responsive: collapse to a compact icon-only mode on narrow screens

## Files to Create/Modify
- `src/components/toolbar.tsx` — toolbar with encoding controls

## Acceptance Criteria
- [x] Clicking "File Count" in size selector changes circle sizes in the visualization
- [x] Clicking "Author" in color selector changes circle colors
- [x] Active selection is visually distinguished (accent color)
- [x] Toolbar matches DESIGN.md styling (borders, shadows, pill shapes)
- [x] Changes are reflected immediately in the visualization

## Notes
- PRD Section 4.2: "Size encoding = Lines changed, files touched, or commit count (user-configurable)"
- This is purely a UI control — the encoding logic is in ticket 014 and `src/lib/encoding.ts`
- Consider grouping with the search input (ticket 019) in the same toolbar row
- Keep the toolbar minimal — it should not dominate the visualization
