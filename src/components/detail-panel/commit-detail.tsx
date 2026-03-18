"use client";

import { useState } from "react";
import {
  GitCommit,
  User,
  Calendar,
  Copy,
  Check,
  FileCode,
  GitBranch,
} from "@phosphor-icons/react";

import type { CommitNode } from "@/types";
import { TYPE_COLOR_MAP } from "@/lib/encoding";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const FILE_LIST_CAP = 20;

export function CommitDetail({ node }: { node: CommitNode }) {
  const [copied, setCopied] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);

  const commitType = node.type ?? "other";
  const typeColor = TYPE_COLOR_MAP[commitType] ?? TYPE_COLOR_MAP.other;
  const totalChanges = node.insertions + node.deletions;
  const files = showAllFiles
    ? node.filesChanged
    : node.filesChanged.slice(0, FILE_LIST_CAP);
  const hasMoreFiles = node.filesChanged.length > FILE_LIST_CAP;

  function handleCopy() {
    navigator.clipboard.writeText(node.hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col">
      {/* Type badge */}
      <div className="border-b border-border py-4">
        <span
          className="inline-block rounded-sm px-2 py-0.5 text-xs font-semibold"
          style={{ color: typeColor, backgroundColor: `color-mix(in srgb, ${typeColor} 15%, transparent)` }}
        >
          {commitType}
        </span>
      </div>

      {/* Commit message */}
      <div className="border-b border-border py-4">
        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {node.message}
        </p>
      </div>

      {/* Author & date */}
      <div className="flex flex-col gap-2 border-b border-border py-4">
        <div className="flex items-center gap-2 text-sm">
          <User size={14} className="shrink-0 text-muted-foreground" />
          <span className="text-foreground">{node.author.name}</span>
          <span className="text-xs text-muted-foreground">{node.author.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={14} className="shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{formatDate(node.date)}</span>
        </div>
      </div>

      {/* Hash */}
      <div className="flex items-center gap-2 border-b border-border py-4">
        <GitCommit size={14} className="shrink-0 text-muted-foreground" />
        <code className="font-mono text-xs font-semibold text-accent">
          {node.shortHash}
        </code>
        <button
          onClick={handleCopy}
          className="ml-auto rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Copy full hash"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>

      {/* Diff stats */}
      {totalChanges > 0 && (
        <div className="flex items-center gap-3 border-b border-border py-4 text-sm">
          <span className="text-muted-foreground">
            {node.filesChanged.length} file{node.filesChanged.length !== 1 ? "s" : ""}
          </span>
          <span className="font-mono text-green-600">+{node.insertions}</span>
          <span className="font-mono text-red-500">-{node.deletions}</span>
        </div>
      )}

      {/* File list */}
      {node.filesChanged.length > 0 && (
        <div className="border-b border-border py-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Files changed
          </p>
          <ul className="flex flex-col gap-1">
            {files.map((file) => (
              <li key={file} className="flex items-center gap-2 text-xs text-foreground">
                <FileCode size={12} className="shrink-0 text-muted-foreground" />
                <span className="truncate font-mono">{file}</span>
              </li>
            ))}
          </ul>
          {hasMoreFiles && !showAllFiles && (
            <button
              onClick={() => setShowAllFiles(true)}
              className="mt-2 text-xs text-accent hover:underline"
            >
              Show all {node.filesChanged.length} files
            </button>
          )}
        </div>
      )}

      {/* Parent hashes */}
      {node.parentHashes.length > 0 && (
        <div className="py-4">
          <div className="flex items-center gap-2 mb-2">
            <GitBranch size={14} className="text-muted-foreground" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Parents
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {node.parentHashes.map((hash) => (
              <code
                key={hash}
                className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground"
              >
                {hash.slice(0, 7)}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
