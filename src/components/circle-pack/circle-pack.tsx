"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { CircleDashed } from "@phosphor-icons/react";

import { MOCK_DATA } from "@/lib/mock-data";
import {
  buildColorContext,
  getEncodedColor,
  type ColorContext,
} from "@/lib/encoding";
import { useVisualizationStore } from "@/store/visualization-store";
import type { ColorEncoding, CommitGroup, CommitNode } from "@/types";
import { computeMatchSets } from "@/lib/search";
import {
  buildD3Hierarchy,
  findPackedNode,
  shouldShowLabel,
  type HierarchyDatum,
} from "./utils";
import { ColorLegend } from "./color-legend";
import { CircleTooltip } from "./circle-tooltip";
import { useHoverTooltip } from "./use-hover-tooltip";
import {
  computeZoomView,
  createZoomTransition,
  easeInOutCubic,
  getEffectiveRadius,
  zoomViewToTransform,
  ZOOM_DURATION_MS,
  type ZoomTransform,
  type ZoomView,
} from "./zoom";

export function CirclePack() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  const root = useVisualizationStore((s) => s.root);
  const selectedNode = useVisualizationStore((s) => s.selectedNode);
  const sizeEncoding = useVisualizationStore((s) => s.encoding.size);
  const colorEncoding = useVisualizationStore((s) => s.encoding.color);
  const setRoot = useVisualizationStore((s) => s.setRoot);
  const selectNode = useVisualizationStore((s) => s.selectNode);
  const zoomPath = useVisualizationStore((s) => s.zoomPath);
  const zoomTo = useVisualizationStore((s) => s.zoomTo);
  const zoomOut = useVisualizationStore((s) => s.zoomOut);
  const searchQuery = useVisualizationStore((s) => s.filters.searchQuery);

  const prefersReducedMotion = useReducedMotion();

  // Hover tooltip
  const { tooltip, handlers: tooltipHandlers, tooltipRef } = useHoverTooltip({
    containerRef,
    zoomPath,
  });

  // Zoom animation refs
  const currentViewRef = useRef<ZoomView | null>(null);
  const rafIdRef = useRef<number>(0);
  const animStartRef = useRef<number>(0);

  const [transform, setTransform] = useState<ZoomTransform>({
    tx: 0,
    ty: 0,
    k: 1,
  });

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
    return buildD3Hierarchy(
      root,
      sizeEncoding,
      dimensions.width,
      dimensions.height,
    );
  }, [root, sizeEncoding, dimensions.width, dimensions.height]);

  // Pre-compute color context
  const colorContext = useMemo(
    () => (root ? buildColorContext(root) : null),
    [root],
  );

  // Pre-compute search match data
  const searchData = useMemo(() => {
    if (!root || !searchQuery) return null;
    return computeMatchSets(root, searchQuery);
  }, [root, searchQuery]);

  const isSearchActive = !!searchData;

  // --- Zoom animation driven by zoomPath changes ---
  useEffect(() => {
    if (!packedRoot || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // Find the target node in the packed hierarchy
    const targetId = zoomPath.length > 0 ? zoomPath[zoomPath.length - 1] : null;
    const targetNode = targetId ? findPackedNode(packedRoot, targetId) : packedRoot;

    if (!targetNode) return;

    const targetView = computeZoomView(targetNode, width, height);

    // If no previous view, snap instantly (initial render)
    if (!currentViewRef.current) {
      currentViewRef.current = targetView;
      rafIdRef.current = requestAnimationFrame(() => {
        setTransform(zoomViewToTransform(targetView, width, height));
      });
      return () => cancelAnimationFrame(rafIdRef.current);
    }

    // Reduced motion: instant transition
    if (prefersReducedMotion) {
      cancelAnimationFrame(rafIdRef.current);
      currentViewRef.current = targetView;
      rafIdRef.current = requestAnimationFrame(() => {
        setTransform(zoomViewToTransform(targetView, width, height));
      });
      return () => cancelAnimationFrame(rafIdRef.current);
    }

    // Cancel any in-progress animation — take current interpolated position
    cancelAnimationFrame(rafIdRef.current);
    const fromView = currentViewRef.current;

    const interpolator = createZoomTransition(fromView, targetView);

    animStartRef.current = 0;
    const animate = (timestamp: number) => {
      if (!animStartRef.current) animStartRef.current = timestamp;
      const elapsed = timestamp - animStartRef.current;
      const rawT = Math.min(elapsed / ZOOM_DURATION_MS, 1);
      const t = easeInOutCubic(rawT);

      const view = interpolator(t);
      currentViewRef.current = view;
      setTransform(zoomViewToTransform(view, width, height));

      if (rawT < 1) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafIdRef.current);
  }, [zoomPath, packedRoot, dimensions, prefersReducedMotion]);

  // --- Click handlers ---

  const handleZoom = useCallback(
    (nodeId: string) => {
      tooltipHandlers.onDismiss();
      selectNode(null);
      zoomTo(nodeId);
    },
    [zoomTo, selectNode, tooltipHandlers],
  );

  const handleBackgroundClick = useCallback(() => {
    tooltipHandlers.onDismiss();
    selectNode(null);
    if (zoomPath.length > 0) {
      zoomOut();
    }
  }, [selectNode, zoomOut, zoomPath.length, tooltipHandlers]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        zoomOut();
      }
    },
    [zoomOut],
  );

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

  const focusDepth = zoomPath.length;

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {packedRoot && dimensions.width > 0 && (
        <svg
          width={dimensions.width}
          height={dimensions.height}
          onClick={handleBackgroundClick}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="cursor-default outline-none"
        >
          <defs>
            <filter id="search-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="var(--accent)" floodOpacity="0.6" />
            </filter>
          </defs>
          <g
            transform={`translate(${transform.tx},${transform.ty}) scale(${transform.k})`}
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
                  onZoom={handleZoom}
                  zoomK={transform.k}
                  focusDepth={focusDepth}
                  colorEncoding={colorEncoding}
                  colorContext={colorContext}
                  isSearchActive={isSearchActive}
                  isSearchMatch={
                    isSearchActive
                      ? d.data.isLeaf
                        ? searchData!.matchIds.has(d.data.id)
                        : searchData!.groupCounts.has(d.data.id)
                      : false
                  }
                  searchMatchCount={
                    isSearchActive && !d.data.isLeaf
                      ? searchData!.groupCounts.get(d.data.id) ?? 0
                      : 0
                  }
                  onPointerEnter={tooltipHandlers.onPointerEnter}
                  onPointerMove={tooltipHandlers.onPointerMove}
                  onPointerLeave={tooltipHandlers.onPointerLeave}
                />
              ))}
          </g>
        </svg>
      )}
      {tooltip && (
        <CircleTooltip
          tooltip={tooltip}
          tooltipRef={tooltipRef}
          containerWidth={dimensions.width}
          containerHeight={dimensions.height}
        />
      )}
      {colorContext && (
        <ColorLegend encoding={colorEncoding} context={colorContext} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CircleNode — individual circle + label
// ---------------------------------------------------------------------------

const CircleNode = React.memo(function CircleNode({
  node,
  isSelected,
  onSelect,
  onZoom,
  zoomK,
  focusDepth,
  colorEncoding,
  colorContext,
  isSearchActive,
  isSearchMatch,
  searchMatchCount,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
}: {
  node: d3.HierarchyCircularNode<HierarchyDatum>;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onZoom: (id: string) => void;
  zoomK: number;
  focusDepth: number;
  colorEncoding: ColorEncoding;
  colorContext: ColorContext | null;
  isSearchActive: boolean;
  isSearchMatch: boolean;
  searchMatchCount: number;
  onPointerEnter: (e: React.PointerEvent, node: CommitGroup | CommitNode, isLeaf: boolean) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerLeave: () => void;
}) {
  const { x, y, r } = node;
  const { isLeaf } = node.data;
  const colors = colorContext
    ? getEncodedColor(node.data, colorEncoding, colorContext)
    : { fill: "var(--muted)", stroke: "var(--muted-foreground)" };

  // Effective screen-space radius for label visibility
  const effectiveR = getEffectiveRadius(r, zoomK);
  const showLabel = shouldShowLabel(effectiveR, isLeaf);

  // Counter-scale font size so it doesn't blow up with the <g> transform
  const baseFontSize = Math.max(8, Math.min(r * 0.35, 14));
  const fontSize = baseFontSize / zoomK;

  // Depth-based opacity relative to focus level, modified by search
  let opacity = getDepthOpacity(node.depth, focusDepth, isLeaf);
  if (isSearchActive) {
    if (isSearchMatch) {
      opacity = 1;
    } else {
      opacity = 0.15;
    }
  }

  // Search-match stroke overrides
  const searchStroke = isSearchActive && isSearchMatch && isLeaf;

  // Badge dimensions (counter-scaled)
  const badgeFontSize = 10 / zoomK;
  const badgePadX = 4 / zoomK;
  const badgePadY = 2 / zoomK;
  const badgeR = 3 / zoomK;

  // Click routing: groups zoom, leaves select
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPointerLeave();
    if (isLeaf) {
      onSelect(node.data.id);
    } else {
      // Clicking the currently-focused group zooms out
      if (node.depth === focusDepth) {
        // Let background handler take care of zoom-out
        return;
      }
      onZoom(node.data.id);
    }
  };

  const handlePointerEnter = (e: React.PointerEvent) => {
    onPointerEnter(e, node.data.originalNode, isLeaf);
  };

  // Counter-scale stroke width
  const baseStrokeWidth = isSelected ? 3 : 2;
  const strokeWidth = baseStrokeWidth / zoomK;

  // Counter-scale shadow offset
  const shadowOffset = 2 / zoomK;

  return (
    <g
      onClick={handleClick}
      onPointerEnter={handlePointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="cursor-pointer"
      opacity={opacity}
    >
      {/* Hard shadow for selected node */}
      {isSelected && (
        <circle
          cx={x + shadowOffset}
          cy={y + shadowOffset}
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
        stroke={
          searchStroke
            ? "var(--accent)"
            : isSelected
              ? "var(--accent)"
              : colors.stroke
        }
        strokeWidth={searchStroke ? (3 / zoomK) : strokeWidth}
        vectorEffect="non-scaling-stroke"
        filter={searchStroke ? "url(#search-glow)" : undefined}
        style={{
          transition:
            "fill 0.4s ease, stroke 0.3s var(--ease-bounce), stroke-width 0.3s var(--ease-bounce), opacity 0.3s ease",
        }}
      />

      {/* Search match count badge on groups */}
      {isSearchActive && searchMatchCount > 0 && !isLeaf && (
        <g>
          <rect
            x={x + r * 0.5 - badgePadX}
            y={y - r * 0.85 - badgePadY - badgeFontSize}
            width={
              String(searchMatchCount).length * badgeFontSize * 0.65 +
              badgePadX * 2
            }
            height={badgeFontSize + badgePadY * 2}
            rx={badgeR}
            fill="var(--accent)"
          />
          <text
            x={
              x +
              r * 0.5 -
              badgePadX +
              (String(searchMatchCount).length * badgeFontSize * 0.65 +
                badgePadX * 2) /
                2
            }
            y={y - r * 0.85 - badgePadY - badgeFontSize + (badgeFontSize + badgePadY * 2) / 2}
            dy="0.35em"
            textAnchor="middle"
            fontSize={badgeFontSize}
            fill="var(--accent-foreground)"
            fontFamily="var(--font-heading)"
            fontWeight="bold"
            pointerEvents="none"
          >
            {searchMatchCount}
          </text>
        </g>
      )}

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
          {truncateLabel(node.data.name, effectiveR, baseFontSize)}
        </text>
      )}
    </g>
  );
});

// ---------------------------------------------------------------------------
// Depth-based opacity
// ---------------------------------------------------------------------------

function getDepthOpacity(
  nodeDepth: number,
  focusDepth: number,
  isLeaf: boolean,
): number {
  // At root level (focusDepth=0), everything at depth 1+ is fully visible
  if (focusDepth === 0) return 1;

  // Ancestor circles (above focus) — faded
  if (nodeDepth < focusDepth) return 0.15;

  // The focused container itself
  if (nodeDepth === focusDepth && !isLeaf) return 0.3;

  // Children of the focus — fully visible
  if (nodeDepth === focusDepth + 1) return 1;

  // Deeper descendants — slightly faded
  if (nodeDepth > focusDepth + 1) return 0.7;

  return 1;
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
