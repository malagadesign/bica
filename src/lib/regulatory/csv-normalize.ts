const ACCENT_MAP: Record<string, string> = {
  Á: "A",
  É: "E",
  Í: "I",
  Ó: "O",
  Ú: "U",
  Ñ: "N",
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  ñ: "n",
};

export function stripAccents(value: string): string {
  return value.replace(/[ÁÉÍÓÚÑáéíóúñ]/g, (char) => ACCENT_MAP[char] ?? char);
}

export function toListCode(listType: string): string {
  const upper = stripAccents(listType.trim()).toUpperCase();
  return upper.replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function normalizeText(value: string | undefined | null): string {
  return (value ?? "").trim();
}

export function parseNeedsReview(value: string): boolean {
  const normalized = value.trim().toUpperCase();
  return normalized === "YES" || normalized === "Y" || normalized === "SI";
}

export function parseOptionalInt(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseMaxConcentration(value: string): number | null {
  const trimmed = value.trim().replace(",", ".");
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function hasRestrictionTriggerFields(row: CsvRow): boolean {
  return (
    !!normalizeText(row.application_area) ||
    !!normalizeText(row.max_concentration) ||
    !!normalizeText(row.unit) ||
    !!normalizeText(row.expressed_as) ||
    !!normalizeText(row.limitations) ||
    !!normalizeText(row.warnings)
  );
}

export type CsvRow = {
  record_id: string;
  source_sheet: string;
  source_row_start: string;
  source_row_end: string;
  list_type: string;
  status: string;
  jurisdiction: string;
  source_label: string;
  mercosur_norm: string;
  local_norm: string;
  source_url: string;
  entry_number_ar: string;
  entry_number_eu: string;
  ingredient_name_es: string;
  inci_name: string;
  cas_number: string;
  ec_number: string;
  color_index: string;
  color: string;
  application_area: string;
  max_concentration: string;
  unit: string;
  expressed_as: string;
  limitations: string;
  warnings: string;
  conditions_raw: string;
  notes: string;
  needs_review: string;
  review_reason: string;
};

export type IngredientDedupKey =
  | { kind: "inci"; value: string }
  | { kind: "ci"; value: string }
  | { kind: "cas"; value: string }
  | { kind: "es"; value: string }
  | null;

export function ingredientDedupKey(row: CsvRow): IngredientDedupKey {
  const inci = normalizeText(row.inci_name);
  if (inci) return { kind: "inci", value: inci.toLowerCase() };

  const ci = normalizeText(row.color_index);
  if (ci) return { kind: "ci", value: ci.toLowerCase() };

  const cas = normalizeText(row.cas_number);
  if (cas) return { kind: "cas", value: cas.toLowerCase() };

  const es = normalizeText(row.ingredient_name_es);
  if (es) return { kind: "es", value: es.toLowerCase() };

  return null;
}

export function dedupKeyString(key: IngredientDedupKey): string {
  if (!key) return "";
  return `${key.kind}:${key.value}`;
}

export function documentFingerprint(row: CsvRow): string {
  return [
    normalizeText(row.local_norm),
    normalizeText(row.mercosur_norm),
    normalizeText(row.source_label),
    normalizeText(row.source_url),
  ].join("||");
}

export function buildApplicationArea(row: CsvRow): string | null {
  const area = normalizeText(row.application_area);
  const color = normalizeText(row.color);
  if (area && color) return `${area} (${color})`;
  return area || color || null;
}

export const CSV_RULE_STATUSES = [
  "prohibited",
  "permitted_with_scope",
  "permitted_with_limit",
  "restricted",
  "limited",
  "labeling_required",
  "not_permitted",
  "prohibited_when_condition",
  "prohibited_for_scope",
  "note",
] as const;

export const MERCOSUR_CSV_COLUMNS = [
  "record_id",
  "source_sheet",
  "source_row_start",
  "source_row_end",
  "list_type",
  "status",
  "jurisdiction",
  "source_label",
  "mercosur_norm",
  "local_norm",
  "source_url",
  "entry_number_ar",
  "entry_number_eu",
  "ingredient_name_es",
  "inci_name",
  "cas_number",
  "ec_number",
  "color_index",
  "color",
  "application_area",
  "max_concentration",
  "unit",
  "expressed_as",
  "limitations",
  "warnings",
  "conditions_raw",
  "notes",
  "needs_review",
  "review_reason",
] as const;
