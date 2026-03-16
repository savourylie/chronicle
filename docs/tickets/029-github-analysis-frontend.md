# Ticket 029: GitHub Analysis Frontend

## Status
`not started`

## Phase
Phase 6: GitHub Analysis

## Dependencies
010, 011, 028

## Description
Build the frontend UI for the GitHub analysis flow: a URL input form, progress tracking during analysis, and integration with the existing visualization. When analysis completes, the `CommitGroup` result is loaded into the Zustand store and the circle packing visualization renders it — connecting the GitHub flow to the existing visualization pipeline.

## Requirements
- [ ] GitHub URL input form:
  - Text input with placeholder: `https://github.com/owner/repo`
  - "Analyze" submit button with loading state
  - Client-side URL validation before submission (using `url-utils` from ticket 025)
  - Display validation errors inline
  - Disabled state while an analysis is in progress
- [ ] Analysis progress tracking:
  - After submission, poll `GET /api/analyze-github/[id]` using TanStack Query
  - Display current status with appropriate UI: pending → cloning → analyzing → complete
  - Show a progress indicator (spinner or step indicator) for each stage
  - On error, display the error message with a "Try Again" button
  - Poll interval: 1 second while in progress, stop on complete/error
- [ ] TanStack Query hooks:
  - `useStartAnalysis()` — mutation that calls `POST /api/analyze-github`
  - `useAnalysisStatus(id)` — query that polls the analysis status endpoint
- [ ] Integration with visualization:
  - On `'complete'` status, extract the `CommitGroup` from the result
  - Call `setRoot()` on the Zustand store to load the data
  - Store the `analysisId` in the Zustand store for reference
  - The existing circle packing visualization renders automatically once `root` is set
- [ ] Page integration:
  - Add the GitHub URL form to the main page (alongside or replacing the local repo input from ticket 021)
  - Support URL parameter `?repo=<github-url>` for direct linking

## Files to Create/Modify
- `src/hooks/use-github-analysis.ts` — TanStack Query hooks (`useStartAnalysis`, `useAnalysisStatus`)
- `src/components/github-url-form.tsx` — URL input form with validation and progress
- `src/app/page.tsx` — integrate the GitHub URL form

## Acceptance Criteria
- [ ] User can paste a GitHub URL and click "Analyze"
- [ ] Progress updates are shown in real-time as the analysis proceeds
- [ ] On completion, the visualization renders the analyzed repository
- [ ] Error states show a clear message and allow retry
- [ ] Client-side validation prevents obviously invalid URLs from being submitted
- [ ] `?repo=owner/repo` URL parameter auto-starts analysis on page load
- [ ] The form is disabled during an active analysis
- [ ] TanStack Query handles caching — revisiting a completed analysis doesn't re-fetch

## Notes
- The form component should use shadcn/ui `Input` and `Button` components (per CLAUDE.md stack)
- Use Phosphor icons for the submit button and status indicators
- Framer Motion for status transition animations (subtle, not flashy)
- The `url-utils` module (ticket 025) is isomorphic — it runs on both client and server
- The `analysisId` stored in Zustand enables future features like sharing analysis URLs
- Consider debouncing the URL input validation to avoid flickering errors while typing
