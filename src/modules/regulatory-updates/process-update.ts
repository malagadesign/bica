import type { SupabaseClient } from "@supabase/supabase-js";
import { parseRegulatoryFile } from "./parser/parse-file";
import { normalizeCsvRows } from "./normalizer/mercosur";
import { validateNormalizedRules } from "./validator/validate";
import {
  buildDiffItems,
  countConflicts,
  loadPublishedRulesByRecordIds,
  summarizeDiff,
} from "./diff/compute-diff";
import { getErrorMessage } from "@/lib/errors/get-error-message";
import type { RegulatoryUpdateStatus } from "./types";

export async function processRegulatoryUpdateFile(
  supabase: SupabaseClient,
  updateId: string,
  buffer: Buffer,
  filename: string
): Promise<void> {
  await supabase
    .from("regulatory_updates")
    .update({ status: "processing", error_message: null })
    .eq("id", updateId);

  try {
    const parsed = parseRegulatoryFile(buffer, filename);
    const normalized = normalizeCsvRows(parsed.rows);
    const validationReport = validateNormalizedRules(normalized);

    const recordIds = normalized
      .map((r) => r.source_record_id)
      .filter(Boolean);
    const publishedMap = await loadPublishedRulesByRecordIds(supabase, recordIds);
    const diffItems = buildDiffItems(normalized, publishedMap);

    const itemsPayload = diffItems.map((item, idx) => ({
      update_id: updateId,
      row_index: item.row_index,
      entity_type: item.entity_type,
      entity_key: item.entity_key,
      change_type: item.change_type,
      normalized_payload: item.normalized_payload,
      published_snapshot: item.published_snapshot,
      field_diff: item.field_diff,
      has_conflict: item.has_conflict,
      conflict_reason: item.conflict_reason,
      resolution: item.resolution,
      validation_issues: validationReport.errors
        .filter((e) => e.row === idx + 2)
        .concat(
          validationReport.warnings.filter((w) => w.row === idx + 2)
        ),
    }));

    await supabase
      .from("regulatory_update_items")
      .delete()
      .eq("update_id", updateId);

    const chunkSize = 100;
    for (let i = 0; i < itemsPayload.length; i += chunkSize) {
      const chunk = itemsPayload.slice(i, i + chunkSize);
      const { error } = await supabase
        .from("regulatory_update_items")
        .insert(chunk);
      if (error) throw error;
    }

    const diffSummary = summarizeDiff(
      diffItems.map((d) => ({
        change_type: d.change_type,
        normalized_payload: d.normalized_payload,
        has_conflict: d.has_conflict,
      }))
    );
    const conflictCount = countConflicts(diffItems);
    const nextStatus: RegulatoryUpdateStatus = "in_review";

    await supabase
      .from("regulatory_updates")
      .update({
        status: nextStatus,
        source_encoding: parsed.encoding,
        source_sheet: parsed.sheetName,
        row_count: normalized.length,
        validation_report: validationReport,
        diff_summary: diffSummary,
        conflict_count: conflictCount,
        validated_at: new Date().toISOString(),
      })
      .eq("id", updateId);
  } catch (err) {
    const message = getErrorMessage(err);
    await supabase
      .from("regulatory_updates")
      .update({ status: "failed", error_message: message })
      .eq("id", updateId);
    throw err;
  }
}
