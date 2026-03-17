import type {
  CommitNode,
  CommitGroup,
  CommitGroupMetadata,
  GroupingStrategy,
} from "@/types";
import { isCommitNode } from "@/types";
import { clusterByFilePath, type FileClusteringOptions } from "./file-clustering";
import { clusterByTimeSession, type TimeSessionOptions } from "./time-session";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HierarchyBuilderOptions {
  /** Minimum commits for a scope/type group to become its own chapter (default 2). */
  minChapterSize?: number;
  /** Options forwarded to file-path clustering for unscoped/untyped commits. */
  fileClusteringOptions?: FileClusteringOptions;
  /** Options forwarded to time-session grouping for scene creation. */
  timeSessionOptions?: TimeSessionOptions;
}

export interface HierarchyBuilderStats {
  totalCommits: number;
  chapterCount: number;
  sceneCount: number;
  scopeGroupedCommits: number;
  typeGroupedCommits: number;
  filePathGroupedCommits: number;
  orphanedCommits: number;
}

export interface HierarchyBuilderResult {
  root: CommitGroup;
  stats: HierarchyBuilderStats;
}

// ---------------------------------------------------------------------------
// Internals — metadata
// ---------------------------------------------------------------------------

/** Recursively collect all leaf CommitNodes from a hierarchy node. */
function collectLeaves(node: CommitGroup | CommitNode): CommitNode[] {
  if (isCommitNode(node)) return [node];
  return node.children.flatMap(collectLeaves);
}

/** Compute group metadata from an array of commits. */
function computeMetadata(commits: CommitNode[]): CommitGroupMetadata {
  if (commits.length === 0) {
    return {
      dateRange: ["", ""],
      commitCount: 0,
      authors: [],
      topFiles: [],
      totalInsertions: 0,
      totalDeletions: 0,
    };
  }

  const dates = commits.map((c) => c.date).sort();
  const dateRange: [string, string] = [dates[0], dates[dates.length - 1]];

  const authorSet = new Set<string>();
  const fileCounts = new Map<string, number>();
  let totalInsertions = 0;
  let totalDeletions = 0;

  for (const c of commits) {
    authorSet.add(c.author.name);
    totalInsertions += c.insertions;
    totalDeletions += c.deletions;
    for (const f of c.filesChanged) {
      fileCounts.set(f, (fileCounts.get(f) || 0) + 1);
    }
  }

  const topFiles = [...fileCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([file]) => file);

  return {
    dateRange,
    commitCount: commits.length,
    authors: [...authorSet],
    topFiles,
    totalInsertions,
    totalDeletions,
  };
}

// ---------------------------------------------------------------------------
// Internals — naming
// ---------------------------------------------------------------------------

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** Derive a human-readable root name from the date range of all commits. */
function deriveRootName(commits: CommitNode[]): string {
  if (commits.length === 0) return "Empty Repository";

  const dates = commits
    .map((c) => new Date(c.date))
    .filter((d) => !isNaN(d.getTime()));
  if (dates.length === 0) return "Repository History";

  dates.sort((a, b) => a.getTime() - b.getTime());
  const first = dates[0];
  const last = dates[dates.length - 1];

  const fMonth = MONTH_ABBR[first.getMonth()];
  const lMonth = MONTH_ABBR[last.getMonth()];
  const fYear = first.getFullYear();
  const lYear = last.getFullYear();

  if (fYear === lYear && first.getMonth() === last.getMonth()) {
    return `${fMonth} ${fYear}`;
  }
  if (fYear === lYear) {
    return `${fMonth} – ${lMonth} ${fYear}`;
  }
  return `${fMonth} ${fYear} – ${lMonth} ${lYear}`;
}

/** Human-readable labels for conventional commit types. */
const TYPE_LABELS: Record<string, string> = {
  feat: "Features",
  fix: "Bug Fixes",
  refactor: "Refactoring",
  docs: "Documentation",
  chore: "Maintenance",
  test: "Tests",
  style: "Code Style",
  perf: "Performance",
  ci: "CI/CD",
  build: "Build System",
};

