import type { CommitGroup, CommitNode } from "@/types";
import { isCommitNode } from "@/types";

/** Check if a single commit node matches a search query (case-insensitive). */
export function matchesQuery(node: CommitNode, query: string): boolean {
  const q = query.toLowerCase();
  return (
    node.message.toLowerCase().includes(q) ||
    node.author.name.toLowerCase().includes(q) ||
    node.filesChanged.some((f) => f.toLowerCase().includes(q))
  );
}

/** Collect all matching CommitNodes from the tree. */
export function collectSearchMatches(
  root: CommitGroup,
  query: string,
): CommitNode[] {
  if (!query) return [];
  const results: CommitNode[] = [];

  function walk(node: CommitGroup | CommitNode) {
    if (isCommitNode(node)) {
      if (matchesQuery(node, query)) results.push(node);
    } else {
      for (const child of node.children) walk(child);
    }
  }

  walk(root);
  return results;
}

/**
 * Compute match sets for highlight/dim in the visualization.
 * Single O(n) traversal returns:
 * - matchIds: set of commit hashes that match
 * - groupCounts: map of group ID → number of descendant matches
 */
export function computeMatchSets(
  root: CommitGroup,
  query: string,
): { matchIds: Set<string>; groupCounts: Map<string, number> } {
  const matchIds = new Set<string>();
  const groupCounts = new Map<string, number>();

  if (!query) return { matchIds, groupCounts };

  function walk(node: CommitGroup | CommitNode): number {
    if (isCommitNode(node)) {
      if (matchesQuery(node, query)) {
        matchIds.add(node.hash);
        return 1;
      }
      return 0;
    }

    let count = 0;
    for (const child of node.children) {
      count += walk(child);
    }
    if (count > 0) {
      groupCounts.set(node.id, count);
    }
    return count;
  }

  walk(root);
  return { matchIds, groupCounts };
}
