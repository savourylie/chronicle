# Ticket 010: Zustand Visualization Store

## Status
`done`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
003

## Description
Implement the central state management store using Zustand. This store holds the visualization state (root data, zoom path, selection, filters, encoding) and provides actions for all interactive behaviors. Every visualization component reads from and writes to this store.

## Requirements
- [ ] Create a Zustand store implementing `VisualizationState`:
  - `root: CommitGroup | null` — the full hierarchy tree
  - `zoomPath: string[]` — IDs from root to currently focused node
  - `selectedNode: string | null` — currently selected commit/group ID
  - `filters`: dateRange, authors, types, searchQuery
  - `encoding`: size and color mapping selections
- [ ] Implement store actions:
  - `setRoot(data: CommitGroup)` — load data into the store
  - `zoomTo(nodeId: string)` — push node onto zoom path
  - `zoomOut()` — pop last node from zoom path
  - `zoomToRoot()` — clear zoom path
  - `selectNode(nodeId: string | null)` — set/clear selection
  - `setFilter(key, value)` — update individual filter fields
  - `clearFilters()` — reset all filters
  - `setEncoding(key, value)` — update size or color encoding
- [ ] Implement derived selectors:
  - `currentFocus` — the CommitGroup at the current zoom depth
  - `visibleNodes` — filtered nodes based on active filters
  - `selectedNodeData` — full data for the selected node
- [ ] Expose the store via a `useVisualizationStore` hook

## Files to Create/Modify
- `src/store/visualization-store.ts` — Zustand store definition

## Acceptance Criteria
- [x] `useVisualizationStore()` returns typed state and actions
- [x] `zoomTo` / `zoomOut` correctly manage the zoom path stack
- [x] `currentFocus` returns the correct node for any zoom depth
- [x] Filters correctly narrow the visible nodes
- [x] Store updates trigger re-renders only in subscribing components

## Notes
- Zustand is chosen for its simplicity and minimal boilerplate
- The store is the single source of truth — components should not maintain local visualization state
- Consider using Zustand's `subscribeWithSelector` for performance-sensitive selectors
- The URL state sharing ticket (022) will later sync parts of this store to the URL
