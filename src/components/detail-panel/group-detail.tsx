"use client";

import {
  FolderOpen,
  Users,
  Files,
  ArrowRight,
} from "@phosphor-icons/react";

import type { CommitGroup } from "@/types";
import { isCommitGroup } from "@/types";

const LEVEL_LABELS: Record<number, string> = {
  0: "Epoch",
  1: "Chapter",
  2: "Scene",
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

export function GroupDetail({
  node,
  onZoom,
}: {
  node: CommitGroup;
  onZoom: (id: string) => void;
}) {
  const { metadata } = node;
  const [startDate, endDate] = metadata.dateRange;
  const subGroups = node.children.filter(isCommitGroup);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-border py-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {node.name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {LEVEL_LABELS[node.level] ?? `Level ${node.level}`}
          </span>
          <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {node.groupingStrategy}
          </span>
        </div>
      </div>

      {/* Date range */}
      <div className="border-b border-border py-4 text-sm text-muted-foreground">
        {formatDate(startDate)} – {formatDate(endDate)}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 border-b border-border py-4 text-sm">
        <span className="text-muted-foreground">
          {metadata.commitCount} commit{metadata.commitCount !== 1 ? "s" : ""}
        </span>
        <span className="font-mono text-green-600">+{metadata.totalInsertions}</span>
        <span className="font-mono text-red-500">-{metadata.totalDeletions}</span>
      </div>

      {/* Contributors */}
      {metadata.authors.length > 0 && (
        <div className="border-b border-border py-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Contributors
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {metadata.authors.map((author) => (
              <span
                key={author}
                className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {author}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top files */}
      {metadata.topFiles.length > 0 && (
        <div className="border-b border-border py-4">
          <div className="flex items-center gap-2 mb-2">
            <Files size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Top files
            </p>
          </div>
          <ul className="flex flex-col gap-1">
            {metadata.topFiles.map((file) => (
              <li key={file} className="flex items-center gap-2 text-xs text-foreground">
                <FolderOpen size={12} className="shrink-0 text-muted-foreground" />
                <span className="truncate font-mono">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sub-groups */}
      {subGroups.length > 0 && (
        <div className="py-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Sub-groups
          </p>
          <ul className="flex flex-col gap-1">
            {subGroups.map((group) => (
              <li key={group.id}>
                <button
                  onClick={() => onZoom(group.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                >
                  <span className="flex-1 truncate">{group.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {group.metadata.commitCount}
                  </span>
                  <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
