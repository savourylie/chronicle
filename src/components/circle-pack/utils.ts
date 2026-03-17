import * as d3 from "d3";

import type { CommitGroup, CommitNode, SizeEncoding } from "@/types";
import { isCommitNode, isCommitGroup } from "@/types";

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

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function getNodeColor(
  depth: number,
  isLeaf: boolean,
): { fill: string; stroke: string } {
  if (isLeaf) {
    const color = CHART_COLORS[depth % CHART_COLORS.length];
    return { fill: color, stroke: color };
  }

  // Group circles — translucent fills based on depth
  switch (depth) {
    case 1:
      return {
        fill: "color-mix(in srgb, var(--primary) 8%, transparent)",
        stroke: "var(--primary)",
      };
    case 2:
      return {
        fill: "color-mix(in srgb, var(--secondary) 8%, transparent)",
        stroke: "var(--secondary)",
      };
    default:
      return {
        fill: "color-mix(in srgb, var(--tertiary) 8%, transparent)",
        stroke: "var(--tertiary)",
      };
  }
}

export function shouldShowLabel(radius: number, isLeaf: boolean): boolean {
  return isLeaf ? radius > 20 : radius > 30;
}
