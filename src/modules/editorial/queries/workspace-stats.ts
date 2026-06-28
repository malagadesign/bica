import type { SupabaseClient } from "@supabase/supabase-js";
import type { WorkspaceStats } from "../types";

export async function getWorkspaceStats(
  supabase: SupabaseClient
): Promise<WorkspaceStats> {
  const [
    { count: ingredientDrafts },
    { count: ruleDrafts },
    { count: docDrafts },
    { count: ingredientReady },
    { count: ruleReady },
    { count: docReady },
    { count: ingredientPublished },
    { count: rulePublished },
    { count: needsReview },
    { data: lastPub },
    { data: lastRule },
  ] = await Promise.all([
    supabase
      .from("ingredients")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "draft"),
    supabase
      .from("ingredient_rules")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "draft"),
    supabase
      .from("regulatory_documents")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "draft"),
    supabase
      .from("ingredients")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "ready_for_review"),
    supabase
      .from("ingredient_rules")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "ready_for_review"),
    supabase
      .from("regulatory_documents")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "ready_for_review"),
    supabase
      .from("ingredients")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "published"),
    supabase
      .from("ingredient_rules")
      .select("*", { count: "exact", head: true })
      .eq("editorial_status", "published"),
    supabase
      .from("ingredient_rules")
      .select("*", { count: "exact", head: true })
      .eq("needs_review", true),
    supabase
      .from("content_revisions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ingredient_rules")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    drafts: (ingredientDrafts ?? 0) + (ruleDrafts ?? 0) + (docDrafts ?? 0),
    readyForReview:
      (ingredientReady ?? 0) + (ruleReady ?? 0) + (docReady ?? 0),
    published: (ingredientPublished ?? 0) + (rulePublished ?? 0),
    needsReview: needsReview ?? 0,
    lastPublication: lastPub?.created_at ?? null,
    lastImport: lastRule?.created_at ?? null,
  };
}
