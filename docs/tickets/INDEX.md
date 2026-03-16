# Chronicle — Implementation Tracker

## Status Legend
| Symbol | Meaning |
|--------|---------|
| `not started` | Work has not begun |
| `in progress` | Currently being implemented |
| `done` | Completed and verified |

## Dependency Graph

```
001 Project Scaffolding ✅ DONE
 ├── 002 Design Tokens & Theme Config ✅ DONE
 ├── 003 TypeScript Data Model (001)
 │    ├── 004 Mock/Sample Data Generator (003)
 │    ├── 005 Git Log Ingestion & Parser (003)
 │    │    ├── 006 Conventional Commit Parser (005)
 │    │    ├── 007 File-Path Clustering (005)
 │    │    ├── 008 Time-Session Grouping (005)
 │    │    └── 009 Hierarchy Builder (006, 007, 008)
 │    └── 010 Zustand Visualization Store (003)
 └── 011 App Layout Shell (002)
      ├── 012 D3 Circle Packing – Static Render (004, 010, 011)
      │    ├── 013 Circle Packing Zoom Transitions (012)
      │    │    ├── 017 Breadcrumb Navigation (010, 013)
      │    │    └── 019 Search & Highlight (010, 012, 013)
      │    ├── 014 Color & Size Encoding (012)
      │    │    └── 020 Encoding Controls Toolbar (002, 014)
      │    ├── 015 Hover Tooltips (012)
      │    └── 016 Detail Panel (012, 002)
      └── 018 Timeline Minimap (004, 010, 011)
021 Git Data API Route (009)
022 URL State Sharing (010)
023 QA & Polish Pass (all)

024 Supabase Setup & Migration (001)
025 GitHub URL Parsing & Validation (001)
026 Git Clone Manager (001)
027 Analysis Types & Data Access Layer (003, 024)
 └── 028 GitHub Analysis API Route (021, 025, 026, 027)
      └── 029 GitHub Analysis Frontend (010, 011, 028)
```

## Phase 1: Foundation (M0)

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 001 | [Project Scaffolding](./001-project-scaffolding.md) | `done` | — |
| 002 | [Design Token Configuration](./002-design-token-configuration.md) | `done` | 001 |
| 003 | [TypeScript Data Model](./003-typescript-data-model.md) | `not started` | 001 |
| 004 | [Mock Data Generator](./004-mock-data-generator.md) | `not started` | 003 |

## Phase 2: Data Pipeline (M1)

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 005 | [Git Log Ingestion & Parser](./005-git-log-ingestion-parser.md) | `not started` | 003 |
| 006 | [Conventional Commit Parser](./006-conventional-commit-parser.md) | `not started` | 005 |
| 007 | [File-Path Clustering](./007-file-path-clustering.md) | `not started` | 005 |
| 008 | [Time-Session Grouping](./008-time-session-grouping.md) | `not started` | 005 |
| 009 | [Hierarchy Builder](./009-hierarchy-builder.md) | `not started` | 006, 007, 008 |

## Phase 3: Core Visualization (M2 part 1)

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 010 | [Zustand Visualization Store](./010-zustand-visualization-store.md) | `not started` | 003 |
| 011 | [App Layout Shell](./011-app-layout-shell.md) | `not started` | 002 |
| 012 | [D3 Circle Packing – Static Render](./012-d3-circle-packing-static.md) | `not started` | 004, 010, 011 |
| 013 | [Circle Packing Zoom Transitions](./013-circle-packing-zoom-transitions.md) | `not started` | 012 |
| 014 | [Color & Size Encoding](./014-color-size-encoding.md) | `not started` | 012 |
| 015 | [Hover Tooltips](./015-hover-tooltips.md) | `not started` | 012 |

## Phase 4: Interactive Features (M2 part 2)

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 016 | [Detail Panel](./016-detail-panel.md) | `not started` | 012, 002 |
| 017 | [Breadcrumb Navigation](./017-breadcrumb-navigation.md) | `not started` | 010, 013 |
| 018 | [Timeline Minimap](./018-timeline-minimap.md) | `not started` | 004, 010, 011 |
| 019 | [Search & Highlight](./019-search-highlight.md) | `not started` | 010, 012, 013 |

## Phase 5: Integration & Polish

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 020 | [Encoding Controls Toolbar](./020-encoding-controls-toolbar.md) | `not started` | 002, 014 |
| 021 | [Git Data API Route](./021-git-data-api-route.md) | `not started` | 009 |
| 022 | [URL State Sharing](./022-url-state-sharing.md) | `not started` | 010 |
| 023 | [QA & Polish Pass](./023-qa-polish-pass.md) | `not started` | all |

## Phase 6: GitHub Analysis

| # | Ticket | Status | Deps |
|---|--------|--------|------|
| 024 | [Supabase Setup & Migration](./024-supabase-setup-migration.md) | `not started` | 001 |
| 025 | [GitHub URL Parsing & Validation](./025-github-url-parsing-validation.md) | `not started` | 001 |
| 026 | [Git Clone Manager](./026-git-clone-manager.md) | `not started` | 001 |
| 027 | [Analysis Types & Data Access Layer](./027-analysis-types-data-access.md) | `not started` | 003, 024 |
| 028 | [GitHub Analysis API Route](./028-github-analysis-api-route.md) | `not started` | 021, 025, 026, 027 |
| 029 | [GitHub Analysis Frontend](./029-github-analysis-frontend.md) | `not started` | 010, 011, 028 |
