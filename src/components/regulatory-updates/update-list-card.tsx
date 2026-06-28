import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import {
  formatSourceDocumentType,
  getRegulatorySourceLabel,
} from "@/lib/regulatory/domain-catalog";
import { computeImpactMetrics } from "@/lib/regulatory/impact-metrics";
import type { RegulatoryUpdate } from "@/modules/regulatory-updates/types";
import { RegulatoryUpdateStatusBadge } from "./status-badge";

type RegulatoryUpdateListCardProps = {
  update: RegulatoryUpdate;
};

export function RegulatoryUpdateListCard({
  update,
}: RegulatoryUpdateListCardProps) {
  const domain = update.domain_context;
  const sourceLabel =
    getRegulatorySourceLabel(domain.regulatory_source_id) !== "—"
      ? getRegulatorySourceLabel(domain.regulatory_source_id)
      : update.origin;
  const docLabel = formatSourceDocumentType(update.source_type);
  const impact = computeImpactMetrics(update.diff_summary, []);

  return (
    <Link
      href={`/app/admin/regulatory-updates/${update.id}`}
      className="block px-5 py-5 transition-colors hover:bg-[var(--bica-muted)]/50"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-primary">{update.name}</p>
            <RegulatoryUpdateStatusBadge status={update.status} />
          </div>
          <p className="text-sm text-muted-foreground">{sourceLabel}</p>
          <p className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <FileText className="size-3.5" />
            Documento fuente: {docLabel} · {update.source_filename}
          </p>
          {domain.official_url && (
            <p className="inline-flex items-center gap-1 text-xs text-primary">
              <ExternalLink className="size-3" />
              URL oficial
            </p>
          )}
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Resumen de impacto
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {impact.ingredientsNew} nuevos · {impact.ingredientsModified}{" "}
            modificados · {impact.needsReview} en revisión
          </p>
        </div>
      </div>
    </Link>
  );
}
