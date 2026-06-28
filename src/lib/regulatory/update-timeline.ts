import type {
  RegulatoryDomainContext,
  RegulatoryUpdate,
  RegulatoryUpdateItem,
} from "@/modules/regulatory-updates/types";

export type UpdateTimelineStep = {
  id: string;
  label: string;
  completed: boolean;
  current: boolean;
  timestamp: string | null;
};

export function buildUpdateTimeline(
  update: RegulatoryUpdate,
  items: RegulatoryUpdateItem[],
  domain: RegulatoryDomainContext
): UpdateTimelineStep[] {
  const hasCorrections = items.some(
    (item) => item.normalized_payload._meta?.manually_edited
  );
  const analysisDone = !!update.validated_at;
  const inReview =
    update.status === "in_review" ||
    update.status === "ready_to_publish" ||
    update.status === "published";
  const confirmed =
    !!domain.review_confirmed_at || update.status === "ready_to_publish";
  const published = update.status === "published";

  const steps: UpdateTimelineStep[] = [
    {
      id: "incorporated",
      label: "Normativa incorporada",
      completed: true,
      current: update.status === "draft" || update.status === "processing",
      timestamp: update.created_at,
    },
    {
      id: "analysis",
      label: "Análisis realizado",
      completed: analysisDone,
      current: update.status === "processing" || (analysisDone && !inReview),
      timestamp: update.validated_at,
    },
    {
      id: "review",
      label: "Revisión manual",
      completed: inReview && (confirmed || published),
      current: update.status === "in_review" && !confirmed,
      timestamp: update.validated_at,
    },
    {
      id: "corrections",
      label: "Correcciones",
      completed: hasCorrections,
      current: inReview && hasCorrections && !confirmed,
      timestamp: hasCorrections ? update.updated_at : null,
    },
    {
      id: "confirmation",
      label: "Confirmación",
      completed: confirmed || published,
      current: update.status === "ready_to_publish",
      timestamp: domain.review_confirmed_at ?? null,
    },
    {
      id: "publication",
      label: "Publicación",
      completed: published,
      current: false,
      timestamp: update.published_at,
    },
  ];

  return steps;
}
