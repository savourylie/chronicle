# Ticket 025: GitHub URL Parsing & Validation

## Status
`not started`

## Phase
Phase 6: GitHub Analysis

## Dependencies
001

## Description
Create a utility module that parses and validates GitHub repository URLs in various formats (HTTPS, SSH, shorthand) and extracts structured metadata (owner, repo, branch). This is the entry point for the GitHub analysis flow — every URL the user submits passes through this module before any cloning or analysis begins.

## Requirements
- [ ] Parse GitHub URLs in all common formats:
  - `https://github.com/owner/repo`
  - `https://github.com/owner/repo.git`
  - `https://github.com/owner/repo/tree/branch-name`
  - `git@github.com:owner/repo.git`
  - Shorthand: `owner/repo`
- [ ] Extract structured metadata:
  - `owner` (string)
  - `repo` (string)
  - `branch` (string | undefined — only if present in URL)
  - `cloneUrl` (normalized HTTPS clone URL)
- [ ] Validate parsed URLs:
  - Reject non-GitHub hosts
  - Reject URLs with invalid characters in owner/repo
  - Reject obviously invalid formats (empty owner, empty repo)
- [ ] Return a discriminated union result type:
  - `{ ok: true, data: GitHubRepoInfo }` on success
  - `{ ok: false, error: string }` on failure with a user-friendly message
- [ ] Unit tests covering all URL formats and edge cases

## Files to Create/Modify
- `src/lib/github/url-utils.ts` — URL parsing & validation
- `src/lib/github/url-utils.test.ts` — unit tests

## Acceptance Criteria
- [ ] All 5 URL formats are correctly parsed
- [ ] Invalid URLs return descriptive error messages
- [ ] Branch names with slashes (e.g., `feature/foo`) are handled
- [ ] Unit tests pass with >95% branch coverage
- [ ] No external dependencies required (pure string parsing)

## Notes
- Keep this module pure (no network calls) — validation that the repo actually exists happens later in the clone step
- The normalized `cloneUrl` should always be HTTPS format for `git clone`
- Consider GitHub Enterprise URLs as a future extension, but don't implement now
