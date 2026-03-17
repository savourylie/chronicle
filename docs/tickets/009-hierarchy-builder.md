# Ticket 009: Hierarchy Builder

## Status
`done`

## Phase
Phase 2: Data Pipeline (M1)

## Dependencies
006, 007, 008

## Description
Combine the outputs of conventional commit parsing, file-path clustering, and time-session grouping into a unified multi-level `CommitGroup` hierarchy. This is the final pipeline stage that produces the tree structure consumed by the visualization.

## Requirements
- [ ] Build a 3-level hierarchy from the three grouping strategies:
  - **Level 0 (Epoch)**: Time-based epochs (e.g., quarters, months) or large file-path clusters
  - **Level 1 (Chapter)**: Conventional commit scope groups or major file-path clusters
  - **Level 2 (Scene)**: Time-sessions or fine-grained file-path sub-clusters
  - **Level 3 (Leaf)**: Individual `CommitNode`s
- [ ] Merge and reconcile overlapping groupings:
  - A commit may match multiple strategies — assign to the most specific group
  - Priority order: conventional commit scope > file-path cluster > time-session
- [ ] Compute all `CommitGroup.metadata` fields:
  - `dateRange`: min/max date from all descendant commits
  - `commitCount`: total leaf commits
  - `authors`: unique author names
  - `topFiles`: most frequently changed files (top 5)
  - `totalInsertions` / `totalDeletions`: sums
- [ ] Generate human-readable group names at each level
- [ ] Handle the "Other" / uncategorized group for orphan commits
- [ ] Return a single root `CommitGroup` with the complete tree

## Files to Create/Modify
- `src/lib/pipeline/hierarchy-builder.ts` — builder module

## Acceptance Criteria
- [x] Produces a valid `CommitGroup` tree from real pipeline outputs
- [x] Every input commit appears exactly once as a leaf node
- [x] No empty groups (groups with 0 commits are pruned)
- [x] Metadata fields are correctly computed at every level
- [x] The root node has `level: 0` and contains the full hierarchy
- [x] Tree structure matches `VisualizationState.root` type

## Notes
- This is the most complex pipeline stage — it orchestrates the three grouping strategies
- The hierarchy doesn't need to be perfect — it's a best-effort semantic grouping
- For MVP, a simpler approach is fine: group by scope at level 1, time-session at level 2
- The hierarchy builder is called by the API route (ticket 021)
- Consider making the strategy priority order configurable for future flexibility
