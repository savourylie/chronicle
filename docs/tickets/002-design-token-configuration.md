# Ticket 002: Design Token Configuration

## Status
`done`

## Phase
Phase 1: Foundation (M0)

## Dependencies
001

## Description
Translate all DESIGN.md tokens (colors, typography, spacing, radius, shadows) into Tailwind config and CSS custom properties. Configure shadcn/ui theme to use these tokens. After this ticket, any component can use the design system via standard Tailwind classes.

## Requirements
- [x] Define all color tokens as CSS custom properties in `globals.css`:
  - `--background: #FFFDF5`, `--foreground: #1E293B`, `--muted: #F1F5F9`, `--muted-foreground: #64748B`
  - `--accent: #8B5CF6`, `--accent-foreground: #FFFFFF`
  - `--secondary: #F472B6`, `--tertiary: #FBBF24`, `--quaternary: #34D399`
  - `--border: #E2E8F0`, `--input: #FFFFFF`, `--card: #FFFFFF`, `--ring: #8B5CF6`
- [x] Extend Tailwind config with design tokens:
  - Border radius: `radius-sm: 8px`, `radius-md: 16px`, `radius-lg: 24px`, `radius-full: 9999px`
  - Default `border-width: 2px`
- [x] Configure hard shadow utilities:
  - `shadow-hard: 4px 4px 0 0 #1E293B`
  - `shadow-hard-hover: 6px 6px 0 0 #1E293B`
  - `shadow-hard-active: 2px 2px 0 0 #1E293B`
  - `shadow-hard-soft: 8px 8px 0 0 #E2E8F0`
  - `shadow-hard-featured: 8px 8px 0 0 #F472B6`
- [x] Set up typography:
  - Import Google Fonts: `Outfit` (700, 800) and `Plus Jakarta Sans` (400, 500)
  - Configure font families in Tailwind: `font-heading` and `font-body`
- [x] Configure bounce timing function as a Tailwind utility:
  - `transition-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)`
- [x] Update shadcn/ui theme variables to reference the custom tokens

## Files to Create/Modify
- `tailwind.config.ts` — extend with all design tokens
- `src/app/globals.css` — CSS custom properties, font imports, base styles
- `src/app/layout.tsx` — apply font classes to html/body
- `components.json` — shadcn/ui theme configuration (if needed)

## Acceptance Criteria
- [x] `bg-background` renders warm cream `#FFFDF5`
- [x] `text-foreground` renders slate `#1E293B`
- [x] `shadow-hard` applies a solid 4px offset shadow
- [x] `font-heading` uses Outfit, `font-body` uses Plus Jakarta Sans
- [x] `rounded-lg` maps to 24px border radius
- [x] All DESIGN.md color tokens are accessible as Tailwind classes

## Notes
- The design system follows "Playful Geometric" / Memphis-inspired aesthetic
- Hard shadows (zero blur) are a core visual signature
- `secondary`, `tertiary`, `quaternary` are decorative colors — rotate across elements for "confetti" effect
- `prefers-reduced-motion` support will be handled in individual component tickets
