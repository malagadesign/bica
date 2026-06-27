import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import {
  formatRuleStatus,
  getIngredientDisplayName,
} from "@/lib/ingredient-display";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { unwrapJoin } from "@/lib/supabase-joins";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function IngredientDetailPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: ingredient, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !ingredient) notFound();

  const { data: rules } = await supabase
    .from("ingredient_rules")
    .select(
      `
      id,
      rule_status,
      source_record_id,
      entry_number_ar,
      entry_number_eu,
      conditions_raw,
      needs_review,
      review_reason,
      regulatory_lists ( name, code ),
      regulatory_documents ( title, document_number, mercosur_reference ),
      restrictions (
        id,
        application_area,
        max_concentration,
        concentration_unit,
        expressed_as,
        limitation_text,
        warning_text,
        condition_text,
        notes
      )
    `
    )
    .eq("ingredient_id", id)
    .order("created_at", { ascending: true });

  return (
    <>
      <AppHeader title={getIngredientDisplayName(ingredient)} userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <Link
            href="/app/ingredients"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "mb-2 -ml-2"
            )}
          >
            ← Volver al listado
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">
            {getIngredientDisplayName(ingredient)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detalle de ingrediente — Etapa 1A
          </p>
        </div>

        <section className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">INCI</p>
            <p className="font-medium">{ingredient.inci_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nombre químico</p>
            <p className="font-medium">{ingredient.chemical_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">CAS</p>
            <p className="font-medium">{ingredient.cas_number ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Color Index</p>
            <p className="font-medium">{ingredient.color_index ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">EINECS</p>
            <p className="font-medium">{ingredient.einecs ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Función / listado</p>
            <p className="font-medium">{ingredient.function ?? "—"}</p>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">
            Reglas normativas ({rules?.length ?? 0})
          </h2>

          {!rules?.length && (
            <p className="text-sm text-muted-foreground">
              Este ingrediente no tiene reglas cargadas.
            </p>
          )}

          {rules?.map((rule) => {
            const list = unwrapJoin(rule.regulatory_lists);
            const doc = unwrapJoin(rule.regulatory_documents);
            const restrictions = (rule.restrictions ?? []) as Array<{
              id: string;
              application_area: string | null;
              max_concentration: number | null;
              concentration_unit: string | null;
              expressed_as: string | null;
              limitation_text: string | null;
              warning_text: string | null;
              condition_text: string | null;
              notes: string | null;
            }>;

            return (
              <article
                key={rule.id}
                className="space-y-3 rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{list?.name ?? "Lista"}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc?.document_number ?? doc?.title}
                      {doc?.mercosur_reference
                        ? ` · ${doc.mercosur_reference}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">
                      {formatRuleStatus(rule.rule_status)}
                    </span>
                    {rule.needs_review && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                        needs_review
                      </span>
                    )}
                  </div>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Nº AR</dt>
                    <dd>{rule.entry_number_ar ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Nº EU</dt>
                    <dd>{rule.entry_number_eu ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">source_record_id</dt>
                    <dd className="font-mono text-xs">{rule.source_record_id}</dd>
                  </div>
                </dl>

                {rule.conditions_raw && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Condiciones (raw)</p>
                    <p className="whitespace-pre-wrap">{rule.conditions_raw}</p>
                  </div>
                )}

                {rule.needs_review && rule.review_reason && (
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Motivo de revisión
                    </p>
                    <p className="mt-1">{rule.review_reason}</p>
                  </div>
                )}

                {restrictions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Restricciones ({restrictions.length})
                    </p>
                    {restrictions.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-md bg-muted/40 p-3 text-sm"
                      >
                        {r.application_area && (
                          <p>
                            <span className="text-muted-foreground">Área: </span>
                            {r.application_area}
                          </p>
                        )}
                        {r.max_concentration != null && (
                          <p>
                            <span className="text-muted-foreground">Máx: </span>
                            {r.max_concentration}
                            {r.concentration_unit ? ` ${r.concentration_unit}` : ""}
                            {r.expressed_as ? ` (${r.expressed_as})` : ""}
                          </p>
                        )}
                        {r.limitation_text && (
                          <p className="mt-1 whitespace-pre-wrap">
                            {r.limitation_text}
                          </p>
                        )}
                        {r.warning_text && (
                          <p className="mt-1 whitespace-pre-wrap text-amber-800 dark:text-amber-200">
                            {r.warning_text}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin restricciones (válido para listados como Prohibidos).
                  </p>
                )}
              </article>
            );
          })}
        </section>
      </main>
    </>
  );
}
