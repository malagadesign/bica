import { CSV_RULE_STATUSES } from "@/lib/regulatory/csv-normalize";
import type {
  BicaNormalizedRule,
  ValidationIssue,
  ValidationReport,
} from "../types";

export function validateNormalizedRules(
  rules: BicaNormalizedRule[]
): ValidationReport {
  const warnings: ValidationIssue[] = [];
  const errors: ValidationIssue[] = [];
  const seenRecordIds = new Map<string, number>();

  rules.forEach((rule, index) => {
    const row = index + 2;

    if (!rule.source_record_id) {
      errors.push({
        row,
        code: "missing_record_id",
        message: "Falta record_id.",
        severity: "error",
      });
    } else if (seenRecordIds.has(rule.source_record_id)) {
      errors.push({
        row,
        code: "duplicate_record_id",
        message: `record_id duplicado: ${rule.source_record_id}`,
        severity: "error",
      });
    } else {
      seenRecordIds.set(rule.source_record_id, row);
    }

    if (!rule.list_type) {
      errors.push({
        row,
        code: "missing_list_type",
        message: "Falta list_type.",
        severity: "error",
      });
    }

    if (!rule.rule_status) {
      errors.push({
        row,
        code: "missing_status",
        message: "Falta status regulatorio.",
        severity: "error",
      });
    } else if (
      !CSV_RULE_STATUSES.includes(
        rule.rule_status as (typeof CSV_RULE_STATUSES)[number]
      )
    ) {
      warnings.push({
        row,
        code: "unknown_status",
        message: `Estado no catalogado: ${rule.rule_status}`,
        severity: "warning",
      });
    }

    if (!rule.ingredient.dedup_key) {
      warnings.push({
        row,
        code: "missing_ingredient_identity",
        message: "Sin identidad de ingrediente (INCI, CAS, CI o nombre ES).",
        severity: "warning",
      });
    }

    if (!rule.document.source_label && !rule.document.document_number) {
      warnings.push({
        row,
        code: "weak_document_ref",
        message: "Referencia documental incompleta.",
        severity: "warning",
      });
    }
  });

  const blockingRows = new Set(errors.map((e) => e.row));
  const valid_rows = rules.length - blockingRows.size;

  return {
    total_rows: rules.length,
    valid_rows,
    warnings,
    errors,
  };
}
