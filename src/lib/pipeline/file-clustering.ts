import type { CommitNode, CommitGroup, CommitGroupMetadata } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileClusteringOptions {
  /** Jaccard threshold to join an existing cluster (0–1, default 0.3). */
  similarityThreshold?: number;
  /** Clusters smaller than this are merged into "Other changes" (default 2). */
  minClusterSize?: number;
  /** Glob patterns for paths to exclude from fingerprinting. */
  ignorePaths?: string[];
  /** Directory truncation depth (default 2). */
  directoryDepth?: number;
  /** Per-commit directory cap — prevents large refactors bridging clusters (default 8). */
  maxDirectories?: number;
}

export interface FileClusteringStats {
  totalCommits: number;
  clusteredCommits: number;
  orphanedCommits: number;
  clusterCount: number;
  averageClusterSize: number;
}

export interface FileClusteringResult {
  groups: CommitGroup[];
  stats: FileClusteringStats;
}

// ---------------------------------------------------------------------------
// Internals — glob matching
// ---------------------------------------------------------------------------

/** Compiled glob pattern (converted to RegExp once). */
interface CompiledGlob {
  source: string;
  re: RegExp;
}

/**
 * Convert an array of simple glob strings to RegExps.
 *
 * Supports `*` (any non-separator), `**` (any path), and `?` (single char).
 */
function compileGlobs(patterns: string[]): CompiledGlob[] {
  return patterns.map((pattern) => {
    // Escape regex-special chars except our glob wildcards
    let re = pattern.replace(/([.+^${}()|[\]\\])/g, "\\$1");

    // Order matters: ** before *
    re = re.replace(/\*\*/g, "{{GLOBSTAR}}");
    re = re.replace(/\*/g, "[^/]*");
    re = re.replace(/{{GLOBSTAR}}/g, ".*");
    re = re.replace(/\?/g, "[^/]");

    return { source: pattern, re: new RegExp(`^${re}$`) };
  });
}

/** Test whether a file path matches any of the compiled glob patterns. */
function matchesAnyGlob(path: string, compiled: CompiledGlob[]): boolean {
  return compiled.some((g) => g.re.test(path));
}

// ---------------------------------------------------------------------------
// Internals — directory fingerprinting
// ---------------------------------------------------------------------------

/**
 * Extract a set of truncated directory paths from a list of file paths.
 *
 * - `src/auth/middleware/login.ts` at depth 2 → `src/auth`
 * - Root-level files (`README.md`) → `"."`
 * - Ignored paths are filtered out before extraction.
 */
function extractDirectories(
  files: string[],
  depth: number,
  ignoredGlobs: CompiledGlob[]
): Set<string> {
  const dirs = new Set<string>();

  for (const file of files) {
    if (ignoredGlobs.length > 0 && matchesAnyGlob(file, ignoredGlobs)) {
      continue;
    }

    const parts = file.split("/");

    if (parts.length <= 1) {
      // Root-level file (no directory component)
      dirs.add(".");
    } else {
      dirs.add(parts.slice(0, depth).join("/"));
    }
  }

  return dirs;
}

/**
 * If a fingerprint exceeds `maxDirs`, keep only the most frequent directories
 * (measured by how many files in the commit fall under each directory).
 */
function capDirectories(
  files: string[],
  dirs: Set<string>,
  maxDirs: number,
  depth: number
): Set<string> {
  if (dirs.size <= maxDirs) return dirs;

  // Count files per directory
  const counts = new Map<string, number>();
  for (const file of files) {
    const parts = file.split("/");
    const dir = parts.length <= 1 ? "." : parts.slice(0, depth).join("/");
    if (dirs.has(dir)) {
      counts.set(dir, (counts.get(dir) || 0) + 1);
    }
  }

  // Sort descending by count, keep top maxDirs
  const sorted = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxDirs);

  return new Set(sorted.map(([dir]) => dir));
}

// ---------------------------------------------------------------------------
// Internals — Jaccard similarity
// ---------------------------------------------------------------------------

/** Compute Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|. */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  // Iterate the smaller set for efficiency
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Internals — cluster operations
// ---------------------------------------------------------------------------

interface Cluster {
  commits: CommitNode[];
  /** Union of all member directory fingerprints (acts as the centroid). */
  dirs: Set<string>;
}

/**
 * Find the best-matching cluster for a directory set.
 *
 * Returns the cluster index if the best Jaccard score exceeds `threshold`,
 * or `null` if no cluster qualifies.
 */
function findBestCluster(
  dirs: Set<string>,
  clusters: Cluster[],
  threshold: number
): number | null {
  let bestIdx: number | null = null;
  let bestScore = 0;

  for (let i = 0; i < clusters.length; i++) {
    const score = jaccardSimilarity(dirs, clusters[i].dirs);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }

  return bestScore >= threshold ? bestIdx : null;
}

// ---------------------------------------------------------------------------
// Internals — naming
// ---------------------------------------------------------------------------

/**
 * Derive a human-readable name for a cluster from its directory union.
 *
 * 1. Longest common directory prefix → `src/auth/*`
 * 2. No common prefix → join top 2–3 dirs → `src/api, src/utils`
 * 3. Root-only → `"Root files"`
 */
