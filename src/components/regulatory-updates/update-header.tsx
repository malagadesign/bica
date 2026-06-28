import { ExternalLink, FileText } from "lucide-react";
import {
  formatSourceDocumentType,
  getDocumentTypeLabel,
  getRegulatorySourceLabel,
} from "@/lib/regulatory/domain-catalog";
import type { RegulatoryUpdate } from "@/modules/regulatory-updates/types";
import { RegulatoryUpdateStatusBadge } from "./status-badge";
import { formatLastUpdated } from "@/lib/format-date";

type RegulatoryUpdateHeaderProps = {
  update: RegulatoryUpdate;
  authorLabel: string | null;
};

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(
    new Date(iso)
  );
}

export function RegulatoryUpdateHeader({
  update,
  authorLabel,
}: RegulatoryUpdateHeaderProps) {
  const domain = update.domain_context;
  const sourceLabel =
    getRegulatorySourceLabel(domain.regulatory_source_id) !== "—"
      ? getRegulatorySourceLabel(domain.regulatory_source_id)
      : update.origin;
  const typeLabel = getDocumentTypeLabel(domain.document_type_id);
  const docType = formatSourceDocumentType(update.source_type);

  const fields: Array<{
    label: string;
    value?: string | null;
    link?: string | null;
    wide?: boolean;
    document?: boolean;
  }> = [
    { label: "Fuente", value: sourceLabel },
    { label: "Tipo", value: typeLabel !== "—" ? typeLabel : null },
    {
      label: "Fecha de publicación",
      value: formatDateOnly(domain.normative_published_date),
    },
    {
      label: "Fecha de incorporación",
      value: formatDateOnly(update.created_at),
    },
    { label: "Autor", value: authorLabel },
    { label: "Observaciones", value: update.notes, wide: true },
    {
      label: "URL oficial",
      value: domain.official_url,
      link: domain.official_url,
      wide: true,
    },
    {
      label: "Documento fuente",
      value: `${docType} · ${update.source_filename}`,
      document: true,
      wide: true,
    },
  ].filter((f) => f.value && f.value !== "—");

  return (
    <section className="bica-card space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <RegulatoryUpdateStatusBadge status={update.status} />
            {update.version_number && (
              <span className="bica-pill text-xs">
                Versión {update.version_number}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">
            {update.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {sourceLabel}
            {domain.document_number ? ` · ${domain.document_number}` : ""}
            {update.row_count > 0
              ? ` · ${update.row_count.toLocaleString("es-AR")} registros analizados`
              : ""}
          </p>
        </div>
        {update.published_at && (
          <p className="text-xs text-muted-foreground">
            Publicada {formatLastUpdated(update.published_at)}
          </p>
        )}
      </div>

      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {fields.map((field) => (
          <div
            key={field.label}
            className={field.wide ? "sm:col-span-2 lg:col-span-3" : undefined}
          >
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {field.label}
            </dt>
            <dd className="mt-1 text-sm">
              {field.link ? (
                <a
                  href={field.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {field.link}
                  <ExternalLink className="size-3.5" />
                </a>
              ) : field.document ? (
                <span className="inline-flex items-center gap-2">
                  <FileText className="size-4 text-primary/60" />
                  {field.value}
                </span>
              ) : (
                field.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
