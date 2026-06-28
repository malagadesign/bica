import { createClient } from "@/lib/supabase/server";
import { searchIngredientsQuery } from "@/modules/search/search-ingredients";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Thin wrapper sobre searchIngredientsQuery — compatibilidad API / testing. */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Math.min(
    Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12,
    50
  );

  if (q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await searchIngredientsQuery(supabase, q, { limit });
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
