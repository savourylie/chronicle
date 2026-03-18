import { execFile } from "child_process";
import { mkdtemp, rm } from "fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cloneRepo } from "./clone-manager";

vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

vi.mock("fs/promises", () => ({
  mkdtemp: vi.fn(),
  rm: vi.fn(),
}));

const mockExecFile = vi.mocked(execFile);
const mockMkdtemp = vi.mocked(mkdtemp);
const mockRm = vi.mocked(rm);

function fakeExecFile(
  results: Array<{ stdout?: string; stderr?: string; error?: Error }>,
) {
  let callIndex = 0;
  mockExecFile.mockImplementation((_cmd, _args, _opts, cb?) => {
    const callback = typeof _opts === "function" ? _opts : cb;
    const result = results[callIndex++];
    const callbackFn = callback as (...args: unknown[]) => void;
    if (result?.error) {
      callbackFn(result.error);
    } else {
      callbackFn(null, {
        stdout: result?.stdout ?? "",
        stderr: result?.stderr ?? "",
      });
    }
    return {} as ReturnType<typeof execFile>;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdtemp.mockResolvedValue("/tmp/chronicle-clone-abc123" as never);
  mockRm.mockResolvedValue(undefined as never);
});

describe("cloneRepo", () => {
  it("clones a repo and returns localPath, branch, and cleanup", async () => {
    fakeExecFile([
      { stdout: "" },          // git clone
      { stdout: "main\n" },    // git rev-parse
    ]);

    const result = await cloneRepo({
      url: "https://github.com/owner/repo.git",
    });

    expect(result.localPath).toBe("/tmp/chronicle-clone-abc123");
    expect(result.branch).toBe("main");
    expect(typeof result.cleanup).toBe("function");

    // Verify clone args
    const cloneCall = mockExecFile.mock.calls[0];
    expect(cloneCall[0]).toBe("git");
    expect(cloneCall[1]).toEqual([
      "clone",
      "--filter=blob:none",
      "--single-branch",
      "https://github.com/owner/repo.git",
      "/tmp/chronicle-clone-abc123",
    ]);
  });

  it("passes --branch when branch is specified", async () => {
    fakeExecFile([
      { stdout: "" },
      { stdout: "develop\n" },
    ]);

    const result = await cloneRepo({
      url: "https://github.com/owner/repo.git",
      branch: "develop",
    });

    expect(result.branch).toBe("develop");

    const cloneCall = mockExecFile.mock.calls[0];
    expect(cloneCall[1]).toEqual([
      "clone",
      "--filter=blob:none",
      "--single-branch",
      "--branch",
      "develop",
      "https://github.com/owner/repo.git",
      "/tmp/chronicle-clone-abc123",
    ]);
  });

  it("passes timeout option to execFile", async () => {
    fakeExecFile([
      { stdout: "" },
      { stdout: "main\n" },
    ]);

    await cloneRepo({
      url: "https://github.com/owner/repo.git",
      timeoutMs: 60_000,
    });

    const cloneCall = mockExecFile.mock.calls[0];
    expect(cloneCall[2]).toEqual({ timeout: 60_000 });
  });

  it("cleanup removes the temp directory", async () => {
    fakeExecFile([
      { stdout: "" },
      { stdout: "main\n" },
    ]);

    const result = await cloneRepo({
      url: "https://github.com/owner/repo.git",
    });

    await result.cleanup();

    expect(mockRm).toHaveBeenCalledWith("/tmp/chronicle-clone-abc123", {
      recursive: true,
      force: true,
    });
  });

  it("calls onProgress with correct stages on success", async () => {
    fakeExecFile([
      { stdout: "" },
      { stdout: "main\n" },
    ]);

    const stages: string[] = [];
    await cloneRepo({
      url: "https://github.com/owner/repo.git",
      onProgress: (stage) => stages.push(stage),
    });

    expect(stages).toEqual(["cloning", "complete"]);
  });

  it("throws 'Git is not installed' for ENOENT", async () => {
    const err = Object.assign(new Error("spawn git ENOENT"), {
      code: "ENOENT",
    });
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({ url: "https://github.com/owner/repo.git" }),
    ).rejects.toThrow("Git is not installed or not found in PATH");
  });

  it("throws 'Repository not found' when stderr contains 'not found'", async () => {
    const err = Object.assign(new Error("git clone failed"), {
      stderr: "repository not found",
      code: 128,
    });
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({ url: "https://github.com/owner/nonexistent.git" }),
    ).rejects.toThrow("Repository not found: https://github.com/owner/nonexistent.git");
  });

  it("throws 'Authentication required' for private repos", async () => {
    const err = Object.assign(new Error("git clone failed"), {
      stderr: "could not read Username for 'https://github.com'",
    });
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({ url: "https://github.com/owner/private.git" }),
    ).rejects.toThrow("Authentication required (private repos not supported)");
  });

  it("throws timeout error when clone is killed", async () => {
    const err = Object.assign(new Error("Command timed out"), {
      killed: true,
    });
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({
        url: "https://github.com/owner/huge-repo.git",
        timeoutMs: 5_000,
      }),
    ).rejects.toThrow("Clone timed out after 5 seconds");
  });

  it("calls onProgress with 'error' on failure", async () => {
    const err = Object.assign(new Error("failed"), { code: "ENOENT" });
    fakeExecFile([{ error: err }]);

    const stages: string[] = [];
    await expect(
      cloneRepo({
        url: "https://github.com/owner/repo.git",
        onProgress: (stage) => stages.push(stage),
      }),
    ).rejects.toThrow();

    expect(stages).toEqual(["cloning", "error"]);
  });

  it("cleans up temp dir on error", async () => {
    const err = Object.assign(new Error("failed"), {
      stderr: "repository not found",
      code: 128,
    });
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({ url: "https://github.com/owner/repo.git" }),
    ).rejects.toThrow();

    expect(mockRm).toHaveBeenCalledWith("/tmp/chronicle-clone-abc123", {
      recursive: true,
      force: true,
    });
  });

  it("throws generic error for unknown failures", async () => {
    const err = new Error("something unexpected");
    fakeExecFile([{ error: err }]);

    await expect(
      cloneRepo({ url: "https://github.com/owner/repo.git" }),
    ).rejects.toThrow("Clone failed: something unexpected");
  });
});
