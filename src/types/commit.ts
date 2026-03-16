export interface CommitNode {
  hash: string;
  shortHash: string;
  message: string;
  author: { name: string; email: string };
  date: string; // ISO 8601
  filesChanged: string[];
  insertions: number;
  deletions: number;
  type?: string;
  scope?: string;
  parentHashes: string[];
  prNumber?: number;
  prTitle?: string;
}
