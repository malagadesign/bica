import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditorialStatus } from "../types";

export type AdminRuleListItem = {
  id: string;
  ingredientName: string;
  listName: string;
  documentTitle: string;
  rule_status: string;
  needs_review: boolean;
  editorial_status: EditorialStatus;
  updated_at: string;
};

export async function listAdminRules(
  supabase: SupabaseClient
): Promise<AdminRuleListItem[]> {
  const { data, error } = await supabase
    .from("ingredient_rules")
    .select(
      `
      id, rule_status, needs_review, editorial_status, updated_at,
      ingredients ( inci_name, chemical_name, cas_number ),
      regulatory_lists ( name ),
      regulatory_documents ( title )
    `
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) throw error;

  return (data ?? []).map((row) => {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    const list = Array.isArray(row.regulatory_lists)
      ? row.regulatory_lists[0]
      : row.regulatory_lists;
    const doc = Array.isArray(row.regulatory_documents)
      ? row.regulatory_documents[0]
      : row.regulatory_documents;

    const ingredientName =
      ing?.inci_name?.trim() ||
      ing?.chemical_name?.trim() ||
      ing?.cas_number ||
      "Sin nombre";

    return {
      id: row.id,
      ingredientName,
      listName: list?.name ?? "—",
      documentTitle: doc?.title ?? "—",
      rule_status: row.rule_status,
      needs_review: row.needs_review,
      editorial_status: row.editorial_status as EditorialStatus,
      updated_at: row.updated_at,
    };
  });
}

export type RuleEditorData = {
  id: string;
  rule_status: string;
  conditions_raw: string | null;
  needs_review: boolean;
  editorial_status: EditorialStatus;
  ingredientName: string;
  ingredientId: string;
  listName: string;
  documentTitle: string;
  documentId: string;
  restrictions: {
    id: string;
    application_area: string | null;
    max_concentration: number | null;
    concentration_unit: string | null;
    limitation_text: string | null;
    warning_text: string | null;
    condition_text: string | null;
  }[];
};

export async function getRuleEditorData(
  supabase: SupabaseClient,
  id: string
): Promise<RuleEditorData | null> {
  const { data, error } = await supabase
    .from("ingredient_rules")
    .select(
      `
      id, rule_status, conditions_raw, needs_review, editorial_status,
      ingredient_id, document_id,
      ingredients ( inci_name, chemical_name, cas_number ),
      regulatory_lists ( name ),
      regulatory_documents ( title ),
      restrictions (
        id, application_area, max_concentration, concentration_unit,
        limitation_text, warning_text, condition_text
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const ing = Array.isArray(data.ingredients) ? data.ingredients[0] : data.ingredients;
  const list = Array.isArray(data.regulatory_lists)
    ? data.regulatory_lists[0]
    : data.regulatory_lists;
  const doc = Array.isArray(data.regulatory_documents)
    ? data.regulatory_documents[0]
    : data.regulatory_documents;

  return {
    id: data.id,
    rule_status: data.rule_status,
    conditions_raw: data.conditions_raw,
    needs_review: data.needs_review,
    editorial_status: data.editorial_status as EditorialStatus,
    ingredientId: data.ingredient_id,
    ingredientName:
      ing?.inci_name?.trim() ||
      ing?.chemical_name?.trim() ||
      ing?.cas_number ||
      "Sin nombre",
    listName: list?.name ?? "—",
    documentTitle: doc?.title ?? "—",
    documentId: data.document_id,
    restrictions: (data.restrictions ?? []) as RuleEditorData["restrictions"],
  };
}
