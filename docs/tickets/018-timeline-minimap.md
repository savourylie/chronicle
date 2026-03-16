# Ticket 018: Timeline Minimap

## Status
`not started`

## Phase
Phase 4: Interactive Features (M2 part 2)

## Dependencies
004, 010, 011

## Description
Implement a horizontal timeline minimap at the bottom of the visualization. Shows commit density over the full repo lifespan as a density plot/histogram. Highlights the time range of the currently focused group. Allows brush-selecting a date range to filter the main view.

## Requirements
- [ ] Render a horizontal density plot:
  - X-axis: time (full repository lifespan)
  - Y-axis: commit density (commits per time bucket)
  - Use D3 to compute and render the histogram/area chart
  - Height: ~100-120px, full width of the visualization area
- [ ] Sync with visualization state:
  - Highlight the date range of the currently focused group (from `zoomPath`)
  - Highlighted region uses accent color; rest is muted
- [ ] Brush interaction:
  - Users can click-drag to select a date range on the timeline
  - Selected range updates `filters.dateRange` in the Zustand store
  - The main visualization filters to show only commits within the range
  - Clear brush to reset filter
- [ ] Visual styling:
  - Clean, minimal chart that doesn't compete with the main visualization
  - Uses design token colors (accent for highlight, muted for background)
  - Subtle grid lines for time orientation
  - Date labels at key intervals
- [ ] Responsive: hide or collapse on very narrow screens

## Files to Create/Modify
- `src/components/timeline/timeline-minimap.tsx` — main component
- `src/components/timeline/density-chart.tsx` — D3 density/histogram renderer
- `src/components/timeline/index.ts` — re-export

## Acceptance Criteria
- [ ] Timeline shows commit density across the full repo history
- [ ] Current zoom focus is highlighted on the timeline
- [ ] Brush-selecting a range filters the main visualization
- [ ] Clearing the brush removes the date filter
- [ ] Timeline updates when zoom changes
- [ ] Renders 10k commits in under 500ms

## Notes
- PRD Section 4.3 defines the timeline requirements
- PRD Section 8.1: "Timeline minimap visible at bottom, showing full repo lifespan"
- Use `d3-brush` for the selection interaction
- Use `d3-scale` for the time axis
- Consider binning commits into daily or weekly buckets depending on repo timespan
- This component reads from the store but also writes to it (via brush → filter)
