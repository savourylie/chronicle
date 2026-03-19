"use client";

import { useEffect, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useVisualizationStore } from "@/store/visualization-store";
import type { AnalysisRow } from "@/types/database";
import type { CommitGroup } from "@/types";

// ---------------------------------------------------------------------------
// POST /api/analyze-github — start a new analysis
// ---------------------------------------------------------------------------

async function startAnalysis(repoUrl: string): Promise<{ analysisId: string }> {
  const res = await fetch("/api/analyze-github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export function useStartGitHubAnalysis() {
  const setAnalysisId = useVisualizationStore((s) => s.setAnalysisId);

  return useMutation({
    mutationFn: startAnalysis,
    onSuccess: (data) => {
      setAnalysisId(data.analysisId);
    },
  });
}

// ---------------------------------------------------------------------------
// GET /api/analyze-github/[id] — poll for status
// ---------------------------------------------------------------------------

async function fetchAnalysisStatus(id: string): Promise<AnalysisRow> {
  const res = await fetch(`/api/analyze-github/${id}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }

  return res.json();
}

export function useGitHubAnalysisStatus(analysisId: string | null) {
  const setRoot = useVisualizationStore((s) => s.setRoot);
  const didSetRoot = useRef(false);

  // Reset the guard when analysisId changes
  useEffect(() => {
    didSetRoot.current = false;
  }, [analysisId]);

  const query = useQuery<AnalysisRow>({
    queryKey: ["github-analysis", analysisId],
    queryFn: () => fetchAnalysisStatus(analysisId!),
    enabled: !!analysisId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "pending" || status === "cloning" || status === "analyzing") {
        return 1000;
      }
      return false;
    },
  });

  // Set root exactly once when analysis completes
  useEffect(() => {
    if (query.data?.status === "complete" && query.data.result && !didSetRoot.current) {
      didSetRoot.current = true;
      setRoot(query.data.result as unknown as CommitGroup);
    }
  }, [query.data, setRoot]);

  return query;
}
