# Ticket 012: D3 Circle Packing — Static Render

## Status
`not started`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
004, 010, 011

## Description
Implement the core D3.js circle-packing visualization that renders the CommitGroup hierarchy as nested circles. This is the centerpiece of the application — the "Google Maps for your codebase." This ticket covers the static (non-interactive) render; zoom transitions come in ticket 013.

## Requirements
- [ ] Create a React component that renders a D3 circle-packing layout:
  - Use `d3-hierarchy` to convert `CommitGroup` tree into a D3 hierarchy
  - Use `d3.pack()` to compute circle positions and sizes
  - Render circles as SVG elements (or Canvas for performance)
- [ ] Render 3 levels of the hierarchy:
  - Level 0 circles: large, containing epoch groups
  - Level 1 circles: medium, containing chapter groups
  - Level 2+ circles: small, representing scenes or individual commits
- [ ] Apply basic visual styling:
  - Circles have borders (2px, matching DESIGN.md)
  - Group circles have a subtle fill (translucent)
  - Leaf circles (commits) have a solid fill
  - Labels on groups (name text inside circles where space permits)
- [ ] Connect to Zustand store:
  - Read `root` data from `useVisualizationStore`
  - Read `encoding.size` to determine what drives circle size
- [ ] Click-to-select interaction:
  - Clicking a circle calls `selectNode(id)` in the Zustand store
  - Selected circle gets a visual highlight (accent border or ring)
  - Clicking outside any circle deselects (`selectNode(null)`)
- [ ] Handle empty/loading states:
  - Show a placeholder when no data is loaded
  - Loading indicator while data is being processed
- [ ] Responsive: fill the visualization area from the layout shell

## Files to Create/Modify
- `src/components/circle-pack/circle-pack.tsx` — main visualization component
- `src/components/circle-pack/utils.ts` — D3 hierarchy conversion utilities
- `src/components/circle-pack/index.ts` — re-export

## Acceptance Criteria
- [ ] Mock data renders as nested circles on screen
- [ ] All 3 levels of hierarchy are visible
- [ ] Circles are correctly sized based on the selected size encoding
- [ ] Group labels are readable where space allows
- [ ] Clicking a circle updates `selectedNode` in the store
- [ ] 150-node mock data renders in under 200ms
- [ ] Labels do not overlap at the initial zoom level
- [ ] Component fills its container responsively
- [ ] No console errors or D3 warnings

## Notes
- Reference the D3 Zoomable Circle Packing example: https://observablehq.com/@d3/zoomable-circle-packing
- Start with SVG rendering; switch to Canvas only if performance requires it (likely for 10k+ nodes)
- D3 should handle layout computation; React handles DOM rendering
- Consider using `d3.pack().padding()` to create visual separation between circles
- The circle-packing visualization is the default layout (treemap is deferred per PRD Open Question #1)
