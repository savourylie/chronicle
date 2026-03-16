# PRD: Chronicle — The Story of Your Codebase

## 1. Problem Statement

Existing git visualization tools focus on **structural topology** — branches, merges, and linear commit graphs. Developers and engineering leaders lack a way to understand the **semantic evolution** of a codebase: what features were built, how they evolved, and how work clusters into meaningful themes over time.

The current landscape forces users to mentally reconstruct the "story" of their repo by scrolling through flat commit logs or staring at branch graphs that reveal structure but not meaning.

## 2. Vision

An interactive, zoomable visualization that turns a git repository's history into a **navigable narrative** — where commits are grouped into chapters, chapters into story arcs, and arcs into epochs. Users can zoom from a 10,000-foot view ("Q1 was the auth rewrite and the API v2 migration") down to individual commits and diffs, with every level of the hierarchy clickable and explorable.

Think: Google Maps, but for your codebase's history. Every repo has a story — Chronicle lets you read it.

## 3. Target Users

| Persona | Need |
|---|---|
| **Engineering Leads / Managers** | Understand what the team has been working on at a glance, track feature evolution across sprints |
| **New Team Members** | Quickly build mental models of how the codebase got to its current state |
| **Individual Contributors** | Navigate their own or others' past work, find related commits, understand context |
| **Open Source Maintainers** | Visualize contribution patterns, identify feature areas, onboard contributors |

## 4. Core Concepts

### 4.1 Semantic Commit Grouping (Multi-Level Hierarchy)

Commits are organized into a hierarchy with at least 3 levels of zoom:

```
Level 0 (Epoch/Arc)       →  "Auth System Overhaul" / "Q1 2025 Platform Work"
  Level 1 (Chapter)       →  "OAuth2 Migration" / "Session Management Refactor"
    Level 2 (Scene/Task)  →  "Add refresh token rotation" / "Fix token expiry edge case"
      Level 3 (Commit)    →  Individual commits with full metadata and diffs
```

Grouping strategies (configurable, stackable):

- **Conventional Commits** — Parse prefixes (`feat:`, `fix:`, `refactor:`, `docs:`) for automatic categorization
- **File Path Clustering** — Commits touching similar file trees are grouped (e.g., `src/auth/*` commits cluster together)
- **Time-based Windowing** — Nearby commits by the same author on similar files form natural "sessions"
- **Branch/PR Mapping** — Use merge commits and PR metadata to reconstruct feature boundaries
- **LLM-Assisted Summarization** — Use an LLM to generate human-readable group names and hierarchical clustering from commit messages and diffs
- **Manual Tags/Annotations** — Allow users to override or annotate groupings

### 4.2 Zoomable Visual Interface

The primary visualization is an interactive **zoomable circle-packing** or **nested treemap** layout:

- **Outermost containers** = Epochs / high-level themes
- **Mid-level containers** = Features / workstreams
- **Innermost elements** = Individual commits
- **Size encoding** = Lines changed, files touched, or commit count (user-configurable)
- **Color encoding** = Category (feat/fix/refactor), author, recency, or churn risk

Users interact by:
- **Clicking** a group to zoom into it (smooth animated transition)
- **Hovering** to see summary tooltips (commit count, date range, top contributors, key files)
- **Clicking a leaf commit** to open a detail panel with full message, diff stats, and file list
- **Breadcrumb navigation** to track and jump between zoom levels
- **Search** to highlight commits/groups matching a query

### 4.3 Timeline Integration

A secondary timeline axis (horizontal bar or minimap) anchors the spatial view in time:

- Shows commit density over time
- Highlights the currently zoomed group's time span
- Allows scrubbing to filter the spatial view to a date range
- Marks significant events (tagged releases, large merges, CI failures if integrated)

### 4.4 Detail Panel

When a commit or group is selected, a slide-out panel shows:

- **For a group**: Summary description, date range, contributor breakdown, files most frequently touched, sub-groups list
- **For a commit**: Full commit message, author, date, diff stat, file tree of changes, link to remote (GitHub/GitLab)

