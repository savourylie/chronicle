import * as d3 from "d3";

import type { CommitGroup, CommitNode, ColorEncoding } from "@/types";
import { isCommitNode } from "@/types";
import type { HierarchyDatum } from "@/components/circle-pack/utils";

// ---------------------------------------------------------------------------
// Color context — pre-computed data for encoding strategies
// ---------------------------------------------------------------------------

export interface GroupAggregates {
  dominantType: string;
  dominantAuthor: string;
  avgDate: number;
  avgChurn: number;
}

export interface ColorContext {
  dateRange: [number, number];
  authors: string[];
  fileChurnMap: Map<string, number>;
  maxChurn: number;
  groupAggregates: WeakMap<CommitGroup, GroupAggregates>;
  recencyScale: d3.ScaleSequential<string>;
  churnScale: d3.ScaleSequential<string>;
}

// ---------------------------------------------------------------------------
// Type color map (CSS variables for dark-mode compat)
// ---------------------------------------------------------------------------

export const TYPE_COLOR_MAP: Record<string, string> = {
  feat: "var(--primary)",
  fix: "var(--secondary)",
  refactor: "var(--tertiary)",
  docs: "var(--quaternary)",
  other: "var(--muted-foreground)",
};

// ---------------------------------------------------------------------------
// Author hashing — djb2 into d3.schemeTableau10
// ---------------------------------------------------------------------------

export function hashAuthorColor(name: string): string {
  let hash = 5381;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  const idx = Math.abs(hash) % d3.schemeTableau10.length;
  return d3.schemeTableau10[idx];
}

// ---------------------------------------------------------------------------
// buildColorContext — single O(n) recursive walk
// ---------------------------------------------------------------------------

export function buildColorContext(root: CommitGroup): ColorContext {
  const authorSet = new Set<string>();
  const fileChurnMap = new Map<string, number>();
  const groupAggregates = new WeakMap<CommitGroup, GroupAggregates>();
  let minDate = Infinity;
  let maxDate = -Infinity;
  let maxChurn = 0;

  function walkLeaves(node: CommitGroup | CommitNode): CommitNode[] {
    if (isCommitNode(node)) {
      const ts = new Date(node.date).getTime();
      if (ts < minDate) minDate = ts;
      if (ts > maxDate) maxDate = ts;
      authorSet.add(node.author.name);
      for (const file of node.filesChanged) {
        const count = (fileChurnMap.get(file) ?? 0) + 1;
        fileChurnMap.set(file, count);
        if (count > maxChurn) maxChurn = count;
      }
      return [node];
    }

    const allLeaves: CommitNode[] = [];
    for (const child of node.children) {
      allLeaves.push(...walkLeaves(child));
    }

    // Compute group aggregates
    if (allLeaves.length > 0) {
      const typeCounts = new Map<string, number>();
      const authorCounts = new Map<string, number>();
      let dateSum = 0;
      let churnSum = 0;

      for (const leaf of allLeaves) {
        const t = leaf.type ?? "other";
        typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
        authorCounts.set(
          leaf.author.name,
          (authorCounts.get(leaf.author.name) ?? 0) + 1,
        );
        dateSum += new Date(leaf.date).getTime();

        // Average churn for this commit's files
        let leafChurn = 0;
        for (const file of leaf.filesChanged) {
          leafChurn += fileChurnMap.get(file) ?? 0;
        }
        churnSum +=
          leaf.filesChanged.length > 0
            ? leafChurn / leaf.filesChanged.length
            : 0;
      }

      groupAggregates.set(node, {
        dominantType: maxByCount(typeCounts),
        dominantAuthor: maxByCount(authorCounts),
        avgDate: dateSum / allLeaves.length,
        avgChurn: churnSum / allLeaves.length,
      });
    }

    return allLeaves;
  }

  walkLeaves(root);

  // Guard: single commit → equal range
  if (minDate === maxDate) {
    minDate -= 1;
    maxDate += 1;
  }
  if (maxChurn === 0) maxChurn = 1;

  return {
    dateRange: [minDate, maxDate],
    authors: Array.from(authorSet),
    fileChurnMap,
    maxChurn,
    groupAggregates,
    recencyScale: d3.scaleSequential(d3.interpolateCool).domain([minDate, maxDate]),
    churnScale: d3.scaleSequential(d3.interpolateReds).domain([0, maxChurn]),
  };
}

// ---------------------------------------------------------------------------
// getEncodedColor — main dispatch
// ---------------------------------------------------------------------------

export function getEncodedColor(
  datum: HierarchyDatum,
  encoding: ColorEncoding,
  ctx: ColorContext,
): { fill: string; stroke: string } {
  if (datum.isLeaf) {
    const commit = datum.originalNode as CommitNode;
    return leafColor(commit, encoding, ctx);
  }

  const group = datum.originalNode as CommitGroup;
  const agg = ctx.groupAggregates.get(group);
  if (!agg) {
    return {
      fill: "color-mix(in srgb, var(--muted-foreground) 8%, transparent)",
      stroke: "var(--muted-foreground)",
    };
  }

  const raw = groupRawColor(agg, encoding, ctx);
  return {
    fill: `color-mix(in srgb, ${raw} 8%, transparent)`,
    stroke: raw,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function leafColor(
  commit: CommitNode,
  encoding: ColorEncoding,
  ctx: ColorContext,
): { fill: string; stroke: string } {
  switch (encoding) {
    case "type": {
      const color = TYPE_COLOR_MAP[commit.type ?? "other"] ?? TYPE_COLOR_MAP.other;
      return { fill: color, stroke: color };
    }
    case "author": {
      const color = hashAuthorColor(commit.author.name);
      return { fill: color, stroke: color };
    }
    case "recency": {
      const color = ctx.recencyScale(new Date(commit.date).getTime());
      return { fill: color, stroke: color };
    }
    case "churn": {
      let avgChurn = 0;
      if (commit.filesChanged.length > 0) {
        let total = 0;
        for (const file of commit.filesChanged) {
          total += ctx.fileChurnMap.get(file) ?? 0;
        }
        avgChurn = total / commit.filesChanged.length;
      }
      const color = ctx.churnScale(avgChurn);
      return { fill: color, stroke: color };
    }
  }
}

function groupRawColor(
  agg: GroupAggregates,
  encoding: ColorEncoding,
  ctx: ColorContext,
): string {
  switch (encoding) {
    case "type":
      return TYPE_COLOR_MAP[agg.dominantType] ?? TYPE_COLOR_MAP.other;
    case "author":
      return hashAuthorColor(agg.dominantAuthor);
    case "recency":
      return ctx.recencyScale(agg.avgDate);
    case "churn":
      return ctx.churnScale(agg.avgChurn);
  }
}

function maxByCount(map: Map<string, number>): string {
  let best = "";
  let bestCount = 0;
  for (const [key, count] of map) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
