/**
 * Diagnóstico local del pipeline de actualizaciones normativas.
 * Uso: npx tsx scripts/test-regulatory-upload.ts
 */
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseRegulatoryFile } from "../src/modules/regulatory-updates/parser/parse-file";
import { normalizeCsvRows } from "../src/modules/regulatory-updates/normalizer/mercosur";
import { validateNormalizedRules } from "../src/modules/regulatory-updates/validator/validate";
import {
  buildDiffItems,
  loadPublishedRulesByRecordIds,
} from "../src/modules/regulatory-updates/diff/compute-diff";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const supabase = createClient(url, key);
  const buf = fs.readFileSync("data/seeds/proyecto_listados_test_sample.csv");
  const parsed = parseRegulatoryFile(buf, "proyecto_listados_test_sample.csv");
  console.log("parsed:", parsed.rows.length, "missing:", parsed.missingColumns);

  const normalized = normalizeCsvRows(parsed.rows);
  console.log("normalized:", normalized.length);

  const validation = validateNormalizedRules(normalized);
  console.log("validation errors:", validation.errors.length);

  const recordIds = normalized.map((r) => r.source_record_id).filter(Boolean);
  console.log("loading published for:", recordIds);

  try {
    const publishedMap = await loadPublishedRulesByRecordIds(supabase, recordIds);
    console.log("published found:", publishedMap.size);
    const diffItems = buildDiffItems(normalized, publishedMap);
    console.log(
      "diff:",
      diffItems.map((d) => `${d.entity_key} ${d.change_type} conflict=${d.has_conflict}`)
    );

    const sample = diffItems[0];
    const payload = {
      update_id: "00000000-0000-0000-0000-000000000001",
      row_index: sample.row_index,
      entity_type: sample.entity_type,
      entity_key: sample.entity_key,
      change_type: sample.change_type,
      normalized_payload: sample.normalized_payload,
      published_snapshot: sample.published_snapshot,
      field_diff: sample.field_diff,
      has_conflict: sample.has_conflict,
      conflict_reason: sample.conflict_reason,
      resolution: sample.resolution,
      validation_issues: [],
    };

    const { error } = await supabase.from("regulatory_update_items").insert(payload);
    if (error) {
      console.error("INSERT ERROR:", JSON.stringify(error, null, 2));
    } else {
      console.log("insert ok (dry - may need cleanup)");
      await supabase
        .from("regulatory_update_items")
        .delete()
        .eq("update_id", payload.update_id);
    }
  } catch (err) {
    console.error("FAIL:", err);
  }
}

main();
