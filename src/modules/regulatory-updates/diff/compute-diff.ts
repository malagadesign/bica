import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BicaNormalizedRule,
  DiffSummary,
  RegulatoryChangeType,
  RegulatoryUpdateItem,
} from "../types";
import { emptyDiffSummary } from "../types";

type PublishedRuleRow = {
  source_record_id: string;
  rule_status: string;
  needs_review: boolean;
  review_reason: string | null;
  conditions_raw: string | null;
  ingredient: {
    inci_name: string | null;
    cas_number: string | null;
    color_index: string | null;
    chemical_name: string | null;
  } | null;
  restriction: {
    max_concentration: number | null;
    unit: string | null;
    limitation_text: string | null;
    warning_text: string | null;
  } | null;
};

function buildPublishedSnapshot(row: PublishedRuleRow): Record<string, unknown> {
  return {
    source_record_id: row.source_record_id,
    rule_status: row.rule_status,
    needs_review: row.needs_review,
    review_reason: row.review_reason,
    conditions_raw: row.conditions_raw,
    ingredient: row.ingredient,
    restriction: row.restriction,
  };
}

function compareRule(
  normalized: BicaNormalizedRule,
  published: PublishedRuleRow | undefined
): {
  change_type: RegulatoryChangeType;
  field_diff: Record<string, { from: unknown; to: unknown }> | null;
  has_conflict: boolean;
  conflict_reason: string | null;
  published_snapshot: Record<string, unknown> | null;
} {
  if (!published) {
    return {
      change_type: "create",
      field_diff: null,
      has_conflict: false,
      conflict_reason: null,
      published_snapshot: null,
    };
  }

  const field_diff: Record<string, { from: unknown; to: unknown }> = {};
  const snapshot = buildPublishedSnapshot(published);

  if (published.rule_status !== normalized.rule_status) {
    field_diff.rule_status = {
      from: published.rule_status,
      to: normalized.rule_status,
    };
  }

  if (published.needs_review !== normalized.needs_review) {
    field_diff.needs_review = {
      from: published.needs_review,
      to: normalized.needs_review,
    };
  }

  if ((published.review_reason ?? "") !== (normalized.review_reason ?? "")) {
    field_diff.review_reason = {
      from: published.review_reason,
      to: normalized.review_reason,
    };
  }

  if ((published.conditions_raw ?? "") !== (normalized.conditions_raw ?? "")) {
    field_diff.conditions_raw = {
      from: published.conditions_raw,
      to: normalized.conditions_raw,
    };
  }

  const pubConc = published.restriction?.max_concentration ?? null;
  const newConc = normalized.restriction?.max_concentration ?? null;
  if (pubConc !== newConc) {
    field_diff.max_concentration = { from: pubConc, to: newConc };
  }

  const pubLimit = published.restriction?.limitation_text ?? "";
  const newLimit = normalized.restriction?.limitation_text ?? "";
  if (pubLimit !== newLimit) {
    field_diff.limitation_text = { from: pubLimit, to: newLimit };
  }

  if (Object.keys(field_diff).length === 0) {
    return {
      change_type: "unchanged",
      field_diff: null,
      has_conflict: false,
      conflict_reason: null,
      published_snapshot: snapshot,
    };
  }

  const has_conflict = Object.keys(field_diff).some((key) =>
    ["rule_status", "max_concentration", "limitation_text"].includes(key)
  );

  return {
    change_type: "update",
    field_diff,
    has_conflict,
    conflict_reason: has_conflict
      ? "Cambio regulatorio significativo respecto a la versión publicada."
      : null,
    published_snapshot: snapshot,
  };
}

