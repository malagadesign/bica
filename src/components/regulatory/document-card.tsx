import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import type { DocumentSummary } from "@/lib/data/regulatory-documents";
import { formatLastUpdated } from "@/lib/format-date";
import { cn } from "@/lib/utils";

type DocumentCardProps = {
  document: DocumentSummary;
  index?: number;
};

export function DocumentCard({ document, index = 0 }: DocumentCardProps) {
  return (
    <Link
      href={`/app/documents/${document.id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={cn(
        "animate-fade-in-up group flex flex-col gap-4 bica-card-interactive p-5 hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--bica-accent),transparent_88%)]">
          <FileText className="size-4 text-primary/70 transition-colors group-hover:text-primary" />
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold leading-snug tracking-tight">
          {document.title}
        </h3>
        {document.document_number && (
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {document.document_number}
          </p>
        )}
        <p className="mt-2 text-sm text-muted-foreground">
          {document.authorityName}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        {document.publication_date && (
          <span>{formatLastUpdated(document.publication_date)}</span>
        )}
        <span>
          {document.listCount}{" "}
          {document.listCount === 1 ? "lista" : "listas"}
        </span>
        <span>
          {document.ruleCount.toLocaleString("es-AR")} reglas
        </span>
      </div>

      {document.lists.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {document.lists.slice(0, 3).map((list) => (
            <span
              key={list.id}
              className="bica-pill px-2 py-0.5 text-xs"
            >
              {list.name}
            </span>
          ))}
          {document.lists.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{document.lists.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
