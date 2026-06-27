import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [
    ingredientsResult,
    rulesResult,
    reviewResult,
  ] = await Promise.all([
    supabase.from("ingredients").select("*", { count: "exact", head: true }),
    supabase.from("ingredient_rules").select("*", { count: "exact", head: true }),
    supabase
      .from("ingredient_rules")
      .select("*", { count: "exact", head: true })
      .eq("needs_review", true),
  ]);

  const schemaReady =
    !ingredientsResult.error &&
    !rulesResult.error &&
    !reviewResult.error;

  const ingredientsCount = ingredientsResult.count ?? 0;
  const rulesCount = rulesResult.count ?? 0;
  const reviewCount = reviewResult.count ?? 0;
  const hasData = ingredientsCount > 0;

  return (
    <>
      <AppHeader title="Dashboard" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bienvenido{user.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Plataforma regulatoria cosmética — Etapa 1A
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ingredientes</CardTitle>
              <CardDescription>Maestro cargado</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {(ingredientsCount ?? 0).toLocaleString("es-AR")}
              </p>
              <Link
                href="/app/ingredients"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "mt-2 h-auto p-0"
                )}
              >
                Ver listado
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reglas</CardTitle>
              <CardDescription>IngredientRule</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">
                {(rulesCount ?? 0).toLocaleString("es-AR")}
              </p>
              <Link
                href="/app/rules"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "mt-2 h-auto p-0"
                )}
              >
                Ver reglas
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">needs_review</CardTitle>
              <CardDescription>Pendientes de revisión</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-amber-700 dark:text-amber-300">
                {(reviewCount ?? 0).toLocaleString("es-AR")}
              </p>
              <Link
                href="/app/rules?needs_review=true"
                className={cn(
                  buttonVariants({ variant: "link", size: "sm" }),
                  "mt-2 h-auto p-0"
                )}
              >
                Filtrar pendientes
              </Link>
            </CardContent>
          </Card>

          <Card className={hasData ? "opacity-60" : ""}>
            <CardHeader>
              <CardTitle className="text-base">Seed Etapa 1A</CardTitle>
              <CardDescription>Carga inicial controlada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {!schemaReady
                  ? "Aplicá la migración Etapa 1A y ejecutá npm run seed:csv."
                  : hasData
                    ? "Datos cargados desde CSV normalizado."
                    : "Ejecutá npm run seed:csv:dry-run y luego npm run seed:csv."}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-base">Búsqueda</CardTitle>
              <CardDescription>Etapa 3</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-base">Importaciones</CardTitle>
              <CardDescription>Etapa 2</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>

          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="text-base">Administración</CardTitle>
              <CardDescription>Etapa posterior</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Próximamente</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
