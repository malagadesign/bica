import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { searchIngredientsQuery } from "@/modules/search/search-ingredients";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { QaInternalBanner, SearchQaPanel } from "@/components/search/search-qa-panel";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchQaPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectTo=/app/search/qa");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") redirect("/app/dashboard");

  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const results =
    query.length >= 2
      ? (await searchIngredientsQuery(supabase, query, { limit: 10 })).map(
          (r) => ({
            ...r,
            relevance_score: r.rank,
            match_field_raw: r.matchField,
          })
        )
      : [];

  return (
    <>
      <AppHeader title="Calidad de búsqueda" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-6 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <QaInternalBanner />

          <div className="space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Administración", href: "/app/admin/workspace" },
                { label: "Calidad de búsqueda" },
              ]}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Calidad de búsqueda
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Herramienta interna para validar relevancia y cobertura de
                  búsqueda. Solo administradores.
                </p>
              </div>
              <Link
                href="/app/search"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Ir a búsqueda pública
              </Link>
            </div>
          </div>

          <SearchQaPanel initialQuery={query} initialResults={results} />
        </div>
      </main>
    </>
  );
}
