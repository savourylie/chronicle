# Ticket 022: URL State Sharing

## Status
`not started`

## Phase
Phase 5: Integration & Polish

## Dependencies
010

## Description
Encode visualization state (zoom path, selected node, filters, encoding) in the URL so that a specific view can be shared via link. Loading a URL with state parameters restores the exact view.

## Requirements
- [ ] Encode state in URL search params:
  - `zoom`: zoom path as comma-separated IDs (e.g., `?zoom=root,auth,oauth`)
  - `selected`: selected node ID (e.g., `&selected=abc123`)
  - `size`: size encoding (e.g., `&size=linesChanged`)
  - `color`: color encoding (e.g., `&color=type`)
  - `search`: search query (e.g., `&search=auth`)
  - `dateFrom` / `dateTo`: date range filter
- [ ] Sync store → URL:
  - When Zustand store changes, update URL params (without page reload)
  - Use `history.replaceState` to avoid polluting browser history
  - Debounce URL updates (300ms) to avoid excessive history entries
- [ ] Sync URL → store:
  - On initial page load, parse URL params and hydrate Zustand store
  - Apply zoom path, selection, filters, and encoding from URL
- [ ] Handle invalid/stale URLs gracefully:
  - If a zoom path ID doesn't exist in the data, fall back to root
  - If an encoding value is invalid, use the default

## Files to Create/Modify
- `src/lib/url-state.ts` — URL serialization/deserialization logic
- `src/store/visualization-store.ts` — add URL sync middleware or effect

## Acceptance Criteria
- [ ] Zooming in/out updates the URL without page reload
- [ ] Copying the URL and opening in a new tab restores the same view
- [ ] Changing encoding updates the URL
- [ ] Invalid URL params are handled gracefully (no crashes)
- [ ] Browser back/forward buttons work with zoom history

## Notes
- PRD Feature F12: "URL-encoded state so a specific zoom level + selection can be shared"
- Use `URLSearchParams` for serialization
- Keep URL params short and readable
- This is a P2 feature — functional but doesn't need to be perfect for MVP
- The URL state only makes sense after data is loaded — if no data, URL params are ignored
