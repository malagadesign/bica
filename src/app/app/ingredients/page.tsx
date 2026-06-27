import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { getIngredientDisplayName } from "@/lib/ingredient-display";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

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
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let dbQuery = supabase
    .from("ingredients")
    .select("id, inci_name, chemical_name, color_index, cas_number", {
      count: "exact",
    })
    .order("chemical_name", { ascending: true, nullsFirst: false })
    .range(from, to);

  if (query) {
    dbQuery = dbQuery.or(
      `inci_name.ilike.%${query}%,chemical_name.ilike.%${query}%,cas_number.ilike.%${query}%,color_index.ilike.%${query}%`
    );
  }

  const { data: ingredients, count, error } = await dbQuery;

  if (error) {
    return (
      <>
        <AppHeader title="Ingredientes" userEmail={user.email} />
        <main className="p-6">
          <p className="text-destructive">Error al cargar ingredientes: {error.message}</p>
        </main>
      </>
    );
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <AppHeader title="Ingredientes" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Ingredientes</h1>
            <p className="text-sm text-muted-foreground">
              {total.toLocaleString("es-AR")} registros — lectura Etapa 1A
            </p>
          </div>
          <Link
            href="/app/rules?needs_review=true"
            className={cn(buttonVariants({ variant: "outline" }), "text-sm")}
          >
            Ver pendientes de revisión
          </Link>
        </div>

        <form className="flex gap-2" method="get">
          <input
            name="q"
            defaultValue={query}
            placeholder="Buscar por INCI, nombre, CAS o CI..."
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
          <button
            type="submit"
            className={cn(buttonVariants({ variant: "default" }), "shrink-0")}
          >
            Buscar
          </button>
        </form>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">INCI</th>
                <th className="px-4 py-3 font-medium">CAS</th>
                <th className="px-4 py-3 font-medium">CI</th>
              </tr>
            </thead>
            <tbody>
              {(ingredients ?? []).map((ingredient) => (
                <tr key={ingredient.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      href={`/app/ingredients/${ingredient.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {getIngredientDisplayName(ingredient)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ingredient.inci_name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ingredient.cas_number ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ingredient.color_index ?? "—"}
                  </td>
                </tr>
              ))}
              {!ingredients?.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {query
                      ? "Sin resultados. ¿Ejecutaste el seed Etapa 1A?"
                      : "No hay ingredientes cargados. Ejecutá el seed desde scripts/seed-from-csv.ts."}
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
      </main>
    </>
  );
}
