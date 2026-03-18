"use client";

import { useEffect, useRef } from "react";

import { useVisualizationStore } from "@/store/visualization-store";
import {
  parseUrlState,
  serializeToParams,
  buildUrlString,
  type UrlState,
} from "@/lib/url-state";

/**
 * Zero-UI component that keeps URL ↔ Zustand store in sync.
 * Renders nothing.
 */
export function UrlStateSync() {
  const suppressUrlUpdateRef = useRef(false);
  const pendingUrlStateRef = useRef<UrlState | null>(null);
  const prevZoomRef = useRef<string>("");

  // ---------- URL → Store: initial hydration ----------

  // Stash URL params on mount (before root is available)
  useEffect(() => {
    const parsed = parseUrlState(window.location.search);
    const hasParams = Object.keys(parsed).length > 0;
    if (hasParams) {
      pendingUrlStateRef.current = parsed;
    }
  }, []);

  // When root transitions from null → non-null, apply stashed params
  const root = useVisualizationStore((s) => s.root);
  const hydrateFromUrl = useVisualizationStore((s) => s.hydrateFromUrl);

  useEffect(() => {
    if (root && pendingUrlStateRef.current) {
      suppressUrlUpdateRef.current = true;
      hydrateFromUrl(pendingUrlStateRef.current);
      pendingUrlStateRef.current = null;
      // Allow URL updates on next tick
      requestAnimationFrame(() => {
        suppressUrlUpdateRef.current = false;
      });
    }
  }, [root, hydrateFromUrl]);

  // ---------- Store → URL sync ----------

  const zoomPath = useVisualizationStore((s) => s.zoomPath);
  const selectedNode = useVisualizationStore((s) => s.selectedNode);
  const encoding = useVisualizationStore((s) => s.encoding);
  const filters = useVisualizationStore((s) => s.filters);

  // Zoom changes → pushState (enables back/forward)
  useEffect(() => {
    if (!root) return;

    const zoomKey = zoomPath.join(",");
    const isZoomChange = prevZoomRef.current !== zoomKey;
    prevZoomRef.current = zoomKey;

    if (!isZoomChange || suppressUrlUpdateRef.current) return;

    const params = serializeToParams({
      zoom: zoomPath,
      selected: selectedNode ?? undefined,
      size: encoding.size,
      color: encoding.color,
      search: filters.searchQuery,
      dateFrom: filters.dateRange?.[0],
      dateTo: filters.dateRange?.[1],
    });
    const url = buildUrlString(params);
    history.pushState(null, "", url);
  }, [zoomPath, root, selectedNode, encoding, filters]);

  // Other state changes → debounced replaceState (no history pollution)
  const replaceTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!root || suppressUrlUpdateRef.current) return;

    clearTimeout(replaceTimerRef.current);
    replaceTimerRef.current = setTimeout(() => {
      if (suppressUrlUpdateRef.current) return;
      const params = serializeToParams({
        zoom: zoomPath,
        selected: selectedNode ?? undefined,
        size: encoding.size,
        color: encoding.color,
        search: filters.searchQuery,
        dateFrom: filters.dateRange?.[0],
        dateTo: filters.dateRange?.[1],
      });
      const url = buildUrlString(params);
      history.replaceState(null, "", url);
    }, 300);

    return () => clearTimeout(replaceTimerRef.current);
  }, [selectedNode, encoding, filters, root, zoomPath]);

  // ---------- URL → Store: popstate (back/forward) ----------

  useEffect(() => {
    const handlePopState = () => {
      if (!root) return;

      suppressUrlUpdateRef.current = true;
      const parsed = parseUrlState(window.location.search);
      hydrateFromUrl(parsed);

      requestAnimationFrame(() => {
        suppressUrlUpdateRef.current = false;
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [root, hydrateFromUrl]);

  return null;
}
