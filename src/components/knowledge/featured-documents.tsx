import Link from "next/link";
import { ChevronRight, ExternalLink, FileText } from "lucide-react";
import type { KnowledgeDocument } from "@/lib/data/ingredient-knowledge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { KNOWLEDGE_SOURCE_NOTE } from "@/lib/legal/microcopy";
import { OfficialSourceNote } from "@/components/legal/official-source-note";

type FeaturedDocumentsProps = {
  documents: KnowledgeDocument[];
  className?: string;
  showEmpty?: boolean;
};

export function FeaturedDocuments({
  documents,
  className,
  showEmpty = false,
}: FeaturedDocumentsProps) {
  if (documents.length === 0) {
    if (!showEmpty) return null;
    return (
      <EmptyState
        icon={FileText}
        title="No existen documentos asociados"
        description="Este ingrediente todavía no tiene documentos normativos vinculados."
        className={cn("py-10", className)}
      />
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
        Respaldado por
      </h2>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="group flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-colors hover:bg-accent/20"
          >
            <Link
              href={`/app/documents/${doc.id}`}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <FileText className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <p className="truncate font-medium group-hover:underline">
                  {doc.document_number ?? doc.title}
                </p>
                {doc.document_number && doc.title !== doc.document_number && (
                  <p className="truncate text-sm text-muted-foreground">
                    {doc.title}
                  </p>
                )}
              </div>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            {doc.source_url && (
              <a
                href={doc.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Ver fuente oficial"
              >
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        ))}
      </div>
      <OfficialSourceNote text={KNOWLEDGE_SOURCE_NOTE} />
    </section>
  );
}
