# Ticket 003: TypeScript Data Model & Types

## Status
`done`

## Phase
Phase 1: Foundation (M0)

## Dependencies
001

## Description
Define the core TypeScript types and interfaces that represent git commits, commit groups, and visualization state. These types are the shared contract between the data pipeline, state management, and UI components.

## Requirements
- [x] Define `CommitNode` interface:
  - `hash`, `shortHash`, `message`, `author: { name, email }`, `date` (ISO 8601)
  - `filesChanged: string[]`, `insertions: number`, `deletions: number`
  - `type?: string` (feat, fix, refactor, etc.), `scope?: string`
  - `parentHashes: string[]`
  - `prNumber?: number`, `prTitle?: string`
- [x] Define `CommitGroup` interface:
  - `id`, `name`, `level` (0=epoch, 1=chapter, 2=scene)
  - `groupingStrategy: "conventional-commit" | "file-path" | "time-session" | "manual"`
  - `children: (CommitGroup | CommitNode)[]`
  - `metadata: { dateRange, commitCount, authors, topFiles, totalInsertions, totalDeletions }`
- [x] Define `VisualizationState` interface:
  - `root: CommitGroup`
  - `zoomPath: string[]`
  - `selectedNode: string | null`
  - `filters: { dateRange?, authors?, types?, searchQuery? }`
  - `encoding: { size: "linesChanged" | "fileCount" | "commitCount", color: "type" | "author" | "recency" | "churn" }`
- [x] Define type guards: `isCommitNode(node)` and `isCommitGroup(node)`
- [x] Define `GroupingStrategy` type union
- [x] Define `SizeEncoding` and `ColorEncoding` type unions

## Files to Create/Modify
- `src/types/commit.ts` — CommitNode interface
- `src/types/group.ts` — CommitGroup interface
- `src/types/visualization.ts` — VisualizationState, encoding types
- `src/types/index.ts` — re-exports

## Acceptance Criteria
- [x] All types compile with TypeScript strict mode
- [x] Type guards correctly discriminate between CommitNode and CommitGroup
- [x] Types match the data model defined in PRD Section 6.4
- [x] All type files are re-exported from `src/types/index.ts`

## Notes
- These types are defined in PRD Section 6.4 — follow that specification closely
- Type guards are needed because `CommitGroup.children` is a union type
- The `level` field on CommitGroup maps to: 0=Epoch/Arc, 1=Chapter, 2=Scene/Task
- Keep types serializable (no class instances, functions, or Dates — use ISO strings)
