import { badgeToneClasses } from "@/lib/brand/badges";

export type StatusTone = "danger" | "warning" | "success" | "info" | "muted";

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: StatusTone; priority: number }
> = {
  prohibited: { label: "Prohibido", tone: "danger", priority: 100 },
  not_permitted: { label: "No permitido", tone: "danger", priority: 95 },
  prohibited_when_condition: {
    label: "Prohibido con condición",
    tone: "danger",
    priority: 90,
  },
  prohibited_for_scope: {
    label: "Prohibido en alcance",
    tone: "danger",
    priority: 85,
  },
  restricted: { label: "Restringido", tone: "warning", priority: 70 },
  limited: { label: "Uso limitado", tone: "warning", priority: 65 },
  permitted_with_limit: {
    label: "Permitido con límite",
    tone: "info",
    priority: 50,
  },
  permitted_with_scope: {
    label: "Permitido con alcance",
    tone: "info",
    priority: 45,
  },
  labeling_required: {
    label: "Rotulado específico",
    tone: "info",
    priority: 40,
  },
  note: { label: "Nota normativa", tone: "muted", priority: 10 },
};

export function getRuleStatusConfig(status: string) {
  return (
    STATUS_CONFIG[status] ?? {
      label: status.replace(/_/g, " "),
      tone: "muted" as StatusTone,
      priority: 0,
    }
  );
}

export function derivePrimaryStatus(ruleStatuses: string[]): {
  label: string;
  tone: StatusTone;
} | null {
  if (!ruleStatuses.length) return null;

  const ranked = ruleStatuses
    .map((s) => ({ status: s, ...getRuleStatusConfig(s) }))
    .sort((a, b) => b.priority - a.priority);

  const top = ranked[0];
  return { label: top.label, tone: top.tone };
}

export function statusToneClasses(tone: StatusTone): string {
  return badgeToneClasses(tone);
}
