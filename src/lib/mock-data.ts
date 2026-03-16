import type {
  CommitNode,
  CommitGroup,
  CommitGroupMetadata,
  GroupingStrategy,
} from "@/types";
import { isCommitNode } from "@/types";

// ---------------------------------------------------------------------------
// Seed data constants
// ---------------------------------------------------------------------------

const AUTHORS = [
  { name: "Alice Chen", email: "alice.chen@example.com" },
  { name: "Bob Martinez", email: "bob.martinez@example.com" },
  { name: "Chandra Patel", email: "chandra.patel@example.com" },
  { name: "Diana Okafor", email: "diana.okafor@example.com" },
  { name: "Erik Lindqvist", email: "erik.lindqvist@example.com" },
  { name: "Fatima Al-Rashid", email: "fatima.alrashid@example.com" },
  { name: "George Tanaka", email: "george.tanaka@example.com" },
];

interface SceneDef {
  name: string;
  commitCount: number;
  typePool: { type: string; weight: number }[];
  files: string[];
}

interface ChapterDef {
  name: string;
  scenes: SceneDef[];
}

interface EpochDef {
  name: string;
  strategy: GroupingStrategy;
  chapters: ChapterDef[];
}

const EPOCH_DEFINITIONS: EpochDef[] = [
  {
    name: "Auth System Overhaul",
    strategy: "conventional-commit",
    chapters: [
      {
        name: "OAuth2 Integration",
        scenes: [
          {
            name: "Provider setup",
            commitCount: 5,
            typePool: [
              { type: "feat", weight: 4 },
              { type: "chore", weight: 1 },
            ],
            files: [
              "src/auth/providers/google.ts",
              "src/auth/providers/github.ts",
              "src/auth/oauth-client.ts",
              "src/config/auth.ts",
            ],
          },
          {
            name: "Token exchange",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "fix", weight: 1 },
            ],
            files: [
              "src/auth/token-exchange.ts",
              "src/auth/crypto.ts",
              "src/auth/types.ts",
              "tests/auth/token-exchange.test.ts",
            ],
          },
          {
            name: "Callback handling",
            commitCount: 3,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "test", weight: 1 },
            ],
            files: [
              "src/auth/callback-handler.ts",
              "src/routes/auth/callback.ts",
              "tests/auth/callback.test.ts",
            ],
          },
        ],
      },
      {
        name: "Session Management",
        scenes: [
          {
            name: "Session store",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "refactor", weight: 1 },
            ],
            files: [
              "src/auth/session/store.ts",
              "src/auth/session/types.ts",
              "src/db/migrations/002-sessions.ts",
              "src/auth/session/redis-adapter.ts",
            ],
          },
          {
            name: "Middleware",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "fix", weight: 1 },
              { type: "test", weight: 1 },
            ],
            files: [
              "src/middleware/auth.ts",
              "src/middleware/session.ts",
              "tests/middleware/auth.test.ts",
            ],
          },
          {
            name: "Refresh tokens",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "fix", weight: 2 },
            ],
            files: [
              "src/auth/session/refresh.ts",
              "src/auth/token-store.ts",
              "tests/auth/refresh.test.ts",
              "src/auth/session/store.ts",
            ],
          },
        ],
      },
      {
        name: "Permission System",
        scenes: [
          {
            name: "RBAC model",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "docs", weight: 1 },
            ],
            files: [
              "src/auth/rbac/model.ts",
              "src/auth/rbac/types.ts",
              "src/db/migrations/003-roles.ts",
              "docs/rbac.md",
            ],
          },
          {
            name: "Permission guards",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "test", weight: 2 },
            ],
            files: [
              "src/auth/rbac/guard.ts",
              "src/decorators/require-role.ts",
              "tests/auth/rbac/guard.test.ts",
              "tests/auth/rbac/integration.test.ts",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "API v2 Migration",
    strategy: "file-path",
    chapters: [
      {
        name: "Schema Redesign",
        scenes: [
          {
            name: "New schema definitions",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "chore", weight: 1 },
            ],
            files: [
              "src/api/v2/schema/users.ts",
              "src/api/v2/schema/projects.ts",
              "src/api/v2/schema/index.ts",
              "src/api/v2/types.ts",
            ],
          },
          {
            name: "Validation layer",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "test", weight: 2 },
            ],
            files: [
              "src/api/v2/validation/schemas.ts",
              "src/api/v2/validation/middleware.ts",
              "tests/api/v2/validation.test.ts",
              "src/api/v2/validation/errors.ts",
            ],
          },
          {
            name: "Migration scripts",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "fix", weight: 1 },
              { type: "chore", weight: 1 },
            ],
            files: [
              "src/db/migrations/004-api-v2.ts",
              "scripts/migrate-v1-to-v2.ts",
              "scripts/validate-migration.ts",
            ],
          },
        ],
      },
      {
        name: "Client SDK Update",
        scenes: [
          {
            name: "SDK core rewrite",
            commitCount: 5,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "refactor", weight: 2 },
            ],
            files: [
              "packages/sdk/src/client.ts",
              "packages/sdk/src/types.ts",
              "packages/sdk/src/http.ts",
              "packages/sdk/src/errors.ts",
              "packages/sdk/package.json",
            ],
          },
          {
            name: "SDK tests & docs",
            commitCount: 3,
            typePool: [
              { type: "test", weight: 2 },
              { type: "docs", weight: 1 },
            ],
            files: [
              "packages/sdk/tests/client.test.ts",
              "packages/sdk/tests/integration.test.ts",
              "packages/sdk/README.md",
            ],
          },
        ],
      },
      {
        name: "Deprecation & Cleanup",
        scenes: [
          {
            name: "Deprecation warnings",
            commitCount: 4,
            typePool: [
              { type: "chore", weight: 2 },
              { type: "feat", weight: 1 },
              { type: "docs", weight: 1 },
            ],
            files: [
              "src/api/v1/deprecation.ts",
              "src/api/v1/middleware/warning.ts",
              "src/api/v1/types.ts",
              "docs/migration-guide.md",
            ],
          },
          {
            name: "Legacy removal",
            commitCount: 4,
            typePool: [
              { type: "chore", weight: 3 },
              { type: "refactor", weight: 1 },
            ],
            files: [
              "src/api/v1/routes/users.ts",
              "src/api/v1/routes/projects.ts",
              "src/api/v1/index.ts",
              "tests/api/v1/cleanup.test.ts",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Performance Sprint",
    strategy: "time-session",
    chapters: [
      {
        name: "Database Optimization",
        scenes: [
          {
            name: "Query analysis",
            commitCount: 4,
            typePool: [
              { type: "perf", weight: 3 },
              { type: "refactor", weight: 1 },
            ],
            files: [
              "src/db/queries/users.ts",
              "src/db/queries/projects.ts",
              "src/db/query-analyzer.ts",
              "src/db/explain.ts",
            ],
          },
          {
            name: "Index optimization",
            commitCount: 4,
            typePool: [
              { type: "perf", weight: 3 },
              { type: "chore", weight: 1 },
            ],
            files: [
              "src/db/migrations/005-indexes.ts",
              "src/db/indexes.ts",
              "scripts/benchmark-queries.ts",
              "src/db/connection-pool.ts",
            ],
          },
          {
            name: "Caching layer",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "perf", weight: 2 },
            ],
            files: [
              "src/cache/redis.ts",
              "src/cache/strategy.ts",
              "src/cache/invalidation.ts",
              "tests/cache/redis.test.ts",
            ],
          },
        ],
      },
      {
        name: "Frontend Bundle",
        scenes: [
          {
            name: "Bundle analysis",
            commitCount: 4,
            typePool: [
              { type: "perf", weight: 2 },
              { type: "chore", weight: 2 },
            ],
            files: [
              "webpack.config.ts",
              "scripts/analyze-bundle.ts",
              "src/utils/lazy-imports.ts",
              ".bundlewatch.config.json",
            ],
          },
          {
            name: "Code splitting",
            commitCount: 4,
            typePool: [
              { type: "perf", weight: 3 },
              { type: "refactor", weight: 1 },
            ],
            files: [
              "src/routes/lazy-routes.ts",
              "src/components/lazy-components.ts",
              "src/utils/dynamic-import.ts",
              "src/routes/index.ts",
            ],
          },
          {
            name: "Asset optimization",
            commitCount: 4,
            typePool: [
              { type: "perf", weight: 2 },
              { type: "chore", weight: 1 },
              { type: "fix", weight: 1 },
            ],
            files: [
              "src/utils/image-optimizer.ts",
              "scripts/compress-assets.ts",
              "src/components/optimized-image.tsx",
              "public/manifest.json",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Dashboard Redesign",
    strategy: "conventional-commit",
    chapters: [
      {
        name: "Component Library",
        scenes: [
          {
            name: "Design tokens",
            commitCount: 3,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "style", weight: 1 },
            ],
            files: [
              "src/ui/tokens/colors.ts",
              "src/ui/tokens/spacing.ts",
              "src/ui/tokens/typography.ts",
              "src/ui/tokens/index.ts",
            ],
          },
          {
            name: "Base components",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "style", weight: 1 },
            ],
            files: [
              "src/ui/components/Button.tsx",
              "src/ui/components/Card.tsx",
              "src/ui/components/Input.tsx",
              "src/ui/components/Modal.tsx",
              "src/ui/components/index.ts",
            ],
          },
          {
            name: "Storybook setup",
            commitCount: 2,
            typePool: [
              { type: "chore", weight: 1 },
              { type: "docs", weight: 1 },
            ],
            files: [
              ".storybook/main.ts",
              ".storybook/preview.ts",
              "src/ui/stories/Button.stories.tsx",
            ],
          },
        ],
      },
      {
        name: "Analytics Views",
        scenes: [
          {
            name: "Chart components",
            commitCount: 4,
            typePool: [
              { type: "feat", weight: 3 },
              { type: "style", weight: 1 },
            ],
            files: [
              "src/dashboard/charts/LineChart.tsx",
              "src/dashboard/charts/BarChart.tsx",
              "src/dashboard/charts/PieChart.tsx",
              "src/dashboard/charts/types.ts",
            ],
          },
          {
            name: "Dashboard layout",
            commitCount: 3,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "style", weight: 1 },
            ],
            files: [
              "src/dashboard/layout/Grid.tsx",
              "src/dashboard/layout/Sidebar.tsx",
              "src/dashboard/layout/Header.tsx",
              "src/dashboard/DashboardPage.tsx",
            ],
          },
          {
            name: "Data connectors",
            commitCount: 3,
            typePool: [
              { type: "feat", weight: 2 },
              { type: "fix", weight: 1 },
            ],
            files: [
              "src/dashboard/data/connector.ts",
              "src/dashboard/data/transforms.ts",
              "src/dashboard/data/hooks.ts",
            ],
          },
        ],
      },
      {
        name: "Testing & Polish",
        scenes: [
          {
            name: "Integration tests",
            commitCount: 3,
            typePool: [
              { type: "test", weight: 3 },
            ],
            files: [
              "tests/dashboard/charts.test.tsx",
              "tests/dashboard/layout.test.tsx",
              "tests/dashboard/integration.test.tsx",
            ],
          },
          {
            name: "Visual polish",
            commitCount: 2,
            typePool: [
              { type: "style", weight: 2 },
              { type: "fix", weight: 1 },
            ],
            files: [
              "src/dashboard/DashboardPage.tsx",
              "src/ui/tokens/colors.ts",
              "src/ui/components/Card.tsx",
            ],
          },
        ],
      },
    ],
  },
];

