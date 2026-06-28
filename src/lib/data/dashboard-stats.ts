import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";

export type DashboardStats = {
  ingredients: number;
  rules: number;
  documents: number;
  needsReview: number;
  lastUpdated: string | null;
  recentPublications: {
    id: string;
    displayName: string;
    updated_at: string;
  }[];
};

export async function getDashboardStats(
  supabase: SupabaseClient
): Promise<DashboardStats> {
  const [ingredients, rules, documents, review, lastRule, recentUpdates] =
    await Promise.all([
      supabase.from("ingredients").select("*", { count: "exact", head: true }),
      supabase
        .from("ingredient_rules")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("regulatory_documents")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("ingredient_rules")
        .select("*", { count: "exact", head: true })
        .eq("needs_review", true),
      supabase
        .from("ingredient_rules")
        .select("updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ingredients")
        .select("id, inci_name, chemical_name, cas_number, color_index, updated_at")
        .order("updated_at", { ascending: false })
        .limit(5),
    ]);

  return {
    ingredients: ingredients.count ?? 0,
    rules: rules.count ?? 0,
    documents: documents.count ?? 0,
    needsReview: review.count ?? 0,
    lastUpdated: lastRule.data?.updated_at ?? null,
    recentPublications: (recentUpdates.data ?? []).map((row) => ({
      id: row.id,
      displayName: getIngredientDisplayName(row),
      updated_at: row.updated_at,
    })),
  };
}
