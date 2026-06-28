import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { searchIngredientsQuery } from "@/modules/search/search-ingredients";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { IngredientSearch } from "@/components/search/ingredient-search";
import { SearchResultRow } from "@/components/search/search-result-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ContextualKnowledgeLink } from "@/components/knowledge-center/contextual-knowledge-link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  let results: Awaited<ReturnType<typeof searchIngredientsQuery>> = [];
  let searchError = false;

  if (query.length >= 2) {
    try {
      results = await searchIngredientsQuery(supabase, query, { limit: 50 });
    } catch {
      searchError = true;
    }
  }

  return (
    <>
      <AppHeader title="Búsqueda" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <div className="animate-fade-in-up space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <Breadcrumbs
                  items={[
                    { label: "Inicio", href: "/app/dashboard" },
                    { label: "Búsqueda" },
                  ]}
                />
                <h1 className="text-2xl font-semibold tracking-tight">Búsqueda</h1>
                <p className="text-sm text-muted-foreground">
                  INCI, CAS, Color Index, sinónimos, listas y restricciones normativas.
                </p>
              </div>
              <ContextualKnowledgeLink
                href="/app/help/buscar-informacion"
                label="Cómo buscar"
                description="Guía de búsqueda regulatoria en BICA"
              />
            </div>
          </div>

          <IngredientSearch
            variant="compact"
            className="max-w-xl"
            initialQuery={query}
          />

          {searchError ? (
            <ErrorState
              title="No pudimos completar la búsqueda"
              description="Hubo un problema al consultar la base normativa. Intentá de nuevo en unos segundos."
            />
          ) : query.length >= 2 ? (
            results.length > 0 ? (
              <div className="animate-fade-in-up space-y-1">
                <p className="mb-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {results.length.toLocaleString("es-AR")}
                  </span>
                  {results.length === 1 ? " resultado" : " resultados"} para
                  &ldquo;{query}&rdquo;
                </p>
                <div className="overflow-hidden rounded-xl border bg-card">
                  {results.map((result, index) => (
                    <div
                      key={result.id}
                      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
                      className="animate-fade-in-up border-b last:border-b-0"
                    >
                      <SearchResultRow result={result} showChevron />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={SearchX}
                title="No se encontraron resultados"
                description="Probá con INCI, CAS, CI, nombre químico, lista regulatoria o texto de restricción."
                action={
                  <Link
                    href="/app/ingredients"
                    className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                  >
                    Explorar ingredientes regulados
                  </Link>
                }
              />
            )
          ) : (
            <EmptyState
              icon={SearchX}
              title="Escribí al menos 2 caracteres"
              description="Podés buscar por identificador, nombre o contexto normativo como “filtros uv” o “prohibidos”."
              className="py-10"
            />
          )}
        </div>
      </main>
    </>
  );
}
