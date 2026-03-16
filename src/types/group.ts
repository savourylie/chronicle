import type { CommitNode } from "./commit";

export type GroupingStrategy =
  | "conventional-commit"
  | "file-path"
  | "time-session"
  | "manual";

export interface CommitGroupMetadata {
  dateRange: [string, string]; // ISO 8601
  commitCount: number;
  authors: string[];
  topFiles: string[];
  totalInsertions: number;
  totalDeletions: number;
}

export interface CommitGroup {
  id: string;
  name: string;
  level: 0 | 1 | 2; // 0=epoch, 1=chapter, 2=scene
  groupingStrategy: GroupingStrategy;
  children: (CommitGroup | CommitNode)[];
  metadata: CommitGroupMetadata;
}

export function isCommitNode(
  node: CommitGroup | CommitNode
): node is CommitNode {
  return "hash" in node;
}

export function isCommitGroup(
  node: CommitGroup | CommitNode
): node is CommitGroup {
  return !("hash" in node);
}
