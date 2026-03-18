import * as d3 from "d3";

import type { CommitGroup, CommitNode, SizeEncoding } from "@/types";
import { isCommitNode } from "@/types";

// ---------------------------------------------------------------------------
// HierarchyDatum — the shape D3 works with
// ---------------------------------------------------------------------------

export interface HierarchyDatum {
  id: string;
  name: string;
  isLeaf: boolean;
  originalNode: CommitGroup | CommitNode;
  children?: HierarchyDatum[];
  value?: number;
}

// ---------------------------------------------------------------------------
// Tree conversion
// ---------------------------------------------------------------------------

function toDatum(
  node: CommitGroup | CommitNode,
  sizeEncoding: SizeEncoding,
): HierarchyDatum {
  if (isCommitNode(node)) {
    let value: number;
    switch (sizeEncoding) {
      case "linesChanged":
        value = Math.max(1, node.insertions + node.deletions);
        break;
      case "fileCount":
        value = Math.max(1, node.filesChanged.length);
        break;
      case "commitCount":
        value = 1;
        break;
    }
    return {
      id: node.hash,
      name: node.shortHash,
      isLeaf: true,
      originalNode: node,
      value,
    };
  }

  return {
    id: node.id,
    name: node.name,
    isLeaf: false,
    originalNode: node,
    children: node.children.map((child) => toDatum(child, sizeEncoding)),
  };
}

// ---------------------------------------------------------------------------
// buildD3Hierarchy
// ---------------------------------------------------------------------------

export function buildD3Hierarchy(
  root: CommitGroup,
  sizeEncoding: SizeEncoding,
  width: number,
  height: number,
) {
  const datum = toDatum(root, sizeEncoding);

  const hierarchy = d3
    .hierarchy(datum)
    .sum((d) => d.value ?? 0)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const pack = d3
    .pack<HierarchyDatum>()
    .size([width, height])
    .padding((d) => {
      if (d.depth <= 1) return 12;
      if (d.depth === 2) return 6;
      return 3;
    });

  return pack(hierarchy);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getNodeId(node: CommitGroup | CommitNode): string {
  return isCommitNode(node) ? node.hash : node.id;
}

export function shouldShowLabel(radius: number, isLeaf: boolean): boolean {
  return isLeaf ? radius > 20 : radius > 30;
}

/** DFS lookup in a packed D3 hierarchy by datum id. */
export function findPackedNode(
  root: d3.HierarchyCircularNode<HierarchyDatum>,
  id: string,
): d3.HierarchyCircularNode<HierarchyDatum> | null {
  if (root.data.id === id) return root;
  if (root.children) {
    for (const child of root.children) {
      const found = findPackedNode(child, id);
      if (found) return found;
    }
  }
  return null;
}
