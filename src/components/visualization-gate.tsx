"use client";

import type { ReactNode } from "react";
import { useVisualizationStore } from "@/store/visualization-store";

export function VisualizationGate({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const root = useVisualizationStore((s) => s.root);
  return <>{root ? children : fallback}</>;
}
