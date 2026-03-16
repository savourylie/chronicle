import type { CommitGroup } from "./group";

export type SizeEncoding = "linesChanged" | "fileCount" | "commitCount";

export type ColorEncoding = "type" | "author" | "recency" | "churn";

export interface VisualizationState {
  root: CommitGroup;
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
}
