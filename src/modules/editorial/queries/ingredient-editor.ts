import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditorialStatus } from "../types";

export type AdminIngredientListItem = {
  id: string;
  displayName: string;
  inci_name: string | null;
  cas_number: string | null;
  editorial_status: EditorialStatus;
  is_active: boolean;
  ruleCount: number;
  needsReview: boolean;
  updated_at: string;
};

export async function listAdminIngredients(
  supabase: SupabaseClient,
  options: {
    status?: EditorialStatus;
    q?: string;
    archivedOnly?: boolean;
  } = {}
): Promise<AdminIngredientListItem[]> {
  let query = supabase
    .from("ingredients")
    .select(
      `
      id, inci_name, chemical_name, cas_number, color_index,
      editorial_status, is_active, updated_at,
      ingredient_rules ( id, needs_review )
    `
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (options.archivedOnly) {
    query = query.eq("is_active", false);
  } else {
    query = query.eq("is_active", true);
  }

  if (options.status) {
    query = query.eq("editorial_status", options.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  const q = options.q?.trim().toLowerCase();

  return (data ?? [])
    .map((row) => {
      const rules = row.ingredient_rules as { id: string; needs_review: boolean }[] | null;
      const ruleList = rules ?? [];
      const displayName =
        row.inci_name?.trim() ||
        row.chemical_name?.trim() ||
        (row.color_index ? `CI ${row.color_index}` : row.cas_number) ||
        "Sin nombre";

      return {
        id: row.id,
        displayName,
        inci_name: row.inci_name,
        cas_number: row.cas_number,
        editorial_status: row.editorial_status as EditorialStatus,
        is_active: row.is_active !== false,
        ruleCount: ruleList.length,
        needsReview: ruleList.some((r) => r.needs_review),
        updated_at: row.updated_at,
      };
    })
    .filter((item) => {
      if (!q) return true;
      const haystack = [item.displayName, item.inci_name, item.cas_number]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
}

export type IngredientEditorData = {
  id: string;
  inci_name: string | null;
  chemical_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  einecs: string | null;
  function: string | null;
  notes: string | null;
  is_active: boolean;
  editorial_status: EditorialStatus;
  published_at: string | null;
  editorial_updated_at: string | null;
  synonyms: { id: string; synonym: string; synonym_type: string }[];
  rules: {
    id: string;
    rule_status: string;
    needs_review: boolean;
    editorial_status: EditorialStatus;
    listName: string;
    documentTitle: string;
  }[];
};

export async function getIngredientEditorData(
  supabase: SupabaseClient,
  id: string
): Promise<IngredientEditorData | null> {
  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .select(
      `
      id, inci_name, chemical_name, cas_number, color_index, einecs,
      function, notes, is_active, editorial_status, published_at, editorial_updated_at,
      ingredient_synonyms ( id, synonym, synonym_type ),
      ingredient_rules (
        id, rule_status, needs_review, editorial_status,
        regulatory_lists ( name ),
        regulatory_documents ( title )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!ingredient) return null;

  type RuleJoin = {
    id: string;
    rule_status: string;
    needs_review: boolean;
    editorial_status: EditorialStatus;
    regulatory_lists: { name: string } | { name: string }[] | null;
    regulatory_documents: { title: string } | { title: string }[] | null;
  };

  const rulesRaw = (ingredient.ingredient_rules ?? []) as RuleJoin[];

  return {
    id: ingredient.id,
    inci_name: ingredient.inci_name,
    chemical_name: ingredient.chemical_name,
    cas_number: ingredient.cas_number,
    color_index: ingredient.color_index,
    einecs: ingredient.einecs,
    function: ingredient.function,
    notes: ingredient.notes,
    is_active: ingredient.is_active !== false,
    editorial_status: ingredient.editorial_status as EditorialStatus,
    published_at: ingredient.published_at,
    editorial_updated_at: ingredient.editorial_updated_at,
    synonyms: (ingredient.ingredient_synonyms ?? []) as IngredientEditorData["synonyms"],
    rules: rulesRaw.map((rule) => {
      const list = Array.isArray(rule.regulatory_lists)
        ? rule.regulatory_lists[0]
        : rule.regulatory_lists;
      const doc = Array.isArray(rule.regulatory_documents)
        ? rule.regulatory_documents[0]
        : rule.regulatory_documents;
      return {
        id: rule.id,
        rule_status: rule.rule_status,
        needs_review: rule.needs_review,
        editorial_status: rule.editorial_status,
        listName: list?.name ?? "—",
        documentTitle: doc?.title ?? "—",
      };
    }),
  };
}
