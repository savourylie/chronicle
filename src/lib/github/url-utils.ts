export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch: string | undefined;
  cloneUrl: string;
}

export type ParseResult =
  | { ok: true; data: GitHubRepoInfo }
  | { ok: false; error: string };

const VALID_NAME = /^[a-zA-Z0-9._-]+$/;

function validateOwnerRepo(
  owner: string,
  repo: string,
): ParseResult | null {
  if (!owner) return { ok: false, error: "Owner is empty" };
  if (!repo) return { ok: false, error: "Repo name is empty" };
  if (!VALID_NAME.test(owner))
    return { ok: false, error: `Invalid owner: ${owner}` };
  if (!VALID_NAME.test(repo))
    return { ok: false, error: `Invalid repo name: ${repo}` };
  return null;
}

function buildResult(
  owner: string,
  repo: string,
  branch: string | undefined,
): ParseResult {
  const err = validateOwnerRepo(owner, repo);
  if (err) return err;
  return {
    ok: true,
    data: {
      owner,
      repo,
      branch,
      cloneUrl: `https://github.com/${owner}/${repo}.git`,
    },
  };
}

function stripGitSuffix(name: string): string {
  return name.endsWith(".git") ? name.slice(0, -4) : name;
}

function trySSH(input: string): ParseResult | null {
  const match = input.match(/^git@github\.com:([^/]+)\/([^/]+?)(?:\.git)?$/);
  if (!match) return null;
  return buildResult(match[1], match[2], undefined);
}

function tryHTTPS(input: string): ParseResult | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  if (url.hostname !== "github.com")
    return { ok: false, error: "Not a GitHub URL" };

  const segments = url.pathname
    .split("/")
    .filter(Boolean);

  if (segments.length < 2) return { ok: false, error: "URL missing owner/repo" };

  const owner = segments[0];
  const repo = stripGitSuffix(segments[1]);

  let branch: string | undefined;
  if (segments[2] === "tree" && segments.length > 3) {
    branch = segments.slice(3).join("/");
  }

  return buildResult(owner, repo, branch);
}

function tryShorthand(input: string): ParseResult | null {
  const match = input.match(/^([^/\s]+)\/([^/\s]+)$/);
  if (!match) return null;
  return buildResult(match[1], stripGitSuffix(match[2]), undefined);
}

export function parseGitHubUrl(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: "Input is empty" };

  return (
    trySSH(trimmed) ??
    tryHTTPS(trimmed) ??
    tryShorthand(trimmed) ??
    { ok: false, error: "Unrecognized URL format" }
  );
}
