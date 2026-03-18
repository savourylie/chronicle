import { useLayoutEffect, useState } from "react";

import type { CommitGroup, CommitNode } from "@/types";
import { isCommitNode } from "@/types";

import type { TooltipState } from "./use-hover-tooltip";

interface CircleTooltipProps {
  tooltip: TooltipState;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
  containerWidth: number;
  containerHeight: number;
}

const OFFSET_X = 12;
const OFFSET_Y = -8;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

function truncateMessage(msg: string, max = 80): string {
  if (msg.length <= max) return msg;
  return msg.slice(0, max - 1) + "…";
}

export function CircleTooltip({
  tooltip,
  tooltipRef,
  containerWidth,
  containerHeight,
}: CircleTooltipProps) {
  const [layout, setLayout] = useState<{ left: number; top: number; ready: boolean }>({
    left: 0,
    top: 0,
    ready: false,
  });

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    let left = tooltip.x + OFFSET_X;
    let top = tooltip.y + OFFSET_Y;

    // Flip horizontally if overflowing right
    if (left + rect.width > containerWidth) {
      left = tooltip.x - rect.width - OFFSET_X;
    }
    // Flip vertically if overflowing bottom
    if (top + rect.height > containerHeight) {
      top = tooltip.y - rect.height - OFFSET_Y;
    }
    // Clamp to container edges
    left = Math.max(4, Math.min(left, containerWidth - rect.width - 4));
    top = Math.max(4, Math.min(top, containerHeight - rect.height - 4));

    setLayout({ left, top, ready: true });
  }, [tooltip.x, tooltip.y, tooltip.node, tooltipRef, containerWidth, containerHeight]);

  const node = tooltip.node;

  return (
    <div
      ref={tooltipRef}
      className="tooltip-enter pointer-events-none absolute z-50 max-w-[280px] rounded-[var(--radius-md)] border-2 border-border bg-card p-3"
      style={{
        left: layout.left,
        top: layout.top,
        boxShadow: "var(--shadow-hard)",
        opacity: layout.ready ? 1 : 0,
      }}
    >
      {isCommitNode(node) ? (
        <LeafContent node={node} />
      ) : (
        <GroupContent node={node} />
      )}
    </div>
  );
}

function LeafContent({ node }: { node: CommitNode }) {
  const totalChanges = node.insertions + node.deletions;

  return (
    <div className="flex flex-col gap-1.5">
      <code className="font-mono text-xs font-semibold text-accent">
        {node.shortHash}
      </code>
      <p className="text-sm leading-snug text-foreground">
        {truncateMessage(node.message)}
      </p>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span>{node.author.name}</span>
        <span>{formatDate(node.date)}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">
          {node.filesChanged.length} file{node.filesChanged.length !== 1 ? "s" : ""}
        </span>
        {totalChanges > 0 && (
          <>
            <span className="font-mono text-diff-add">+{node.insertions}</span>
            <span className="font-mono text-diff-remove">-{node.deletions}</span>
          </>
        )}
      </div>
    </div>
  );
}

function GroupContent({ node }: { node: CommitGroup }) {
  const { metadata } = node;
  const [startDate, endDate] = metadata.dateRange;
  const topAuthors = metadata.authors.slice(0, 3);

  return (
    <div className="flex flex-col gap-1.5">
      <p className="font-heading text-sm font-semibold text-foreground">
        {node.name}
      </p>
      <span className="w-fit rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
        {node.groupingStrategy}
      </span>
      <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
        <span>
          {metadata.commitCount} commit{metadata.commitCount !== 1 ? "s" : ""}
        </span>
        <span>
          {formatDate(startDate)} – {formatDate(endDate)}
        </span>
      </div>
      {topAuthors.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {topAuthors.map((author) => (
            <span
              key={author}
              className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
            >
              {author}
            </span>
          ))}
          {metadata.authors.length > 3 && (
            <span className="px-1 text-xs text-muted-foreground">
              +{metadata.authors.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
