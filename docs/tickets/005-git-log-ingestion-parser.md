# Ticket 005: Git Log Ingestion & Parser

## Status
`done`

## Phase
Phase 2: Data Pipeline (M1)

## Dependencies
003

## Description
Build a parser that executes `git log` against a local repository and converts the raw output into a typed `CommitNode[]` array. This is the entry point of the data pipeline — all downstream grouping and clustering operates on the output of this parser.

## Requirements
- [x] Execute `git log` with structured format flags to extract:
  - Hash, short hash, author name, author email, date (ISO 8601)
  - Subject line, body, parent hashes
  - `--numstat` for per-file insertions/deletions
- [x] Parse the raw output into `CommitNode[]`
  - Handle multi-line commit messages
  - Parse `--numstat` lines into `filesChanged`, `insertions`, `deletions`
  - Handle binary files in numstat (shown as `-` for insertions/deletions)
  - Handle merge commits (multiple parent hashes)
- [x] Accept configuration options:
  - `repoPath: string` — path to the git repository
  - `maxCommits?: number` — limit for large repos (default: 10000)
  - `since?: string` — date filter (ISO 8601)
  - `until?: string` — date filter (ISO 8601)
  - `branch?: string` — specific branch (default: all with `--all`)
- [x] Handle error cases:
  - Path is not a git repository
  - Git is not installed
  - Empty repository (no commits)

## Files to Create/Modify
- `src/lib/pipeline/git-parser.ts` — main parser module

## Acceptance Criteria
- [x] Parses a real git repository into valid `CommitNode[]`
- [x] All `CommitNode` fields are populated correctly
- [x] `filesChanged` accurately lists modified files per commit
- [x] `insertions`/`deletions` are correct numeric totals
- [x] Handles repos with 1000+ commits without hanging
- [x] Returns descriptive errors for invalid inputs

## Notes
- Reference PRD Section 7 for the recommended `git log` format
- Use Node.js `child_process.execFile` (not `exec`) for safety — no shell injection
- The `--numstat` flag adds file stats after each commit entry
- Binary files show `-\t-\tfilename` in numstat — treat these as 0 insertions/deletions
- This parser is used server-side only (in the API route, ticket 021)