function deriveClusterName(dirUnion: Set<string>): string {
  const dirs = [...dirUnion];

  if (dirs.length === 0) return "Other changes";
  if (dirs.length === 1 && dirs[0] === ".") return "Root files";

  // Filter out root marker for prefix computation
  const nonRoot = dirs.filter((d) => d !== ".");

  if (nonRoot.length === 0) return "Root files";

  // Find longest common prefix
  const prefix = longestCommonPrefix(nonRoot);
  if (prefix.length > 0) {
    // Clean trailing slash if any
    const clean = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    if (clean.length > 0) return `${clean}/*`;
  }

  // No common prefix — show top dirs (up to 3)
  const top = nonRoot.slice(0, 3).join(", ");
  return nonRoot.length > 3 ? `${top}, ...` : top;
}

/** Find the longest common directory-aligned prefix among an array of paths. */
function longestCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  if (paths.length === 1) return paths[0];

  let prefix = paths[0];
  for (let i = 1; i < paths.length; i++) {
    while (!paths[i].startsWith(prefix)) {
      const lastSlash = prefix.lastIndexOf("/");
      if (lastSlash === -1) {
        prefix = "";
        break;
      }
      prefix = prefix.slice(0, lastSlash);
    }
    if (prefix === "") break;
  }

  return prefix;
}

// ---------------------------------------------------------------------------
// Internals — metadata
// ---------------------------------------------------------------------------

/** Compute group metadata from an array of commits. */
function computeGroupMetadata(commits: CommitNode[]): CommitGroupMetadata {
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

  // Date range
  const dates = commits.map((c) => c.date).sort();
  const dateRange: [string, string] = [dates[0], dates[dates.length - 1]];

  // Unique authors
  const authorSet = new Set<string>();
  for (const c of commits) authorSet.add(c.author.name);

  // Top files by frequency
  const fileCounts = new Map<string, number>();
  let totalInsertions = 0;
  let totalDeletions = 0;

  for (const c of commits) {
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Cluster commits by file-path directory overlap using Jaccard similarity.
 *
 * Uses a greedy seed-expansion approach:
 * 1. Pre-compute directory fingerprints for each commit.
 * 2. Iterate commits, joining the best-matching cluster or starting a new one.
 * 3. Merge undersized clusters into an "Other changes" group.
 *
 * Returns `CommitGroup[]` at level 2 with `groupingStrategy: "file-path"`.
 */
export function clusterByFilePath(
  commits: CommitNode[],
  options?: FileClusteringOptions
): FileClusteringResult {
  const {
    similarityThreshold = 0.3,
    minClusterSize = 2,
    ignorePaths = [],
    directoryDepth = 2,
    maxDirectories = 8,
  } = options ?? {};

  // Empty input
  if (commits.length === 0) {
    return {
      groups: [],
      stats: {
        totalCommits: 0,
        clusteredCommits: 0,
        orphanedCommits: 0,
        clusterCount: 0,
        averageClusterSize: 0,
      },
    };
  }

  // Pre-compile ignore globs once
  const compiledIgnore = compileGlobs(ignorePaths);

  // --- Step 1 & 2: Fingerprint each commit ---
  const fingerprints: Set<string>[] = commits.map((commit) => {
    const dirs = extractDirectories(
      commit.filesChanged,
      directoryDepth,
      compiledIgnore
    );
    return capDirectories(commit.filesChanged, dirs, maxDirectories, directoryDepth);
  });

  // --- Step 3: Seed-expansion clustering ---
  const clusters: Cluster[] = [];

  for (let i = 0; i < commits.length; i++) {
    const dirs = fingerprints[i];

    const bestIdx = findBestCluster(dirs, clusters, similarityThreshold);

    if (bestIdx !== null) {
      // Add to existing cluster and expand its centroid
      clusters[bestIdx].commits.push(commits[i]);
      for (const d of dirs) clusters[bestIdx].dirs.add(d);
    } else {
      // Start a new cluster
      clusters.push({ commits: [commits[i]], dirs: new Set(dirs) });
    }
  }

  // --- Step 4: Collect orphans ---
  const validClusters: Cluster[] = [];
  const orphanCommits: CommitNode[] = [];

  for (const cluster of clusters) {
    if (cluster.commits.length >= minClusterSize) {
      validClusters.push(cluster);
    } else {
      orphanCommits.push(...cluster.commits);
    }
  }

  // --- Step 5: Build CommitGroup[] ---
  let groupIdx = 0;
  const groups: CommitGroup[] = validClusters.map((cluster) => ({
    id: `file-cluster-${groupIdx++}`,
    name: deriveClusterName(cluster.dirs),
    level: 2 as const,
    groupingStrategy: "file-path" as const,
    children: cluster.commits,
    metadata: computeGroupMetadata(cluster.commits),
  }));

  if (orphanCommits.length > 0) {
    groups.push({
      id: `file-cluster-${groupIdx}`,
      name: "Other changes",
      level: 2 as const,
      groupingStrategy: "file-path" as const,
      children: orphanCommits,
      metadata: computeGroupMetadata(orphanCommits),
    });
  }

  // --- Stats ---
  const clusteredCommits = validClusters.reduce(
    (sum, c) => sum + c.commits.length,
    0
  );

  return {
    groups,
    stats: {
      totalCommits: commits.length,
      clusteredCommits,
      orphanedCommits: orphanCommits.length,
      clusterCount: validClusters.length,
      averageClusterSize:
        validClusters.length > 0 ? clusteredCommits / validClusters.length : 0,
    },
  };
}
