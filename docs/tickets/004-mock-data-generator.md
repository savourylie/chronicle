# Ticket 004: Mock/Sample Data Generator

## Status
`done`

## Phase
Phase 1: Foundation (M0)

## Dependencies
003

## Description
Create a mock data generator that produces a realistic 3-level CommitGroup hierarchy for development and testing. This enables UI work (tickets 012+) to proceed before the real data pipeline (tickets 005-009) is complete.

## Requirements
- [x] Generate a root `CommitGroup` with 3 levels of nesting:
  - Level 0: 3-4 epochs (e.g., "Auth System Overhaul", "API v2 Migration", "Performance Sprint")
  - Level 1: 2-4 chapters per epoch (e.g., "OAuth2 Integration", "Session Management")
  - Level 2: 3-6 scenes per chapter, each containing 2-8 leaf `CommitNode`s
- [x] Generate realistic `CommitNode` data:
  - Plausible commit messages using conventional commit prefixes
  - Varied authors (5-8 different contributors)
  - Realistic date ranges (spanning ~6 months)
  - File paths resembling a real project structure
  - Varied insertions/deletions counts
- [x] Populate all `CommitGroup.metadata` fields correctly:
  - `dateRange` computed from children
  - `commitCount` aggregated recursively
  - `authors` collected from children
  - `topFiles` most frequently changed files
  - `totalInsertions` / `totalDeletions` summed
- [x] Export a `generateMockData()` function that returns a complete `CommitGroup` tree
- [x] Export a static `MOCK_DATA` constant for deterministic use in tests

## Files to Create/Modify
- `src/lib/mock-data.ts` — generator function and static export

## Acceptance Criteria
- [x] `generateMockData()` returns a valid `CommitGroup` root
- [x] The tree has 3 levels of depth with realistic variety
- [x] All metadata fields are correctly computed
- [x] Total commit count is 80-150 nodes (enough to be visually interesting, not overwhelming)
- [x] Type-checks pass with strict TypeScript

## Notes
- This mock data is the primary data source for M0 (proof of concept)
- Design the data to showcase different grouping strategies (some groups by file-path, some by conventional commit type)
- Include a mix of commit types: feat, fix, refactor, docs, chore, test
- Date distribution should not be uniform — create realistic "bursts" of activity