const COMMIT_VERBS: Record<string, string[]> = {
  feat: [
    "add",
    "implement",
    "introduce",
    "create",
    "support",
    "enable",
  ],
  fix: [
    "fix",
    "resolve",
    "correct",
    "patch",
    "handle",
    "address",
  ],
  refactor: [
    "refactor",
    "restructure",
    "simplify",
    "extract",
    "reorganize",
    "streamline",
  ],
  chore: [
    "update",
    "bump",
    "configure",
    "clean up",
    "remove",
    "move",
  ],
  test: [
    "add tests for",
    "cover",
    "verify",
    "validate",
    "test",
  ],
  docs: [
    "document",
    "add docs for",
    "describe",
    "explain",
    "update docs for",
  ],
  perf: [
    "optimize",
    "improve",
    "speed up",
    "reduce",
    "cache",
    "batch",
  ],
  style: [
    "style",
    "align",
    "adjust",
    "polish",
    "update styling for",
  ],
};

// ---------------------------------------------------------------------------
// Seeded RNG (Mulberry32)
// ---------------------------------------------------------------------------

function createRng(seed: number) {
  let s = seed | 0;

  function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function randInt(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1));
  }

  function pick<T>(arr: T[]): T {
    return arr[Math.floor(next() * arr.length)];
  }

  function pickN<T>(arr: T[], n: number): T[] {
    const copy = [...arr];
    const result: T[] = [];
    const count = Math.min(n, copy.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(next() * copy.length);
      result.push(copy[idx]);
      copy.splice(idx, 1);
    }
    return result;
  }

  function pickWeighted(pool: { type: string; weight: number }[]): string {
    const total = pool.reduce((sum, p) => sum + p.weight, 0);
    let r = next() * total;
    for (const p of pool) {
      r -= p.weight;
      if (r <= 0) return p.type;
    }
    return pool[pool.length - 1].type;
  }

  function hexChars(n: number): string {
    let out = "";
    for (let i = 0; i < n; i++) {
      out += Math.floor(next() * 16).toString(16);
    }
    return out;
  }

  return { next, randInt, pick, pickN, pickWeighted, hexChars };
}

