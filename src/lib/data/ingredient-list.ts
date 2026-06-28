import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import { PUBLIC_EDITORIAL_STATUS } from "@/lib/editorial/public-visibility";
import {
  derivePrimaryStatus,
  type StatusTone,
} from "@/lib/regulatory-status";
import { escapeLikePattern } from "@/lib/search/escape-like";
import { searchIngredients } from "@/lib/search";

export type IngredientListItem = {
  id: string;
  displayName: string;
  inci_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  ruleCount: number;
  needsReview: boolean;
  statusLabel: string | null;
  statusTone: StatusTone | null;
};

const PAGE_SIZE = 24;

export async function getIngredientList(
  supabase: SupabaseClient,
  options: { query?: string; page?: number }
): Promise<{ items: IngredientListItem[]; total: number; page: number; pageSize: number }> {
  const query = options.query?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);

  if (query.length >= 2) {
    const results = await searchIngredients(supabase, query, { limit: 200 });
    const from = (page - 1) * PAGE_SIZE;
    const slice = results.slice(from, from + PAGE_SIZE);

    return {
      items: slice.map((r) => ({
        id: r.id,
        displayName: r.displayName,
        inci_name: r.inci_name,
        cas_number: r.cas_number,
        color_index: r.color_index,
        ruleCount: r.ruleCount,
        needsReview: r.needsReview,
        statusLabel: r.primaryStatus,
        statusTone: r.primaryStatusTone,
      })),
      total: results.length,
      page,
      pageSize: PAGE_SIZE,
    };
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: ingredients, count } = await supabase
    .from("ingredients")
    .select("id, inci_name, chemical_name, cas_number, color_index", {
      count: "exact",
    })
    .eq("is_active", true)
    .eq("editorial_status", PUBLIC_EDITORIAL_STATUS)
    .order("chemical_name", { ascending: true, nullsFirst: false })
    .range(from, to);

  const ids = (ingredients ?? []).map((i) => i.id);
  const { data: rules } = ids.length
    ? await supabase
        .from("ingredient_rules")
        .select("ingredient_id, rule_status, needs_review")
        .in("ingredient_id", ids)
        .eq("is_active", true)
        .eq("editorial_status", PUBLIC_EDITORIAL_STATUS)
    : { data: [] };

  const ruleMap = new Map<
    string,
    { count: number; needsReview: boolean; statuses: string[] }
  >();

  for (const rule of rules ?? []) {
    const cur = ruleMap.get(rule.ingredient_id) ?? {
      count: 0,
      needsReview: false,
      statuses: [] as string[],
    };
    cur.count += 1;
    cur.needsReview ||= rule.needs_review;
    cur.statuses.push(rule.rule_status);
    ruleMap.set(rule.ingredient_id, cur);
  }

  const items: IngredientListItem[] = (ingredients ?? []).map((ing) => {
    const meta = ruleMap.get(ing.id);
    const primary = derivePrimaryStatus(meta?.statuses ?? []);
    return {
      id: ing.id,
      displayName: getIngredientDisplayName(ing),
      inci_name: ing.inci_name,
      cas_number: ing.cas_number,
      color_index: ing.color_index,
      ruleCount: meta?.count ?? 0,
      needsReview: meta?.needsReview ?? false,
      statusLabel: primary?.label ?? null,
      statusTone: primary?.tone ?? null,
    };
  });

  return {
    items,
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export { PAGE_SIZE as INGREDIENT_LIST_PAGE_SIZE, escapeLikePattern };
