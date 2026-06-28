import type { SupabaseClient } from "@supabase/supabase-js";
import { mapRpcRowToSearchResult } from "@/modules/search/mappers/map-rpc-result";
import type {
  IngredientSearchResult,
  SearchIngredientsRpcRow,
} from "@/modules/search/types";

const MIN_QUERY_LENGTH = 2;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Búsqueda regulatoria vía RPC PostgreSQL (FTS + ranking híbrido).
 * Sprint 1B — no llamar Supabase directo desde componentes client.
 */
export async function searchIngredientsQuery(
  supabase: SupabaseClient,
  query: string,
  options?: { limit?: number }
): Promise<IngredientSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const limit = Math.min(
    Math.max(1, options?.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT
  );

  const { data, error } = await supabase.rpc("search_ingredients", {
    query_text: trimmed,
    limit_count: limit,
  });

  if (error) {
    console.error("[search_ingredients RPC]", error.message);
    throw new Error("No pudimos completar la búsqueda.");
  }

  return ((data ?? []) as SearchIngredientsRpcRow[]).map(mapRpcRowToSearchResult);
}
