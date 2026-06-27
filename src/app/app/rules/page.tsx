import Link from "next/link";
import { redirect } from "next/navigation";
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

const PAGE_SIZE = 50;

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
      source_record_id,
      needs_review,
      review_reason,
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
        <AppHeader title="Reglas" userEmail={user.email} />
        <main className="p-6">
          <p className="text-destructive">Error al cargar reglas: {error.message}</p>
        </main>
      </>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AppHeader title="Reglas normativas" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Reglas normativas
            </h1>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString("es-AR")} reglas
              {onlyReview ? " pendientes de revisión" : ""}
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
              needs_review
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Ingrediente</th>
                <th className="px-4 py-3 font-medium">Lista</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Nº AR</th>
                <th className="px-4 py-3 font-medium">Revisión</th>
              </tr>
            </thead>
            <tbody>
              {(rules ?? []).map((rule) => {
                const ingredient = unwrapJoin(rule.ingredients);
                const list = unwrapJoin(rule.regulatory_lists);

                return (
                  <tr key={rule.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {ingredient ? (
                        <Link
                          href={`/app/ingredients/${ingredient.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {getIngredientDisplayName(ingredient)}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {list?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {formatRuleStatus(rule.rule_status)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {rule.entry_number_ar ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {rule.needs_review ? (
                        <span
                          className="text-xs text-amber-800 dark:text-amber-200"
                          title={rule.review_reason ?? undefined}
                        >
                          Sí
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!rules?.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {onlyReview
                      ? "No hay reglas con needs_review. ¿Ejecutaste el seed?"
                      : "No hay reglas cargadas."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
      </main>
    </>
  );
}
