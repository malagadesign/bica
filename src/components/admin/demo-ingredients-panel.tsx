import Link from "next/link";
import { ChevronRight, FlaskConical, Presentation } from "lucide-react";
import type { DemoIngredient } from "@/lib/data/demo-ingredients";
import {
  NeedsReviewBadge,
  RegulatoryStatusBadge,
} from "@/components/regulatory/status-badges";

type DemoIngredientsPanelProps = {
  ingredients: DemoIngredient[];
};

export function DemoIngredientsPanel({ ingredients }: DemoIngredientsPanelProps) {
  if (ingredients.length === 0) return null;

  return (
    <section className="bica-callout-info space-y-4">
      <div className="flex items-start gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--badge-info-bg)",
            color: "var(--badge-info-text)",
          }}
        >
          <Presentation className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold tracking-tight text-primary">
            Ingredientes recomendados para demostración
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Seleccionados por riqueza normativa: restricciones, documentos, reglas
            y variedad de estados. Solo visible para administradores.
          </p>
        </div>
      </div>

      <ul className="space-y-2">
        {ingredients.map((item) => (
          <li key={item.id}>
            <Link
              href={`/app/ingredients/${item.id}`}
              className="group flex flex-col gap-2 rounded-lg border border-[var(--bica-border)] bg-card px-4 py-3 transition-colors hover:bg-[var(--bica-muted)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <FlaskConical className="mt-0.5 size-4 shrink-0 text-primary/60" />
                <div className="min-w-0">
                  <p className="font-medium group-hover:text-primary">
                    {item.displayName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.reasons.join(" · ")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
                {item.categoryLabel && item.categoryTone && (
                  <RegulatoryStatusBadge
                    label={item.categoryLabel}
                    tone={item.categoryTone}
                  />
                )}
                {item.needsReview && <NeedsReviewBadge />}
                <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
