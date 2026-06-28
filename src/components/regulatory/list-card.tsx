import Link from "next/link";
import { ChevronRight, ClipboardList } from "lucide-react";
import type { RegulatoryListSummary } from "@/lib/data/regulatory-lists";
import { cn } from "@/lib/utils";

type RegulatoryListCardProps = {
  list: RegulatoryListSummary;
  index?: number;
  compact?: boolean;
};

export function RegulatoryListCard({
  list,
  index = 0,
  compact = false,
}: RegulatoryListCardProps) {
  return (
    <Link
      href={`/app/lists/${list.slug}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={cn(
        "animate-fade-in-up group flex flex-col gap-4 bica-card-interactive p-5 hover:-translate-y-0.5",
        compact && "p-4 gap-3"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--bica-accent),transparent_88%)]">
          <ClipboardList className="size-4 text-primary/70 transition-colors group-hover:text-primary" />
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="font-semibold tracking-tight transition-colors group-hover:text-foreground">
          {list.name}
        </h3>
        {!compact && list.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {list.description.replace(/ \(seed Etapa 1A\)$/, "")}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span>
          <span className="font-medium tabular-nums text-foreground">
            {list.ingredientCount.toLocaleString("es-AR")}
          </span>{" "}
          ingredientes
        </span>
        <span>
          <span className="font-medium tabular-nums text-foreground">
            {list.ruleCount.toLocaleString("es-AR")}
          </span>{" "}
          reglas
        </span>
      </div>

      {list.lastDocument && !compact && (
        <p className="truncate text-xs text-muted-foreground">
          Doc: {list.lastDocument.document_number ?? list.lastDocument.title}
        </p>
      )}
    </Link>
  );
}