// ---------------------------------------------------------------------------
// Helper: makeCommitNode
// ---------------------------------------------------------------------------

function makeCommitNode(
  rng: ReturnType<typeof createRng>,
  scene: SceneDef,
  date: Date,
  epochAuthors: { name: string; email: string }[],
  previousHash: string | null,
): CommitNode {
  const hash = rng.hexChars(40);
  const shortHash = hash.slice(0, 7);
  const commitType = rng.pickWeighted(scene.typePool);
  const scope = scene.name.toLowerCase().replace(/\s+/g, "-").slice(0, 16);
  const verbs = COMMIT_VERBS[commitType] ?? COMMIT_VERBS["feat"];
  const verb = rng.pick(verbs);

  const fileCount = rng.randInt(1, Math.min(4, scene.files.length));
  const filesChanged = rng.pickN(scene.files, fileCount);

  const insertions = rng.randInt(5, 200);
  const deletions = rng.randInt(0, Math.min(100, Math.floor(insertions * 0.6)));

  const author = rng.pick(epochAuthors);
  const message = `${commitType}(${scope}): ${verb} ${scene.name.toLowerCase()}`;

  const parentHashes = previousHash ? [previousHash] : [];

  const node: CommitNode = {
    hash,
    shortHash,
    message,
    author,
    date: date.toISOString(),
    filesChanged,
    insertions,
    deletions,
    type: commitType,
    scope,
    parentHashes,
  };

  if (rng.next() < 0.3) {
    node.prNumber = rng.randInt(100, 999);
    node.prTitle = `${verb.charAt(0).toUpperCase() + verb.slice(1)} ${scene.name.toLowerCase()}`;
  }

  return node;
}

