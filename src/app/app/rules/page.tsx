import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, ClipboardList, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import { unwrapJoin } from "@/lib/supabase-joins";
import {
  NeedsReviewBadge,
  RuleStatusBadge,
} from "@/components/regulatory/status-badges";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

type Props = {
  searchParams: Promise<{ needs_review?: string; page?: string }>;
};

export default async function RulesPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const onlyReview = params.needs_review === "true";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dbQuery = supabase
    .from("ingredient_rules")
    .select(
      `
      id,
      rule_status,
      needs_review,
      entry_number_ar,
      ingredients ( id, inci_name, chemical_name, color_index, cas_number ),
      regulatory_lists ( name, code ),
      regulatory_documents ( title, document_number )
    `,
      { count: "exact" }
    )
    .order("needs_review", { ascending: false })
    .order("created_at", { ascending: true })
    .range(from, to);

  if (onlyReview) {
    dbQuery = dbQuery.eq("needs_review", true);
  }

  const { data: rules, count, error } = await dbQuery;

  if (error) {
    return (
      <>
        <AppHeader title="Reglas regulatorias" userEmail={user.email} />
        <main className="flex flex-1 flex-col px-6 py-8">
          <div className="mx-auto w-full max-w-4xl">
            <ErrorState
              title="No pudimos cargar las reglas regulatorias"
              description="Hubo un problema al consultar la base normativa. Intentá de nuevo en unos segundos."
            />
          </div>
        </main>
      </>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AppHeader title="Reglas regulatorias" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-6">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: onlyReview ? "Pendientes de revisión" : "Reglas regulatorias" },
              ]}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {onlyReview ? "Pendientes de revisión" : "Reglas regulatorias"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {onlyReview
                  ? `${total.toLocaleString("es-AR")} reglas requieren validación manual`
                  : `${total.toLocaleString("es-AR")} reglas en la base`}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/app/rules"
                className={cn(
                  buttonVariants({
                    variant: onlyReview ? "outline" : "default",
                    size: "sm",
                  })
                )}
              >
                Todas
              </Link>
              <Link
                href="/app/rules?needs_review=true"
                className={cn(
                  buttonVariants({
                    variant: onlyReview ? "default" : "outline",
                    size: "sm",
                  })
                )}
              >
                Pendientes
              </Link>
            </div>
            </div>
          </div>

          {(rules ?? []).length > 0 ? (
            <div className="space-y-2">
              {rules!.map((rule, index) => {
                const ingredient = unwrapJoin(rule.ingredients);
                const list = unwrapJoin(rule.regulatory_lists);
                const doc = unwrapJoin(rule.regulatory_documents);

                return (
                  <Link
                    key={rule.id}
                    href={`/app/rules/${rule.id}`}
                    style={{ animationDelay: `${Math.min(index, 10) * 35}ms` }}
                    className="animate-fade-in-up group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:bg-accent/20 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        {ingredient
                          ? getIngredientDisplayName(ingredient)
                          : "Ingrediente no identificado"}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-muted-foreground">
                        {list?.name}
                        {doc?.document_number
                          ? ` · ${doc.document_number}`
                          : doc?.title
                            ? ` · ${doc.title}`
                            : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RuleStatusBadge status={rule.rule_status} />
                      {rule.needs_review && <NeedsReviewBadge />}
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : onlyReview ? (
            <EmptyState
              icon={CheckCircle2}
              title="Nada pendiente por ahora"
              description="Todas las reglas cargadas fueron revisadas. Cuando haya nuevas importaciones, las excepciones aparecerán acá."
              action={
                <Link
                  href="/app/rules"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Ver todas las reglas
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={ClipboardList}
              title="Sin reglas cargadas"
              description="Las reglas vinculan cada ingrediente con su listado, documento normativo y restricciones de uso."
            />
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Página {page} de {totalPages}
              </span>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/app/rules?page=${page - 1}${onlyReview ? "&needs_review=true" : ""}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/app/rules?page=${page + 1}${onlyReview ? "&needs_review=true" : ""}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Siguiente
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
