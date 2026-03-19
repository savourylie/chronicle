export type AnalysisStatus =
  | "pending"
  | "cloning"
  | "analyzing"
  | "complete"
  | "error";

export type AnalysisRow = {
  id: string;
  repo_url: string;
  repo_owner: string | null;
  repo_name: string | null;
  branch: string | null;
  commit_count: number | null;
  status: AnalysisStatus;
  result: Record<string, unknown> | null;
  error_message: string | null;
  pipeline_ms: number | null;
  created_at: string;
  updated_at: string;
};

export type AnalysisInsert = Pick<AnalysisRow, "repo_url"> &
  Partial<
    Pick<
      AnalysisRow,
      | "repo_owner"
      | "repo_name"
      | "branch"
      | "commit_count"
      | "status"
      | "result"
      | "error_message"
      | "pipeline_ms"
    >
  >;

export type AnalysisUpdate = Partial<
  Pick<
    AnalysisRow,
    | "repo_owner"
    | "repo_name"
    | "branch"
    | "commit_count"
    | "status"
    | "result"
    | "error_message"
    | "pipeline_ms"
  >
>;

export type Database = {
  public: {
    Tables: {
      analyses: {
        Row: AnalysisRow;
        Insert: AnalysisInsert;
        Update: AnalysisUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
};