// ---------------------------------------------------------------------------
// Helper: computeMetadata
// ---------------------------------------------------------------------------

function computeMetadata(
  children: (CommitGroup | CommitNode)[],
): CommitGroupMetadata {
  const dates: string[] = [];
  const authors = new Set<string>();
  const fileCounts = new Map<string, number>();
  let totalInsertions = 0;
  let totalDeletions = 0;
  let commitCount = 0;

  function walk(nodes: (CommitGroup | CommitNode)[]) {
    for (const node of nodes) {
      if (isCommitNode(node)) {
        dates.push(node.date);
        authors.add(node.author.name);
        for (const f of node.filesChanged) {
          fileCounts.set(f, (fileCounts.get(f) ?? 0) + 1);
        }
        totalInsertions += node.insertions;
        totalDeletions += node.deletions;
        commitCount++;
      } else {
        walk(node.children);
      }
    }
  }

  walk(children);

  dates.sort();
  const dateRange: [string, string] = [
    dates[0] ?? new Date().toISOString(),
    dates[dates.length - 1] ?? new Date().toISOString(),
  ];

  const topFiles = [...fileCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([f]) => f);

  return {
    dateRange,
    commitCount,
    authors: [...authors],
    topFiles,
    totalInsertions,
    totalDeletions,
  };
}

// ---------------------------------------------------------------------------
// Builders
// ---------------------------------------------------------------------------

