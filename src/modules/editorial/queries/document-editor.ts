import type { SupabaseClient } from "@supabase/supabase-js";
import type { EditorialStatus } from "../types";

export type AdminDocumentListItem = {
  id: string;
  title: string;
  document_number: string | null;
  authorityName: string;
  editorial_status: EditorialStatus;
  ruleCount: number;
  updated_at: string;
};

export async function listAdminDocuments(
  supabase: SupabaseClient
): Promise<AdminDocumentListItem[]> {
  const [{ data: docs, error }, { data: rules, error: rulesError }] =
    await Promise.all([
      supabase
        .from("regulatory_documents")
        .select(
          `
          id, title, document_number, editorial_status, updated_at,
          regulatory_authorities ( name )
        `
        )
        .order("updated_at", { ascending: false })
        .limit(100),
      supabase
        .from("ingredient_rules")
        .select("document_id")
        .eq("is_active", true),
    ]);

  if (error) throw error;
  if (rulesError) throw rulesError;

  const ruleCounts = new Map<string, number>();
  for (const r of rules ?? []) {
    ruleCounts.set(r.document_id, (ruleCounts.get(r.document_id) ?? 0) + 1);
  }

  return (docs ?? []).map((doc) => {
    const auth = Array.isArray(doc.regulatory_authorities)
      ? doc.regulatory_authorities[0]
      : doc.regulatory_authorities;
    return {
      id: doc.id,
      title: doc.title,
      document_number: doc.document_number,
      authorityName: auth?.name ?? "—",
      editorial_status: doc.editorial_status as EditorialStatus,
      ruleCount: ruleCounts.get(doc.id) ?? 0,
      updated_at: doc.updated_at,
    };
  });
}

export type DocumentEditorData = {
  id: string;
  title: string;
  document_number: string | null;
  document_type: string;
  summary: string | null;
  source_url: string | null;
  editorial_status: EditorialStatus;
  authorityName: string;
  lists: { id: string; name: string }[];
};

export async function getDocumentEditorData(
  supabase: SupabaseClient,
  id: string
): Promise<DocumentEditorData | null> {
  const { data: doc, error } = await supabase
    .from("regulatory_documents")
    .select(
      `
      id, title, document_number, document_type, summary, source_url,
      editorial_status,
      regulatory_authorities ( name )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!doc) return null;

  const { data: rules } = await supabase
    .from("ingredient_rules")
    .select("regulatory_lists ( id, name )")
    .eq("document_id", id)
    .eq("is_active", true);

  const listsMap = new Map<string, { id: string; name: string }>();
  for (const rule of rules ?? []) {
    const list = Array.isArray(rule.regulatory_lists)
      ? rule.regulatory_lists[0]
      : rule.regulatory_lists;
    if (list) listsMap.set(list.id, list);
  }

  const auth = Array.isArray(doc.regulatory_authorities)
    ? doc.regulatory_authorities[0]
    : doc.regulatory_authorities;

  return {
    id: doc.id,
    title: doc.title,
    document_number: doc.document_number,
    document_type: doc.document_type,
    summary: doc.summary,
    source_url: doc.source_url,
    editorial_status: doc.editorial_status as EditorialStatus,
    authorityName: auth?.name ?? "—",
    lists: [...listsMap.values()],
  };
}