export async function loadPublishedRulesByRecordIds(
  supabase: SupabaseClient,
  recordIds: string[]
): Promise<Map<string, PublishedRuleRow>> {
  const map = new Map<string, PublishedRuleRow>();
  if (recordIds.length === 0) return map;

  const chunkSize = 200;
  for (let i = 0; i < recordIds.length; i += chunkSize) {
    const chunk = recordIds.slice(i, i + chunkSize);
    const { data, error } = await supabase
      .from("ingredient_rules")
      .select(
        `
        source_record_id,
        rule_status,
        needs_review,
        review_reason,
        conditions_raw,
        ingredient:ingredients(inci_name, cas_number, color_index, chemical_name),
        restriction:restrictions(max_concentration, concentration_unit, limitation_text, warning_text)
      `
      )
      .in("source_record_id", chunk)
      .eq("is_active", true);

    if (error) throw error;

    for (const row of data ?? []) {
      const rawRestriction = Array.isArray(row.restriction)
        ? row.restriction[0]
        : row.restriction;
      const ingredient = Array.isArray(row.ingredient)
        ? row.ingredient[0]
        : row.ingredient;

      const restriction = rawRestriction
        ? {
            max_concentration: rawRestriction.max_concentration,
            unit: rawRestriction.concentration_unit ?? null,
            limitation_text: rawRestriction.limitation_text,
            warning_text: rawRestriction.warning_text,
          }
        : null;

      map.set(row.source_record_id, {
        source_record_id: row.source_record_id,
        rule_status: row.rule_status,
        needs_review: row.needs_review,
        review_reason: row.review_reason,
        conditions_raw: row.conditions_raw,
        ingredient: ingredient ?? null,
        restriction: restriction ?? null,
      });
    }
  }

  return map;
}

export function buildDiffItems(
  normalizedRules: BicaNormalizedRule[],
  publishedMap: Map<string, PublishedRuleRow>
): Omit<
  RegulatoryUpdateItem,
  "id" | "update_id" | "created_at" | "validation_issues"
>[] {
  const documentFingerprints = new Set<string>();
  const ingredientKeys = new Set<string>();

  return normalizedRules.map((rule, index) => {
    if (rule.document.fingerprint) documentFingerprints.add(rule.document.fingerprint);
    if (rule.ingredient.dedup_key) ingredientKeys.add(rule.ingredient.dedup_key);

    const published = publishedMap.get(rule.source_record_id);
    const comparison = compareRule(rule, published);

    return {
      row_index: index + 1,
      entity_type: "rule" as const,
      entity_key: rule.source_record_id,
      change_type: comparison.change_type,
      normalized_payload: rule,
      published_snapshot: comparison.published_snapshot,
      field_diff: comparison.field_diff,
      has_conflict: comparison.has_conflict,
      conflict_reason: comparison.conflict_reason,
      resolution: comparison.has_conflict ? ("pending" as const) : null,
    };
  });
}

export function summarizeDiff(
  items: Pick<RegulatoryUpdateItem, "change_type" | "normalized_payload" | "has_conflict">[]
): DiffSummary {
  const summary = emptyDiffSummary();
  const docFps = new Set<string>();
  const ingKeys = new Set<string>();

  for (const item of items) {
    const rule = item.normalized_payload;
    const isNewDoc = docFps.has(rule.document.fingerprint) === false;
    if (isNewDoc) {
      docFps.add(rule.document.fingerprint);
      summary.documents.new += 1;
    }

    if (rule.ingredient.dedup_key) {
      if (!ingKeys.has(rule.ingredient.dedup_key)) {
        ingKeys.add(rule.ingredient.dedup_key);
        if (item.change_type === "create") summary.ingredients.new += 1;
        else if (item.change_type === "update") summary.ingredients.modified += 1;
      }
    }

    if (item.change_type === "create") summary.rules.new += 1;
    else if (item.change_type === "update") summary.rules.modified += 1;
    else if (item.change_type === "unchanged") summary.unchanged += 1;

    if (rule.restriction && item.change_type !== "unchanged") {
      summary.restrictions.new += 1;
    }
  }

  return summary;
}

export function countConflicts(
  items: Pick<RegulatoryUpdateItem, "has_conflict" | "resolution">[]
): number {
  return items.filter(
    (i) => i.has_conflict && (i.resolution === "pending" || i.resolution === null)
  ).length;
}

export function isReadyToPublish(
  items: Pick<RegulatoryUpdateItem, "has_conflict" | "resolution">[]
): boolean {
  return countConflicts(items) === 0;
}
