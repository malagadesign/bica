import type { LucideIcon } from "lucide-react";
import { FileText, Globe, List, Scale, ShieldAlert } from "lucide-react";
import type { IngredientKnowledgeProfile } from "@/lib/data/ingredient-knowledge";
import { formatLastUpdated } from "@/lib/format-date";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
} from "@/components/regulatory/status-badges";
import { cn } from "@/lib/utils";

type RegulatorySnapshotProps = {
  profile: IngredientKnowledgeProfile;
  className?: string;
};

export function RegulatorySnapshot({ profile, className }: RegulatorySnapshotProps) {
  const category = profile.category;

  return (
    <section className={cn("bica-snapshot", className)}>
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[var(--snapshot-border)]" />
        <p className="bica-snapshot-label">Resumen regulatorio</p>
        <div className="h-px flex-1 bg-[var(--snapshot-border)]" />
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 md:col-span-2 lg:col-span-1">
          <SnapshotLabel icon={ShieldAlert} label="Estado regulatorio" />
          <div className="flex flex-wrap items-center gap-2">
            {category ? (
              <RegulatoryStatusBadge
                label={category.label}
                tone={category.tone}
                className="px-3 py-1 text-sm"
              />
            ) : (
              <span className="text-sm text-muted-foreground">Sin clasificar</span>
            )}
            {profile.primaryStatus &&
              profile.primaryStatus.label !== category?.label && (
                <span className="text-sm text-muted-foreground">
                  ({profile.primaryStatus.label})
                </span>
              )}
            {profile.needsReview && <NeedsReviewBadge />}
          </div>
        </div>

        <div className="space-y-4">
          <SnapshotLabel icon={Globe} label="Jurisdicciones" />
          <div className="flex flex-wrap gap-2">
            {profile.jurisdictions.length > 0 ? (
              profile.jurisdictions.map((j) => (
                <span key={j} className="bica-pill">
                  {j}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <SnapshotLabel icon={List} label="Listas regulatorias" />
          <div className="flex flex-wrap gap-2">
            {profile.lists.length > 0 ? (
              profile.lists.map((list) => (
                <span key={list.id} className="bica-pill text-xs">
                  {list.name}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Ninguna</span>
            )}
          </div>
        </div>

        <SnapshotMetric
          icon={FileText}
          label="Documentos normativos"
          value={profile.documentCount}
        />
        <SnapshotMetric
          icon={Scale}
          label="Reglas regulatorias"
          value={profile.ruleCount}
        />
        <SnapshotMetric
          icon={ShieldAlert}
          label="Restricciones"
          value={profile.restrictionCount}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-x-8 gap-y-2 border-t border-[var(--snapshot-border)] pt-6 text-sm text-muted-foreground">
        <span>
          Última actualización:{" "}
          <strong className="font-medium text-foreground">
            {formatLastUpdated(profile.lastUpdated)}
          </strong>
        </span>
        {profile.published_at && (
          <span>
            Versión publicada:{" "}
            <strong className="font-medium text-foreground">
              {new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
                new Date(profile.published_at)
              )}
            </strong>
          </span>
        )}
      </div>
    </section>
  );
}

function SnapshotLabel({
  icon: Icon,
  label,
}: {
  icon: LucideIcon;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="size-4 text-primary/60" strokeWidth={1.5} />
      {label}
    </div>
  );
}

function SnapshotMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
}) {
  return (
    <div className="space-y-3">
      <SnapshotLabel icon={Icon} label={label} />
      <p className="text-3xl font-semibold tabular-nums tracking-tight text-primary">
        {value.toLocaleString("es-AR")}
      </p>
    </div>
  );
}
