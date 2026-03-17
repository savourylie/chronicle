import { execFile } from "child_process";
import { access } from "fs/promises";
import { promisify } from "util";
import type { CommitNode } from "@/types";

const execFileAsync = promisify(execFile);

// Delimiters for parsing structured git log output.
// Chosen to be extremely unlikely to appear in commit messages.
const RECORD_SEP = "<<CHRONICLE_RECORD_7f3a>>";
const BODY_END = "<<CHRONICLE_BODY_END_7f3a>>";

export interface GitParserOptions {
  /** Path to the git repository */
  repoPath: string;
  /** Maximum number of commits to retrieve (default: 10000) */
  maxCommits?: number;
  /** Only include commits after this date (ISO 8601) */
  since?: string;
  /** Only include commits before this date (ISO 8601) */
  until?: string;
  /** Specific branch to parse (default: all branches) */
  branch?: string;
}

// Build the format string for git log.
// Each field on its own line, body terminated by BODY_END marker.
// numstat lines appear after BODY_END for each commit.
const FORMAT =
  [
    RECORD_SEP,
    "%H", // hash
    "%h", // short hash
    "%an", // author name
    "%ae", // author email
    "%aI", // author date ISO 8601
    "%P", // parent hashes (space-separated)
    "%s", // subject line
  ].join("%n") +
  "%n%b" +
  BODY_END;

/**
 * Parse a git repository's log into a typed CommitNode array.
 *
 * Executes `git log` with structured format flags and `--numstat`,
 * then parses the output into CommitNode objects.
 */
export async function parseGitLog(
  options: GitParserOptions
): Promise<CommitNode[]> {
  const { repoPath, maxCommits = 10000, since, until, branch } = options;

  try {
    await access(repoPath);
  } catch {
    throw new Error(`Path does not exist: ${repoPath}`);
  }

  const args: string[] = [
    "log",
    `--pretty=format:${FORMAT}`,
    "--numstat",
    `--max-count=${maxCommits}`,
  ];

  if (since) args.push(`--since=${since}`);
  if (until) args.push(`--until=${until}`);

  if (branch) {
    args.push(branch);
  } else {
    args.push("--all");
  }

  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: repoPath,
      maxBuffer: 100 * 1024 * 1024, // 100MB for large repos
    });

    if (!stdout.trim()) return [];

    return parseRawOutput(stdout);
  } catch (error: unknown) {
    if (!(error instanceof Error)) throw error;

    const msg = error.message || "";
    const stderr =
      (error as NodeJS.ErrnoException & { stderr?: string }).stderr || "";
    const combined = `${msg}\n${stderr}`;

    if (combined.includes("not a git repository")) {
      throw new Error(`Not a git repository: ${repoPath}`);
    }

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Git is not installed or not found in PATH");
    }

    if (combined.includes("does not have any commits")) {
      return [];
    }

    throw new Error(`Git log failed: ${msg}`);
  }
}

function parseRawOutput(output: string): CommitNode[] {
  const chunks = output.split(RECORD_SEP);
  const commits: CommitNode[] = [];

  for (const chunk of chunks) {
    if (!chunk.trim()) continue;
    const commit = parseCommitChunk(chunk);
    if (commit) commits.push(commit);
  }

  return commits;
}

function parseCommitChunk(chunk: string): CommitNode | null {
  const bodyEndIdx = chunk.indexOf(BODY_END);
  if (bodyEndIdx === -1) return null;

  const headerSection = chunk.substring(0, bodyEndIdx);
  const numstatSection = chunk.substring(bodyEndIdx + BODY_END.length);

  const lines = headerSection.split("\n");

  // Trim leading/trailing empty lines
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "")
    lines.pop();

  // Minimum 7 lines: hash, shortHash, authorName, authorEmail, date, parents, subject
  if (lines.length < 7) return null;

  const hash = lines[0];
  const shortHash = lines[1];
  const authorName = lines[2];
  const authorEmail = lines[3];
  const date = lines[4];
  const parentHashesRaw = lines[5];
  const subject = lines[6];
  const body = lines.slice(7).join("\n").trim();

  const parentHashes = parentHashesRaw.trim()
    ? parentHashesRaw.trim().split(" ")
    : [];

  const message = body ? `${subject}\n\n${body}` : subject;
  const { filesChanged, insertions, deletions } = parseNumstat(numstatSection);

  return {
    hash,
    shortHash,
    message,
    author: { name: authorName, email: authorEmail },
    date,
    filesChanged,
    insertions,
    deletions,
    parentHashes,
  };
}

function parseNumstat(raw: string): {
  filesChanged: string[];
  insertions: number;
  deletions: number;
} {
  const filesChanged: string[] = [];
  let insertions = 0;
  let deletions = 0;

  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // numstat format: <insertions>\t<deletions>\t<filepath>
    // Binary files:   -\t-\t<filepath>
    const match = trimmed.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (!match) continue;

    const ins = match[1] === "-" ? 0 : parseInt(match[1], 10);
    const del = match[2] === "-" ? 0 : parseInt(match[2], 10);

    filesChanged.push(match[3]);
    insertions += ins;
    deletions += del;
  }

  return { filesChanged, insertions, deletions };
}
