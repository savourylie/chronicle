import type { CommitNode } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export const CONVENTIONAL_TYPES = [
  "feat",
  "fix",
  "refactor",
  "docs",
  "chore",
  "test",
  "style",
  "perf",
  "ci",
  "build",
] as const;

export type ConventionalType = (typeof CONVENTIONAL_TYPES)[number];

export interface ConventionalParseResult {
  type: ConventionalType | undefined;
  scope: string | undefined;
  breaking: boolean;
}

export interface ConventionalParseStats {
  total: number;
  parsed: number;
  unparsed: number;
  fuzzyMatched: number;
  typeDistribution: Record<string, number>;
}

export interface EnrichResult {
  commits: CommitNode[];
  stats: ConventionalParseStats;
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

const TYPES_SET: ReadonlySet<string> = new Set(CONVENTIONAL_TYPES);

/**
 * Strict conventional commit regex.
 *
 * ```
 * type(scope)!: description
 * ```
 *
 * - Group 1: type
 * - Group 2: scope (optional)
 * - Group 3: `!` breaking indicator (optional)
 * - Group 4: description
 */
const STRICT_RE = /^(\w+)(?:\(([^)]*)\))?(!)?\s*:\s*(.+)/;

/** Matches `BREAKING CHANGE:` or `BREAKING-CHANGE:` anywhere in the body. */
const BREAKING_BODY_RE = /BREAKING[ -]CHANGE\s*:/;

/**
 * Fuzzy verb→type mappings.  Each entry maps a leading verb pattern to a
 * conventional type.  Patterns are tried against the lowercased subject.
 */
const FUZZY_RULES: ReadonlyArray<readonly [RegExp, ConventionalType]> = [
  // fix
  [/^fix\b/, "fix"],
  [/^patch\b/, "fix"],
  [/^resolve\b/, "fix"],
  [/^hotfix\b/, "fix"],
  [/^bug\s*fix\b/, "fix"],
  [/^correct\b/, "fix"],
  [/^repair\b/, "fix"],

  // feat
  [/^add\b/, "feat"],
  [/^implement\b/, "feat"],
  [/^introduce\b/, "feat"],
  [/^create\b/, "feat"],
  [/^support\b/, "feat"],
  [/^enable\b/, "feat"],
  [/^allow\b/, "feat"],

  // refactor
  [/^refactor\b/, "refactor"],
  [/^restructure\b/, "refactor"],
  [/^simplify\b/, "refactor"],
  [/^reorganize\b/, "refactor"],
  [/^rename\b/, "refactor"],
  [/^move\b/, "refactor"],
  [/^extract\b/, "refactor"],

  // docs
  [/^document\b/, "docs"],
  [/^update docs\b/, "docs"],
  [/^update readme\b/, "docs"],

  // chore
  [/^bump\b/, "chore"],
  [/^update dep/, "chore"],
  [/^upgrade\b/, "chore"],
  [/^clean\s*up\b/, "chore"],
  [/^remove unused\b/, "chore"],
  [/^delete\b/, "chore"],
  [/^misc\b/, "chore"],

  // perf
  [/^optimize\b/, "perf"],
  [/^speed\s*up\b/, "perf"],
  [/^improve perf/, "perf"],

  // style
  [/^format\b/, "style"],
  [/^lint\b/, "style"],
  [/^prettier\b/, "style"],

  // test
  [/^test\b/, "test"],
  [/^add test/, "test"],

  // ci
  [/^ci\b/, "ci"],

  // build
  [/^build\b/, "build"],
];

/** Extract the subject line (first line) from a full commit message. */
function extractSubject(message: string): string {
  const newlineIdx = message.indexOf("\n");
  return newlineIdx === -1 ? message : message.slice(0, newlineIdx);
}

/** Extract the body (everything after the first blank line) from a message. */
function extractBody(message: string): string {
  const idx = message.indexOf("\n\n");
  return idx === -1 ? "" : message.slice(idx + 2);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parse a single commit message into conventional commit fields.
 *
 * 1. Tries a strict conventional commit regex.
 * 2. Falls back to fuzzy leading-verb matching.
 * 3. Returns undefined type/scope if neither matches.
 */
export function parseConventionalMessage(
  message: string
): ConventionalParseResult {
  if (!message) {
    return { type: undefined, scope: undefined, breaking: false };
  }

  const subject = extractSubject(message).trim();
  const body = extractBody(message);

  // --- Strict match ---
  const strict = STRICT_RE.exec(subject);
  if (strict) {
    const rawType = strict[1].toLowerCase();
    if (TYPES_SET.has(rawType)) {
      const hasBreakingMarker = strict[3] === "!";
      const hasBreakingBody = BREAKING_BODY_RE.test(body);
      return {
        type: rawType as ConventionalType,
        scope: strict[2] || undefined,
        breaking: hasBreakingMarker || hasBreakingBody,
      };
    }
  }

  // --- Fuzzy match ---
  const lower = subject.toLowerCase();
  for (const [re, type] of FUZZY_RULES) {
    if (re.test(lower)) {
      return { type, scope: undefined, breaking: false };
    }
  }

  return { type: undefined, scope: undefined, breaking: false };
}

/**
 * Enrich an array of CommitNodes with conventional commit `type` and `scope`.
 *
 * Returns a **new** array (no mutation) plus aggregate stats.
 */
export function enrichCommits(commits: CommitNode[]): EnrichResult {
  const stats: ConventionalParseStats = {
    total: commits.length,
    parsed: 0,
    unparsed: 0,
    fuzzyMatched: 0,
    typeDistribution: {},
  };

  const enriched = commits.map((commit) => {
    const result = parseConventionalMessage(commit.message);

    if (result.type) {
      // Determine if strict or fuzzy: re-run strict check to classify
      const subject = extractSubject(commit.message).trim();
      const strict = STRICT_RE.exec(subject);
      const isStrict =
        strict !== null && TYPES_SET.has(strict[1].toLowerCase());

      if (isStrict) {
        stats.parsed++;
      } else {
        stats.fuzzyMatched++;
      }

      stats.typeDistribution[result.type] =
        (stats.typeDistribution[result.type] || 0) + 1;

      return { ...commit, type: result.type, scope: result.scope };
    }

    stats.unparsed++;
    return { ...commit };
  });

  return { commits: enriched, stats };
}
