import { History } from "lucide-react";
import { formatLastUpdated } from "@/lib/format-date";
import { EDITORIAL_STATUS_LABELS, type ContentRevision } from "@/modules/editorial/types";
import { EmptyState } from "@/components/ui/empty-state";

export function RevisionHistory({ revisions }: { revisions: ContentRevision[] }) {
  if (revisions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Sin historial editorial"
        description="Cuando guardes borradores o publiques cambios, las versiones aparecerán acá."
        className="py-10"
      />
    );
  }

  return (
    <ul className="space-y-3">
      {revisions.map((rev) => (
        <li
          key={rev.id}
          className="rounded-xl border bg-card px-4 py-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">
              {rev.change_summary ?? "Cambio registrado"}
            </p>
            <span className="text-xs text-muted-foreground">
              {EDITORIAL_STATUS_LABELS[rev.editorial_status]}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatLastUpdated(rev.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}
