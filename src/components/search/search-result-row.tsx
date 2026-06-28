"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { IngredientSearchResult } from "@/modules/search/types";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
} from "@/components/regulatory/status-badges";
import { cn } from "@/lib/utils";

type SearchResultRowProps = {
  result: IngredientSearchResult;
  active?: boolean;
  showMatchContext?: boolean;
  showChevron?: boolean;
  onNavigate?: () => void;
  className?: string;
};

export function SearchResultRow({
  result,
  active = false,
  showMatchContext = true,
  showChevron = false,
  onNavigate,
  className,
}: SearchResultRowProps) {
  return (
    <Link
      href={`/app/ingredients/${result.id}`}
      onClick={onNavigate}
      className={cn(
        "group flex flex-col gap-2.5 px-4 py-3 transition-colors duration-150",
        active ? "bg-accent" : "hover:bg-accent/50",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{result.displayName}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {result.matchLabel}
        </span>
      </div>

      {showMatchContext && result.matchContext && (
        <p className="truncate text-xs text-muted-foreground">
          {result.matchContext}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {result.regulatoryCategory && result.regulatoryCategoryTone && (
          <RegulatoryStatusBadge
            label={result.regulatoryCategory}
            tone={result.regulatoryCategoryTone}
          />
        )}
        {result.primaryListName && (
          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-muted-foreground">
            {result.primaryListName}
          </span>
        )}
        {result.restrictionCount > 0 && (
          <span className="text-muted-foreground">
            {result.restrictionCount}{" "}
            {result.restrictionCount === 1 ? "restricción" : "restricciones"}
          </span>
        )}
        {result.ruleCount > 0 && (
          <span className="text-muted-foreground">
            {result.ruleCount}{" "}
            {result.ruleCount === 1 ? "regla" : "reglas"}
          </span>
        )}
        {result.needsReview && <NeedsReviewBadge />}
      </div>

      {(result.cas_number || result.color_index) && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {result.cas_number && (
            <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono">
              CAS {result.cas_number}
            </span>
          )}
          {result.color_index && (
            <span className="rounded-md bg-muted/60 px-2 py-0.5 font-mono">
              CI {result.color_index}
            </span>
          )}
        </div>
      )}

      {showChevron && (
        <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
      )}
    </Link>
  );
}
