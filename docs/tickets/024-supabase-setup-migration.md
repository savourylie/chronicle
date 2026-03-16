# Ticket 024: Supabase Setup & Migration

## Status
`not started`

## Phase
Phase 6: GitHub Analysis

## Dependencies
001

## Description
Set up Supabase as the persistence layer for Chronicle. This includes creating the project configuration, writing the initial database migration for storing analysis results, and setting up both server-side and browser-side Supabase clients. All subsequent GitHub analysis features depend on this foundation.

## Requirements
- [ ] Create Supabase project configuration:
  - Add `@supabase/supabase-js` and `@supabase/ssr` packages
  - Add environment variables to `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Add `.env.local` to `.gitignore` (if not already)
  - Create `.env.local.example` with placeholder values
- [ ] Create initial database migration:
  - `analyses` table: `id` (uuid, PK), `repo_url` (text, not null), `repo_owner` (text), `repo_name` (text), `branch` (text), `commit_count` (integer), `status` (text: 'pending' | 'cloning' | 'analyzing' | 'complete' | 'error'), `error_message` (text, nullable), `result` (jsonb, nullable — stores the `CommitGroup` tree), `pipeline_ms` (integer, nullable), `created_at` (timestamptz), `updated_at` (timestamptz)
  - Add index on `repo_url` for lookup
  - Add index on `status` for polling
  - Enable Row Level Security (RLS) — open read for now (no auth in MVP)
- [ ] Create Supabase client utilities:
  - Server client (for API routes): uses service role key
  - Browser client (for client components): uses anon key
- [ ] Verify connection works with a simple health-check query

## Files to Create/Modify
- `supabase/migrations/001_create_analyses.sql` — initial migration SQL
- `src/lib/supabase/server.ts` — server-side Supabase client (service role)
- `src/lib/supabase/client.ts` — browser-side Supabase client (anon key)
- `.env.local.example` — environment variable template
- `package.json` — add Supabase dependencies

## Acceptance Criteria
- [ ] `npx supabase db push` applies the migration without errors
- [ ] Server client can insert and read from `analyses` table
- [ ] Browser client can read from `analyses` table
- [ ] RLS policies are in place (open read, service-role write)
- [ ] Environment variables are documented in `.env.local.example`
- [ ] No secrets are committed to the repository

## Notes
- Use Supabase local dev (`npx supabase start`) for development
- The `result` column stores the full `CommitGroup` JSON tree — for MVP this is simpler than normalizing commits into separate tables
- Service role key is used server-side only for writes; anon key is used client-side for reads
- Auth can be added later — MVP is single-user with open read access
