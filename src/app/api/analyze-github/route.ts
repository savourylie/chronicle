import { NextResponse } from "next/server";
import { after } from "next/server";

import { parseGitHubUrl } from "@/lib/github/url-utils";
import { cloneRepo } from "@/lib/github/clone-manager";
import { analyzePipeline } from "@/lib/pipeline";
import {
  createAnalysis,
  updateAnalysisStatus,
  setAnalysisResult,
  getRecentCompleteAnalysis,
  countActiveAnalyses,
} from "@/lib/supabase/analyses";

const MAX_CONCURRENT = 3;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { repoUrl, branch } = body as {
    repoUrl?: string;
    branch?: string;
  };

  if (!repoUrl || typeof repoUrl !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid repoUrl" },
      { status: 400 },
    );
  }

  // Parse & validate GitHub URL
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const { cloneUrl } = parsed.data;
  const effectiveBranch = branch ?? parsed.data.branch;

  // Dedup: return existing recent complete analysis
  try {
    const existing = await getRecentCompleteAnalysis(cloneUrl);
    if (existing) {
      return NextResponse.json({ analysisId: existing.id }, { status: 200 });
    }
  } catch {
    // Dedup check is best-effort; continue if it fails
  }

  // Rate limiting
  try {
    const active = await countActiveAnalyses();
    if (active >= MAX_CONCURRENT) {
      return NextResponse.json(
        { error: "Too many concurrent analyses. Please try again later." },
        { status: 429 },
      );
    }
  } catch {
    // Rate limit check is best-effort; continue if it fails
  }

  // Create pending analysis record
  let analysisId: string;
  try {
    const analysis = await createAnalysis({
      repo_url: cloneUrl,
      repo_owner: parsed.data.owner,
      repo_name: parsed.data.repo,
      branch: effectiveBranch ?? null,
      status: "pending",
    });
    analysisId = analysis.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Background processing after the response is sent
  after(async () => {
    let cleanup: (() => Promise<void>) | undefined;
    try {
      // 1. Clone
      await updateAnalysisStatus(analysisId, "cloning");
      const cloneResult = await cloneRepo({
        url: cloneUrl,
        branch: effectiveBranch,
      });
      cleanup = cloneResult.cleanup;

      // 2. Analyze
      await updateAnalysisStatus(analysisId, "analyzing");
      const pipelineResult = await analyzePipeline({
        repoPath: cloneResult.localPath,
      });

      // 3. Store result
      await setAnalysisResult(analysisId, pipelineResult.root, pipelineResult.meta);

      // 4. Cleanup
      await cleanup();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analysis failed";
      await updateAnalysisStatus(analysisId, "error", {
        error_message: message,
      }).catch(() => {});

      // Always clean up temp directory
      await cleanup?.().catch(() => {});
    }
  });

  return NextResponse.json({ analysisId }, { status: 202 });
}
