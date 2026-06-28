import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import {
  derivePrimaryStatus,
  type StatusTone,
} from "@/lib/regulatory-status";
import { listCodeToSlug, slugToListCode } from "@/lib/regulatory-slug";
import { unwrapJoin } from "@/lib/supabase-joins";

export type RegulatoryListSummary = {
  id: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  ingredientCount: number;
  ruleCount: number;
  lastDocument: {
    id: string;
    title: string;
    document_number: string | null;
  } | null;
};

export type ListDocumentRef = {
  id: string;
  title: string;
  document_number: string | null;
  publication_date: string | null;
  source_url: string | null;
  ruleCount: number;
};

export type ListIngredientItem = {
  id: string;
  displayName: string;
  inci_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  ruleCount: number;
  hasRestrictions: boolean;
  needsReview: boolean;
  statusLabel: string | null;
  statusTone: StatusTone | null;
  ruleId: string;
  ruleStatus: string;
};

type RuleStatsRow = {
  id: string;
  list_id: string;
  ingredient_id: string;
  needs_review: boolean;
  rule_status: string;
  document_id: string;
  regulatory_documents:
    | {
        id: string;
        title: string;
        document_number: string | null;
        publication_date: string | null;
      }
    | {
        id: string;
        title: string;
        document_number: string | null;
        publication_date: string | null;
      }[]
    | null;
};

type RuleIngredientRow = {
  id: string;
  ingredient_id: string;
  needs_review: boolean;
  rule_status: string;
  ingredients:
    | {
        id: string;
        inci_name: string | null;
        chemical_name: string | null;
        cas_number: string | null;
        color_index: string | null;
      }
    | {
        id: string;
        inci_name: string | null;
        chemical_name: string | null;
        cas_number: string | null;
        color_index: string | null;
      }[]
    | null;
  restrictions: { id: string }[] | { id: string } | null;
};

function aggregateListStats(rules: RuleStatsRow[]) {
  const byList = new Map<
    string,
    {
      ingredients: Set<string>;
      ruleCount: number;
      lastDoc: RegulatoryListSummary["lastDocument"];
      lastDate: string | null;
    }
  >();

  for (const rule of rules) {
    const cur = byList.get(rule.list_id) ?? {
      ingredients: new Set<string>(),
      ruleCount: 0,
      lastDoc: null,
      lastDate: null,
    };
    cur.ruleCount += 1;
    cur.ingredients.add(rule.ingredient_id);

    const doc = unwrapJoin(rule.regulatory_documents);
    if (doc) {
      const pub = doc.publication_date ?? "";
      if (!cur.lastDate || pub > cur.lastDate) {
        cur.lastDate = pub || cur.lastDate;
        cur.lastDoc = {
          id: doc.id,
          title: doc.title,
          document_number: doc.document_number,
        };
      }
    }

    byList.set(rule.list_id, cur);
  }

  return byList;
}

export async function getRegulatoryListsWithStats(
  supabase: SupabaseClient
): Promise<RegulatoryListSummary[]> {
  const [{ data: lists, error: listsError }, { data: rules, error: rulesError }] =
    await Promise.all([
      supabase
        .from("regulatory_lists")
        .select("id, name, code, description")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("ingredient_rules")
        .select(
          `
          id, list_id, ingredient_id, needs_review, rule_status, document_id,
          regulatory_documents ( id, title, document_number, publication_date )
        `
        )
        .eq("is_active", true),
    ]);

  if (listsError) throw listsError;
  if (rulesError) throw rulesError;

  const stats = aggregateListStats((rules ?? []) as RuleStatsRow[]);

  return (lists ?? []).map((list) => {
    const s = stats.get(list.id);
    return {
      id: list.id,
      name: list.name,
      code: list.code,
      slug: listCodeToSlug(list.code),
      description: list.description,
      ingredientCount: s?.ingredients.size ?? 0,
      ruleCount: s?.ruleCount ?? 0,
      lastDocument: s?.lastDoc ?? null,
    };
  });
}

export async function getRegulatoryListBySlug(
  supabase: SupabaseClient,
  slug: string
) {
  const code = slugToListCode(slug);

  const { data: list, error } = await supabase
    .from("regulatory_lists")
    .select("id, name, code, description, authority_id")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!list) return null;

  return {
    ...list,
    slug: listCodeToSlug(list.code),
  };
}

