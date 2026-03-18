"use client";

import type { ReactNode } from "react";
import { useVisualizationStore } from "@/store/visualization-store";

export function Header({ children }: { children?: ReactNode }) {
  const resetRoot = useVisualizationStore((s) => s.resetRoot);

  return (
    <header className="flex h-14 items-center justify-between border-b-2 border-border px-4 md:px-6">
      <button
        onClick={resetRoot}
        className="font-heading text-lg font-bold transition-colors hover:text-accent"
      >
        Chronicle
      </button>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