/** Capitalize a scope string: "user-auth" → "User Auth". */
function capitalizeScope(scope: string): string {
  return scope
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------
// Internals — grouping helpers
// ---------------------------------------------------------------------------

interface ChapterSeed {
  id: string;
  name: string;
  strategy: GroupingStrategy;
  commits: CommitNode[];
}

/**
 * Partition commits by conventional commit scope.
 *
 * Scopes with fewer than `minSize` commits are merged back into the remainder.
 */
function groupByScope(
  commits: CommitNode[],
  minSize: number
): { seeds: ChapterSeed[]; remainder: CommitNode[] } {
  const byScope = new Map<string, CommitNode[]>();
  const unscoped: CommitNode[] = [];

  for (const c of commits) {
    if (c.scope) {
      const arr = byScope.get(c.scope) ?? [];
      arr.push(c);
      byScope.set(c.scope, arr);
    } else {
      unscoped.push(c);
    }
  }

  const seeds: ChapterSeed[] = [];
  const remainder = [...unscoped];
  let idx = 0;

  for (const [scope, group] of byScope) {
    if (group.length >= minSize) {
      seeds.push({
        id: `chapter-scope-${idx++}`,
        name: capitalizeScope(scope),
        strategy: "conventional-commit",
        commits: group,
      });
    } else {
      remainder.push(...group);
    }
  }

  return { seeds, remainder };
}

/**
 * Partition commits by conventional commit type (for commits without scope).
 *
 * Types with fewer than `minSize` commits are merged back into the remainder.
 */
function groupByType(
  commits: CommitNode[],
  minSize: number
): { seeds: ChapterSeed[]; remainder: CommitNode[] } {
  const byType = new Map<string, CommitNode[]>();
  const untyped: CommitNode[] = [];

  for (const c of commits) {
    if (c.type) {
      const arr = byType.get(c.type) ?? [];
      arr.push(c);
      byType.set(c.type, arr);
    } else {
      untyped.push(c);
    }
  }

  const seeds: ChapterSeed[] = [];
  const remainder = [...untyped];
  let idx = 0;

  for (const [type, group] of byType) {
    if (group.length >= minSize) {
      seeds.push({
        id: `chapter-type-${idx++}`,
        name: TYPE_LABELS[type] ?? capitalizeScope(type),
        strategy: "conventional-commit",
        commits: group,
      });
    } else {
      remainder.push(...group);
    }
  }

  return { seeds, remainder };
}

// ---------------------------------------------------------------------------
// Internals — scene building
// ---------------------------------------------------------------------------

/**
 * Build Level 2 scenes within a chapter via time-session grouping.
 *
 * Single-commit sessions are flattened to direct CommitNode children
 * to reduce unnecessary nesting depth.
 */
function buildScenes(
  chapterId: string,
  commits: CommitNode[],
  options?: TimeSessionOptions
): { children: (CommitGroup | CommitNode)[]; sceneCount: number } {
  if (commits.length === 0) {
    return { children: [], sceneCount: 0 };
  }

  if (commits.length === 1) {
    return { children: commits, sceneCount: 0 };
  }

  const result = clusterByTimeSession(commits, options);

  let sceneCount = 0;
  const children: (CommitGroup | CommitNode)[] = [];

  for (let i = 0; i < result.groups.length; i++) {
    const session = result.groups[i];
    const sessionCommits = collectLeaves(session);

    if (sessionCommits.length === 1) {
      children.push(sessionCommits[0]);
    } else {
      sceneCount++;
      children.push({
        ...session,
        id: `${chapterId}-scene-${i}`,
        level: 2 as const,
      });
    }
  }

  return { children, sceneCount };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a multi-level CommitGroup hierarchy from enriched commits.
 *
 * Combines three grouping strategies in priority order:
 *
 * 1. **Conventional commit scope** → Level 1 chapters (e.g., "Auth", "API")
 * 2. **Conventional commit type** (unscoped) → Level 1 chapters (e.g., "Features", "Bug Fixes")
 * 3. **File-path clustering** (untyped) → Level 1 chapters (e.g., "src/utils/*")
 * 4. **Time-session grouping** → Level 2 scenes within each chapter
 *
 * Returns a single root `CommitGroup` at level 0 containing the full tree.
 * Every input commit appears exactly once as a leaf node.
 */
export function buildHierarchy(
  commits: CommitNode[],
  options?: HierarchyBuilderOptions
): HierarchyBuilderResult {
  const {
    minChapterSize = 2,
    fileClusteringOptions,
    timeSessionOptions,
  } = options ?? {};

  // Empty input
  if (commits.length === 0) {
    return {
      root: {
        id: "root",
        name: "Empty Repository",
        level: 0,
        groupingStrategy: "manual",
        children: [],
        metadata: computeMetadata([]),
      },
      stats: {
        totalCommits: 0,
        chapterCount: 0,
        sceneCount: 0,
        scopeGroupedCommits: 0,
        typeGroupedCommits: 0,
        filePathGroupedCommits: 0,
        orphanedCommits: 0,
      },
    };
  }

  // --- Step 1: Group by conventional commit scope ---
  const { seeds: scopeSeeds, remainder: afterScope } = groupByScope(
    commits,
    minChapterSize
  );

  // --- Step 2: Group remainder by conventional commit type ---
  const { seeds: typeSeeds, remainder: afterType } = groupByType(
    afterScope,
    minChapterSize
  );

  // --- Step 3: File-path clustering on the remainder ---
  const filePathSeeds: ChapterSeed[] = [];
  if (afterType.length > 0) {
    const fpResult = clusterByFilePath(afterType, fileClusteringOptions);
    let fpIdx = 0;
    for (const group of fpResult.groups) {
      const groupCommits = collectLeaves(group);
      if (groupCommits.length > 0) {
        const isOrphan = group.name === "Other changes";
        filePathSeeds.push({
          id: `chapter-file-${fpIdx++}`,
          name: isOrphan ? "Other Changes" : group.name,
          strategy: isOrphan ? "manual" : "file-path",
          commits: groupCommits,
        });
      }
    }
  }

  // --- Step 4: Build scenes within each chapter ---
  const allSeeds = [...scopeSeeds, ...typeSeeds, ...filePathSeeds];

  let totalSceneCount = 0;
  const chapters: CommitGroup[] = [];

  for (const seed of allSeeds) {
    const { children, sceneCount } = buildScenes(
      seed.id,
      seed.commits,
      timeSessionOptions
    );
    totalSceneCount += sceneCount;

    if (children.length > 0) {
      chapters.push({
        id: seed.id,
        name: seed.name,
        level: 1,
        groupingStrategy: seed.strategy,
        children,
        metadata: computeMetadata(seed.commits),
      });
    }
  }

  // Sort chapters chronologically by earliest commit date
  chapters.sort((a, b) =>
    a.metadata.dateRange[0].localeCompare(b.metadata.dateRange[0])
  );

  // --- Step 5: Compute stats ---
  let scopeGroupedCommits = 0;
  let typeGroupedCommits = 0;
  let filePathGroupedCommits = 0;
  let orphanedCommits = 0;

  for (const seed of scopeSeeds) scopeGroupedCommits += seed.commits.length;
  for (const seed of typeSeeds) typeGroupedCommits += seed.commits.length;
  for (const seed of filePathSeeds) {
    if (seed.strategy === "file-path") {
      filePathGroupedCommits += seed.commits.length;
    } else {
      orphanedCommits += seed.commits.length;
    }
  }

  // --- Step 6: Build root ---
  const root: CommitGroup = {
    id: "root",
    name: deriveRootName(commits),
    level: 0,
    groupingStrategy: "manual",
    children: chapters,
    metadata: computeMetadata(commits),
  };

  return {
    root,
    stats: {
      totalCommits: commits.length,
      chapterCount: chapters.length,
      sceneCount: totalSceneCount,
      scopeGroupedCommits,
      typeGroupedCommits,
      filePathGroupedCommits,
      orphanedCommits,
    },
  };
}
