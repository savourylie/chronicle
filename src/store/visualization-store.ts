import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type {
  CommitGroup,
  CommitNode,
  SizeEncoding,
  ColorEncoding,
} from "@/types";
import { isCommitNode, isCommitGroup } from "@/types";
import type { UrlState } from "@/lib/url-state";

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

type TreeNode = CommitGroup | CommitNode;

/** Recursive DFS lookup by group ID or commit hash. */
function findNodeById(node: TreeNode, id: string): TreeNode | null {
  if (isCommitNode(node)) {
    return node.hash === id ? node : null;
  }
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/** Returns group-ID path (excluding root) from root to target group, or null. */
function findGroupPath(root: CommitGroup, groupId: string): string[] | null {
  if (root.id === groupId) return [];

  for (const child of root.children) {
    if (isCommitGroup(child)) {
      if (child.id === groupId) return [child.id];
      const sub = findGroupPath(child, groupId);
      if (sub) return [child.id, ...sub];
    }
  }
  return null;
}

/** Returns zoom path to the group *containing* a commit, or null. */
function findCommitGroupPath(
  root: CommitGroup,
  commitHash: string
): string[] | null {
  for (const child of root.children) {
    if (isCommitNode(child) && child.hash === commitHash) {
      return []; // commit is direct child of root
    }
    if (isCommitGroup(child)) {
      const sub = findCommitGroupPath(child, commitHash);
      if (sub !== null) return [child.id, ...sub];
    }
  }
  return null;
}

type FilterState = VisualizationStoreState["filters"];

/** Builds a single predicate from active filters (AND logic). Returns null if none active. */
function buildFilterPredicate(
  filters: FilterState
): ((node: CommitNode) => boolean) | null {
  const predicates: ((node: CommitNode) => boolean)[] = [];

  if (filters.dateRange) {
    const [start, end] = filters.dateRange;
    predicates.push((n) => n.date >= start && n.date <= end);
  }
  if (filters.authors && filters.authors.length > 0) {
    const authors = filters.authors;
    predicates.push((n) => authors.includes(n.author.name));
  }
  if (filters.types && filters.types.length > 0) {
    const types = filters.types;
    predicates.push((n) => types.includes(n.type ?? ""));
  }
  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    predicates.push(
      (n) =>
        n.message.toLowerCase().includes(q) ||
        n.author.name.toLowerCase().includes(q) ||
        n.filesChanged.some((f) => f.toLowerCase().includes(q))
    );
  }

  if (predicates.length === 0) return null;
  return (node) => predicates.every((p) => p(node));
}

/** Recursively filters tree, preserving structure. Returns null if nothing passes. */
function filterTree(
  group: CommitGroup,
  predicate: (node: CommitNode) => boolean
): CommitGroup | null {
  const filtered: TreeNode[] = [];

  for (const child of group.children) {
    if (isCommitNode(child)) {
      if (predicate(child)) filtered.push(child);
    } else {
      const sub = filterTree(child, predicate);
      if (sub) filtered.push(sub);
    }
  }

  if (filtered.length === 0) return null;
  return { ...group, children: filtered };
}

// ---------------------------------------------------------------------------
// Store types
// ---------------------------------------------------------------------------

export interface VisualizationStoreState {
  // State
  root: CommitGroup | null;
  zoomPath: string[];
  selectedNode: string | null;
  filters: {
    dateRange?: [string, string];
    authors?: string[];
    types?: string[];
    searchQuery?: string;
  };
  encoding: {
    size: SizeEncoding;
    color: ColorEncoding;
  };

  // Actions
  setRoot: (data: CommitGroup) => void;
  resetRoot: () => void;
  zoomTo: (nodeId: string) => void;
  zoomOut: () => void;
  zoomToRoot: () => void;
  selectNode: (nodeId: string | null) => void;
  setFilter: <K extends keyof VisualizationStoreState["filters"]>(
    key: K,
    value: VisualizationStoreState["filters"][K]
  ) => void;
  clearFilters: () => void;
  setEncoding: <K extends keyof VisualizationStoreState["encoding"]>(
    key: K,
    value: VisualizationStoreState["encoding"][K]
  ) => void;
  hydrateFromUrl: (urlState: UrlState) => void;

