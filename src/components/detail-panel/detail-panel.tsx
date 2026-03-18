"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "@phosphor-icons/react";

import { isCommitNode, isCommitGroup } from "@/types";
import { useVisualizationStore } from "@/store/visualization-store";

import { CommitDetail } from "./commit-detail";
import { GroupDetail } from "./group-detail";

const BOUNCE_EASE = [0.34, 1.56, 0.64, 1] as const;

export function DetailPanel() {
  const selectedNode = useVisualizationStore((s) => s.selectedNode);
  const selectedNodeData = useVisualizationStore((s) => s.selectedNodeData());
  const selectNode = useVisualizationStore((s) => s.selectNode);
  const zoomTo = useVisualizationStore((s) => s.zoomTo);

  const prefersReducedMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevNodeRef = useRef<string | null>(null);

  // Scroll to top when selected node changes
  useEffect(() => {
    if (selectedNode && selectedNode !== prevNodeRef.current) {
      scrollRef.current?.scrollTo(0, 0);
    }
    prevNodeRef.current = selectedNode;
  }, [selectedNode]);

  // Close on Escape
  useEffect(() => {
    if (!selectedNode) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        selectNode(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedNode, selectNode]);

  function handleZoomToSubGroup(id: string) {
    zoomTo(id);
    selectNode(null);
  }

  const duration = prefersReducedMotion ? 0 : 0.35;

  return (
    <AnimatePresence>
      {selectedNode && selectedNodeData && (
        <motion.aside
          key="detail-panel"
          data-slot="detail-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{
            duration,
            ease: prefersReducedMotion ? "linear" : BOUNCE_EASE,
          }}
          className="fixed inset-y-0 right-0 z-30 flex w-full flex-col border-l-2 border-border bg-card md:w-[400px]"
          style={{
            boxShadow: "-4px 4px 0 0 var(--foreground)",
          }}
          role="dialog"
          aria-label="Detail panel"
        >
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {isCommitNode(selectedNodeData) ? "Commit" : "Group"}
            </h2>
            <button
              onClick={() => selectNode(null)}
              className="rounded-sm p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label="Close detail panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable content */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
            {isCommitNode(selectedNodeData) ? (
              <CommitDetail key={selectedNodeData.hash} node={selectedNodeData} />
            ) : isCommitGroup(selectedNodeData) ? (
              <GroupDetail
                key={selectedNodeData.id}
                node={selectedNodeData}
                onZoom={handleZoomToSubGroup}
              />
            ) : null}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
