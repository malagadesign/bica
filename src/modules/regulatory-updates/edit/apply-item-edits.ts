import {
  dedupKeyString,
  normalizeText,
  type IngredientDedupKey,
} from "@/lib/regulatory/csv-normalize";
import type { BicaNormalizedRule } from "../types";

function ingredientDedupKeyFromFields(
  inci: string | null,
  colorIndex: string | null,
  cas: string | null,
  chemicalName: string | null
): IngredientDedupKey {
  if (inci) return { kind: "inci", value: inci.toLowerCase() };
  if (colorIndex) return { kind: "ci", value: colorIndex.toLowerCase() };
  if (cas) return { kind: "cas", value: cas.toLowerCase() };
  if (chemicalName) return { kind: "es", value: chemicalName.toLowerCase() };
  return null;
}

export type ItemEditInput = {
  chemical_name: string;
  inci_name: string;
  cas_number: string;
  max_concentration: string;
  unit: string;
  limitation_text: string;
  warning_text: string;
  notes: string;
  review_reason: string;
};

export function applyItemEdits(
  payload: BicaNormalizedRule,
  edits: ItemEditInput
): BicaNormalizedRule {
  const chemical_name = normalizeText(edits.chemical_name) || null;
  const inci_name = normalizeText(edits.inci_name) || null;
  const cas_number = normalizeText(edits.cas_number) || null;
  const maxRaw = normalizeText(edits.max_concentration).replace(",", ".");
  const max_concentration = maxRaw
    ? Number.parseFloat(maxRaw)
    : payload.restriction?.max_concentration ?? null;
  const unit = normalizeText(edits.unit) || null;
  const limitation_text = normalizeText(edits.limitation_text) || null;
  const warning_text = normalizeText(edits.warning_text) || null;
  const notes = normalizeText(edits.notes) || null;
  const review_reason = normalizeText(edits.review_reason) || null;

  const hasRestriction =
    payload.restriction !== null ||
    max_concentration !== null ||
    unit ||
    limitation_text ||
    warning_text;

  const restriction = hasRestriction
    ? {
        application_area: payload.restriction?.application_area ?? null,
        max_concentration: Number.isFinite(max_concentration as number)
          ? (max_concentration as number)
          : null,
        unit,
        expressed_as: payload.restriction?.expressed_as ?? null,
        limitation_text,
        warning_text,
      }
    : null;

  const dedup_key =
    dedupKeyString(
      ingredientDedupKeyFromFields(
        inci_name,
        payload.ingredient.color_index,
        cas_number,
        chemical_name
      )
    ) || null;

  return {
    ...payload,
    ingredient: {
      ...payload.ingredient,
      chemical_name,
      inci_name,
      cas_number,
      dedup_key,
    },
    restriction,
    notes,
    review_reason,
    needs_review: payload.needs_review || !!review_reason,
    _meta: {
      manually_edited: true,
      edited_at: new Date().toISOString(),
    },
  };
}
