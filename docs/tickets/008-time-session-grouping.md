# Ticket 008: Time-Session Grouping

## Status
`done`

## Phase
Phase 2: Data Pipeline (M1)

## Dependencies
005

## Description
Cluster sequential commits by the same author on similar files within a configurable time window into "sessions" — natural work sessions that represent a developer's focused work period. This mimics how developers actually work: bursts of commits on a feature before switching context.

## Requirements
- [ ] Group sequential commits into sessions based on:
  - Same author
  - Within a configurable time window (default: 2 hours between commits)
  - Optional: overlapping file paths (same working area)
- [ ] Accept configuration:
  - `maxGapMinutes: number` (default: 120 — 2 hours)
  - `requireFileOverlap: boolean` (default: false)
  - `fileOverlapThreshold: number` (0-1, default: 0.2)
- [ ] Name sessions descriptively:
  - Use the first commit message as the session name, or
  - Combine author name + date: "Alice's work on Mar 15"
- [ ] Handle edge cases:
  - Single-commit sessions (author made one commit then switched)
  - Very long sessions (cap at configurable max, default: 50 commits)
  - Multiple authors interleaving commits (don't mix into one session)
- [ ] Return `CommitGroup[]` with level=2 (scene/task level)

## Files to Create/Modify
- `src/lib/pipeline/time-session.ts` — session grouping module

## Acceptance Criteria
- [x] 5 commits by "Alice" within 1 hour form a single session
- [x] A 3-hour gap between commits by the same author creates two sessions
- [x] Different authors' commits are never merged into one session
- [x] Session names are readable and informative
- [x] Processes commits sorted by date in a single pass (O(n))

## Notes
- PRD Section 4.1: "Cluster sequential commits by same author on similar files within a configurable time window (default: 2 hours)"
- This strategy is most useful for repos like Express with long, varied histories
- Sessions map to Level 2 (Scene/Task) in the hierarchy
- Commits must be pre-sorted by date before passing to this module
