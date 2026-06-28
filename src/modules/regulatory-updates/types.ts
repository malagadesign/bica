export type RegulatoryUpdateStatus =
  | "draft"
  | "processing"
  | "validated"
  | "in_review"
  | "ready_to_publish"
  | "published"
  | "failed";

export type RegulatorySourceType = "csv" | "xlsx" | "pdf";

export type RegulatoryChangeType = "create" | "update" | "delete" | "unchanged";

export type ConflictResolution = "pending" | "keep_published" | "accept_update";

export type ValidationIssue = {
  row: number;
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type ValidationReport = {
  total_rows: number;
  valid_rows: number;
  warnings: ValidationIssue[];
  errors: ValidationIssue[];
};

export type DiffSummary = {
  ingredients: { new: number; modified: number; removed: number };
  rules: { new: number; modified: number; removed: number };
  restrictions: { new: number; modified: number };
  documents: { new: number };
  unchanged: number;
};

/** Modelo interno BICA — independiente del archivo fuente. */
export type BicaNormalizedRuleMeta = {
  manually_edited?: boolean;
  edited_at?: string;
};

export type BicaNormalizedRule = {
  source_record_id: string;
  source_sheet: string | null;
  source_row_start: number | null;
  source_row_end: number | null;
  list_type: string;
  list_code: string;
  rule_status: string;
  jurisdiction: string | null;
  document: {
    fingerprint: string;
    title: string;
    document_number: string | null;
    mercosur_reference: string | null;
    source_label: string | null;
    source_url: string | null;
  };
  ingredient: {
    dedup_key: string | null;
    inci_name: string | null;
    chemical_name: string | null;
    cas_number: string | null;
    color_index: string | null;
    einecs: string | null;
  };
  restriction: {
    application_area: string | null;
    max_concentration: number | null;
    unit: string | null;
    expressed_as: string | null;
    limitation_text: string | null;
    warning_text: string | null;
  } | null;
  conditions_raw: string | null;
  notes: string | null;
  needs_review: boolean;
  review_reason: string | null;
  entry_number_ar: string | null;
  entry_number_eu: string | null;
  _meta?: BicaNormalizedRuleMeta;
};

export type RegulatoryDomainContext = {
  regulatory_source_id?: string | null;
  document_type_id?: string | null;
  document_number?: string | null;
  official_url?: string | null;
  normative_published_date?: string | null;
  review_confirmed_at?: string | null;
};

export type RegulatoryUpdate = {
  id: string;
  name: string;
  source_type: RegulatorySourceType;
  source_filename: string;
  source_encoding: string | null;
  source_sheet: string | null;
  origin: string;
  domain_context: RegulatoryDomainContext;
  status: RegulatoryUpdateStatus;
  notes: string | null;
  row_count: number;
  validation_report: ValidationReport;
  diff_summary: DiffSummary;
  conflict_count: number;
  version_number: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  published_at: string | null;
  published_by: string | null;
  error_message: string | null;
};

export type RegulatoryUpdateItem = {
  id: string;
  update_id: string;
  row_index: number;
  entity_type: "ingredient" | "rule" | "restriction" | "document" | "list";
  entity_key: string;
  change_type: RegulatoryChangeType;
  normalized_payload: BicaNormalizedRule;
  published_snapshot: Record<string, unknown> | null;
  field_diff: Record<string, { from: unknown; to: unknown }> | null;
  has_conflict: boolean;
  conflict_reason: string | null;
  resolution: ConflictResolution | null;
  validation_issues: ValidationIssue[];
};

export type RegulatoryPublication = {
  id: string;
  update_id: string;
  version_number: number;
  change_summary: DiffSummary;
  published_by: string;
  published_at: string;
};

export const UPDATE_STATUS_LABELS: Record<RegulatoryUpdateStatus, string> = {
  draft: "Borrador",
  processing: "Procesando",
  validated: "Validada",
  in_review: "En revisión",
  ready_to_publish: "Lista para publicar",
  published: "Publicada",
  failed: "Fallida",
};

export const CHANGE_TYPE_LABELS: Record<RegulatoryChangeType, string> = {
  create: "Nuevo",
  update: "Modificado",
  delete: "Eliminado",
  unchanged: "Sin cambios",
};

export function emptyDiffSummary(): DiffSummary {
  return {
    ingredients: { new: 0, modified: 0, removed: 0 },
    rules: { new: 0, modified: 0, removed: 0 },
    restrictions: { new: 0, modified: 0 },
    documents: { new: 0 },
    unchanged: 0,
  };
}

export function emptyValidationReport(): ValidationReport {
  return {
    total_rows: 0,
    valid_rows: 0,
    warnings: [],
    errors: [],
  };
}

export type RegulatoryUpdateActionState = {
  error: string | null;
  success: string | null;
  updateId?: string;
};

export const regulatoryUpdateActionInitial: RegulatoryUpdateActionState = {
  error: null,
  success: null,
};