function makeScene(
  rng: ReturnType<typeof createRng>,
  sceneDef: SceneDef,
  epochIdx: number,
  chapterIdx: number,
  sceneIdx: number,
  startDate: Date,
  epochAuthors: { name: string; email: string }[],
): { group: CommitGroup; endDate: Date; lastHash: string | null } {
  const children: CommitNode[] = [];
  let cursor = new Date(startDate);
  let prevHash: string | null = null;

  for (let i = 0; i < sceneDef.commitCount; i++) {
    const gapMinutes = rng.randInt(10, 120);
    cursor = new Date(cursor.getTime() + gapMinutes * 60_000);
    const node = makeCommitNode(rng, sceneDef, cursor, epochAuthors, prevHash);
    children.push(node);
    prevHash = node.hash;
  }

  const id = `scene-${epochIdx}-${chapterIdx}-${sceneIdx}`;
  const metadata = computeMetadata(children);

  return {
    group: {
      id,
      name: sceneDef.name,
      level: 2,
      groupingStrategy: EPOCH_DEFINITIONS[epochIdx].strategy,
      children,
      metadata,
    },
    endDate: cursor,
    lastHash: prevHash,
  };
}

function makeChapter(
  rng: ReturnType<typeof createRng>,
  chapterDef: ChapterDef,
  epochIdx: number,
  chapterIdx: number,
  startDate: Date,
  epochAuthors: { name: string; email: string }[],
): { group: CommitGroup; endDate: Date; lastHash: string | null } {
  const children: CommitGroup[] = [];
  let cursor = new Date(startDate);
  let lastHash: string | null = null;

  for (let sceneIdx = 0; sceneIdx < chapterDef.scenes.length; sceneIdx++) {
    const result = makeScene(
      rng,
      chapterDef.scenes[sceneIdx],
      epochIdx,
      chapterIdx,
      sceneIdx,
      cursor,
      epochAuthors,
    );
    children.push(result.group);
    lastHash = result.lastHash;

    // 3-9 day gap between scenes
    const gapDays = rng.randInt(3, 9);
    cursor = new Date(result.endDate.getTime() + gapDays * 86_400_000);
  }

  const id = `chapter-${epochIdx}-${chapterIdx}`;
  const metadata = computeMetadata(children);

  return {
    group: {
      id,
      name: chapterDef.name,
      level: 1,
      groupingStrategy: EPOCH_DEFINITIONS[epochIdx].strategy,
      children,
      metadata,
    },
    endDate: cursor,
    lastHash,
  };
}

function makeEpoch(
  rng: ReturnType<typeof createRng>,
  epochDef: EpochDef,
  epochIdx: number,
  startDate: Date,
): { group: CommitGroup; endDate: Date } {
  const epochAuthors = rng.pickN(AUTHORS, rng.randInt(3, 5));
  const children: CommitGroup[] = [];
  let cursor = new Date(startDate);

  for (
    let chapterIdx = 0;
    chapterIdx < epochDef.chapters.length;
    chapterIdx++
  ) {
    const result = makeChapter(
      rng,
      epochDef.chapters[chapterIdx],
      epochIdx,
      chapterIdx,
      cursor,
      epochAuthors,
    );
    children.push(result.group);
    cursor = result.endDate;
  }

  const id = `epoch-${epochIdx}`;
  const metadata = computeMetadata(children);

  return {
    group: {
      id,
      name: epochDef.name,
      level: 0,
      groupingStrategy: epochDef.strategy,
      children,
      metadata,
    },
    endDate: cursor,
  };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export function generateMockData(seed: number = 42): CommitGroup {
  const rng = createRng(seed);
  const baseDate = new Date("2025-07-01T09:00:00Z");
  const epochChildren: CommitGroup[] = [];
  let cursor = new Date(baseDate);

  for (let i = 0; i < EPOCH_DEFINITIONS.length; i++) {
    const result = makeEpoch(rng, EPOCH_DEFINITIONS[i], i, cursor);
    epochChildren.push(result.group);

    // Small gap between epochs
    const gapDays = rng.randInt(2, 8);
    cursor = new Date(result.endDate.getTime() + gapDays * 86_400_000);
  }

  const metadata = computeMetadata(epochChildren);

  return {
    id: "root",
    name: "All Commits",
    level: 0,
    groupingStrategy: "manual",
    children: epochChildren,
    metadata,
  };
}

export const MOCK_DATA: CommitGroup = generateMockData(42);
