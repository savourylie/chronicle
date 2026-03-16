# Ticket 017: Breadcrumb Navigation

## Status
`not started`

## Phase
Phase 4: Interactive Features (M2 part 2)

## Dependencies
010, 013

## Description
Display a clickable breadcrumb trail showing the current zoom path. Users can click any ancestor in the breadcrumb to jump directly to that zoom level. Example: `All > Auth System > OAuth2 Migration > Session Handling`.

## Requirements
- [ ] Render a breadcrumb bar at the top of the visualization area:
  - Show the full zoom path from root to current focus
  - Root level shown as "All" or the repository name
  - Each breadcrumb segment is the group's name
  - Separator between segments (e.g., `>` or `/`)
- [ ] Click interaction:
  - Click any ancestor segment to zoom directly to that level
  - Calls `zoomTo()` or `zoomToRoot()` in the Zustand store
  - Current (deepest) level is not clickable (it's the active state)
- [ ] Styling per DESIGN.md:
  - Pill-shaped segments with subtle backgrounds
  - Active (current) segment has accent color
  - Hover state on clickable segments
  - Phosphor CaretRight or ArrowRight as separator icon
  - Font: Plus Jakarta Sans, medium weight
- [ ] Read zoom path from Zustand store (`zoomPath`)
- [ ] Resolve zoom path IDs to group names for display
- [ ] Handle long paths: truncate middle segments with "..." on narrow screens

## Files to Create/Modify
- `src/components/breadcrumb.tsx` — breadcrumb navigation component

## Acceptance Criteria
- [ ] Breadcrumb shows "All" when at root level
- [ ] Zooming in adds segments: "All > Epoch Name > Chapter Name"
- [ ] Clicking "All" returns to root view
- [ ] Clicking any ancestor zooms to that level
- [ ] Breadcrumb updates in sync with zoom transitions
- [ ] Responsive: truncates gracefully on small screens

## Notes
- PRD Section 4.2: "Breadcrumb navigation to track and jump between zoom levels"
- PRD Section 8.2: `All > Auth System > OAuth2 Migration`
- Keep it simple — this is a navigation aid, not a complex component
- Consider using shadcn/ui Breadcrumb component as a base, styled with DESIGN.md tokens
