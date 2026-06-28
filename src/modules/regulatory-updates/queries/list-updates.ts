import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  DiffSummary,
  RegulatoryPublication,
  RegulatoryUpdate,
  ValidationReport,
} from "../types";
import { emptyDiffSummary, emptyValidationReport } from "../types";
import { parseDomainContext } from "@/lib/regulatory/domain-catalog";

function parseValidationReport(raw: unknown): ValidationReport {
  if (!raw || typeof raw !== "object") return emptyValidationReport();
  const r = raw as ValidationReport;
  return {
    total_rows: r.total_rows ?? 0,
    valid_rows: r.valid_rows ?? 0,
    warnings: Array.isArray(r.warnings) ? r.warnings : [],
    errors: Array.isArray(r.errors) ? r.errors : [],
  };
}

function parseDiffSummary(raw: unknown): DiffSummary {
  if (!raw || typeof raw !== "object") return emptyDiffSummary();
  const r = raw as DiffSummary;
  return {
    ingredients: r.ingredients ?? { new: 0, modified: 0, removed: 0 },
    rules: r.rules ?? { new: 0, modified: 0, removed: 0 },
    restrictions: r.restrictions ?? { new: 0, modified: 0 },
    documents: r.documents ?? { new: 0 },
    unchanged: r.unchanged ?? 0,
  };
}

export async function listRegulatoryUpdates(
  supabase: SupabaseClient
): Promise<RegulatoryUpdate[]> {
  const { data, error } = await supabase
    .from("regulatory_updates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    domain_context: parseDomainContext(row.domain_context),
    validation_report: parseValidationReport(row.validation_report),
    diff_summary: parseDiffSummary(row.diff_summary),
  })) as RegulatoryUpdate[];
}

export async function getRegulatoryUpdate(
  supabase: SupabaseClient,
  id: string
): Promise<RegulatoryUpdate | null> {
  const { data, error } = await supabase
    .from("regulatory_updates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    domain_context: parseDomainContext(data.domain_context),
    validation_report: parseValidationReport(data.validation_report),
    diff_summary: parseDiffSummary(data.diff_summary),
  } as RegulatoryUpdate;
}

export async function listPublications(
  supabase: SupabaseClient
): Promise<RegulatoryPublication[]> {
  const { data, error } = await supabase
    .from("regulatory_publications")
    .select("*")
    .order("version_number", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    ...row,
    change_summary: parseDiffSummary(row.change_summary),
  })) as RegulatoryPublication[];
}
