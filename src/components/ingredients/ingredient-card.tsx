import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { IngredientListItem } from "@/lib/data/ingredient-list";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
} from "@/components/regulatory/status-badges";
import { cn } from "@/lib/utils";

type IngredientCardProps = {
  item: IngredientListItem;
  index?: number;
};

export function IngredientCard({ item, index = 0 }: IngredientCardProps) {
  return (
    <Link
      href={`/app/ingredients/${item.id}`}
      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
      className={cn(
        "animate-fade-in-up group flex flex-col gap-3 bica-card-interactive p-4 hover:-translate-y-0.5",
        "active:translate-y-0 active:shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium tracking-tight transition-colors group-hover:text-primary">
            {item.displayName}
          </h3>
          {item.inci_name && item.inci_name !== item.displayName && (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {item.inci_name}
            </p>
          )}
        </div>
        <ChevronRight className="size-4 shrink-0 translate-x-0 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {item.cas_number && (
          <span className="bica-pill px-2 py-0.5 font-mono text-xs">
            CAS {item.cas_number}
          </span>
        )}
        {item.color_index && (
          <span className="bica-pill px-2 py-0.5 font-mono text-xs">
            CI {item.color_index}
          </span>
        )}
        <span>
          {item.ruleCount === 0
            ? "Sin reglas regulatorias"
            : `${item.ruleCount} ${item.ruleCount === 1 ? "regla regulatoria" : "reglas regulatorias"}`}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {item.statusLabel && item.statusTone ? (
          <RegulatoryStatusBadge label={item.statusLabel} tone={item.statusTone} />
        ) : item.ruleCount === 0 ? (
          <span className="text-xs text-muted-foreground">Estado por confirmar</span>
        ) : null}
        {item.needsReview && <NeedsReviewBadge />}
      </div>
    </Link>
  );
}
