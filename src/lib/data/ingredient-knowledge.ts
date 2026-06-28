import type { SupabaseClient } from "@supabase/supabase-js";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import {
  isPubliclyVisibleRule,
  PUBLIC_EDITORIAL_STATUS,
} from "@/lib/editorial/public-visibility";
import {
  deriveJurisdictions,
  deriveRegulatoryCategory,
} from "@/lib/regulatory-summary";
import { derivePrimaryStatus, type StatusTone } from "@/lib/regulatory-status";
import { listCodeToSlug } from "@/lib/regulatory-slug";
import { unwrapJoin } from "@/lib/supabase-joins";

export type KnowledgeDocument = {
  id: string;
  title: string;
  document_number: string | null;
  source_url: string | null;
  source_label: string | null;
  publication_date: string | null;
};

export type KnowledgeRule = {
  id: string;
  rule_status: string;
  needs_review: boolean;
  review_reason: string | null;
  entry_number_ar: string | null;
  created_at: string;
  updated_at: string;
  listName: string;
  listCode: string;
  listSlug: string;
  document: KnowledgeDocument | null;
  restrictionCount: number;
  restrictions: {
    id: string;
    created_at: string;
    updated_at: string;
    max_concentration: number | null;
    concentration_unit: string | null;
    limitation_text: string | null;
    warning_text: string | null;
  }[];
};

export type KnowledgeList = {
  id: string;
  name: string;
  code: string;
  slug: string;
};

export type TimelineEvent = {
  id: string;
  date: string;
  year: number;
  title: string;
  description: string | null;
  kind: "creation" | "rule" | "restriction" | "update" | "publication";
};

export type RelatedIngredient = {
  id: string;
  displayName: string;
  listName: string;
  statusLabel: string | null;
  statusTone: StatusTone | null;
};

export type IngredientKnowledgeProfile = {
  id: string;
  displayName: string;
  inci_name: string | null;
  chemical_name: string | null;
  cas_number: string | null;
  color_index: string | null;
  einecs: string | null;
  function: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  editorial_status: string | null;
  published_at: string | null;
  synonyms: { synonym: string; synonym_type: string }[];
  category: ReturnType<typeof deriveRegulatoryCategory>;
  primaryStatus: ReturnType<typeof derivePrimaryStatus>;
  jurisdictions: string[];
  lists: KnowledgeList[];
  documents: KnowledgeDocument[];
  rules: KnowledgeRule[];
  ruleCount: number;
  restrictionCount: number;
  documentCount: number;
  needsReview: boolean;
  lastUpdated: string;
  timeline: TimelineEvent[];
  relatedIngredients: RelatedIngredient[];
};

function buildTimeline(
  ingredient: { created_at: string; updated_at: string },
  rules: KnowledgeRule[]
): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: `ingredient-created`,
    date: ingredient.created_at,
    year: new Date(ingredient.created_at).getFullYear(),
    title: "Alta del ingrediente",
    description: "Incorporado al catálogo regulatorio",
    kind: "creation",
  });

  for (const rule of rules) {
    events.push({
      id: `rule-${rule.id}`,
      date: rule.created_at,
      year: new Date(rule.created_at).getFullYear(),
      title: `Regla en ${rule.listName}`,
      description: rule.document?.document_number ?? rule.document?.title ?? null,
      kind: "rule",
    });

    if (rule.updated_at !== rule.created_at) {
      events.push({
        id: `rule-update-${rule.id}`,
        date: rule.updated_at,
        year: new Date(rule.updated_at).getFullYear(),
        title: "Actualización normativa",
        description: `Cambio en ${rule.listName}`,
        kind: "update",
      });
    }

    for (const restriction of rule.restrictions) {
      events.push({
        id: `restriction-${restriction.id}`,
        date: restriction.created_at,
        year: new Date(restriction.created_at).getFullYear(),
        title: restriction.max_concentration
          ? "Cambio concentración máxima"
          : restriction.warning_text
            ? "Nueva advertencia"
            : "Nueva restricción",
        description:
          restriction.limitation_text ??
          restriction.warning_text ??
          (restriction.max_concentration
            ? `${restriction.max_concentration}${restriction.concentration_unit ?? ""}`
            : null),
        kind: "restriction",
      });
    }
  }

  return events
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 12);
}

