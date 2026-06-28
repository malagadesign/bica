import type { SupabaseClient } from "@supabase/supabase-js";
import { searchIngredientsQuery } from "@/modules/search/search-ingredients";

export type {
  IngredientSearchResult,
  SearchMatchField,
} from "@/modules/search/types";

/**
 * Punto de entrada de búsqueda (server-side).
 * Sprint 1B: RPC PostgreSQL FTS + ranking híbrido.
 */
export async function searchIngredients(
  supabase: SupabaseClient,
  query: string,
  options?: { limit?: number }
) {
  return searchIngredientsQuery(supabase, query, options);
}
