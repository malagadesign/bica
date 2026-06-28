import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ingredientDedupKey,
  type CsvRow,
} from "@/lib/regulatory/csv-normalize";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  BicaNormalizedRule,
  DiffSummary,
  RegulatoryUpdateItem,
} from "../types";

const AUTHORITY = {
  name: "Argentina / MERCOSUR",
  code: "AR_MERCOSUR",
  country: "AR",
  region: "MERCOSUR",
};

type Catalog = {
  authorityId: string;
  documentIds: Map<string, string>;
  listIds: Map<string, string>;
  ingredientIds: Map<string, string>;
};

function normalizedToCsvRow(rule: BicaNormalizedRule): CsvRow {
  return {
    record_id: rule.source_record_id,
    source_sheet: rule.source_sheet ?? "",
    source_row_start: String(rule.source_row_start ?? ""),
    source_row_end: String(rule.source_row_end ?? ""),
    list_type: rule.list_type,
    status: rule.rule_status,
    jurisdiction: rule.jurisdiction ?? "",
    source_label: rule.document.source_label ?? "",
    mercosur_norm: rule.document.mercosur_reference ?? "",
    local_norm: rule.document.document_number ?? "",
    source_url: rule.document.source_url ?? "",
    entry_number_ar: rule.entry_number_ar ?? "",
    entry_number_eu: rule.entry_number_eu ?? "",
    ingredient_name_es: rule.ingredient.chemical_name ?? "",
    inci_name: rule.ingredient.inci_name ?? "",
    cas_number: rule.ingredient.cas_number ?? "",
    ec_number: rule.ingredient.einecs ?? "",
    color_index: rule.ingredient.color_index ?? "",
    color: "",
    application_area: rule.restriction?.application_area ?? "",
    max_concentration: rule.restriction?.max_concentration?.toString() ?? "",
    unit: rule.restriction?.unit ?? "",
    expressed_as: rule.restriction?.expressed_as ?? "",
    limitations: rule.restriction?.limitation_text ?? "",
    warnings: rule.restriction?.warning_text ?? "",
    conditions_raw: rule.conditions_raw ?? "",
    notes: rule.notes ?? "",
    needs_review: rule.needs_review ? "YES" : "NO",
    review_reason: rule.review_reason ?? "",
  };
}

