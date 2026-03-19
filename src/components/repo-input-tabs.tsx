"use client";

import { useState } from "react";
import { GithubLogo, FolderOpen } from "@phosphor-icons/react";

import { SegmentedControl } from "@/components/ui/segmented-control";
import { GitHubUrlForm } from "@/components/github-url-form";
import { RepoInput } from "@/components/repo-input";

type InputMode = "github" | "local";

const MODE_OPTIONS: { value: InputMode; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "local", label: "Local" },
];

const MODE_CONFIG = {
  github: {
    icon: GithubLogo,
    title: "Analyze a GitHub Repository",
    subtitle: "Enter a GitHub URL or owner/repo to visualize its commit history.",
  },
  local: {
    icon: FolderOpen,
    title: "Analyze a Local Repository",
    subtitle: "Enter the path to a local git repository to visualize its commit history.",
  },
} as const;

export function RepoInputTabs() {
  const [mode, setMode] = useState<InputMode>("github");

  const config = MODE_CONFIG[mode];
  const Icon = config.icon;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-8 px-4">
      {/* Header */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border bg-accent/10">
          <Icon size={32} weight="duotone" className="text-accent" />
        </div>
        <h2 className="font-heading text-2xl font-bold">{config.title}</h2>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {config.subtitle}
        </p>
      </div>

      {/* Mode toggle */}
      <SegmentedControl
        value={mode}
        onChange={setMode}
        options={MODE_OPTIONS}
        label="Input mode"
      />

      {/* Active form */}
      {mode === "github" ? (
        <GitHubUrlForm />
      ) : (
        <RepoInput hideHeader />
      )}
    </div>
  );
}
