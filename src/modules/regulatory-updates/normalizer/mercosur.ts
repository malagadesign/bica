import {
  buildApplicationArea,
  dedupKeyString,
  documentFingerprint,
  hasRestrictionTriggerFields,
  ingredientDedupKey,
  normalizeText,
  parseMaxConcentration,
  parseNeedsReview,
  parseOptionalInt,
  toListCode,
  type CsvRow,
} from "@/lib/regulatory/csv-normalize";
import type { BicaNormalizedRule } from "../types";

export function normalizeCsvRow(row: CsvRow): BicaNormalizedRule {
  const listType = normalizeText(row.list_type);
  const localNorm = normalizeText(row.local_norm);
  const mercosur = normalizeText(row.mercosur_norm);
  const sourceLabel = normalizeText(row.source_label);
  const sourceUrl = normalizeText(row.source_url);
  const title =
    [sourceLabel, localNorm].filter(Boolean).join(" — ") ||
    sourceLabel ||
    "Documento normativo";

  const restriction = hasRestrictionTriggerFields(row)
    ? {
        application_area: buildApplicationArea(row),
        max_concentration: parseMaxConcentration(row.max_concentration),
        unit: normalizeText(row.unit) || null,
        expressed_as: normalizeText(row.expressed_as) || null,
        limitation_text: normalizeText(row.limitations) || null,
        warning_text: normalizeText(row.warnings) || null,
      }
    : null;

  return {
    source_record_id: normalizeText(row.record_id),
    source_sheet: normalizeText(row.source_sheet) || null,
    source_row_start: parseOptionalInt(row.source_row_start),
    source_row_end: parseOptionalInt(row.source_row_end),
    list_type: listType,
    list_code: toListCode(listType),
    rule_status: normalizeText(row.status),
    jurisdiction: normalizeText(row.jurisdiction) || null,
    document: {
      fingerprint: documentFingerprint(row),
      title,
      document_number: localNorm || null,
      mercosur_reference: mercosur || null,
      source_label: sourceLabel || null,
      source_url: sourceUrl || null,
    },
    ingredient: {
      dedup_key: dedupKeyString(ingredientDedupKey(row)) || null,
      inci_name: normalizeText(row.inci_name) || null,
      chemical_name: normalizeText(row.ingredient_name_es) || null,
      cas_number: normalizeText(row.cas_number) || null,
      color_index: normalizeText(row.color_index) || null,
      einecs: normalizeText(row.ec_number) || null,
    },
    restriction,
    conditions_raw: normalizeText(row.conditions_raw) || null,
    notes: normalizeText(row.notes) || null,
    needs_review: parseNeedsReview(row.needs_review),
    review_reason: normalizeText(row.review_reason) || null,
    entry_number_ar: normalizeText(row.entry_number_ar) || null,
    entry_number_eu: normalizeText(row.entry_number_eu) || null,
  };
}

export function normalizeCsvRows(rows: CsvRow[]): BicaNormalizedRule[] {
  return rows.map(normalizeCsvRow);
}
