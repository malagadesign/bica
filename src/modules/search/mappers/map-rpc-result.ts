import { derivePrimaryStatus } from "@/lib/regulatory-status";
import { deriveRegulatoryCategory } from "@/lib/regulatory-summary";
import type {
  IngredientSearchResult,
  SearchIngredientsRpcRow,
  SearchMatchField,
} from "@/modules/search/types";

const MATCH_LABELS: Record<SearchMatchField, string> = {
  cas_number: "CAS",
  color_index: "Color Index",
  inci_name: "INCI",
  chemical_name: "Nombre químico",
  synonym: "Sinónimo",
  list_name: "Lista regulatoria",
  regulatory_text: "Restricción",
  full_text: "Texto",
};

function parseMatchField(value: string): SearchMatchField {
  const allowed: SearchMatchField[] = [
    "cas_number",
    "color_index",
    "inci_name",
    "chemical_name",
    "synonym",
    "list_name",
    "regulatory_text",
    "full_text",
  ];
  return allowed.includes(value as SearchMatchField)
    ? (value as SearchMatchField)
    : "full_text";
}

export function mapRpcRowToSearchResult(
  row: SearchIngredientsRpcRow
): IngredientSearchResult {
  const matchField = parseMatchField(row.match_field);
  const statuses = row.rule_statuses
    ? row.rule_statuses.split(/\s+/).filter(Boolean)
    : [];
  const primary = derivePrimaryStatus(statuses);
  const category = deriveRegulatoryCategory(statuses);
  const primaryListName =
    matchField === "list_name" && row.match_context
      ? row.match_context.trim()
      : null;

  return {
    id: row.ingredient_id,
    displayName: row.display_name,
    inci_name: row.inci_name,
    chemical_name: row.chemical_name,
    cas_number: row.cas_number,
    color_index: row.color_index,
    matchField,
    matchLabel: MATCH_LABELS[matchField],
    matchContext: row.match_context,
    ruleCount: row.rule_count,
    restrictionCount: row.restriction_count,
    needsReview: row.has_needs_review,
    primaryStatus: primary?.label ?? null,
    primaryStatusTone: primary?.tone ?? null,
    regulatoryCategory: category?.label ?? null,
    regulatoryCategoryTone: category?.tone ?? null,
    primaryListName,
    rank: row.relevance_score,
  };
}
