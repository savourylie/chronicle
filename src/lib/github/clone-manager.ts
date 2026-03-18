import { execFile } from "child_process";
import fs from "fs";
import { mkdtemp, rm } from "fs/promises";
import os from "os";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface CloneOptions {
  /** HTTPS clone URL (from url-utils.ts GitHubRepoInfo.cloneUrl) */
  url: string;
  /** Optional branch to clone */
  branch?: string;
  /** Clone timeout in ms (default: 120_000) */
  timeoutMs?: number;
  /** Progress callback */
  onProgress?: (stage: "cloning" | "complete" | "error") => void;
}

export interface CloneResult {
  /** Absolute path to cloned repo */
  localPath: string;
  /** Branch that was cloned */
  branch: string;
  /** Removes the temp directory */
  cleanup: () => Promise<void>;
}

/**
 * Clone a GitHub repository into a temp directory.
 *
 * Uses `--filter=blob:none --single-branch` for a fast, shallow-ish clone.
 * Returns the local path and a cleanup function to remove it.
 */
export async function cloneRepo(options: CloneOptions): Promise<CloneResult> {
  const { url, branch, timeoutMs = 120_000, onProgress } = options;

  const tempDir = await mkdtemp(
    path.join(os.tmpdir(), "chronicle-clone-"),
  );

  const args = ["clone", "--filter=blob:none", "--single-branch"];
  if (branch) args.push("--branch", branch);
  args.push(url, tempDir);

  const cleanup = async () => {
    await rm(tempDir, { recursive: true, force: true });
  };

  // Safety net: clean up on process exit
  const exitHandler = () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  };
  process.on("exit", exitHandler);

  try {
    onProgress?.("cloning");

    await execFileAsync("git", args, { timeout: timeoutMs });

    const { stdout } = await execFileAsync(
      "git",
      ["-C", tempDir, "rev-parse", "--abbrev-ref", "HEAD"],
    );

    const detectedBranch = stdout.trim();

    onProgress?.("complete");

    return {
      localPath: tempDir,
      branch: detectedBranch,
      cleanup: async () => {
        process.removeListener("exit", exitHandler);
        await cleanup();
      },
    };
  } catch (error: unknown) {
    onProgress?.("error");
    await cleanup();
    process.removeListener("exit", exitHandler);

    if (!(error instanceof Error)) throw error;

    const msg = error.message || "";
    const stderr =
      (error as NodeJS.ErrnoException & { stderr?: string }).stderr || "";
    const combined = `${msg}\n${stderr}`;

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error("Git is not installed or not found in PATH");
    }

    if (
      (error as { killed?: boolean }).killed ||
      combined.includes("timed out")
    ) {
      const secs = Math.round(timeoutMs / 1000);
      throw new Error(`Clone timed out after ${secs} seconds`);
    }

    if (combined.includes("could not read Username")) {
      throw new Error(
        "Authentication required (private repos not supported)",
      );
    }

    if (
      combined.includes("not found") ||
      (error as { code?: unknown }).code === 128
    ) {
      throw new Error(`Repository not found: ${url}`);
    }

    throw new Error(`Clone failed: ${msg}`);
  }
}
