import type {
  DiffSummary,
  RegulatoryUpdateItem,
} from "@/modules/regulatory-updates/types";

export type RegulatoryImpactMetrics = {
  ingredientsNew: number;
  ingredientsModified: number;
  ingredientsRemoved: number;
  restrictionsModified: number;
  relatedDocuments: number;
  needsReview: number;
};

export function computeImpactMetrics(
  summary: DiffSummary,
  items: RegulatoryUpdateItem[]
): RegulatoryImpactMetrics {
  const needsReview = items.filter(
    (item) =>
      item.normalized_payload.needs_review ||
      item.validation_issues.length > 0 ||
      item.has_conflict
  ).length;

  return {
    ingredientsNew: summary.ingredients.new,
    ingredientsModified: summary.ingredients.modified,
    ingredientsRemoved: summary.ingredients.removed,
    restrictionsModified: summary.restrictions.modified + summary.restrictions.new,
    relatedDocuments: summary.documents.new,
    needsReview,
  };
}
