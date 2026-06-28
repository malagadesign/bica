"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { ListIngredientItem } from "@/lib/data/regulatory-lists";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
  RuleStatusBadge,
} from "@/components/regulatory/status-badges";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  { value: "prohibited", label: "Prohibido" },
  { value: "restricted", label: "Restringido" },
  { value: "permitted_with_limit", label: "Permitido con límite" },
  { value: "permitted_with_scope", label: "Permitido con alcance" },
  { value: "prohibited_when_condition", label: "Prohibido con condición" },
  { value: "note", label: "Nota normativa" },
];

type ListDetailExplorerProps = {
  slug: string;
  items: ListIngredientItem[];
  initialQuery?: string;
};

export function ListDetailExplorer({
  slug,
  items,
  initialQuery = "",
}: ListDetailExplorerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const needsReview = searchParams.get("needs_review") === "true";
  const hasRestrictions = searchParams.get("has_restrictions") === "true";
  const status = searchParams.get("status") ?? "";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value == null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <form
          className="relative max-w-md flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParams({ q: (fd.get("q") as string) || null });
          }}
        >
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={initialQuery}
            placeholder="Filtrar en esta lista…"
            className="h-10 w-full rounded-lg border bg-background pl-10 pr-3 text-sm outline-none ring-ring focus:ring-2"
          />
        </form>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              updateParams({ needs_review: needsReview ? null : "true" })
            }
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              needsReview
                ? "border-[color-mix(in_oklch,var(--badge-warning-ring),transparent_50%)] bg-[var(--badge-warning-bg)] text-[var(--badge-warning-text)]"
                : "hover:bg-[var(--bica-muted)]"
            )}
          >
            Pendientes
          </button>
          <button
            type="button"
            onClick={() =>
              updateParams({
                has_restrictions: hasRestrictions ? null : "true",
              })
            }
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              hasRestrictions
                ? "border-primary/40 bg-primary/5"
                : "hover:bg-muted/60"
            )}
          >
            Con restricciones
          </button>
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value || null })}
            className="h-8 rounded-lg border bg-background px-2 text-xs outline-none"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {items.length.toLocaleString("es-AR")}
        </span>
        {items.length === 1 ? " ingrediente" : " ingredientes"}
      </p>

      {items.length > 0 ? (
        <div className="divide-y overflow-hidden rounded-xl border bg-card">
          {items.map((item, index) => (
            <Link
              key={item.id}
              href={`/app/ingredients/${item.id}?from=${encodeURIComponent(slug)}`}
              style={{ animationDelay: `${Math.min(index, 10) * 30}ms` }}
              className="animate-fade-in-up group flex flex-col gap-2 px-4 py-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.displayName}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {item.cas_number && (
                    <span className="font-mono">CAS {item.cas_number}</span>
                  )}
                  {item.color_index && (
                    <span className="font-mono">CI {item.color_index}</span>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {item.statusLabel && item.statusTone ? (
                  <RegulatoryStatusBadge
                    label={item.statusLabel}
                    tone={item.statusTone}
                  />
                ) : (
                  <RuleStatusBadge status={item.ruleStatus} />
                )}
                {item.hasRestrictions && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    Restricciones
                  </span>
                )}
                {item.needsReview && <NeedsReviewBadge />}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
          No hay ingredientes con estos filtros.
        </p>
      )}
    </div>
  );
}
