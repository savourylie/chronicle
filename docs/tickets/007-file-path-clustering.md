# Ticket 007: File-Path Clustering

## Status
`done`

## Phase
Phase 2: Data Pipeline (M1)

## Dependencies
005

## Description
Group commits by directory overlap — commits that touch similar file trees cluster together. Uses Jaccard similarity on file paths or common path prefix analysis. This is the primary grouping strategy for repos without conventional commit enforcement.

## Requirements
- [x] Compute file-path similarity between commits:
  - Extract directory paths from each commit's `filesChanged`
  - Use Jaccard similarity on the set of directories (not full file paths)
  - Configurable similarity threshold (default: 0.3)
- [x] Cluster commits into groups based on directory overlap:
  - Commits sharing significant directory overlap form a cluster
  - Name clusters by their most common directory prefix (e.g., "src/auth/*")
- [x] Handle edge cases:
  - Commits touching only root-level files (README, package.json)
  - Commits touching many unrelated directories (large refactors)
  - Single-file commits
- [x] Accept configuration:
  - `similarityThreshold: number` (0-1, default: 0.3)
  - `minClusterSize: number` (default: 2)
  - `ignorePaths: string[]` (globs for paths to exclude, e.g., `["*.lock", "*.json"]`)
- [x] Return `CommitGroup[]` where each group contains related commits

## Files to Create/Modify
- `src/lib/pipeline/file-clustering.ts` — clustering module

## Acceptance Criteria
- [x] Commits touching `src/auth/login.ts` and `src/auth/session.ts` cluster together
- [x] Commits in unrelated directories end up in separate clusters
- [x] Large refactors (touching many dirs) are handled without creating one mega-cluster
- [x] Cluster names are human-readable directory prefixes
- [x] Processes 5k commits in under 2 seconds

## Notes
- PRD Section 4.1 specifies "Jaccard similarity or common path prefix" — implement Jaccard on directory sets
- This strategy is critical for repos like Next.js and Express that lack conventional commits
- Consider using directory depth 2-3 for comparison (e.g., `src/auth` not `src/auth/middleware/validators`)
- Orphan commits (no cluster match) should be collected in an "Other" group
