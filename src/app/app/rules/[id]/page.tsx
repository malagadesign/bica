import Link from "next/link";
import { ExternalLink, ShieldOff } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import {
  formatRuleStatus,
  getIngredientDisplayName,
} from "@/lib/ingredient-display";
import { unwrapJoin } from "@/lib/supabase-joins";
import {
  NeedsReviewBadge,
  RuleStatusBadge,
} from "@/components/regulatory/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RuleProfilePage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;

  const { data: rule, error } = await supabase
    .from("ingredient_rules")
    .select(
      `
      *,
      ingredients ( id, inci_name, chemical_name, color_index, cas_number ),
      regulatory_lists ( name, code, description ),
      regulatory_documents (
        id, title, document_number, source_url, source_label,
        mercosur_reference, summary, publication_date
      ),
      restrictions (
        id, application_area, max_concentration, concentration_unit,
        expressed_as, limitation_text, warning_text, condition_text, notes
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !rule) notFound();

  const ingredient = unwrapJoin(rule.ingredients);
  const list = unwrapJoin(rule.regulatory_lists);
  const document = unwrapJoin(rule.regulatory_documents);
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
    <>
      <AppHeader
        title={list?.name ?? "Regla regulatoria"}
        userEmail={user.email}
      />
      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <div className="animate-fade-in-up">
            {ingredient && (
              <Link
                href={`/app/ingredients/${ingredient.id}`}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "-ml-2 mb-4 text-muted-foreground"
                )}
              >
                ← {getIngredientDisplayName(ingredient)}
              </Link>
            )}

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {list?.name ?? "Regla regulatoria"}
                </h1>
                <p className="text-muted-foreground">
                  {document?.document_number ?? document?.title}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <RuleStatusBadge status={rule.rule_status} />
                {rule.needs_review && <NeedsReviewBadge />}
              </div>
            </div>
          </div>

          <section
            className="animate-fade-in-up space-y-4 rounded-xl border bg-card p-6"
            style={{ animationDelay: "60ms" }}
          >
            <h2 className="text-sm font-medium text-muted-foreground">
              Documento normativo
            </h2>
            <div className="space-y-2">
              <p className="font-medium">{document?.title}</p>
              {document?.mercosur_reference && (
                <p className="text-sm text-muted-foreground">
                  {document.mercosur_reference}
                </p>
              )}
              {document?.summary && (
                <p className="text-sm text-muted-foreground">{document.summary}</p>
              )}
              {document?.source_url && (
                <a
                  href={document.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "mt-2 gap-1"
                  )}
                >
                  Abrir documento oficial
                  <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          </section>

          <section
            className="animate-fade-in-up grid gap-4 sm:grid-cols-2"
            style={{ animationDelay: "120ms" }}
          >
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Lista regulatoria</p>
              <p className="mt-1 font-medium">{list?.name ?? "—"}</p>
              {list?.code && (
                <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                  {list.code}
                </p>
              )}
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="mt-1 font-medium capitalize">
                {formatRuleStatus(rule.rule_status)}
              </p>
            </div>
            {rule.entry_number_ar && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Nº entrada AR</p>
                <p className="mt-1 font-medium">{rule.entry_number_ar}</p>
              </div>
            )}
            {rule.entry_number_eu && (
              <div className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">Nº entrada EU</p>
                <p className="mt-1 font-medium">{rule.entry_number_eu}</p>
              </div>
            )}
          </section>

          {restrictions.length > 0 ? (
            <section
              className="animate-fade-in-up space-y-4"
              style={{ animationDelay: "180ms" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                Condiciones de uso
              </h2>
              {restrictions.map((r, index) => (
                <article
                  key={r.id}
                  style={{ animationDelay: `${Math.min(index, 6) * 40}ms` }}
                  className="animate-fade-in-up space-y-3 rounded-xl border bg-card p-5"
                >
                  {r.application_area && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Área de aplicación
                      </p>
                      <p className="mt-1">{r.application_area}</p>
                    </div>
                  )}
                  {r.max_concentration != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Concentración máxima
                      </p>
                      <p className="mt-1 font-medium">
                        {r.max_concentration}
                        {r.concentration_unit ? ` ${r.concentration_unit}` : ""}
                        {r.expressed_as ? ` (${r.expressed_as})` : ""}
                      </p>
                    </div>
                  )}
                  {r.limitation_text && (
                    <div>
                      <p className="text-xs text-muted-foreground">Limitaciones</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {r.limitation_text}
                      </p>
                    </div>
                  )}
                  {r.warning_text && (
                    <div className="bica-callout-warning p-3">
                      <p className="text-xs font-medium">Advertencias</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {r.warning_text}
                      </p>
                    </div>
                  )}
                  {r.condition_text && (
                    <div>
                      <p className="text-xs text-muted-foreground">Condiciones</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">
                        {r.condition_text}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </section>
          ) : (
            <EmptyState
              icon={ShieldOff}
              title="Sin condiciones de uso"
              description={
                rule.rule_status === "prohibited"
                  ? "Esta regla corresponde a un listado prohibitivo — no aplica límite de concentración ni condiciones adicionales."
                  : "No hay restricciones de concentración, advertencias ni condiciones específicas para esta regla."
              }
              className="py-10"
            />
          )}

          {(rule.conditions_raw || rule.review_reason) && (
            <section
              className="animate-fade-in-up space-y-4"
              style={{ animationDelay: "240ms" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                Observaciones
              </h2>
              {rule.conditions_raw && (
                <div className="rounded-xl border bg-card p-5">
                  <p className="text-xs text-muted-foreground">Condiciones normativas</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {rule.conditions_raw}
                  </p>
                </div>
              )}
              {rule.needs_review && rule.review_reason && (
                <div className="bica-callout-warning p-5">
                  <p className="text-xs font-medium">Pendiente de revisión</p>
                  <p className="mt-2 text-sm">{rule.review_reason}</p>
                </div>
              )}
            </section>
          )}

          <section
            className="animate-fade-in-up rounded-xl border bg-muted/20 p-5"
            style={{ animationDelay: "300ms" }}
          >
            <p className="text-xs font-medium text-muted-foreground">Fuente</p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              {document?.source_label && (
                <div>
                  <dt className="text-muted-foreground">Origen</dt>
                  <dd>{document.source_label}</dd>
                </div>
              )}
              {rule.source_sheet && (
                <div>
                  <dt className="text-muted-foreground">Hoja origen</dt>
                  <dd>{rule.source_sheet}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>
      </main>
    </>
  );
}
