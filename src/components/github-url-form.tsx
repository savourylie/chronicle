"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  SpinnerGap,
  ArrowRight,
  HourglassMedium,
  Download,
  ChartBar,
  CheckCircle,
} from "@phosphor-icons/react";

import { parseGitHubUrl } from "@/lib/github/url-utils";
import { useVisualizationStore } from "@/store/visualization-store";
import {
  useStartGitHubAnalysis,
  useGitHubAnalysisStatus,
} from "@/hooks/use-github-analysis";
import type { AnalysisStatus } from "@/types/database";

// ---------------------------------------------------------------------------
// Progress stepper
// ---------------------------------------------------------------------------

const STEPS: { key: AnalysisStatus; label: string; icon: typeof HourglassMedium }[] = [
  { key: "pending", label: "Queued", icon: HourglassMedium },
  { key: "cloning", label: "Cloning", icon: Download },
  { key: "analyzing", label: "Analyzing", icon: ChartBar },
  { key: "complete", label: "Complete", icon: CheckCircle },
];

const STATUS_ORDER: AnalysisStatus[] = ["pending", "cloning", "analyzing", "complete"];

function stepIndex(status: AnalysisStatus): number {
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

function ProgressStepper({ status }: { status: AnalysisStatus }) {
  const prefersReducedMotion = useReducedMotion();
  const currentIdx = stepIndex(status);

  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
      className="flex items-center justify-center gap-2"
    >
      {STEPS.map((step, i) => {
        const isComplete = i < currentIdx;
        const isCurrent = i === currentIdx;
        const Icon = step.icon;

        return (
          <div key={step.key} className="flex items-center gap-2">
            {i > 0 && (
              <div
                className={`h-px w-6 transition-colors ${
                  isComplete ? "bg-accent" : "bg-border"
                }`}
              />
            )}
            <div className="flex items-center gap-1.5">
              {isCurrent && status !== "complete" ? (
                <SpinnerGap
                  size={16}
                  className="animate-spin text-accent"
                />
              ) : isComplete || (isCurrent && status === "complete") ? (
                <CheckCircle
                  size={16}
                  weight="fill"
                  className="text-accent"
                />
              ) : (
                <Icon size={16} className="text-muted-foreground/50" />
              )}
              <span
                className={`text-xs font-medium ${
                  isCurrent
                    ? "text-foreground"
                    : isComplete
                      ? "text-accent"
                      : "text-muted-foreground/50"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        );
      })}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// GitHubUrlForm
// ---------------------------------------------------------------------------

function getInitialUrl(): string {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  const repo = params.get("repo");
  if (!repo) return "";
  return repo.includes("github.com") ? repo : `https://github.com/${repo}`;
}

export function GitHubUrlForm() {
  const [url, setUrl] = useState(getInitialUrl);

  const analysisId = useVisualizationStore((s) => s.analysisId);
  const setAnalysisId = useVisualizationStore((s) => s.setAnalysisId);

  const mutation = useStartGitHubAnalysis();
  const statusQuery = useGitHubAnalysisStatus(analysisId);

  const isPolling =
    !!analysisId &&
    statusQuery.data?.status !== "complete" &&
    statusQuery.data?.status !== "error";

  const prefersReducedMotion = useReducedMotion();
  const autoStarted = useRef(false);

  // Validation derived from url (parseGitHubUrl is synchronous & fast)
  const validation = useMemo(() => {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const result = parseGitHubUrl(trimmed);
    if (result.ok) {
      return { valid: true as const, message: `${result.data.owner}/${result.data.repo}` };
    }
    return { valid: false as const, message: result.error };
  }, [url]);

  // ?repo= auto-start — only fires mutation & cleans URL, no setState
  useEffect(() => {
    if (autoStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    const repo = params.get("repo");
    if (!repo) return;

    autoStarted.current = true;
    window.history.replaceState({}, "", window.location.pathname);

    if (validation?.valid) {
      mutation.mutate(url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || !validation?.valid) return;
    mutation.mutate(trimmed);
  };

  const handleRetry = () => {
    setAnalysisId(null);
    mutation.reset();
  };

  const isDisabled =
    !url.trim() ||
    !validation?.valid ||
    mutation.isPending ||
    isPolling;

  const showError =
    statusQuery.data?.status === "error" || mutation.isError;
  const errorMessage =
    statusQuery.data?.error_message || mutation.error?.message;

  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com/owner/repo"
            disabled={mutation.isPending || isPolling}
            className="h-11 flex-1 rounded-xl border-2 border-border bg-input px-4 font-mono text-sm
              placeholder:text-muted-foreground/50
              focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/20
              disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isDisabled}
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
            {mutation.isPending ? "Starting..." : "Analyze"}
          </button>
        </div>

        {/* Validation feedback */}
        {validation && !isPolling && !showError && (
          <p
            className={`text-xs ${
              validation.valid
                ? "text-muted-foreground"
                : "text-destructive"
            }`}
          >
            {validation.valid
              ? `Repository: ${validation.message}`
              : validation.message}
          </p>
        )}
      </form>

      {/* Progress stepper */}
      <AnimatePresence mode="wait">
        {isPolling && statusQuery.data && (
          <ProgressStepper status={statusQuery.data.status} />
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence mode="wait">
        {showError && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <p className="rounded-lg border-2 border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errorMessage || "Analysis failed"}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="self-start text-sm font-medium text-accent underline underline-offset-2 hover:text-accent/80"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
