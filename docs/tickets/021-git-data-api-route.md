# Ticket 021: Git Data API Route

## Status
`done`

## Phase
Phase 5: Integration & Polish

## Dependencies
009

## Description
Create a Next.js API route that accepts a local repository path, runs the full data pipeline (git parsing → conventional commits → file clustering → time sessions → hierarchy building), and returns the complete `CommitGroup` tree as JSON. This wires the backend pipeline to the frontend.

## Requirements
- [x] Create API route at `POST /api/analyze`:
  - Accept request body: `{ repoPath: string, options?: { maxCommits?, since?, until?, branch? } }`
  - Run the pipeline: git-parser → conventional-parser → file-clustering → time-session → hierarchy-builder
  - Return the `CommitGroup` root as JSON response
- [x] Input validation:
  - Verify `repoPath` exists and is a git repository
  - Sanitize path to prevent directory traversal attacks
  - Validate optional parameters
- [x] Error handling:
  - 400 for invalid input (not a git repo, missing path)
  - 500 for pipeline failures (git command failed, parsing error)
  - Return descriptive error messages
- [x] Performance considerations:
  - Stream processing for large repos where possible
  - Respect `maxCommits` limit
  - Return timing metadata: `{ data: CommitGroup, meta: { commitCount, pipelineMs } }`
- [x] Connect frontend to API:
  - Use TanStack Query to fetch from `/api/analyze`
  - Load result into Zustand store via `setRoot()`
  - Show loading state during analysis

## Files to Create/Modify
- `src/app/api/analyze/route.ts` — Next.js API route handler
- `src/lib/pipeline/index.ts` — pipeline orchestrator (calls all stages)
- `src/app/page.tsx` — add repo path input and TanStack Query fetch

## Acceptance Criteria
- [x] `POST /api/analyze` with a valid repo path returns a `CommitGroup` tree
- [x] The visualization renders data from a real git repository
- [x] Invalid paths return 400 with a helpful error message
- [x] Large repos (5k+ commits) complete within 10 seconds
- [x] Path traversal attempts are rejected
- [x] Loading state is shown while the pipeline runs

## Notes
- This route runs server-side only — git operations happen on the server
- The app reads local repos only — no remote cloning in MVP
- Use `child_process.execFile` (not `exec`) for git commands to prevent shell injection
- TanStack Query provides caching, so re-analyzing the same repo is instant
- Consider adding a simple repo path input UI (text field + "Analyze" button)