## 5. Feature Requirements

### 5.1 MVP (Phase 1)

| ID | Feature | Priority | Description |
|---|---|---|---|
| F1 | Git log ingestion | P0 | Parse `git log` output (JSON or custom format) into structured data |
| F2 | Conventional commit parsing | P0 | Auto-categorize commits by prefix (`feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `style`, `perf`, `ci`, `build`) |
| F3 | File-path clustering | P0 | Group commits by directory overlap using Jaccard similarity or common path prefix |
| F4 | Time-session grouping | P1 | Cluster sequential commits by same author on similar files within a configurable time window (default: 2 hours) |
| F5 | Zoomable circle-packing view | P0 | D3.js-based interactive circle packing with smooth zoom transitions |
| F6 | Color and size encoding | P0 | Configurable mappings for circle color (type, author, age) and size (lines changed, file count) |
| F7 | Tooltip on hover | P0 | Show group/commit summary on hover |
| F8 | Detail panel on click | P0 | Slide-out panel with full commit/group details |
| F9 | Breadcrumb navigation | P1 | Show current zoom path, allow jumping to any ancestor level |
| F10 | Timeline minimap | P1 | Horizontal density plot showing commit distribution over time, synced with main view |
| F11 | Search and highlight | P1 | Text search across commit messages, file paths, authors; highlight matching nodes |
| F12 | Export/share view state | P2 | URL-encoded state so a specific zoom level + selection can be shared |

### 5.2 Phase 2 (Enhanced Grouping)

| ID | Feature | Priority | Description |
|---|---|---|---|
| F13 | PR/merge commit mapping | P1 | Use merge commits and GitHub/GitLab PR metadata to define feature boundaries |
| F14 | LLM-assisted summarization | P1 | Generate human-readable names for commit groups and higher-level theme descriptions |
| F15 | Manual annotation layer | P2 | Allow users to rename groups, merge/split clusters, add notes |
| F16 | Branch topology overlay | P2 | Optional layer showing branch/merge structure within the semantic view |

### 5.3 Phase 3 (Analytics & Integrations)

| ID | Feature | Priority | Description |
|---|---|---|---|
| F17 | Author heatmap | P2 | Overlay showing contributor distribution across feature areas |
| F18 | Churn risk indicators | P2 | Highlight areas with high churn (frequent changes to same files) |
| F19 | CI/CD event overlay | P3 | Show build failures, deployment events on the timeline |
| F20 | GitHub/GitLab deep linking | P2 | Link commits and PRs directly to their remote web views |
| F21 | Live repo watching | P3 | Auto-update visualization as new commits land (via filesystem watch or webhook) |

## 6. Technical Architecture

### 6.1 System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                      │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Zoomable    │  │   Timeline   │  │    Detail      │  │
│  │  Circle Pack │  │   Minimap    │  │    Panel       │  │
│  │  (D3.js)     │  │   (D3.js)    │  │    (React)     │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
│         └─────────────┬───┘──────────────────┘          │
│                       │                                  │
│              ┌────────▼────────┐                         │
│              │   State Manager  │                         │
│              │   (Zustand/ctx)  │                         │
│              └────────┬────────┘                         │
└───────────────────────┼─────────────────────────────────┘
                        │ JSON
               ┌────────▼────────┐
               │   Data Pipeline  │
               │   (Node / Python)│
               └────────┬────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
   ┌──────▼──────┐ ┌───▼────┐ ┌─────▼──────┐
   │ git log     │ │ GitHub │ │  LLM API   │
   │ (local CLI) │ │ API    │ │ (optional) │
   └─────────────┘ └────────┘ └────────────┘
```

### 6.2 Key Technology Choices

| Component | Technology | Rationale |
|---|---|---|
| Visualization | **D3.js** (d3-hierarchy, d3-zoom, d3-pack) | Industry standard for zoomable hierarchical layouts; fine-grained control |
| UI Framework | **React** | Component model fits the panel/toolbar/view architecture |
| State Management | **Zustand** or React Context | Lightweight, sufficient for view state + selection + filters |
| Data Pipeline | **Node.js** or **Python** CLI | Parse git log, compute clusters, output JSON hierarchy |
| Clustering | **Python (scikit-learn)** or custom JS | For file-path Jaccard similarity and time-session grouping |
| LLM Integration | **Anthropic Claude API** (optional) | Summarize commit groups into readable feature names |
| Timeline | **D3.js** or **Recharts** | Density plot / brush component for time filtering |

### 6.3 Reusable Open Source Components

| Project | What We Can Reuse | How |
|---|---|---|
| **[Gource](https://github.com/acaudwell/Gource)** | Inspiration for file-tree animation; its log parsing logic for multiple VCS formats | Reference its custom log format spec for ingestion flexibility |
| **[git-of-theseus](https://github.com/erikbern/git-of-theseus)** | Python-based git log analysis, author/survival curve computation | Fork/adapt its git log parsing and cohort analysis for our grouping heuristics |
| **[D3 Zoomable Circle Packing](https://observablehq.com/@d3/zoomable-circle-packing)** | Core visualization pattern — the exact zooming interaction model we want | Use as the base implementation, extend with our color/size encoding and click behavior |
| **[D3 Zoomable Treemap](https://observablehq.com/@d3/zoomable-treemap)** | Alternative layout for users who prefer rectangular space-filling | Offer as a toggle; shares the same data hierarchy |
| **[Conventional Commits Parser](https://github.com/conventional-changelog/conventional-changelog)** | Robust parsing of `feat:`, `fix:`, etc. prefixes with scope support | Use `conventional-commits-parser` npm package directly |
| **[GitStats](https://github.com/hoxu/gitstats)** | Statistical analysis of git repos (activity, authors, file counts) | Reference its metrics calculations for our analytics overlay (Phase 3) |
| **[react-diff-viewer](https://github.com/praneshr/react-diff-viewer)** | Side-by-side and unified diff rendering in React | Embed in the detail panel for commit diff display |
| **[Hyperlog / git-graph-js](https://github.com/nicedoc/git-graph-js)** | Lightweight git graph rendering | Potential use in the branch topology overlay (Phase 2, F16) |

### 6.4 Data Model

```typescript
interface CommitNode {
  hash: string;
  shortHash: string;
  message: string;
  author: { name: string; email: string };
  date: string;               // ISO 8601
  filesChanged: string[];
  insertions: number;
  deletions: number;
  type?: string;              // feat | fix | refactor | ...
  scope?: string;             // from conventional commit
  parentHashes: string[];
  prNumber?: number;
  prTitle?: string;
}

interface CommitGroup {
  id: string;
  name: string;               // human-readable or LLM-generated
  level: number;              // 0 = arc/epoch, 1 = chapter, 2 = scene/task
  groupingStrategy: string;   // "conventional-commit" | "file-path" | "time-session" | "manual"
  children: (CommitGroup | CommitNode)[];
  metadata: {
    dateRange: [string, string];
    commitCount: number;
    authors: string[];
    topFiles: string[];
    totalInsertions: number;
    totalDeletions: number;
  };
}

interface VisualizationState {
  root: CommitGroup;
  zoomPath: string[];          // IDs from root to current focus
  selectedNode: string | null;
  filters: {
    dateRange?: [string, string];
    authors?: string[];
    types?: string[];
    searchQuery?: string;
  };
  encoding: {
    size: "linesChanged" | "fileCount" | "commitCount";
    color: "type" | "author" | "recency" | "churn";
  };
}
```

## 7. Git Log Ingestion Format

The tool consumes `git log` output in a structured format. Recommended extraction command:

```bash
git log --all --pretty=format:'{
  "hash": "%H",
  "shortHash": "%h",
  "author": {"name": "%an", "email": "%ae"},
  "date": "%aI",
  "message": "%s",
  "body": "%b",
  "parentHashes": "%P"
}' --numstat
```

A preprocessing script normalizes this into the `CommitNode[]` array, then the clustering pipeline builds the `CommitGroup` hierarchy.

## 8. Interaction Design

### 8.1 Initial Load
- Show the highest-level grouping (epochs/themes) as large circles
- Timeline minimap visible at bottom, showing full repo lifespan
- Sidebar collapsed; toolbar shows encoding controls and search

### 8.2 Zoom In
- Click a circle → animated zoom into that group, revealing children
- Breadcrumb updates: `All > Auth System > OAuth2 Migration`
- Timeline highlights the date range of the focused group
- Tooltip appears on hover for any child element

### 8.3 Commit Selection
- Click a leaf node (commit) → detail panel slides in from right
- Shows commit message, author, diff stats, file list
- "Open on GitHub" link if remote is configured
- Optional inline diff view (using react-diff-viewer)

### 8.4 Zoom Out
- Click outside all circles, or click a breadcrumb ancestor
- Smooth animated reverse zoom
- Selection clears unless pinned

### 8.5 Search
- Type in search bar → matching commits glow/highlight across all zoom levels
- If matches are within a collapsed group, the group itself glows with a count badge
- Click a search result to zoom directly to it

## 9. Success Metrics

| Metric | Target |
|---|---|
| Time to first meaningful insight (new user on unfamiliar repo) | < 60 seconds |
| Grouping accuracy (% of commits in a "correct" feature group, per user judgment) | > 70% without LLM, > 85% with LLM |
| Render performance (initial load, 10k commits) | < 3 seconds |
| Zoom transition latency | < 300ms |
| User can explain "what happened in the last quarter" after 5 min of exploration | Qualitative usability test pass rate > 80% |

## 10. Non-Goals (Explicit Exclusions)

- **Not a replacement for `git log` or `git blame`** — this is an exploration and understanding tool, not a daily-driver CLI
- **Not a real-time collaboration tool** — single-user exploration, at least for MVP
- **Not a CI/CD dashboard** — CI integration is Phase 3 overlay only
- **Not a code review tool** — it links to diffs but doesn't support inline comments or approvals
- **No write operations** — this tool never modifies the git repository

## 11. Open Questions

1. **Circle packing vs. treemap as default?** Circle packing is more visually distinctive and handles deep nesting well; treemaps are more space-efficient and familiar. Offer both?
2. **How to handle repos with no conventional commits?** Fall back to file-path + time-session clustering, but the experience will be less rich. Should we auto-detect and warn?
3. **LLM cost management** — Summarizing 10k commits via API could be expensive. Batch? Summarize only on demand per group? Cache aggressively?
4. **Monorepo support** — Should the top-level grouping in a monorepo be by package/service, overriding the semantic clustering?
5. **Git provider auth** — For PR metadata enrichment, we need GitHub/GitLab tokens. How to handle securely in a local-first tool?

## 12. Milestones

| Milestone | Scope | Target |
|---|---|---|
| **M0: Proof of Concept** | Static sample data → zoomable circle packing with 3 levels, basic tooltips | 1 week |
| **M1: Real Data Pipeline** | Git log ingestion + conventional commit parsing + file-path clustering → live visualization | 2 weeks |
| **M2: Interactive MVP** | Detail panel, timeline minimap, search, breadcrumbs, encoding controls | 3 weeks |
| **M3: Enhanced Grouping** | PR metadata, LLM summarization, manual annotations | 5 weeks |
| **M4: Polish & Analytics** | Author heatmaps, churn indicators, GitHub deep linking, performance optimization | 7 weeks |

## 13. Test Repositories

To validate the visualization across different commit styles, team sizes, and project structures, we've selected 6 open source repositories that each stress-test different aspects of the grouping and rendering pipeline.

### Selection Criteria

Each repo was chosen to exercise a specific dimension of the tool:

| Dimension | Why It Matters |
|---|---|
| Commit convention quality | Tests whether `feat:`/`fix:` parsing produces clean groups vs. requiring fallback heuristics |
| Repo size (commit count) | Tests rendering performance and clustering scalability |
| Team size & contributor diversity | Tests author-based coloring and contributor heatmaps |
| Directory structure depth | Tests file-path clustering effectiveness |
| Monorepo vs. single-project | Tests whether top-level grouping should be by package or by semantic theme |
| Branch/PR workflow style | Tests merge-commit and PR-boundary detection |

---

### Repo 1: `angular/angular`
**GitHub:** https://github.com/angular/angular

| Attribute | Value |
|---|---|
| Language | TypeScript |
| Approx. Commits | 30,000+ |
| Contributors | 1,900+ |
| Commit Style | **Strict Conventional Commits** (enforced by CI) |
| Structure | Monorepo (packages/core, packages/router, packages/forms, etc.) |

**Why this repo:** Angular is the gold standard for conventional commits. Every commit follows `type(scope): description` with enforced scopes matching package names. This is our **best-case scenario** — the tool should produce beautiful, well-labeled groups almost entirely from commit message parsing alone. The monorepo structure also tests whether file-path clustering aligns with the conventional commit scopes (it should). At 30k+ commits, it's also a serious performance stress test.

**What it exercises:**
- F2 (Conventional commit parsing) — full coverage with scopes
- F3 (File-path clustering) — should correlate with scope-based groups
- Monorepo top-level grouping (Open Question #4)
- Render performance at scale (Success Metric: <3s for 10k commits)

---

### Repo 2: `fastapi/fastapi`
**GitHub:** https://github.com/fastapi/fastapi

| Attribute | Value |
|---|---|
| Language | Python |
| Approx. Commits | 3,000+ |
| Contributors | 700+ |
| Commit Style | **Mixed** — some conventional, many freeform |
| Structure | Single project, moderate directory depth |

**Why this repo:** FastAPI is a hugely popular project (~80k stars) with a single primary maintainer (Sebastián Ramírez) and hundreds of community contributors. Commit messages are inconsistent — the maintainer uses some conventional style, but many community PRs have freeform messages. This tests the **fallback path**: when conventional parsing fails, can file-path clustering and time-session grouping still produce meaningful feature groups? The heavy internationalization docs work also creates an interesting clustering challenge (docs-only commits should group separately from core feature work).

**What it exercises:**
- F3 (File-path clustering) as primary grouping mechanism
- F4 (Time-session grouping) for the maintainer's commit bursts
- Handling of docs-heavy repos (large volume of non-feature commits)
- Open Question #2 (repos without strict conventional commits)

---

### Repo 3: `orhun/git-cliff`
**GitHub:** https://github.com/orhun/git-cliff

| Attribute | Value |
|---|---|
| Language | Rust |
| Approx. Commits | 1,200+ |
| Contributors | 100+ |
| Commit Style | **Strict Conventional Commits** (dogfooded — it's a changelog generator) |
| Structure | Single project with clear module boundaries |

**Why this repo:** A changelog generator that uses conventional commits to generate changelogs — it would be embarrassing if our tool couldn't visualize it well. This is a smaller, tightly scoped project where conventional parsing should work perfectly, giving us a clean "small repo, clean data" baseline. The dogfooding angle is also great for demos: "here's a tool that understands commits, visualized by a tool that understands commits."

**What it exercises:**
- F2 (Conventional commit parsing) — clean, complete data
- Baseline for "ideal small repo" visualization quality
- Good candidate for the M0 proof of concept (manageable size)
- Validates that grouping is meaningful even at small scale

---

### Repo 4: `electron/electron`
**GitHub:** https://github.com/electron/electron

| Attribute | Value |
|---|---|
| Language | C++, TypeScript, Objective-C++ |
| Approx. Commits | 40,000+ |
| Contributors | 1,200+ |
| Commit Style | **Semi-conventional** with custom types (`chore`, `build`, `spec`) |
| Structure | Deep directory tree, multi-language, complex build system |

**Why this repo:** Electron is a stress test for everything. It has a massive commit count, multiple programming languages, a deep and complex directory structure (native code + JS bindings + build tooling), and commit messages that roughly follow conventional format but with project-specific deviations. The multi-language aspect tests whether file-path clustering can separate native C++ work from TypeScript API work. The sheer scale (~40k commits) pushes rendering performance limits and forces us to prove that hierarchical clustering can meaningfully reduce visual complexity.

**What it exercises:**
- Rendering performance at maximum scale
- Multi-language file-path clustering
- Semi-conventional commit parsing (custom types)
- Deep hierarchy levels (needs 4+ zoom levels to be useful)
- F13 (PR/merge commit mapping) — Electron uses a strict PR workflow

---

### Repo 5: `vercel/next.js`
**GitHub:** https://github.com/vercel/next.js

| Attribute | Value |
|---|---|
| Language | TypeScript, JavaScript, Rust |
| Approx. Commits | 25,000+ |
| Contributors | 3,000+ |
| Commit Style | **Freeform** — no conventional commit enforcement |
| Structure | Large monorepo (packages/*, examples/*, test/*) |

**Why this repo:** Next.js is the hardest challenge in our set. It has zero conventional commit enforcement, thousands of contributors with wildly different commit message styles, and a massive monorepo structure with hundreds of example apps that generate noise. This is our **worst-case scenario for commit parsing** — the tool must rely entirely on file-path clustering, time-session grouping, and ideally LLM-assisted summarization to produce anything useful. If the visualization can make Next.js's history navigable, it can handle anything.

**What it exercises:**
- Open Question #2 at its extreme (no conventional commits at all)
- F3 (File-path clustering) as the only viable grouping strategy
- F14 (LLM-assisted summarization) — needed to generate readable group names
- Monorepo noise filtering (hundreds of `examples/*` changes)
- Very high contributor count (3,000+) tests author-based encoding

---

### Repo 6: `expressjs/express`
**GitHub:** https://github.com/expressjs/express

| Attribute | Value |
|---|---|
| Language | JavaScript |
| Approx. Commits | 5,800+ |
| Contributors | 300+ |
| Commit Style | **Informal but consistent** — short imperative messages |
| Structure | Flat, single-package, classic Node.js layout |

**Why this repo:** Express is a mature, stable project with a long history (since 2009) and relatively low commit velocity in recent years. This tests the **temporal dimension** — can the visualization show the "story arc" of a project that had explosive early growth, a period of stagnation, and recent revitalization (Express 5.x)? The flat directory structure means file-path clustering will be less useful, pushing more weight onto time-session grouping and the timeline minimap. The long history also tests whether the epoch-level grouping can surface major version transitions (Express 3 → 4 → 5) as natural boundaries.

**What it exercises:**
- Timeline minimap effectiveness (15+ years of history)
- Temporal epoch detection (version transitions as natural group boundaries)
- Visualization of projects with varying activity levels over time
- Flat directory structure (limited file-path clustering)
- F4 (Time-session grouping) as a primary mechanism

---

### Test Matrix Summary

| Repo | Commits | Conv. Commits? | Monorepo? | Primary Grouping Strategy Tested |
|---|---|---|---|---|
| angular/angular | ~30k | Strict | Yes | Conventional commit parsing + scope |
| fastapi/fastapi | ~3k | Mixed | No | File-path clustering + time-session |
| orhun/git-cliff | ~1.2k | Strict | No | Conventional commits (clean baseline) |
| electron/electron | ~40k | Semi | No | Multi-language file-path + scale stress |
| vercel/next.js | ~25k | None | Yes | File-path + LLM summarization (worst case) |
| expressjs/express | ~5.8k | Informal | No | Time-session + temporal epoch detection |

### Data Extraction

For each repo, the test pipeline should:

1. Clone the repo (shallow clone with `--filter=blob:none` for speed)
2. Extract git log with the command from Section 7
3. Run the clustering pipeline
4. Measure: grouping time, render time, perceived grouping quality (manual review)
5. Screenshot the initial load and 2 zoom levels for comparison across repos
