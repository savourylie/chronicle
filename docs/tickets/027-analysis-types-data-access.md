# Ticket 027: Analysis Types & Data Access Layer

## Status
`not started`

## Phase
Phase 6: GitHub Analysis

## Dependencies
003, 024

## Description
Define the TypeScript types for analysis records and create a data access layer that wraps Supabase queries for creating, updating, reading, and polling analyses. This module is the single point of contact between the application logic and the `analyses` table — API routes and frontend hooks both go through this layer.

## Requirements
- [ ] Define analysis types:
  - `AnalysisStatus`: `'pending' | 'cloning' | 'analyzing' | 'complete' | 'error'`
  - `Analysis`: full row type matching the `analyses` table schema
  - `AnalysisInsert`: type for creating a new analysis (omit auto-generated fields)
  - `AnalysisUpdate`: partial type for status/result updates
- [ ] Server-side data access functions (use service role client):
  - `createAnalysis(input: AnalysisInsert): Promise<Analysis>` — insert a new pending analysis
  - `updateAnalysisStatus(id: string, status: AnalysisStatus, extra?: Partial<Analysis>): Promise<void>` — update status, error, or result
  - `setAnalysisResult(id: string, result: CommitGroup, meta: { commitCount: number, pipelineMs: number }): Promise<void>` — set final result and mark complete
- [ ] Client-side data access functions (use anon key client):
  - `getAnalysis(id: string): Promise<Analysis | null>` — fetch a single analysis by ID
  - `getAnalysisByRepoUrl(url: string): Promise<Analysis | null>` — fetch most recent complete analysis for a repo URL
- [ ] All functions handle Supabase errors and throw descriptive errors

## Files to Create/Modify
- `src/types/analysis.ts` — analysis type definitions
- `src/lib/supabase/analyses.ts` — data access functions

## Acceptance Criteria
- [ ] Types match the database schema from ticket 024
- [ ] `createAnalysis` returns the inserted row with generated `id`
- [ ] `updateAnalysisStatus` correctly transitions between statuses
- [ ] `setAnalysisResult` stores the `CommitGroup` tree as JSONB
- [ ] `getAnalysis` returns `null` for non-existent IDs (not an error)
- [ ] Supabase errors are caught and re-thrown with context

## Notes
- The `result` field stores the entire `CommitGroup` tree as JSON — this is intentional for MVP simplicity
- The `CommitGroup` type comes from ticket 003's data model
- Consider adding Zod schemas for runtime validation of the JSONB result on read, but not required for MVP
- This module is intentionally thin — it's a typed wrapper over Supabase, not a full ORM
