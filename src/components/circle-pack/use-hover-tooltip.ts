import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { CommitGroup, CommitNode } from "@/types";

export interface TooltipState {
  node: CommitGroup | CommitNode;
  isLeaf: boolean;
  x: number;
  y: number;
}

interface UseHoverTooltipOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  zoomPath: string[];
}

const SHOW_DELAY_MS = 200;

export function useHoverTooltip({ containerRef, zoomPath }: UseHoverTooltipOptions) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingNodeRef = useRef<{ node: CommitGroup | CommitNode; isLeaf: boolean } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingNodeRef.current = null;
    setTooltip(null);
  }, []);

  // Dismiss tooltip when zoom changes — synchronizing local UI state
  // with store-driven zoom is a valid effect use case.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing with zoom store
    dismiss();
  }, [zoomPath, dismiss]);

  const getContainerPosition = useCallback(
    (e: React.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [containerRef],
  );

  const onPointerEnter = useCallback(
    (e: React.PointerEvent, node: CommitGroup | CommitNode, isLeaf: boolean) => {
      const pos = getContainerPosition(e);
      pendingNodeRef.current = { node, isLeaf };

      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        const pending = pendingNodeRef.current;
        if (pending) {
          setTooltip({ ...pending, ...pos });
        }
        timerRef.current = null;
      }, SHOW_DELAY_MS);
    },
    [getContainerPosition],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const pos = getContainerPosition(e);
      setTooltip((prev) => (prev ? { ...prev, ...pos } : null));
    },
    [getContainerPosition],
  );

  const onPointerLeave = useCallback(() => {
    dismiss();
  }, [dismiss]);

  const handlers = useMemo(
    () => ({ onPointerEnter, onPointerMove, onPointerLeave, onDismiss: dismiss }),
    [onPointerEnter, onPointerMove, onPointerLeave, dismiss],
  );

  return {
    tooltip,
    handlers,
    tooltipRef,
  };
}
