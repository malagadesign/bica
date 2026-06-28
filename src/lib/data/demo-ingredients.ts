import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import { deriveRegulatoryCategory } from "@/lib/regulatory-summary";
import type { StatusTone } from "@/lib/regulatory-status";

export type DemoIngredient = {
  id: string;
  displayName: string;
  inci_name: string | null;
  cas_number: string | null;
  ruleCount: number;
  restrictionCount: number;
  documentCount: number;
  needsReview: boolean;
  categoryLabel: string | null;
  categoryTone: StatusTone | null;
  score: number;
  reasons: string[];
};

type ScoredRow = DemoIngredient & { statusSet: Set<string> };

export async function getDemoIngredients(
  supabase: SupabaseClient,
  limit = 8
): Promise<DemoIngredient[]> {
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      `
      id, inci_name, chemical_name, cas_number, color_index,
      ingredient_rules (
        id, rule_status, needs_review, document_id,
        restrictions ( id )
      )
    `
    )
    .eq("is_active", true)
    .limit(200);

  if (error) throw error;

  type RuleRow = {
    id: string;
    rule_status: string;
    needs_review: boolean;
    document_id: string | null;
    restrictions: { id: string }[] | null;
  };

  const scored: ScoredRow[] = (data ?? []).map((row) => {
    const rules = (row.ingredient_rules ?? []) as RuleRow[];
    const ruleCount = rules.length;
    const restrictionCount = rules.reduce(
      (n, r) => n + (r.restrictions?.length ?? 0),
      0
    );
    const documentIds = new Set(
      rules.map((r) => r.document_id).filter(Boolean) as string[]
    );
    const documentCount = documentIds.size;
    const needsReview = rules.some((r) => r.needs_review);
    const statuses = rules.map((r) => r.rule_status);
    const category = deriveRegulatoryCategory(statuses);

    const reasons: string[] = [];
    let score = 0;

    if (restrictionCount > 0) {
      score += Math.min(restrictionCount * 3, 15);
      reasons.push(`${restrictionCount} restricciones`);
    }
    if (documentCount > 0) {
      score += Math.min(documentCount * 4, 12);
      reasons.push(`${documentCount} documentos`);
    }
    if (ruleCount >= 2) {
      score += Math.min(ruleCount * 2, 10);
      reasons.push(`${ruleCount} reglas`);
    } else if (ruleCount === 1) {
      score += 2;
    }
    if (needsReview) {
      score += 8;
      reasons.push("pendiente de revisión");
    }
    if (category) {
      score += 3;
      reasons.push(category.label.toLowerCase());
    }

    return {
      id: row.id,
      displayName: getIngredientDisplayName(row),
      inci_name: row.inci_name,
      cas_number: row.cas_number,
      ruleCount,
      restrictionCount,
      documentCount,
      needsReview,
      categoryLabel: category?.label ?? null,
      categoryTone: category?.tone ?? null,
      score,
      reasons,
      statusSet: new Set(statuses),
    };
  });

  const withRules = scored.filter((s) => s.ruleCount > 0);
  const pool = withRules.length > 0 ? withRules : scored;

  pool.sort((a, b) => b.score - a.score);

  const selected: ScoredRow[] = [];
  const usedCategories = new Set<string>();

  for (const item of pool) {
    if (selected.length >= limit) break;
    const cat = item.categoryLabel ?? "sin-clasificar";
    if (selected.length < 3 || !usedCategories.has(cat) || item.score >= 10) {
      selected.push(item);
      usedCategories.add(cat);
    }
  }

  if (selected.length < Math.min(limit, pool.length)) {
    for (const item of pool) {
      if (selected.length >= limit) break;
      if (!selected.some((s) => s.id === item.id)) {
        selected.push(item);
      }
    }
  }

  return selected.slice(0, limit).map(
    ({ id, displayName, inci_name, cas_number, ruleCount, restrictionCount, documentCount, needsReview, categoryLabel, categoryTone, score, reasons }) => ({
      id,
      displayName,
      inci_name,
      cas_number,
      ruleCount,
      restrictionCount,
      documentCount,
      needsReview,
      categoryLabel,
      categoryTone,
      score,
      reasons,
    })
  );
}
