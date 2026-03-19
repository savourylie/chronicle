import { NextResponse } from "next/server";
import { getAnalysisServer } from "@/lib/supabase/analyses";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing analysis ID" }, { status: 400 });
  }

  try {
    const analysis = await getAnalysisServer(id);
    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analysis";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