async function ensureAuthority(supabase: SupabaseClient): Promise<string> {
  const { data: existing } = await supabase
    .from("regulatory_authorities")
    .select("id")
    .eq("code", AUTHORITY.code)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("regulatory_authorities")
    .insert(AUTHORITY)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function ensureDocument(
  supabase: SupabaseClient,
  authorityId: string,
  rule: BicaNormalizedRule,
  cache: Map<string, string>
): Promise<string> {
  const fp = rule.document.fingerprint;
  const cached = cache.get(fp);
  if (cached) return cached;

  const doc = rule.document;
  let query = supabase
    .from("regulatory_documents")
    .select("id")
    .eq("authority_id", authorityId);

  query = doc.document_number
    ? query.eq("document_number", doc.document_number)
    : query.is("document_number", null);
  query = doc.source_url
    ? query.eq("source_url", doc.source_url)
    : query.is("source_url", null);
  query = doc.mercosur_reference
    ? query.eq("mercosur_reference", doc.mercosur_reference)
    : query.is("mercosur_reference", null);
  query = doc.source_label
    ? query.eq("source_label", doc.source_label)
    : query.is("source_label", null);

  const { data: matches } = await query.maybeSingle();
  if (matches?.id) {
    cache.set(fp, matches.id);
    return matches.id;
  }

  const { data, error } = await supabase
    .from("regulatory_documents")
    .insert({
      authority_id: authorityId,
      title: doc.title,
      document_type: doc.document_number ? "resolution" : "annex",
      document_number: doc.document_number,
      source_url: doc.source_url,
      mercosur_reference: doc.mercosur_reference,
      source_label: doc.source_label,
      summary: doc.mercosur_reference ? `MERCOSUR: ${doc.mercosur_reference}` : null,
      status: "active",
      editorial_status: "published",
    })
    .select("id")
    .single();

  if (error) throw error;
  cache.set(fp, data.id);
  return data.id;
}

async function ensureList(
  supabase: SupabaseClient,
  authorityId: string,
  rule: BicaNormalizedRule,
  cache: Map<string, string>
): Promise<string> {
  const code = rule.list_code;
  const cached = cache.get(code);
  if (cached) return cached;

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

  const { data, error } = await supabase
    .from("regulatory_lists")
    .insert({
      authority_id: authorityId,
      name: rule.list_type,
      code,
      description: `Lista ${rule.list_type}`,
    })
    .select("id")
    .single();

  if (error) throw error;
  cache.set(code, data.id);
  return data.id;
}

async function ensureIngredient(
  supabase: SupabaseClient,
  rule: BicaNormalizedRule,
  cache: Map<string, string>
): Promise<string | null> {
  const row = normalizedToCsvRow(rule);
  const key = ingredientDedupKey(row);
  if (!key || !rule.ingredient.dedup_key) return null;

  const cached = cache.get(rule.ingredient.dedup_key);
  if (cached) return cached;

  let query = supabase.from("ingredients").select("id");
  if (key.kind === "inci") query = query.ilike("inci_name", key.value);
  else if (key.kind === "ci") query = query.ilike("color_index", key.value);
  else if (key.kind === "cas") query = query.ilike("cas_number", key.value);
  else query = query.ilike("chemical_name", key.value);

  const { data: existing } = await query.maybeSingle();
  if (existing?.id) {
    cache.set(rule.ingredient.dedup_key, existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from("ingredients")
    .insert({
      inci_name: rule.ingredient.inci_name,
      chemical_name: rule.ingredient.chemical_name,
      cas_number: rule.ingredient.cas_number,
      color_index: rule.ingredient.color_index,
      einecs: rule.ingredient.einecs,
      editorial_status: "published",
    })
    .select("id")
    .single();

  if (error) throw error;
  cache.set(rule.ingredient.dedup_key, data.id);
  return data.id;
}

function shouldApplyItem(item: RegulatoryUpdateItem): boolean {
  if (item.change_type === "unchanged") return false;
  if (item.resolution === "keep_published") return false;
  if (item.has_conflict && item.resolution !== "accept_update") return false;
  return item.change_type === "create" || item.change_type === "update";
}

async function applyRuleItem(
  supabase: SupabaseClient,
  catalog: Catalog,
  rule: BicaNormalizedRule,
  updateId: string,
  changeType: "create" | "update"
): Promise<void> {
  const documentId = await ensureDocument(
    supabase,
    catalog.authorityId,
    rule,
    catalog.documentIds
  );
  const listId = await ensureList(supabase, catalog.authorityId, rule, catalog.listIds);
  const ingredientId = await ensureIngredient(supabase, rule, catalog.ingredientIds);
  if (!ingredientId) return;

  const rulePayload = {
    ingredient_id: ingredientId,
    authority_id: catalog.authorityId,
    list_id: listId,
    document_id: documentId,
    rule_status: rule.rule_status,
    source_record_id: rule.source_record_id,
    source_sheet: rule.source_sheet,
    source_row_start: rule.source_row_start,
    source_row_end: rule.source_row_end,
    entry_number_ar: rule.entry_number_ar,
    entry_number_eu: rule.entry_number_eu,
    conditions_raw: rule.conditions_raw,
    needs_review: rule.needs_review,
    review_reason: rule.review_reason,
    regulatory_update_id: updateId,
    editorial_status: "published" as const,
    published_at: new Date().toISOString(),
  };

  let ruleId: string;

  if (changeType === "update") {
    const { data: existing } = await supabase
      .from("ingredient_rules")
      .select("id")
      .eq("source_record_id", rule.source_record_id)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("ingredient_rules")
        .update({ ...rulePayload, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
      ruleId = existing.id;
    } else {
      const { data, error } = await supabase
        .from("ingredient_rules")
        .insert(rulePayload)
        .select("id")
        .single();
      if (error) throw error;
      ruleId = data.id;
    }
  } else {
    const { data, error } = await supabase
      .from("ingredient_rules")
      .insert(rulePayload)
      .select("id")
      .single();
    if (error) throw error;
    ruleId = data.id;
  }

  if (rule.restriction) {
    const restrPayload = {
      ingredient_rule_id: ruleId,
      application_area: rule.restriction.application_area,
      max_concentration: rule.restriction.max_concentration,
      concentration_unit: rule.restriction.unit,
      expressed_as: rule.restriction.expressed_as,
      limitation_text: rule.restriction.limitation_text,
      warning_text: rule.restriction.warning_text,
      condition_text: rule.conditions_raw,
      notes: rule.notes,
      editorial_status: "published" as const,
    };

    const { data: existingRestr } = await supabase
      .from("restrictions")
      .select("id")
      .eq("ingredient_rule_id", ruleId)
      .maybeSingle();

    if (existingRestr?.id) {
      await supabase
        .from("restrictions")
        .update(restrPayload)
        .eq("id", existingRestr.id);
    } else {
      await supabase.from("restrictions").insert(restrPayload);
    }
  }

  await supabase.from("rule_versions").insert({
    ingredient_rule_id: ruleId,
    version_number: changeType === "update" ? "2.0" : "1.0",
    schema_version: 1,
    data_snapshot: { rule: rulePayload, normalized: rule },
    change_description: `Publicación normativa — actualización ${updateId}`,
    created_by: "regulatory_update_pipeline",
  });
}

export async function publishRegulatoryUpdate(
  updateId: string,
  items: RegulatoryUpdateItem[],
  diffSummary: DiffSummary,
  publishedBy: string
): Promise<number> {
  const supabase = createAdminClient();
  const applicable = items.filter(shouldApplyItem);

  const { data: lastPub } = await supabase
    .from("regulatory_publications")
    .select("version_number")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  const versionNumber = (lastPub?.version_number ?? 0) + 1;

  const catalog: Catalog = {
    authorityId: await ensureAuthority(supabase),
    documentIds: new Map(),
    listIds: new Map(),
    ingredientIds: new Map(),
  };

  for (const item of applicable) {
    await applyRuleItem(
      supabase,
      catalog,
      item.normalized_payload,
      updateId,
      item.change_type === "update" ? "update" : "create"
    );
  }

  const { error: pubError } = await supabase.from("regulatory_publications").insert({
    update_id: updateId,
    version_number: versionNumber,
    change_summary: diffSummary,
    published_by: publishedBy,
  });

  if (pubError) throw pubError;

  const { error: updateError } = await supabase
    .from("regulatory_updates")
    .update({
      status: "published",
      version_number: versionNumber,
      published_at: new Date().toISOString(),
      published_by: publishedBy,
    })
    .eq("id", updateId);

  if (updateError) throw updateError;

  return versionNumber;
}