export async function getIngredientKnowledgeProfile(
  supabase: SupabaseClient,
  id: string,
  options: { publicOnly?: boolean } = {}
): Promise<IngredientKnowledgeProfile | null> {
  const { publicOnly = false } = options;

  let query = supabase
    .from("ingredients")
    .select(
      `
      id, inci_name, chemical_name, cas_number, color_index, einecs,
      function, notes, created_at, updated_at,
      editorial_status, published_at,
      ingredient_synonyms ( synonym, synonym_type ),
      ingredient_rules (
        id, rule_status, needs_review, review_reason, entry_number_ar,
        is_active, editorial_status,
        created_at, updated_at,
        regulatory_lists ( id, name, code ),
        regulatory_documents (
          id, title, document_number, source_url, source_label, publication_date
        ),
        regulatory_authorities ( country, region, name ),
        restrictions (
          id, created_at, updated_at, is_active,
          max_concentration, concentration_unit,
          limitation_text, warning_text
        )
      )
    `
    )
    .eq("id", id);

  if (publicOnly) {
    query = query.eq("is_active", true).eq("editorial_status", PUBLIC_EDITORIAL_STATUS);
  }

  const { data: ingredient, error } = await query.maybeSingle();

  if (error) throw error;
  if (!ingredient) return null;

  type RuleRow = {
    id: string;
    rule_status: string;
    needs_review: boolean;
    review_reason: string | null;
    entry_number_ar: string | null;
    is_active?: boolean | null;
    editorial_status?: string | null;
    created_at: string;
    updated_at: string;
    regulatory_lists: { id: string; name: string; code: string } | { id: string; name: string; code: string }[] | null;
    regulatory_documents: KnowledgeDocument | KnowledgeDocument[] | null;
    regulatory_authorities: {
      country: string | null;
      region: string | null;
      name: string;
    } | {
      country: string | null;
      region: string | null;
      name: string;
    }[] | null;
    restrictions: (KnowledgeRule["restrictions"][number] & { is_active?: boolean | null })[];
  };

  const rulesRawAll = (ingredient.ingredient_rules ?? []) as unknown as RuleRow[];
  const rulesRaw = publicOnly
    ? rulesRawAll.filter((rule) => isPubliclyVisibleRule(rule))
    : rulesRawAll;

  const rules: KnowledgeRule[] = rulesRaw.map((rule) => {
    const list = unwrapJoin(rule.regulatory_lists);
    const doc = unwrapJoin(rule.regulatory_documents);
    const restrictionsAll = rule.restrictions ?? [];
    const restrictions = publicOnly
      ? restrictionsAll.filter((r) => r.is_active !== false)
      : restrictionsAll;

    return {
      id: rule.id,
      rule_status: rule.rule_status,
      needs_review: rule.needs_review,
      review_reason: rule.review_reason,
      entry_number_ar: rule.entry_number_ar,
      created_at: rule.created_at,
      updated_at: rule.updated_at,
      listName: list?.name ?? "Lista",
      listCode: list?.code ?? "",
      listSlug: list?.code ? listCodeToSlug(list.code) : "",
      document: doc,
      restrictionCount: restrictions.length,
      restrictions,
    };
  });

  const authorities = rulesRaw
    .map((r) => unwrapJoin(r.regulatory_authorities))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const listMap = new Map<string, KnowledgeList>();
  const docMap = new Map<string, KnowledgeDocument>();

  for (const rule of rules) {
    const listRaw = rulesRaw.find((r) => r.id === rule.id);
    const list = unwrapJoin(listRaw?.regulatory_lists ?? null);
    if (list) {
      listMap.set(list.id, {
        id: list.id,
        name: list.name,
        code: list.code,
        slug: listCodeToSlug(list.code),
      });
    }
    if (rule.document?.id) {
      docMap.set(rule.document.id, rule.document);
    }
  }

  const ruleStatuses = rules.map((r) => r.rule_status);
  const restrictionCount = rules.reduce((n, r) => n + r.restrictionCount, 0);
  const listIds = [...listMap.keys()];

  let relatedIngredients: RelatedIngredient[] = [];
  if (listIds.length > 0) {
    let relatedQuery = supabase
      .from("ingredient_rules")
      .select(
        `
        id, rule_status, ingredient_id, is_active, editorial_status,
        ingredients ( id, inci_name, chemical_name, cas_number, color_index, is_active, editorial_status ),
        regulatory_lists ( name )
      `
      )
      .in("list_id", listIds)
      .neq("ingredient_id", id)
      .limit(20);

    if (publicOnly) {
      relatedQuery = relatedQuery
        .eq("is_active", true)
        .eq("editorial_status", PUBLIC_EDITORIAL_STATUS);
    }

    const { data: relatedRules } = await relatedQuery;

    const seen = new Set<string>();
    relatedIngredients = (relatedRules ?? [])
      .map((row) => {
        const ing = unwrapJoin(
          row.ingredients as unknown as {
            id: string;
            inci_name: string | null;
            chemical_name: string | null;
            cas_number: string | null;
            color_index: string | null;
            is_active?: boolean | null;
            editorial_status?: string | null;
          } | null
        );
        const list = unwrapJoin(
          row.regulatory_lists as unknown as { name: string } | null
        );
        if (!ing || seen.has(ing.id)) return null;
        if (
          publicOnly &&
          (ing.is_active === false || ing.editorial_status !== PUBLIC_EDITORIAL_STATUS)
        ) {
          return null;
        }
        seen.add(ing.id);
        const status = derivePrimaryStatus([row.rule_status as string]);
        return {
          id: ing.id,
          displayName: getIngredientDisplayName(ing),
          listName: list?.name ?? "",
          statusLabel: status?.label ?? null,
          statusTone: status?.tone ?? null,
        };
      })
      .filter(Boolean)
      .slice(0, 5) as RelatedIngredient[];
  }

  const lastUpdated = [
    ingredient.updated_at,
    ...rules.map((r) => r.updated_at),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

  return {
    id: ingredient.id,
    displayName: getIngredientDisplayName(ingredient),
    inci_name: ingredient.inci_name,
    chemical_name: ingredient.chemical_name,
    cas_number: ingredient.cas_number,
    color_index: ingredient.color_index,
    einecs: ingredient.einecs,
    function: ingredient.function,
    notes: ingredient.notes,
    created_at: ingredient.created_at,
    updated_at: ingredient.updated_at,
    editorial_status: ingredient.editorial_status ?? null,
    published_at: ingredient.published_at ?? null,
    synonyms: (ingredient.ingredient_synonyms ?? []) as IngredientKnowledgeProfile["synonyms"],
    category: deriveRegulatoryCategory(ruleStatuses),
    primaryStatus: derivePrimaryStatus(ruleStatuses),
    jurisdictions: deriveJurisdictions(authorities),
    lists: [...listMap.values()],
    documents: [...docMap.values()],
    rules,
    ruleCount: rules.length,
    restrictionCount,
    documentCount: docMap.size,
    needsReview: rules.some((r) => r.needs_review),
    lastUpdated,
    timeline: buildTimeline(ingredient, rules),
    relatedIngredients,
  };
}
