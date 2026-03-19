# Ticket 028: GitHub Analysis API Route

## Status
`done`

## Phase
Phase 6: GitHub Analysis

## Dependencies
021, 025, 026, 027

## Description
Create the API routes that orchestrate the full GitHub analysis flow: accept a GitHub URL, validate it, create a pending analysis record, clone the repo, run the existing data pipeline, store the result in Supabase, and provide a polling endpoint for the frontend to track progress. This is the server-side backbone of the GitHub analysis feature.

## Requirements
- [x] `POST /api/analyze-github` — start a new analysis:
  - Accept request body: `{ repoUrl: string, branch?: string }`
  - Parse and validate the URL using `url-utils` (ticket 025)
  - Check for an existing recent complete analysis for the same repo URL — return it if found (dedup)
  - Create a pending `Analysis` record in Supabase
  - Return `{ analysisId: string }` immediately (202 Accepted)
  - In the background (after response): clone → run pipeline → store result
- [x] Background processing flow:
  1. Update status to `'cloning'`, clone the repo (ticket 026)
  2. Update status to `'analyzing'`, run `runPipeline()` (ticket 021) on the cloned repo
  3. Store result via `setAnalysisResult()` (ticket 027), status → `'complete'`
  4. Cleanup temp directory
  5. On any error: update status to `'error'` with `error_message`, cleanup temp dir
- [x] `GET /api/analyze-github/[id]` — poll analysis status:
  - Return the `Analysis` record by ID
  - 404 if not found
  - Response includes `status`, `error_message`, and `result` (when complete)
- [x] Input validation:
  - Reject non-GitHub URLs with 400
  - Reject empty/missing `repoUrl` with 400
- [x] Rate limiting (basic):
  - Reject if there are already 3+ pending/cloning/analyzing records (429 Too Many Requests)

## Files to Create/Modify
- `src/app/api/analyze-github/route.ts` — POST handler (start analysis)
- `src/app/api/analyze-github/[id]/route.ts` — GET handler (poll status)

## Acceptance Criteria
- [x] POST with a valid GitHub URL returns 202 with an `analysisId`
- [x] Polling the `analysisId` shows status progression: pending → cloning → analyzing → complete
- [x] The `result` field contains a valid `CommitGroup` tree when complete
- [x] Duplicate URL submissions return the existing analysis (dedup)
- [x] Invalid URLs return 400 with a descriptive error
- [x] Clone/pipeline failures result in status `'error'` with a message
- [x] Temp directories are always cleaned up (success and failure)
- [x] Basic rate limiting prevents more than 3 concurrent analyses

## Notes
- The "background processing" after the 202 response uses `waitUntil` (Next.js) or a fire-and-forget async pattern — not a separate job queue (MVP simplicity)
- `runPipeline()` from ticket 021 already handles git parsing through hierarchy building — this route just provides it a local repo path from the clone manager
- Dedup check: if a complete analysis for the same `repo_url` exists and is less than 1 hour old, return it instead of re-analyzing
- Consider using Next.js `after()` API (available in App Router) for background work after response
