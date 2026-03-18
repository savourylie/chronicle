"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useVisualizationStore } from "@/store/visualization-store";
import type { CommitGroup, CommitNode } from "@/types";
import { isCommitNode } from "@/types";
import { DensityChart } from "./density-chart";

function collectCommitDates(
  node: CommitGroup | CommitNode,
  out: Date[],
): void {
  if (isCommitNode(node)) {
    out.push(new Date(node.date));
    return;
  }
  for (const child of node.children) {
    collectCommitDates(child, out);
  }
}

function findGroupById(
  node: CommitGroup | CommitNode,
  id: string,
): CommitGroup | null {
  if (isCommitNode(node)) return null;
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findGroupById(child, id);
    if (found) return found;
  }
  return null;
}

export function TimelineMinimap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const root = useVisualizationStore((s) => s.root);
  const zoomPath = useVisualizationStore((s) => s.zoomPath);
  const dateRange = useVisualizationStore((s) => s.filters.dateRange);
  const setFilter = useVisualizationStore((s) => s.setFilter);

  // Track container size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Collect all commit dates from the tree
  const allDates = useMemo(() => {
    if (!root) return [];
    const dates: Date[] = [];
    collectCommitDates(root, dates);
    return dates;
  }, [root]);

  // Compute focused group's date range from zoomPath
  const focusDateRange = useMemo<[Date, Date] | null>(() => {
    if (!root || zoomPath.length === 0) return null;
    const focusId = zoomPath[zoomPath.length - 1];
    const group = findGroupById(root, focusId);
    if (!group) return null;
    return [
      new Date(group.metadata.dateRange[0]),
      new Date(group.metadata.dateRange[1]),
    ];
  }, [root, zoomPath]);

  // Convert store dateRange ISO strings to Date objects
  const brushDateRange = useMemo<[Date, Date] | null>(() => {
    if (!dateRange) return null;
    return [new Date(dateRange[0]), new Date(dateRange[1])];
  }, [dateRange]);

  const handleBrushChange = (range: [string, string] | undefined) => {
    setFilter("dateRange", range);
  };

  if (allDates.length === 0) return <div ref={containerRef} className="h-full w-full" />;

  return (
    <div ref={containerRef} className="h-full w-full">
      {dimensions.width > 0 && dimensions.height > 0 && (
        <DensityChart
          dates={allDates}
          width={dimensions.width}
          height={dimensions.height}
          focusDateRange={focusDateRange}
          brushDateRange={brushDateRange}
          onBrushChange={handleBrushChange}
        />
      )}
    </div>
  );
}
