import { describe, expect, it } from "vitest";
import { parseGitHubUrl } from "./url-utils";

describe("parseGitHubUrl", () => {
  describe("HTTPS URLs", () => {
    it("parses plain HTTPS URL", () => {
      const result = parseGitHubUrl("https://github.com/facebook/react");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "facebook",
          repo: "react",
          branch: undefined,
          cloneUrl: "https://github.com/facebook/react.git",
        },
      });
    });

    it("parses HTTPS URL with .git suffix", () => {
      const result = parseGitHubUrl("https://github.com/facebook/react.git");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "facebook",
          repo: "react",
          branch: undefined,
          cloneUrl: "https://github.com/facebook/react.git",
        },
      });
    });

    it("parses HTTPS URL with branch", () => {
      const result = parseGitHubUrl(
        "https://github.com/facebook/react/tree/main",
      );
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "facebook",
          repo: "react",
          branch: "main",
          cloneUrl: "https://github.com/facebook/react.git",
        },
      });
    });

    it("parses branch with slashes", () => {
      const result = parseGitHubUrl(
        "https://github.com/owner/repo/tree/feature/foo/bar",
      );
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "owner",
          repo: "repo",
          branch: "feature/foo/bar",
          cloneUrl: "https://github.com/owner/repo.git",
        },
      });
    });

    it("handles trailing slash", () => {
      const result = parseGitHubUrl("https://github.com/owner/repo/");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "owner",
          repo: "repo",
          branch: undefined,
          cloneUrl: "https://github.com/owner/repo.git",
        },
      });
    });
  });

  describe("SSH URLs", () => {
    it("parses SSH URL with .git suffix", () => {
      const result = parseGitHubUrl("git@github.com:owner/repo.git");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "owner",
          repo: "repo",
          branch: undefined,
          cloneUrl: "https://github.com/owner/repo.git",
        },
      });
    });

    it("parses SSH URL without .git suffix", () => {
      const result = parseGitHubUrl("git@github.com:owner/repo");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "owner",
          repo: "repo",
          branch: undefined,
          cloneUrl: "https://github.com/owner/repo.git",
        },
      });
    });
  });

  describe("shorthand format", () => {
    it("parses owner/repo shorthand", () => {
      const result = parseGitHubUrl("facebook/react");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "facebook",
          repo: "react",
          branch: undefined,
          cloneUrl: "https://github.com/facebook/react.git",
        },
      });
    });

    it("strips .git from shorthand", () => {
      const result = parseGitHubUrl("owner/repo.git");
      expect(result).toEqual({
        ok: true,
        data: {
          owner: "owner",
          repo: "repo",
          branch: undefined,
          cloneUrl: "https://github.com/owner/repo.git",
        },
      });
    });
  });

  describe("owner/repo name validation", () => {
    it("allows dots, underscores, hyphens", () => {
      const result = parseGitHubUrl("my-org/my_repo.js");
      expect(result.ok).toBe(true);
    });

    it("rejects invalid characters in owner", () => {
      const result = parseGitHubUrl("my org/repo");
      expect(result.ok).toBe(false);
    });

    it("rejects invalid characters in repo", () => {
      const result = parseGitHubUrl(
        "https://github.com/owner/repo name",
      );
      expect(result.ok).toBe(false);
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty string", () => {
      const result = parseGitHubUrl("");
      expect(result).toEqual({ ok: false, error: "Input is empty" });
    });

    it("rejects whitespace-only string", () => {
      const result = parseGitHubUrl("   ");
      expect(result).toEqual({ ok: false, error: "Input is empty" });
    });

    it("rejects non-GitHub host", () => {
      const result = parseGitHubUrl("https://gitlab.com/owner/repo");
      expect(result).toEqual({ ok: false, error: "Not a GitHub URL" });
    });

    it("rejects URL with only owner", () => {
      const result = parseGitHubUrl("https://github.com/owner");
      expect(result).toEqual({
        ok: false,
        error: "URL missing owner/repo",
      });
    });

    it("rejects random string", () => {
      const result = parseGitHubUrl("not-a-url-at-all");
      expect(result).toEqual({
        ok: false,
        error: "Unrecognized URL format",
      });
    });
  });

  describe("edge cases", () => {
    it("trims whitespace", () => {
      const result = parseGitHubUrl("  facebook/react  ");
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.owner).toBe("facebook");
    });

    it("handles mixed case", () => {
      const result = parseGitHubUrl("https://github.com/Facebook/React");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.owner).toBe("Facebook");
        expect(result.data.repo).toBe("React");
      }
    });

    it("ignores extra path segments beyond tree", () => {
      const result = parseGitHubUrl(
        "https://github.com/owner/repo/blob/main/README.md",
      );
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.data.branch).toBeUndefined();
    });
  });
});
