# Ticket 019: Search & Highlight

## Status
`done`

## Phase
Phase 4: Interactive Features (M2 part 2)

## Dependencies
010, 012, 013

## Description
Add text search that searches across commit messages, file paths, and author names, then highlights matching nodes in the visualization. Collapsed groups containing matches show a count badge. Clicking a search result zooms to that node.

## Requirements
- [x] Search input field in the toolbar area:
  - Debounced text input (300ms delay)
  - Search across: commit messages, file paths, author names
  - Case-insensitive matching
  - Clear button to reset search
- [x] Highlight matching nodes in the circle packing:
  - Matching leaf nodes glow or have an emphasized border
  - Non-matching nodes are dimmed (reduced opacity)
  - Group circles containing matches show a count badge (e.g., "12 matches")
  - Groups with no matches are dimmed
- [x] Search results list (optional dropdown):
  - Show top matches as a list below the search input
  - Each result shows: commit message, author, date
  - Click a result to zoom directly to that node
- [x] Update Zustand store:
  - Set `filters.searchQuery` on input
  - The visualization reads this filter for highlight logic
- [x] Styling per DESIGN.md:
  - Search input: 2px border, `radius-md`, hard shadow on focus
  - Highlight: accent-colored glow or ring around matching circles
  - Phosphor MagnifyingGlass icon in the input

## Files to Create/Modify
- `src/components/search.tsx` — search input + results dropdown
- `src/components/circle-pack/circle-pack.tsx` — apply highlight/dim logic

## Acceptance Criteria
- [x] Typing in search highlights matching commits in the visualization
- [x] Non-matching nodes are visually dimmed
- [x] Group badges show correct match counts
- [x] Clicking a search result zooms to that node
- [x] Clearing search restores normal visualization
- [x] Search results appear within 300ms of typing
- [x] Performs correctly with 10k nodes

## Notes
- PRD Section 4.2: "Search to highlight commits/groups matching a query"
- PRD Section 8.5: full search interaction flow
- For MVP, client-side filtering is fine (all data is already loaded)
- Debounce is important — searching 10k commits on every keystroke would be slow
- Consider highlighting the search path: if a match is inside a collapsed group, show the group glowing with the match count
