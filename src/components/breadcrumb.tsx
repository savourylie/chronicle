"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CaretRight } from "@phosphor-icons/react";

import { useVisualizationStore } from "@/store/visualization-store";
import type { CommitGroup } from "@/types";
import { isCommitGroup } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Segment {
  id: string;
  name: string;
}

/** Walk the tree along zoomPath, returning resolved { id, name } segments. */
function resolveZoomPath(root: CommitGroup, zoomPath: string[]): Segment[] {
  const segments: Segment[] = [];
  let current: CommitGroup = root;

  for (const id of zoomPath) {
    const child = current.children.find(
      (c) => isCommitGroup(c) && c.id === id
    );
    if (!child || !isCommitGroup(child)) break; // stale path — stop early
    segments.push({ id: child.id, name: child.name });
    current = child;
  }

  return segments;
}

/** Collapse middle segments to "…" when path is too long. */
function truncateSegments(
  segments: Segment[],
  maxVisible: number
): (Segment | { id: "…"; name: "…" })[] {
  // +1 for the root "All" segment which is rendered separately
  const total = segments.length + 1;
  if (total <= maxVisible || segments.length <= 1) return segments;

  // Always keep first and last segment; collapse middle
  const keepEnd = 1;
  const keepStart = Math.max(maxVisible - 1 - keepEnd, 0); // -1 for root "All"
  return [
    ...segments.slice(0, keepStart),
    { id: "…", name: "…" },
    ...segments.slice(segments.length - keepEnd),
  ];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const bounceEasing = [0.34, 1.56, 0.64, 1] as const;

export function Breadcrumb() {
  const root = useVisualizationStore((s) => s.root);
  const zoomPath = useVisualizationStore((s) => s.zoomPath);
  const zoomTo = useVisualizationStore((s) => s.zoomTo);
  const zoomToRoot = useVisualizationStore((s) => s.zoomToRoot);
  const prefersReducedMotion = useReducedMotion();

  const containerRef = useRef<HTMLElement>(null);
  const [maxVisible, setMaxVisible] = useState(10);

  // Recalculate maxVisible based on container width
  const updateMaxVisible = useCallback(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth;
    // ~120px per pill + separator, minimum 2 (root + current)
    setMaxVisible(Math.max(2, Math.floor(width / 120)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateMaxVisible();
    const observer = new ResizeObserver(updateMaxVisible);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateMaxVisible]);

  const segments = useMemo(
    () => (root ? resolveZoomPath(root, zoomPath) : []),
    [root, zoomPath]
  );

  const displaySegments = useMemo(
    () => truncateSegments(segments, maxVisible),
    [segments, maxVisible]
  );

  if (!root) return null;

  const isAtRoot = segments.length === 0;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.85 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.85 },
        transition: { duration: 0.2, ease: bounceEasing },
      };

  return (
    <nav ref={containerRef} aria-label="Zoom path" className="px-4 py-2">
      <ol className="flex items-center gap-1 flex-wrap">
        <AnimatePresence mode="popLayout">
          {/* Root segment */}
          <motion.li key="root" layout {...motionProps}>
            {isAtRoot ? (
              <span
                className="inline-block rounded-full bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground"
                aria-current="location"
              >
                All
              </span>
            ) : (
              <button
                type="button"
                onClick={zoomToRoot}
                className="inline-block rounded-full bg-muted px-2.5 py-1 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
              >
                All
              </button>
            )}
          </motion.li>

          {/* Path segments */}
          {displaySegments.map((segment, i) => {
            const isLast =
              i === displaySegments.length - 1 && segment.id !== "…";
            const isEllipsis = segment.id === "…";

            return (
              <motion.li
                key={segment.id}
                layout
                className="flex items-center gap-1"
                {...motionProps}
              >
                <CaretRight
                  size={14}
                  className="text-muted-foreground shrink-0"
                  aria-hidden
                />
                {isEllipsis ? (
                  <span className="inline-block rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground">
                    …
                  </span>
                ) : isLast ? (
                  <span
                    className="inline-block max-w-[150px] truncate rounded-full bg-accent px-2.5 py-1 text-sm font-medium text-accent-foreground"
                    aria-current="location"
                  >
                    {segment.name}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => zoomTo(segment.id)}
                    className="inline-block max-w-[150px] truncate rounded-full bg-muted px-2.5 py-1 text-sm font-medium hover:bg-border transition-colors cursor-pointer"
                  >
                    {segment.name}
                  </button>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </nav>
  );
}
