export type EditorialStatus = "draft" | "ready_for_review" | "published";

export type EditorialEntityType =
  | "ingredient"
  | "rule"
  | "document"
  | "restriction";

export type ContentRevision = {
  id: string;
  entity_type: EditorialEntityType;
  entity_id: string;
  editorial_status: EditorialStatus;
  change_summary: string | null;
  snapshot: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

export type WorkspaceStats = {
  drafts: number;
  readyForReview: number;
  published: number;
  needsReview: number;
  lastPublication: string | null;
  lastImport: string | null;
};

export const EDITORIAL_STATUS_LABELS: Record<EditorialStatus, string> = {
  draft: "Borrador",
  ready_for_review: "Listo para revisión",
  published: "Publicado",
};

export type EditorialActionState = {
  error: string | null;
  success: string | null;
};

export const editorialActionInitial: EditorialActionState = {
  error: null,
  success: null,
};

export function isEditableStatus(status: EditorialStatus): boolean {
  return status === "draft" || status === "ready_for_review";
}
