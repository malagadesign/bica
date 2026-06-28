import {
  derivePrimaryStatus,
  getRuleStatusConfig,
  type StatusTone,
} from "@/lib/regulatory-status";

export type RegulatoryCategory = "Permitido" | "Restringido" | "Prohibido";

const PROHIBITED = new Set([
  "prohibited",
  "not_permitted",
  "prohibited_when_condition",
  "prohibited_for_scope",
]);

const RESTRICTED = new Set([
  "restricted",
  "limited",
  "permitted_with_limit",
  "labeling_required",
]);

export function deriveRegulatoryCategory(ruleStatuses: string[]): {
  label: RegulatoryCategory;
  tone: StatusTone;
} | null {
  if (!ruleStatuses.length) return null;

  const primary = derivePrimaryStatus(ruleStatuses);
  if (!primary) return null;

  const topStatus = ruleStatuses
    .map((s) => ({ s, ...getRuleStatusConfig(s) }))
    .sort((a, b) => b.priority - a.priority)[0]?.s;

  if (topStatus && PROHIBITED.has(topStatus)) {
    return { label: "Prohibido", tone: "danger" };
  }
  if (topStatus && RESTRICTED.has(topStatus)) {
    return { label: "Restringido", tone: "warning" };
  }
  return { label: "Permitido", tone: "success" };
}

export function deriveJurisdictions(
  authorities: { country: string | null; region: string | null; name: string }[]
): string[] {
  const jurisdictions = new Set<string>();

  for (const auth of authorities) {
    if (
      auth.country === "AR" ||
      auth.name.toLowerCase().includes("argentina")
    ) {
      jurisdictions.add("Argentina");
    }
    if (
      auth.region === "MERCOSUR" ||
      auth.name.toUpperCase().includes("MERCOSUR")
    ) {
      jurisdictions.add("MERCOSUR");
    }
  }

  return [...jurisdictions];
}

export function firstListName(listNames: string | null | undefined): string | null {
  if (!listNames?.trim()) return null;
  return listNames.split(/\s+/)[0] ?? null;
}
