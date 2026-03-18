import type { CommitGroup } from "@/types";
import { parseGitLog, type GitParserOptions } from "./git-parser";
import { enrichCommits } from "./conventional-parser";
import { buildHierarchy } from "./hierarchy-builder";

export interface PipelineResult {
  root: CommitGroup;
  meta: { commitCount: number; pipelineMs: number };
}

/**
 * Run the full analysis pipeline: git log → enrich → hierarchy.
 */
export async function analyzePipeline(
  options: GitParserOptions,
): Promise<PipelineResult> {
  const start = performance.now();

  const commits = await parseGitLog(options);
  const { commits: enriched } = enrichCommits(commits);
  const { root } = buildHierarchy(enriched);

  return {
    root,
    meta: {
      commitCount: commits.length,
      pipelineMs: Math.round(performance.now() - start),
    },
  };
}
