# Ticket 016: Detail Panel (Commit & Group)

## Status
`not started`

## Phase
Phase 4: Interactive Features (M2 part 2)

## Dependencies
012, 002

## Description
Implement a slide-out detail panel that appears when a commit or group is selected (clicked). Shows comprehensive information about the selected node. This replaces the lightweight tooltip with full details including file lists, contributor breakdowns, and diff stats.

## Requirements
- [ ] **Panel structure**:
  - Slides in from the right side of the viewport
  - Fixed width (~400px on desktop, full width on mobile)
  - Close button and click-outside to dismiss
  - Smooth slide animation with bounce easing per DESIGN.md
- [ ] **For CommitGroup selection**:
  - Group name and level indicator
  - Summary description
  - Date range (start — end)
  - Contributor breakdown (author names with commit counts)
  - Most frequently touched files (top 10)
  - Sub-groups list (clickable to zoom into)
  - Total insertions/deletions
- [ ] **For CommitNode selection**:
  - Full commit message (subject + body)
  - Author name and email
  - Date and time
  - Commit hash (copyable)
  - Diff stats: total files changed, insertions, deletions
  - File list with per-file +/- counts
  - Parent commit hash(es)
- [ ] **Styling per DESIGN.md**:
  - Card background with 2px border
  - Hard shadow on the panel edge
  - Outfit Bold headings, Plus Jakarta Sans body
  - Colored badges for commit type (using encoding colors)
  - Phosphor icons for metadata items (calendar, user, file, etc.)
- [ ] Connect to Zustand store:
  - Read `selectedNode` to determine what to display
  - `selectNode(null)` on close

## Files to Create/Modify
- `src/components/detail-panel/detail-panel.tsx` — main panel component
- `src/components/detail-panel/commit-detail.tsx` — commit view
- `src/components/detail-panel/group-detail.tsx` — group view
- `src/components/detail-panel/index.ts` — re-export

## Acceptance Criteria
- [ ] Clicking a circle opens the detail panel with correct data
- [ ] Panel shows different content for commits vs. groups
- [ ] Panel slides in/out smoothly
- [ ] Close button and click-outside both dismiss the panel
- [ ] Panel is scrollable when content overflows
- [ ] Styling matches DESIGN.md (borders, shadows, typography, icons)

## Notes
- PRD Section 4.4 defines the full detail panel content
- Use Phosphor icons (per CLAUDE.md): Calendar, User, File, GitCommit, etc.
- Consider using shadcn/ui Sheet component as the slide-out base
- The panel should not block the visualization — it overlays on the right side
- Sub-group links in the group detail should trigger `zoomTo()` in the store
