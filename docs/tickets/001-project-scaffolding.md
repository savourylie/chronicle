# Ticket 001: Project Scaffolding & Dependency Install

## Status
`done`

## Phase
Phase 1: Foundation (M0)

## Dependencies
None

## Description
Initialize the Chronicle project with Next.js 16 (App Router), install all required dependencies, and configure the build toolchain. This is the foundation ticket — everything else depends on it.

## Requirements
- [x] Initialize Next.js 16 project with App Router (`npx create-next-app@latest`)
- [x] Configure TypeScript with strict mode in `tsconfig.json`
- [x] Install and configure Tailwind CSS v4
- [x] Install shadcn/ui and run `npx shadcn@latest init`
- [x] Install core dependencies:
  - `d3` + `@types/d3` (visualization)
  - `zustand` (state management)
  - `@tanstack/react-query` (data fetching)
  - `framer-motion` (animation)
  - `animejs` + `@types/animejs` (animation)
  - `@phosphor-icons/react` (icons — per CLAUDE.md, NOT Lucide)
- [x] Install dev dependencies:
  - `@types/node`, `@types/react`, `@types/react-dom`
- [x] Verify `npm run dev` starts without errors
- [x] Verify `npm run build` completes without errors
- [x] Add `.gitignore` entries for `node_modules`, `.next`, `.env.local`

## Files to Create/Modify
- `package.json` — all dependencies
- `next.config.ts` — Next.js configuration
- `tsconfig.json` — TypeScript strict config
- `tailwind.config.ts` — Tailwind base setup
- `src/app/layout.tsx` — root layout (minimal)
- `src/app/page.tsx` — placeholder home page
- `.gitignore` — standard Next.js ignores

## Acceptance Criteria
- [x] `npm run dev` starts the dev server on localhost:3000
- [x] `npm run build` produces a clean production build
- [x] All listed dependencies are in `package.json`
- [x] TypeScript strict mode is enabled
- [x] shadcn/ui is initialized and ready for component additions

## Notes
- Use `npm` (not pnpm) per CLAUDE.md
- Next.js 16 uses App Router by default
- Phosphor icons are used instead of Lucide (CLAUDE.md overrides DESIGN.md)
- Supabase is listed in the stack but not needed for MVP — defer to future ticket if needed
