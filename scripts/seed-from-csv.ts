#!/usr/bin/env npx tsx
/**
 * Etapa 1A — Seed controlado desde CSV normalizado.
 * NO es el importador transaccional (Etapa 2).
 *
 * Uso:
 *   npx tsx scripts/seed-from-csv.ts --dry-run
 *   npx tsx scripts/seed-from-csv.ts
 *   npx tsx scripts/seed-from-csv.ts --only-review
 *
 * Requiere SUPABASE_SERVICE_ROLE_KEY y NEXT_PUBLIC_SUPABASE_URL en .env
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildApplicationArea,
  dedupKeyString,
  documentFingerprint,
  hasRestrictionTriggerFields,
  ingredientDedupKey,
  normalizeText,
  parseMaxConcentration,
  parseNeedsReview,
  parseOptionalInt,
  toListCode,
  type CsvRow,
} from "../../src/lib/regulatory/csv-normalize";
import {
  createEmptyReport,
  printReport,
  writeReportFile,
  type SeedReport,
} from "./seed/report";

const EXPECTED_COLUMNS = [
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
];

const AUTHORITY = {
  name: "Argentina / MERCOSUR",
  code: "AR_MERCOSUR",
  country: "AR",
  region: "MERCOSUR",
  description: "Autoridad regulatoria Argentina / MERCOSUR (seed Etapa 1A)",
};

function loadEnvFile(): void {
  try {
    const envPath = join(process.cwd(), ".env");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      value = value.replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env opcional si vars ya están en el entorno
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const onlyReview = args.includes("--only-review");
  const fileArg = args.find((a) => a.startsWith("--file="));
  const file = fileArg
    ? fileArg.slice("--file=".length)
    : "data/seeds/proyecto_listados_normalizado.csv";
  return { dryRun, onlyReview, file };
}

function readCsv(filePath: string): CsvRow[] {
  const absolute = join(process.cwd(), filePath);
  const raw = readFileSync(absolute, "utf-8");
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  }) as CsvRow[];

  const fields = Object.keys(rows[0] ?? {});
  const missing = EXPECTED_COLUMNS.filter((c) => !fields.includes(c));
  if (missing.length) {
    throw new Error(`Columnas faltantes en CSV: ${missing.join(", ")}`);
  }

  return rows;
}

function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type CatalogIds = {
  authorityId: string;
  documentIds: Map<string, string>;
  listIds: Map<string, string>;
  ingredientIds: Map<string, string>;
  existingRecordIds: Set<string>;
};

async function loadExistingRecordIds(
  supabase: SupabaseClient
): Promise<Set<string>> {
  const ids = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("ingredient_rules")
      .select("source_record_id")
      .order("source_record_id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data?.length) break;

    for (const row of data) {
      ids.add(row.source_record_id);
    }

    if (data.length < pageSize) break;
    from += pageSize;
  }

  return ids;
}

async function ensureAuthority(
  supabase: SupabaseClient | null,
  dryRun: boolean,
  report: SeedReport
): Promise<string> {
  if (!dryRun && supabase) {
    const { data: existing } = await supabase
      .from("regulatory_authorities")
      .select("id")
      .eq("code", AUTHORITY.code)
      .maybeSingle();

    if (existing?.id) return existing.id;
  }

  if (dryRun) {
    report.authorities_created += 1;
    return "dry-run-authority-id";
  }

  if (!supabase) {
    throw new Error("Cliente Supabase requerido fuera de dry-run");
  }

  const { data, error } = await supabase
    .from("regulatory_authorities")
    .insert(AUTHORITY)
    .select("id")
    .single();

  if (error) throw error;
  report.authorities_created += 1;
  return data.id;
}

async function ensureDocument(
  supabase: SupabaseClient | null,
  authorityId: string,
  row: CsvRow,
  cache: Map<string, string>,
  dryRun: boolean,
  report: SeedReport
): Promise<string> {
  const fp = documentFingerprint(row);
  const cached = cache.get(fp);
  if (cached) return cached;

  const localNorm = normalizeText(row.local_norm);
  const mercosur = normalizeText(row.mercosur_norm);
  const sourceLabel = normalizeText(row.source_label);
  const sourceUrl = normalizeText(row.source_url);

  if (!dryRun) {
    if (!supabase) throw new Error("Cliente Supabase requerido");
    let query = supabase
      .from("regulatory_documents")
      .select("id")
      .eq("authority_id", authorityId);

    query = localNorm
      ? query.eq("document_number", localNorm)
      : query.is("document_number", null);
    query = sourceUrl
      ? query.eq("source_url", sourceUrl)
      : query.is("source_url", null);
    query = mercosur
      ? query.eq("mercosur_reference", mercosur)
      : query.is("mercosur_reference", null);
    query = sourceLabel
      ? query.eq("source_label", sourceLabel)
      : query.is("source_label", null);

    const { data: matches } = await query.maybeSingle();

    if (matches?.id) {
      cache.set(fp, matches.id);
      return matches.id;
    }
  }

  const title = [sourceLabel, localNorm].filter(Boolean).join(" — ") || sourceLabel || "Documento normativo";
  const summary = mercosur ? `MERCOSUR: ${mercosur}` : null;

  if (dryRun) {
    const fakeId = `dry-doc-${cache.size}`;
    cache.set(fp, fakeId);
    report.documents_created += 1;
    return fakeId;
  }

  if (!supabase) throw new Error("Cliente Supabase requerido");

  const { data, error } = await supabase
    .from("regulatory_documents")
    .insert({
      authority_id: authorityId,
      title,
      document_type: localNorm ? "resolution" : "annex",
      document_number: localNorm || null,
      source_url: sourceUrl || null,
      mercosur_reference: mercosur || null,
      source_label: sourceLabel || null,
      summary,
      status: "active",
    })
    .select("id")
    .single();

  if (error) throw error;
  cache.set(fp, data.id);
  report.documents_created += 1;
  return data.id;
}

async function ensureList(
  supabase: SupabaseClient | null,
  authorityId: string,
  listType: string,
  cache: Map<string, string>,
  dryRun: boolean,
  report: SeedReport
): Promise<string> {
  const code = toListCode(listType);
  const cached = cache.get(code);
  if (cached) return cached;

  if (!dryRun) {
    if (!supabase) throw new Error("Cliente Supabase requerido");
    const { data: existing } = await supabase
      .from("regulatory_lists")
      .select("id")
      .eq("authority_id", authorityId)
      .eq("code", code)
      .maybeSingle();

    if (existing?.id) {
      cache.set(code, existing.id);
      return existing.id;
    }
  }

  if (dryRun) {
    const fakeId = `dry-list-${cache.size}`;
    cache.set(code, fakeId);
    report.lists_created += 1;
    return fakeId;
  }

  if (!supabase) throw new Error("Cliente Supabase requerido");

  const { data, error } = await supabase
    .from("regulatory_lists")
    .insert({
      authority_id: authorityId,
      name: listType.trim(),
      code,
      description: `Lista ${listType} (seed Etapa 1A)`,
    })
    .select("id")
    .single();

  if (error) throw error;
  cache.set(code, data.id);
  report.lists_created += 1;
  return data.id;
}

async function findExistingIngredientId(
  supabase: SupabaseClient,
  key: ReturnType<typeof ingredientDedupKey>
): Promise<string | null> {
  if (!key) return null;

  if (key.kind === "inci") {
    const { data } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("inci_name", key.value)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (key.kind === "ci") {
    const { data } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("color_index", key.value)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (key.kind === "cas") {
    const { data } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("cas_number", key.value)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  if (key.kind === "es") {
    const { data } = await supabase
      .from("ingredients")
      .select("id")
      .ilike("chemical_name", key.value)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  return null;
}

async function ensureIngredient(
  supabase: SupabaseClient | null,
  row: CsvRow,
  cache: Map<string, string>,
  dryRun: boolean,
  report: SeedReport
): Promise<string | null> {
  const key = ingredientDedupKey(row);
  if (!key) return null;

  const cacheKey = dedupKeyString(key);
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (!dryRun) {
    if (!supabase) throw new Error("Cliente Supabase requerido");
    const existingId = await findExistingIngredientId(supabase, key);
    if (existingId) {
      cache.set(cacheKey, existingId);
      return existingId;
    }
  }

  const payload = {
    inci_name: normalizeText(row.inci_name) || null,
    chemical_name: normalizeText(row.ingredient_name_es) || null,
    cas_number: normalizeText(row.cas_number) || null,
    einecs: normalizeText(row.ec_number) || null,
    color_index: normalizeText(row.color_index) || null,
    function: normalizeText(row.list_type) || null,
    notes: normalizeText(row.notes) || null,
  };

  if (dryRun) {
    const fakeId = `dry-ing-${cache.size}`;
    cache.set(cacheKey, fakeId);
    report.ingredients_created += 1;
    return fakeId;
  }

  if (!supabase) throw new Error("Cliente Supabase requerido");

  const { data, error } = await supabase
    .from("ingredients")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  cache.set(cacheKey, data.id);
  report.ingredients_created += 1;
  return data.id;
}

async function ensureSynonyms(
  supabase: SupabaseClient | null,
  ingredientId: string,
  row: CsvRow,
  dryRun: boolean,
  report: SeedReport
): Promise<void> {
  const synonyms: { synonym: string; synonym_type: string }[] = [];
  const inci = normalizeText(row.inci_name);
  const es = normalizeText(row.ingredient_name_es);
  const ci = normalizeText(row.color_index);

  if (es && es.toLowerCase() !== inci.toLowerCase()) {
    synonyms.push({ synonym: es, synonym_type: "spanish_name" });
  }

  if (ci) {
    synonyms.push({ synonym: ci, synonym_type: "ci" });
  }

  for (const syn of synonyms) {
    if (dryRun) {
      report.synonyms_created += 1;
      continue;
    }

    if (!supabase) throw new Error("Cliente Supabase requerido");

    const { error } = await supabase.from("ingredient_synonyms").upsert(
      {
        ingredient_id: ingredientId,
        synonym: syn.synonym,
        synonym_type: syn.synonym_type,
        source: "csv_seed_1a",
      },
      { onConflict: "ingredient_id,synonym,synonym_type", ignoreDuplicates: true }
    );

    if (error && error.code !== "23505") {
      throw error;
    }
    report.synonyms_created += 1;
  }
}

async function processRow(
  supabase: SupabaseClient | null,
  row: CsvRow,
  catalog: CatalogIds,
  dryRun: boolean,
  report: SeedReport
): Promise<void> {
  report.rows_processed += 1;

  if (catalog.existingRecordIds.has(row.record_id)) {
    report.rows_skipped += 1;
    report.rows_skipped_existing += 1;
    return;
  }

  const dedupKey = ingredientDedupKey(row);
  if (!dedupKey) {
    report.rows_skipped += 1;
    report.rows_skipped_no_identity += 1;
    report.warnings.push(
      `Sin identidad deduplicable: record_id=${row.record_id}`
    );
    return;
  }

  const documentId = await ensureDocument(
    supabase,
    catalog.authorityId,
    row,
    catalog.documentIds,
    dryRun,
    report
  );

  const listId = await ensureList(
    supabase,
    catalog.authorityId,
    row.list_type,
    catalog.listIds,
    dryRun,
    report
  );

  const ingredientId = await ensureIngredient(
    supabase,
    row,
    catalog.ingredientIds,
    dryRun,
    report
  );

  if (!ingredientId) {
    report.rows_skipped += 1;
    report.rows_skipped_no_identity += 1;
    return;
  }

  await ensureSynonyms(supabase, ingredientId, row, dryRun, report);

  const needsReview = parseNeedsReview(row.needs_review);
  if (needsReview) report.needs_review_count += 1;

  const rulePayload = {
    ingredient_id: ingredientId,
    authority_id: catalog.authorityId,
    list_id: listId,
    document_id: documentId,
    rule_status: normalizeText(row.status) || "unknown",
    source_record_id: row.record_id,
    source_sheet: normalizeText(row.source_sheet) || null,
    source_row_start: parseOptionalInt(row.source_row_start),
    source_row_end: parseOptionalInt(row.source_row_end),
    entry_number_ar: normalizeText(row.entry_number_ar) || null,
    entry_number_eu: normalizeText(row.entry_number_eu) || null,
    conditions_raw: normalizeText(row.conditions_raw) || null,
    needs_review: needsReview,
    review_reason: normalizeText(row.review_reason) || null,
    regulatory_update_id: null,
  };

  if (dryRun) {
    report.rules_created += 1;
    report.rule_versions_created += 1;
    if (hasRestrictionTriggerFields(row)) report.restrictions_created += 1;
    report.rows_inserted += 1;
    return;
  }

  if (!supabase) throw new Error("Cliente Supabase requerido");

  const { data: rule, error: ruleError } = await supabase
    .from("ingredient_rules")
    .insert(rulePayload)
    .select("id")
    .single();

  if (ruleError) throw ruleError;
  report.rules_created += 1;
  report.rows_inserted += 1;

  let restrictionSnapshot: Record<string, unknown> | null = null;

  if (hasRestrictionTriggerFields(row)) {
    const restrictionPayload = {
      ingredient_rule_id: rule.id,
      application_area: buildApplicationArea(row),
      max_concentration: parseMaxConcentration(row.max_concentration),
      concentration_unit: normalizeText(row.unit) || null,
      expressed_as: normalizeText(row.expressed_as) || null,
      limitation_text: normalizeText(row.limitations) || null,
      warning_text: normalizeText(row.warnings) || null,
      condition_text: normalizeText(row.conditions_raw) || null,
      notes: normalizeText(row.notes) || null,
      extended_conditions: null,
    };

    const { data: restriction, error: restrError } = await supabase
      .from("restrictions")
      .insert(restrictionPayload)
      .select("*")
      .single();

    if (restrError) throw restrError;
    report.restrictions_created += 1;
    restrictionSnapshot = restriction;
  }

  const snapshot = {
    schema_version: 1,
    seed_origin: "etapa_1a_controlled_csv_seed",
    source_file: "proyecto_listados_normalizado.csv",
    rule: rulePayload,
    restrictions: restrictionSnapshot ? [restrictionSnapshot] : [],
    seeded_at: new Date().toISOString(),
  };

  const { error: versionError } = await supabase.from("rule_versions").insert({
    ingredient_rule_id: rule.id,
    version_number: "1.0",
    schema_version: 1,
    data_snapshot: snapshot,
    change_description: "Etapa 1A — seed inicial controlado desde CSV",
    created_by: "seed_script_1a",
  });

  if (versionError) throw versionError;
  report.rule_versions_created += 1;
}

async function main(): Promise<void> {
  loadEnvFile();
  const { dryRun, onlyReview, file } = parseArgs();
  const report = createEmptyReport(file, dryRun);

  console.log(
    dryRun
      ? "Dry-run: simulando seed Etapa 1A..."
      : "Ejecutando seed Etapa 1A (carga inicial controlada)..."
  );

  const rows = readCsv(file);
  const filtered = onlyReview
    ? rows.filter((r) => parseNeedsReview(r.needs_review))
    : rows;

  if (onlyReview) {
    report.warnings.push(
      `Modo --only-review: ${filtered.length} filas de ${rows.length}`
    );
  }

  const supabase = dryRun ? null : createAdminClient();
  const authorityId = await ensureAuthority(supabase, dryRun, report);
  const existingRecordIds =
    dryRun || !supabase
      ? new Set<string>()
      : await loadExistingRecordIds(supabase);

  const catalog: CatalogIds = {
    authorityId,
    documentIds: new Map(),
    listIds: new Map(),
    ingredientIds: new Map(),
    existingRecordIds,
  };

  for (let i = 0; i < filtered.length; i++) {
    const row = filtered[i];
    if (!dryRun && (i === 0 || (i + 1) % 50 === 0 || i + 1 === filtered.length)) {
      const skipped = report.rows_skipped_existing;
      const inserted = report.rows_inserted;
      console.log(
        `[${i + 1}/${filtered.length}] insertadas: ${inserted}, omitidas: ${skipped}, reglas nuevas: ${report.rules_created}`
      );
    }
    try {
      await processRow(supabase, row, catalog, dryRun, report);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err
            ? String((err as { message: unknown }).message)
            : JSON.stringify(err);
      report.errors.push(`record_id=${row.record_id}: ${message}`);
    }
  }

  report.finished_at = new Date().toISOString();
  printReport(report);

  const reportPath = writeReportFile(report);
  console.log(`\nReporte guardado: ${reportPath}`);

  if (report.errors.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
