"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CircleDashed } from "@phosphor-icons/react";

import { MOCK_DATA } from "@/lib/mock-data";
import { useVisualizationStore } from "@/store/visualization-store";
import {
  buildD3Hierarchy,
  getNodeColor,
  shouldShowLabel,
  type HierarchyDatum,
} from "./utils";

export function CirclePack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const root = useVisualizationStore((s) => s.root);
  const selectedNode = useVisualizationStore((s) => s.selectedNode);
  const sizeEncoding = useVisualizationStore((s) => s.encoding.size);
  const setRoot = useVisualizationStore((s) => s.setRoot);
  const selectNode = useVisualizationStore((s) => s.selectNode);

  // Seed mock data on mount if store is empty
  useEffect(() => {
    if (!root) setRoot(MOCK_DATA);
  }, [root, setRoot]);

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

  // Compute D3 pack layout
  const packedRoot = useMemo(() => {
    if (!root || dimensions.width === 0 || dimensions.height === 0) return null;
    return buildD3Hierarchy(root, sizeEncoding, dimensions.width, dimensions.height);
  }, [root, sizeEncoding, dimensions.width, dimensions.height]);

  // --- Empty / loading states ---

  if (!root) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p className="animate-pulse font-heading text-muted-foreground">
          Loading visualization…
        </p>
      </div>
    );
  }

  if (root.children.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <CircleDashed size={48} />
        <p className="font-heading">No commits to visualize</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full">
      {packedRoot && dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onClick={() => selectNode(null)}
          className="cursor-default"
        >
          {packedRoot
            .descendants()
            .filter((d) => d.depth > 0)
            .map((d) => (
              <CircleNode
                key={d.data.id}
                node={d}
                isSelected={d.data.id === selectedNode}
                onSelect={selectNode}
              />
            ))}
        </svg>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CircleNode — individual circle + label
// ---------------------------------------------------------------------------

function CircleNode({
  node,
  isSelected,
  onSelect,
}: {
  node: d3.HierarchyCircularNode<HierarchyDatum>;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}) {
  const { x, y, r } = node;
  const { isLeaf } = node.data;
  const colors = getNodeColor(node.depth, isLeaf);
  const showLabel = shouldShowLabel(r, isLeaf);
  const fontSize = Math.max(8, Math.min(r * 0.35, 14));

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.data.id);
      }}
      className="cursor-pointer"
    >
      {/* Hard shadow for selected node */}
      {isSelected && (
        <circle
          cx={x + 2}
          cy={y + 2}
          r={r}
          fill="var(--foreground)"
          opacity={0.15}
        />
      )}

      <circle
        cx={x}
        cy={y}
        r={r}
        fill={colors.fill}
        stroke={isSelected ? "var(--accent)" : colors.stroke}
        strokeWidth={isSelected ? 3 : 2}
        style={{
          transition:
            "stroke 0.3s var(--ease-bounce), stroke-width 0.3s var(--ease-bounce)",
        }}
      />

      {showLabel && (
        <text
          x={x}
          y={y}
          dy="0.35em"
          textAnchor="middle"
          fontSize={fontSize}
          fill="var(--foreground)"
          fontFamily={isLeaf ? "var(--font-mono)" : "var(--font-heading)"}
          pointerEvents="none"
        >
          {truncateLabel(node.data.name, r, fontSize)}
        </text>
      )}
    </g>
  );
}

// ---------------------------------------------------------------------------
// Label truncation
// ---------------------------------------------------------------------------

function truncateLabel(
  text: string,
  radius: number,
  fontSize: number,
): string {
  // Rough estimate: each character ~0.6em wide
  const maxChars = Math.floor((radius * 2 * 0.8) / (fontSize * 0.6));
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(1, maxChars - 1)) + "…";
}
