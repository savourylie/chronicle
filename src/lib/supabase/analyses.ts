import { createClient as createServerClient } from "./server";
import { createClient as createBrowserClient } from "./client";
import type {
  Analysis,
  AnalysisInsert,
  AnalysisStatus,
  AnalysisUpdate,
} from "@/types/analysis";
import type { CommitGroup } from "@/types/group";

// ---------------------------------------------------------------------------
// Server-side (service role)
// ---------------------------------------------------------------------------

export async function createAnalysis(input: AnalysisInsert): Promise<Analysis> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("analyses")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAnalysisStatus(
  id: string,
  status: AnalysisStatus,
  extra?: Partial<AnalysisUpdate>,
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("analyses")
    .update({ status, ...extra })
    .eq("id", id);

  if (error) throw error;
}

export async function setAnalysisResult(
  id: string,
  result: CommitGroup,
  meta: { commitCount: number; pipelineMs: number },
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("analyses")
    .update({
      status: "complete" as const,
      result: result as unknown as Record<string, unknown>,
      commit_count: meta.commitCount,
      pipeline_ms: meta.pipelineMs,
    })
    .eq("id", id);

  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Server-side queries (service role)
// ---------------------------------------------------------------------------

export async function getAnalysisServer(id: string): Promise<Analysis | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getRecentCompleteAnalysis(
  repoUrl: string,
  maxAgeMs = 60 * 60 * 1000,
): Promise<Analysis | null> {
  const supabase = createServerClient();
  const cutoff = new Date(Date.now() - maxAgeMs).toISOString();

  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("repo_url", repoUrl)
    .eq("status", "complete")
    .gte("created_at", cutoff)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function countActiveAnalyses(): Promise<number> {
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .in("status", ["pending", "cloning", "analyzing"]);

  if (error) throw error;
  return count ?? 0;
}

// ---------------------------------------------------------------------------
// Client-side (anon key)
// ---------------------------------------------------------------------------

export async function getAnalysis(id: string): Promise<Analysis | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function getAnalysisByRepoUrl(
  url: string,
): Promise<Analysis | null> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("analyses")
    .select()
    .eq("repo_url", url)
    .eq("status", "complete")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
