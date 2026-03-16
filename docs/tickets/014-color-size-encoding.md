# Ticket 014: Color & Size Encoding

## Status
`not started`

## Phase
Phase 3: Core Visualization (M2 part 1)

## Dependencies
012

## Description
Implement configurable color and size mappings for the circle packing visualization. Users can change what drives circle size (lines changed, file count, commit count) and color (commit type, author, recency, churn risk) to explore different dimensions of the data.

## Requirements
- [ ] Implement size encoding strategies:
  - `linesChanged`: `insertions + deletions` drives circle radius
  - `fileCount`: number of `filesChanged` drives circle radius
  - `commitCount`: number of descendant commits drives group circle radius
- [ ] Implement color encoding strategies:
  - `type`: Map commit types to distinct colors
    - feat → accent (#8B5CF6), fix → secondary (#F472B6), refactor → tertiary (#FBBF24)
    - docs → quaternary (#34D399), chore/test/other → muted tones
  - `author`: Assign a consistent color per author (hash author name to color)
  - `recency`: Gradient from cool (old) to warm (recent) based on commit date
  - `churn`: Red intensity based on how many times files were changed (high churn = hot)
- [ ] Read encoding configuration from Zustand store (`encoding.size`, `encoding.color`)
- [ ] Generate a color legend:
  - Show what each color represents in the current encoding mode
  - Position in the corner of the visualization area
- [ ] Group circles: derive color from the dominant encoding of their children

## Files to Create/Modify
- `src/lib/encoding.ts` — encoding strategy functions
- `src/components/circle-pack/circle-pack.tsx` — apply encodings to circles
- `src/components/circle-pack/legend.tsx` — color legend component

## Acceptance Criteria
- [ ] Switching size encoding visibly changes circle sizes
- [ ] Switching color encoding visibly changes circle colors
- [ ] Color legend accurately reflects the current encoding
- [ ] Author colors are consistent (same author = same color across all views)
- [ ] Recency gradient is visually clear (old vs. new)
- [ ] Colors are accessible: not relying on color alone (shape/size adds meaning)

## Notes
- PRD Section 4.2: "Size encoding = Lines changed, files touched, or commit count (user-configurable)"
- PRD Section 4.2: "Color encoding = Category (feat/fix/refactor), author, recency, or churn risk"
- Use D3 color scales (`d3-scale-chromatic`) for consistent, accessible palettes
- The type-to-color mapping should use the DESIGN.md decorative colors where possible
- The toolbar UI for switching encodings is in ticket 020 — this ticket is the encoding logic + rendering
