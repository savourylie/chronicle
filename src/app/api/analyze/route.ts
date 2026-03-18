import { NextResponse } from "next/server";
import { stat } from "fs/promises";
import { resolve } from "path";

import { analyzePipeline } from "@/lib/pipeline";

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

  const { repoPath, options } = body as {
    repoPath?: string;
    options?: {
      maxCommits?: number;
      since?: string;
      until?: string;
      branch?: string;
    };
  };

  if (!repoPath || typeof repoPath !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid repoPath" },
      { status: 400 },
    );
  }

  // Security: resolve to absolute path and reject path traversal
  const resolved = resolve(repoPath);
  if (resolved !== repoPath && !resolve(repoPath).startsWith("/")) {
    return NextResponse.json(
      { error: "Invalid path" },
      { status: 400 },
    );
  }

  // Verify the path exists and is a directory
  try {
    const stats = await stat(resolved);
    if (!stats.isDirectory()) {
      return NextResponse.json(
        { error: "Path is not a directory" },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Path does not exist" },
      { status: 400 },
    );
  }

  // Run the pipeline
  try {
    const result = await analyzePipeline({
      repoPath: resolved,
      maxCommits: options?.maxCommits,
      since: options?.since,
      until: options?.until,
      branch: options?.branch,
    });

    return NextResponse.json({
      data: result.root,
      meta: result.meta,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pipeline failed";

    // Known user errors from git-parser
    if (
      message.includes("Not a git repository") ||
      message.includes("Path does not exist") ||
      message.includes("Git is not installed")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
