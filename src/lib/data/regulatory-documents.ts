import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import { listCodeToSlug } from "@/lib/regulatory-slug";
import { unwrapJoin } from "@/lib/supabase-joins";

export type DocumentSummary = {
  id: string;
  title: string;
  document_number: string | null;
  document_type: string;
  publication_date: string | null;
  effective_date: string | null;
  source_url: string | null;
  mercosur_reference: string | null;
  source_label: string | null;
  authorityName: string;
  listCount: number;
  ruleCount: number;
  lists: { id: string; name: string; slug: string }[];
};

export type DocumentDetail = DocumentSummary & {
  summary: string | null;
  status: string;
  language: string | null;
};

export type DocumentRuleItem = {
  id: string;
  rule_status: string;
  needs_review: boolean;
  ingredient: {
    id: string;
    displayName: string;
    inci_name: string | null;
  };
  list: {
    id: string;
    name: string;
    slug: string;
  };
};

type RuleWithJoins = {
  id: string;
  rule_status: string;
  needs_review: boolean;
  regulatory_lists:
    | { id: string; name: string; code: string }
    | { id: string; name: string; code: string }[]
    | null;
  ingredients:
    | {
        id: string;
        inci_name: string | null;
        chemical_name: string | null;
        cas_number: string | null;
        color_index: string | null;
      }
    | {
        id: string;
        inci_name: string | null;
        chemical_name: string | null;
        cas_number: string | null;
        color_index: string | null;
      }[]
    | null;
};

export async function getRegulatoryDocumentsWithStats(
  supabase: SupabaseClient
): Promise<DocumentSummary[]> {
  const [{ data: documents, error: docError }, { data: rules, error: rulesError }] =
    await Promise.all([
      supabase
        .from("regulatory_documents")
        .select(
          `
          id, title, document_number, document_type,
          publication_date, effective_date, source_url,
          mercosur_reference, source_label,
          regulatory_authorities ( name )
        `
        )
        .eq("status", "active")
        .order("title"),
      supabase
        .from("ingredient_rules")
        .select("document_id, list_id, regulatory_lists ( id, name, code )")
        .eq("is_active", true),
    ]);

  if (docError) throw docError;
  if (rulesError) throw rulesError;

  const stats = new Map<
    string,
    { ruleCount: number; lists: Map<string, { id: string; name: string; slug: string }> }
  >();

  for (const rule of rules ?? []) {
    const docId = rule.document_id;
    const cur = stats.get(docId) ?? { ruleCount: 0, lists: new Map() };
    cur.ruleCount += 1;
    const list = unwrapJoin(rule.regulatory_lists);
    if (list) {
      cur.lists.set(list.id, {
        id: list.id,
        name: list.name,
        slug: listCodeToSlug(list.code),
      });
    }
    stats.set(docId, cur);
  }

  return (documents ?? []).map((doc) => {
    const authority = unwrapJoin(
      doc.regulatory_authorities as { name: string } | { name: string }[] | null
    );
    const s = stats.get(doc.id);
    const lists = s ? [...s.lists.values()] : [];

    return {
      id: doc.id,
      title: doc.title,
      document_number: doc.document_number,
      document_type: doc.document_type,
      publication_date: doc.publication_date,
      effective_date: doc.effective_date,
      source_url: doc.source_url,
      mercosur_reference: doc.mercosur_reference,
      source_label: doc.source_label,
      authorityName: authority?.name ?? "—",
      listCount: lists.length,
      ruleCount: s?.ruleCount ?? 0,
      lists: lists.sort((a, b) => a.name.localeCompare(b.name, "es")),
    };
  });
}

export async function getRegulatoryDocumentById(
  supabase: SupabaseClient,
  id: string
): Promise<DocumentDetail | null> {
  const { data: doc, error } = await supabase
    .from("regulatory_documents")
    .select(
      `
      *,
      regulatory_authorities ( name )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!doc) return null;

  const { data: rules } = await supabase
    .from("ingredient_rules")
    .select("list_id, regulatory_lists ( id, name, code )")
    .eq("document_id", id)
    .eq("is_active", true);

  const listsMap = new Map<string, { id: string; name: string; slug: string }>();
  for (const rule of rules ?? []) {
    const list = unwrapJoin(rule.regulatory_lists);
    if (list) {
      listsMap.set(list.id, {
        id: list.id,
        name: list.name,
        slug: listCodeToSlug(list.code),
      });
    }
  }

  const authority = unwrapJoin(
    doc.regulatory_authorities as { name: string } | { name: string }[] | null
  );
  const lists = [...listsMap.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "es")
  );

  return {
    id: doc.id,
    title: doc.title,
    document_number: doc.document_number,
    document_type: doc.document_type,
    publication_date: doc.publication_date,
    effective_date: doc.effective_date,
    source_url: doc.source_url,
    mercosur_reference: doc.mercosur_reference,
    source_label: doc.source_label,
    summary: doc.summary,
    status: doc.status,
    language: doc.language,
    authorityName: authority?.name ?? "—",
    listCount: lists.length,
    ruleCount: rules?.length ?? 0,
    lists,
  };
}

export async function getDocumentRules(
  supabase: SupabaseClient,
  documentId: string,
  limit = 100
): Promise<DocumentRuleItem[]> {
  const { data: rules, error } = await supabase
    .from("ingredient_rules")
    .select(
      `
      id, rule_status, needs_review,
      regulatory_lists ( id, name, code ),
      ingredients ( id, inci_name, chemical_name, cas_number, color_index )
    `
    )
    .eq("document_id", documentId)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return ((rules ?? []) as RuleWithJoins[]).map((rule) => {
    const ingredient = unwrapJoin(rule.ingredients)!;
    const list = unwrapJoin(rule.regulatory_lists)!;

    return {
      id: rule.id,
      rule_status: rule.rule_status,
      needs_review: rule.needs_review,
      ingredient: {
        id: ingredient.id,
        displayName: getIngredientDisplayName(ingredient),
        inci_name: ingredient.inci_name,
      },
      list: {
        id: list.id,
        name: list.name,
        slug: listCodeToSlug(list.code),
      },
    };
  });
}
