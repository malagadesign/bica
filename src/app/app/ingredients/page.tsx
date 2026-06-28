import Link from "next/link";
import { redirect } from "next/navigation";
import { SearchX, FlaskConical } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getIngredientList } from "@/lib/data/ingredient-list";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { IngredientSearch } from "@/components/search/ingredient-search";
import { IngredientCard } from "@/components/ingredients/ingredient-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function IngredientsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const { items, total, pageSize } = await getIngredientList(supabase, {
    query,
    page,
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <AppHeader title="Ingredientes regulados" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Ingredientes regulados" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Ingredientes regulados
            </h1>
            <p className="text-sm text-muted-foreground">
              {query ? (
                <>
                  <span className="font-medium text-foreground">{total.toLocaleString("es-AR")}</span>
                  {" "}resultados para &ldquo;{query}&rdquo;
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground">{total.toLocaleString("es-AR")}</span>
                  {" "}ingredientes con información regulatoria
                </>
              )}
            </p>
          </div>

          <IngredientSearch variant="compact" className="max-w-xl" />

          {items.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((item, index) => (
                <IngredientCard key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : query ? (
            <EmptyState
              icon={SearchX}
              title="No encontramos ese ingrediente"
              description="Revisá el INCI o CAS, probá con el nombre químico en español, o buscá por sinónimo comercial."
              action={
                <Link
                  href="/app/ingredients"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Ver catálogo completo
                </Link>
              }
            />
          ) : (
            <EmptyState
              icon={FlaskConical}
              title="El catálogo está vacío"
              description="Todavía no hay ingredientes cargados. Cuando la base esté disponible, vas a poder consultar estado normativo, restricciones y documentos desde acá."
              action={
                <Link
                  href="/app/dashboard"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Volver al inicio
                </Link>
              }
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
                    href={`/app/ingredients?page=${page - 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Anterior
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/app/ingredients?page=${page + 1}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
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
