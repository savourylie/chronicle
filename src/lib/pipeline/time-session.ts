import type { CommitNode, CommitGroup, CommitGroupMetadata } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TimeSessionOptions {
  /** Max gap in minutes between consecutive commits by the same author (default 120). */
  maxGapMinutes?: number;
  /** Also require file-path overlap to continue a session (default false). */
  requireFileOverlap?: boolean;
  /** Jaccard threshold when file overlap is required (default 0.2). */
  fileOverlapThreshold?: number;
  /** Hard cap on commits per session (default 50). */
  maxSessionSize?: number;
}

export interface TimeSessionStats {
  totalCommits: number;
  sessionCount: number;
  singleCommitSessions: number;
  averageSessionSize: number;
  averageSessionDurationMinutes: number;
  longestSessionSize: number;
}

export interface TimeSessionResult {
  groups: CommitGroup[];
  stats: TimeSessionStats;
}

// ---------------------------------------------------------------------------
// Internals — file overlap
// ---------------------------------------------------------------------------

/** Compute Jaccard similarity between two sets: |A ∩ B| / |A ∪ B|. */
function fileOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  const [smaller, larger] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of smaller) {
    if (larger.has(item)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// ---------------------------------------------------------------------------
// Internals — session naming
// ---------------------------------------------------------------------------

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Derive a human-readable session name from its commits.
 *
 * - Single day:  "Alice's work on Mar 15"
 * - Multi-day same month: "Alice's work on Mar 15-17"
 * - Cross-month: "Alice's work on Mar 15 – Apr 2"
 */
function deriveSessionName(commits: CommitNode[]): string {
  const firstName = commits[0].author.name.split(/\s+/)[0];

  const firstDate = new Date(commits[0].date);
  const lastDate = new Date(commits[commits.length - 1].date);

  // Guard against invalid dates
  if (isNaN(firstDate.getTime()) || isNaN(lastDate.getTime())) {
    return `${firstName}'s work session`;
  }

  const firstMonth = MONTH_ABBR[firstDate.getMonth()];
  const firstDay = firstDate.getDate();
  const lastMonth = MONTH_ABBR[lastDate.getMonth()];
  const lastDay = lastDate.getDate();

  if (
    firstDate.getFullYear() === lastDate.getFullYear() &&
    firstDate.getMonth() === lastDate.getMonth() &&
    firstDay === lastDay
  ) {
    return `${firstName}'s work on ${firstMonth} ${firstDay}`;
  }

  if (
    firstDate.getFullYear() === lastDate.getFullYear() &&
    firstDate.getMonth() === lastDate.getMonth()
  ) {
    return `${firstName}'s work on ${firstMonth} ${firstDay}-${lastDay}`;
  }

  return `${firstName}'s work on ${firstMonth} ${firstDay} – ${lastMonth} ${lastDay}`;
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
// Internals — active session tracking
// ---------------------------------------------------------------------------

interface ActiveSession {
  commits: CommitNode[];
  lastDate: Date;
  fileSet: Set<string>;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Group sequential commits by the same author within a configurable time
 * window into "sessions" — natural work bursts.
 *
 * Uses a single-pass O(n) algorithm with per-author active sessions:
 * 1. Reverse commits to chronological order (git log outputs newest-first).
 * 2. Maintain a Map of each author's current active session.
 * 3. For each commit, either extend or close-and-replace the active session.
 * 4. Flush remaining active sessions and build CommitGroup[].
 *
 * Returns `CommitGroup[]` at level 2 with `groupingStrategy: "time-session"`.
 */
export function clusterByTimeSession(
  commits: CommitNode[],
  options?: TimeSessionOptions
): TimeSessionResult {
  const {
    maxGapMinutes = 120,
    requireFileOverlap = false,
    fileOverlapThreshold = 0.2,
    maxSessionSize = 50,
  } = options ?? {};

  // Empty input
  if (commits.length === 0) {
    return {
      groups: [],
      stats: {
        totalCommits: 0,
        sessionCount: 0,
        singleCommitSessions: 0,
        averageSessionSize: 0,
        averageSessionDurationMinutes: 0,
        longestSessionSize: 0,
      },
    };
  }

  // Reverse to chronological order (oldest first)
  const chronological = [...commits].reverse();

  const activeSessions = new Map<string, ActiveSession>();
  const closedSessions: CommitNode[][] = [];

  for (const commit of chronological) {
    const authorKey = commit.author.name;
    const commitDate = new Date(commit.date);
    const commitFiles = new Set(commit.filesChanged);
    const active = activeSessions.get(authorKey);

    if (active) {
      const gapMs = commitDate.getTime() - active.lastDate.getTime();
      const gapMinutes = gapMs / 60_000;

      const withinGap = !isNaN(gapMinutes) && gapMinutes >= 0 && gapMinutes <= maxGapMinutes;
      const withinSize = active.commits.length < maxSessionSize;
      const passesOverlap =
        !requireFileOverlap ||
        fileOverlap(active.fileSet, commitFiles) >= fileOverlapThreshold;

      if (withinGap && withinSize && passesOverlap) {
        // Extend active session
        active.commits.push(commit);
        active.lastDate = commitDate;
        for (const f of commit.filesChanged) active.fileSet.add(f);
        continue;
      }

      // Close active session, start new one
      closedSessions.push(active.commits);
    }

    // Start new session for this author
    activeSessions.set(authorKey, {
      commits: [commit],
      lastDate: commitDate,
      fileSet: new Set(commit.filesChanged),
    });
  }

  // Flush remaining active sessions
  for (const session of activeSessions.values()) {
    closedSessions.push(session.commits);
  }

  // --- Build CommitGroup[] ---
  const groups: CommitGroup[] = closedSessions.map((sessionCommits, idx) => ({
    id: `time-session-${idx}`,
    name: deriveSessionName(sessionCommits),
    level: 2 as const,
    groupingStrategy: "time-session" as const,
    children: sessionCommits,
    metadata: computeGroupMetadata(sessionCommits),
  }));

  // --- Stats ---
  const sessionCount = closedSessions.length;
  const singleCommitSessions = closedSessions.filter(
    (s) => s.length === 1
  ).length;
  const longestSessionSize = Math.max(...closedSessions.map((s) => s.length));

  let totalDurationMinutes = 0;
  for (const sessionCommits of closedSessions) {
    if (sessionCommits.length < 2) continue;
    const first = new Date(sessionCommits[0].date).getTime();
    const last = new Date(sessionCommits[sessionCommits.length - 1].date).getTime();
    const durationMs = Math.abs(last - first);
    if (!isNaN(durationMs)) {
      totalDurationMinutes += durationMs / 60_000;
    }
  }

  const sessionsWithDuration = closedSessions.filter((s) => s.length >= 2).length;

  return {
    groups,
    stats: {
      totalCommits: commits.length,
      sessionCount,
      singleCommitSessions,
      averageSessionSize: sessionCount > 0 ? commits.length / sessionCount : 0,
      averageSessionDurationMinutes:
        sessionsWithDuration > 0 ? totalDurationMinutes / sessionsWithDuration : 0,
      longestSessionSize,
    },
  };
}
