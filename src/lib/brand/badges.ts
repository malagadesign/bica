import type { StatusTone } from "@/lib/regulatory-status";
import type { EditorialStatus } from "@/modules/editorial/types";
import { cn } from "@/lib/utils";

const BADGE_BASE =
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function badgeToneClasses(tone: StatusTone): string {
  const map: Record<StatusTone, string> = {
    danger: "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)] ring-[var(--badge-danger-ring)]",
    warning:
      "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] ring-[var(--badge-warning-ring)]",
    success:
      "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] ring-[var(--badge-success-ring)]",
    info: "bg-[var(--badge-info-bg)] text-[var(--badge-info-text)] ring-[var(--badge-info-ring)]",
    muted: "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] ring-[var(--badge-muted-ring)]",
  };
  return map[tone];
}

export function editorialBadgeClasses(status: EditorialStatus): string {
  const map: Record<EditorialStatus, string> = {
    draft:
      "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] ring-[var(--badge-muted-ring)]",
    ready_for_review:
      "bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)] ring-[var(--badge-warning-ring)]",
    published:
      "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)] ring-[var(--badge-success-ring)]",
  };
  return map[status];
}

export function badgeClass(...parts: string[]): string {
  return cn(BADGE_BASE, ...parts);
}

export { BADGE_BASE };
