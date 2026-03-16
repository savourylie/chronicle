# Ticket 026: Git Clone Manager

## Status
`not started`

## Phase
Phase 6: GitHub Analysis

## Dependencies
001

## Description
Create a server-side module that manages cloning GitHub repositories into temporary directories for analysis. The clone manager handles shallow cloning for performance, temporary directory lifecycle, and cleanup. It provides the local repo path that the existing data pipeline (ticket 021) needs to run.

## Requirements
- [ ] Clone a GitHub repo given an HTTPS URL:
  - Use `git clone --depth=0 --single-branch` for shallow clone (full history, no blobs)
  - Support optional branch specification (`--branch <name>`)
  - Clone into a temporary directory under `os.tmpdir()`
  - Use `child_process.execFile` (not `exec`) to prevent shell injection
- [ ] Temporary directory management:
  - Create a unique temp directory per analysis (e.g., `chronicle-clone-<uuid>`)
  - Provide a `cleanup()` function that removes the temp directory
  - Auto-cleanup on process exit as a safety net (use `process.on('exit')`)
- [ ] Progress reporting:
  - Accept an optional callback for clone progress updates
  - Report stages: 'cloning' → 'complete' | 'error'
- [ ] Error handling:
  - Timeout after 120 seconds (configurable)
  - Handle common failures: repo not found (404), auth required, network error
  - Return user-friendly error messages
  - Always clean up temp directory on failure
- [ ] Return a `CloneResult` type:
  - `{ localPath: string, branch: string, cleanup: () => Promise<void> }`

## Files to Create/Modify
- `src/lib/github/clone-manager.ts` — clone and temp directory management

## Acceptance Criteria
- [ ] Public GitHub repos clone successfully into temp directories
- [ ] Cleanup function removes the temp directory and all contents
- [ ] Clone timeout is enforced (120s default)
- [ ] Invalid repo URLs return a clear "repository not found" error
- [ ] No shell injection is possible via repo URL or branch name
- [ ] `child_process.execFile` is used (not `exec` or `execSync`)

## Notes
- Use `--filter=blob:none` instead of `--depth` for treeless clone — this gives full commit history (needed for the pipeline) without downloading file blobs, which is much faster for large repos
- The existing pipeline from ticket 021 expects a local repo path — this module bridges GitHub URLs to local paths
- Private repos are out of scope for MVP (no auth token handling)
- Consider caching clones by repo URL + branch to avoid re-cloning, but this is a future optimization
