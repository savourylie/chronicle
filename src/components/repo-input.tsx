"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { SpinnerGap, FolderOpen, ArrowRight } from "@phosphor-icons/react";

import { useVisualizationStore } from "@/store/visualization-store";
import type { CommitGroup } from "@/types";

interface AnalyzeResponse {
  data: CommitGroup;
  meta: { commitCount: number; pipelineMs: number };
}

async function analyzeRepo(repoPath: string): Promise<AnalyzeResponse> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoPath }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export function RepoInput({ hideHeader }: { hideHeader?: boolean } = {}) {
  const [path, setPath] = useState("");
  const setRoot = useVisualizationStore((s) => s.setRoot);

  const mutation = useMutation({
    mutationFn: analyzeRepo,
    onSuccess: (data) => {
      setRoot(data.data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = path.trim();
    if (!trimmed) return;
    mutation.mutate(trimmed);
  };

  return (
    <div className={hideHeader ? "flex w-full max-w-md flex-col gap-3" : "flex h-full w-full flex-col items-center justify-center gap-8 px-4"}>
      {/* Title area */}
      {!hideHeader && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-accent/10">
            <FolderOpen size={32} weight="duotone" className="text-accent" />
          </div>
          <h2 className="font-heading text-2xl font-bold">
            Analyze a Repository
          </h2>
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            Enter the path to a local git repository to visualize its commit
            history.
          </p>
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col gap-3"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/path/to/your/repo"
            disabled={mutation.isPending}
            className="h-11 flex-1 rounded-xl border-2 border-border bg-input px-4 font-mono text-sm
              placeholder:text-muted-foreground/50
              focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !path.trim()}
            className="flex h-11 items-center gap-2 rounded-full border-2 border-border bg-accent px-5
              font-heading text-sm font-bold text-accent-foreground
              shadow-hard
              transition-all
              hover:shadow-hard-active hover:-translate-x-[2px] hover:-translate-y-[2px]
              active:shadow-none active:translate-x-[4px] active:translate-y-[4px]
              disabled:pointer-events-none disabled:opacity-50"
          >
            {mutation.isPending ? (
              <SpinnerGap size={18} className="animate-spin" />
            ) : (
              <ArrowRight size={18} weight="bold" />
            )}
            {mutation.isPending ? "Analyzing…" : "Analyze"}
          </button>
        </div>

        {/* Error message */}
        {mutation.isError && (
          <p className="rounded-lg border-2 border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}

        {/* Success meta (brief flash before visualization takes over) */}
        {mutation.isSuccess && (
          <p className="text-center text-sm text-muted-foreground">
            Found {mutation.data.meta.commitCount} commits in{" "}
            {mutation.data.meta.pipelineMs}ms
          </p>
        )}
      </form>
    </div>
  );
}