export async function getListDocuments(
  supabase: SupabaseClient,
  listId: string
): Promise<ListDocumentRef[]> {
  const { data: rules, error } = await supabase
    .from("ingredient_rules")
    .select(
      `
      document_id,
      regulatory_documents (
        id, title, document_number, publication_date, source_url
      )
    `
    )
    .eq("list_id", listId)
    .eq("is_active", true);

  if (error) throw error;

  const docs = new Map<string, ListDocumentRef>();

  for (const rule of rules ?? []) {
    const doc = unwrapJoin(rule.regulatory_documents);
    if (!doc) continue;

    const existing = docs.get(doc.id);
    if (existing) {
      existing.ruleCount += 1;
    } else {
      docs.set(doc.id, {
        id: doc.id,
        title: doc.title,
        document_number: doc.document_number,
        publication_date: doc.publication_date,
        source_url: doc.source_url,
        ruleCount: 1,
      });
    }
  }

  return [...docs.values()].sort((a, b) =>
    (a.title ?? "").localeCompare(b.title ?? "", "es")
  );
}

export type ListIngredientsFilter = {
  query?: string;
  needsReview?: boolean;
  hasRestrictions?: boolean;
  status?: string;
};

export async function getListIngredients(
  supabase: SupabaseClient,
  listId: string,
  filters: ListIngredientsFilter = {}
): Promise<ListIngredientItem[]> {
  let dbQuery = supabase
    .from("ingredient_rules")
    .select(
      `
      id, ingredient_id, needs_review, rule_status,
      ingredients ( id, inci_name, chemical_name, cas_number, color_index ),
      restrictions ( id )
    `
    )
    .eq("list_id", listId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  if (filters.needsReview) {
    dbQuery = dbQuery.eq("needs_review", true);
  }

  if (filters.status) {
    dbQuery = dbQuery.eq("rule_status", filters.status);
  }

  const { data: rules, error } = await dbQuery;
  if (error) throw error;

  const byIngredient = new Map<string, ListIngredientItem>();

  for (const rule of (rules ?? []) as RuleIngredientRow[]) {
    const ingredient = unwrapJoin(rule.ingredients);
    if (!ingredient) continue;

    const restrictions = rule.restrictions;
    const hasRestrictions = Array.isArray(restrictions)
      ? restrictions.length > 0
      : restrictions != null;

    if (filters.hasRestrictions && !hasRestrictions) continue;

    const displayName = getIngredientDisplayName(ingredient);
    const q = filters.query?.trim().toLowerCase();
    if (q && q.length >= 2) {
      const haystack = [
        displayName,
        ingredient.inci_name,
        ingredient.chemical_name,
        ingredient.cas_number,
        ingredient.color_index,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) continue;
    }

    const primary = derivePrimaryStatus([rule.rule_status]);
    const existing = byIngredient.get(ingredient.id);

    if (!existing) {
      byIngredient.set(ingredient.id, {
        id: ingredient.id,
        displayName,
        inci_name: ingredient.inci_name,
        cas_number: ingredient.cas_number,
        color_index: ingredient.color_index,
        ruleCount: 1,
        hasRestrictions,
        needsReview: rule.needs_review,
        statusLabel: primary?.label ?? null,
        statusTone: primary?.tone ?? null,
        ruleId: rule.id,
        ruleStatus: rule.rule_status,
      });
    } else {
      existing.ruleCount += 1;
      existing.needsReview ||= rule.needs_review;
      existing.hasRestrictions ||= hasRestrictions;
      const merged = derivePrimaryStatus([
        existing.ruleStatus,
        rule.rule_status,
      ]);
      existing.statusLabel = merged?.label ?? existing.statusLabel;
      existing.statusTone = merged?.tone ?? existing.statusTone;
    }
  }

  return [...byIngredient.values()].sort((a, b) =>
    a.displayName.localeCompare(b.displayName, "es")
  );
}

export async function getListStats(
  supabase: SupabaseClient,
  listId: string
): Promise<{ ingredientCount: number; ruleCount: number }> {
  const { data: rules, error } = await supabase
    .from("ingredient_rules")
    .select("ingredient_id")
    .eq("list_id", listId)
    .eq("is_active", true);

  if (error) throw error;

  const ingredients = new Set((rules ?? []).map((r) => r.ingredient_id));
  return {
    ingredientCount: ingredients.size,
    ruleCount: rules?.length ?? 0,
  };
}
