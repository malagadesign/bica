import type { SupabaseClient } from "@supabase/supabase-js";
import type { BicaNormalizedRule, RegulatoryUpdateItem } from "../types";

export async function getRegulatoryUpdateItems(
  supabase: SupabaseClient,
  updateId: string,
  options?: { conflictsOnly?: boolean }
): Promise<RegulatoryUpdateItem[]> {
  let query = supabase
    .from("regulatory_update_items")
    .select("*")
    .eq("update_id", updateId)
    .order("row_index", { ascending: true });

  if (options?.conflictsOnly) {
    query = query.eq("has_conflict", true);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    normalized_payload: row.normalized_payload as BicaNormalizedRule,
    published_snapshot: row.published_snapshot as Record<string, unknown> | null,
    field_diff: row.field_diff as Record<
      string,
      { from: unknown; to: unknown }
    > | null,
    validation_issues: Array.isArray(row.validation_issues)
      ? row.validation_issues
      : [],
  })) as RegulatoryUpdateItem[];
}

export async function getRegulatoryUpdateItem(
  supabase: SupabaseClient,
  itemId: string
): Promise<RegulatoryUpdateItem | null> {
  const { data, error } = await supabase
    .from("regulatory_update_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    normalized_payload: data.normalized_payload as BicaNormalizedRule,
  } as RegulatoryUpdateItem;
}