  // Derived selectors
  currentFocus: () => CommitGroup | null;
  visibleNodes: () => TreeNode[];
  selectedNodeData: () => TreeNode | null;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useVisualizationStore = create<VisualizationStoreState>()(
  subscribeWithSelector((set, get) => ({
    // ---- State ----
    root: null,
    zoomPath: [],
    selectedNode: null,
    filters: {},
    encoding: {
      size: "linesChanged",
      color: "type",
    },

    // ---- Actions ----

    setRoot: (data) => set({ root: data, zoomPath: [], selectedNode: null }),

    resetRoot: () =>
      set({ root: null, zoomPath: [], selectedNode: null, filters: {} }),

    zoomTo: (nodeId) => {
      const { root } = get();
      if (!root) return;

      // Target is root itself
      if (root.id === nodeId) {
        set({ zoomPath: [] });
        return;
      }

      // Try as a group first
      const groupPath = findGroupPath(root, nodeId);
      if (groupPath) {
        set({ zoomPath: groupPath });
        return;
      }

      // Try as a commit — zoom to parent group and auto-select
      const commitPath = findCommitGroupPath(root, nodeId);
      if (commitPath !== null) {
        set({ zoomPath: commitPath, selectedNode: nodeId });
      }
      // Not found → no-op
    },

    zoomOut: () =>
      set((state) => ({ zoomPath: state.zoomPath.slice(0, -1) })),

    zoomToRoot: () => set({ zoomPath: [] }),

    selectNode: (id) => set({ selectedNode: id }),

    setFilter: (key, value) =>
      set((state) => ({ filters: { ...state.filters, [key]: value } })),

    clearFilters: () => set({ filters: {} }),

    setEncoding: (key, value) =>
      set((state) => ({ encoding: { ...state.encoding, [key]: value } })),

    hydrateFromUrl: (urlState) => {
      const { root } = get();
      if (!root) return;

      // Validate zoom path — walk each segment, truncate at first invalid one
      let zoomPath: string[] = [];
      if (urlState.zoom && urlState.zoom.length > 0) {
        let current: CommitGroup = root;
        for (const id of urlState.zoom) {
          const path = findGroupPath(current, id);
          if (path) {
            zoomPath.push(id);
            // Walk into that child for next iteration
            const child = current.children.find(
              (c) => isCommitGroup(c) && c.id === id
            );
            if (child && isCommitGroup(child)) {
              current = child;
            } else {
              break;
            }
          } else {
            break; // invalid segment, truncate here
          }
        }
      }

      // Validate selected node
      const selectedNode =
        urlState.selected && findNodeById(root, urlState.selected)
          ? urlState.selected
          : null;

      // Build encoding (already validated by parseUrlState)
      const encoding = {
        size: urlState.size ?? get().encoding.size,
        color: urlState.color ?? get().encoding.color,
      };

      // Build filters — start fresh so absent URL params clear old values
      const filters: VisualizationStoreState["filters"] = {};
      if (urlState.search) {
        filters.searchQuery = urlState.search;
      }
      if (urlState.dateFrom && urlState.dateTo) {
        filters.dateRange = [urlState.dateFrom, urlState.dateTo];
      }

      set({ zoomPath, selectedNode, encoding, filters });
    },

    // ---- Derived selectors ----

    currentFocus: () => {
      const { root, zoomPath } = get();
      if (!root) return null;
      let current: CommitGroup = root;
      for (const id of zoomPath) {
        const child = current.children.find(
          (c) => isCommitGroup(c) && c.id === id
        );
        if (!child || isCommitNode(child)) return root; // stale path fallback
        current = child;
      }
      return current;
    },

    visibleNodes: () => {
      const focus = get().currentFocus();
      if (!focus) return [];

      const predicate = buildFilterPredicate(get().filters);
      if (!predicate) return focus.children;

      const filtered = filterTree(focus, predicate);
      return filtered ? filtered.children : [];
    },

    selectedNodeData: () => {
      const { root, selectedNode } = get();
      if (!root || !selectedNode) return null;
      return findNodeById(root, selectedNode);
    },
  }))
);
