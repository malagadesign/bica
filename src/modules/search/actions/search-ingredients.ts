"use server";

import { createClient } from "@/lib/supabase/server";
import { searchIngredientsQuery } from "@/modules/search/search-ingredients";
import type { IngredientSearchResult } from "@/modules/search/types";

export async function searchIngredientsAction(
  query: string,
  limit?: number
): Promise<{ results: IngredientSearchResult[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { results: [], error: "Unauthorized" };
  }

  try {
    const results = await searchIngredientsQuery(supabase, query, { limit });
    return { results };
  } catch {
    return { results: [], error: "Search failed" };
  }
}
