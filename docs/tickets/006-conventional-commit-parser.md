# Ticket 006: Conventional Commit Parser

## Status
`done`

## Phase
Phase 2: Data Pipeline (M1)

## Dependencies
005

## Description
Parse conventional commit prefixes (`feat:`, `fix:`, `refactor:`, etc.) from commit messages to automatically categorize commits. Populates the `type` and `scope` fields on `CommitNode`. This is one of the three grouping strategies that feed into the hierarchy builder.

## Requirements
- [x] Parse conventional commit format: `type(scope): description`
  - Extract `type`: feat, fix, refactor, docs, chore, test, style, perf, ci, build
  - Extract optional `scope`: e.g., `feat(auth): ...` → scope = "auth"
  - Handle breaking changes: `feat!:` or `BREAKING CHANGE` in body
- [x] Handle non-conventional messages gracefully:
  - Return `type: undefined`, `scope: undefined` — do not throw
  - Attempt fuzzy matching for common patterns (e.g., "Fix bug in..." → type: "fix")
- [x] Process a `CommitNode[]` and return enriched `CommitNode[]` with `type` and `scope` populated
- [x] Track parsing statistics:
  - Count of successfully parsed vs. unparsed commits
  - Distribution of commit types

## Files to Create/Modify
- `src/lib/pipeline/conventional-parser.ts` — parser module

## Acceptance Criteria
- [x] `feat(auth): add login` → `{ type: "feat", scope: "auth" }`
- [x] `fix: resolve crash` → `{ type: "fix", scope: undefined }`
- [x] `random message` → `{ type: undefined, scope: undefined }` (no error)
- [x] `feat!: breaking change` → correctly identifies as feat with breaking flag
- [x] Processes 10k commits in under 100ms

## Notes
- PRD references the `conventional-commits-parser` npm package — evaluate whether to use it or write a lightweight parser (the npm package may be heavier than needed)
- The type field drives color encoding when `encoding.color === "type"`
- Scope is used by the hierarchy builder (ticket 009) to group commits with matching scopes
- Keep the fuzzy matching simple — don't over-engineer it; the main value is the strict conventional format
