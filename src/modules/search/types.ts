export type SearchMatchField =
  | "cas_number"
  | "color_index"
  | "inci_name"
  | "chemical_name"
  | "synonym"
  | "list_name"
  | "regulatory_text"
  | "full_text";

import type { StatusTone } from "@/lib/regulatory-status";

export type IngredientSearchResult = {
  id: string;
  displayName: string;
  inci_name: string | null;
  chemical_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  matchField: SearchMatchField;
  matchLabel: string;
  matchContext: string | null;
  ruleCount: number;
  restrictionCount: number;
  needsReview: boolean;
  primaryStatus: string | null;
  primaryStatusTone: StatusTone | null;
  regulatoryCategory: string | null;
  regulatoryCategoryTone: StatusTone | null;
  primaryListName: string | null;
  rank: number;
};

export type SearchIngredientsRpcRow = {
  ingredient_id: string;
  display_name: string;
  inci_name: string | null;
  chemical_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  rule_count: number;
  restriction_count: number;
  has_needs_review: boolean;
  rule_statuses: string;
  match_field: string;
  match_context: string | null;
  relevance_score: number;
};
