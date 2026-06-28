import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getListDocuments,
  getListIngredients,
  getListStats,
  getRegulatoryListBySlug,
} from "@/lib/data/regulatory-lists";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ListDetailExplorer } from "@/components/regulatory/list-detail-explorer";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string;
    needs_review?: string;
    has_restrictions?: string;
    status?: string;
  }>;
};

export default async function ListDetailPage({ params, searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { slug } = await params;
  const sp = await searchParams;

  const list = await getRegulatoryListBySlug(supabase, slug);
  if (!list) notFound();

  const [stats, documents, items] = await Promise.all([
    getListStats(supabase, list.id),
    getListDocuments(supabase, list.id),
    getListIngredients(supabase, list.id, {
      query: sp.q,
      needsReview: sp.needs_review === "true",
      hasRestrictions: sp.has_restrictions === "true",
      status: sp.status,
    }),
  ]);

  const description = list.description?.replace(/ \(seed Etapa 1A\)$/, "");

  return (
    <>
      <AppHeader title={list.name} userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-5xl space-y-10">
          <div className="animate-fade-in-up space-y-4">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Listados", href: "/app/lists" },
                { label: list.name },
              ]}
            />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {list.name}
              </h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Ingredientes</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {stats.ingredientCount.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Reglas</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {stats.ruleCount.toLocaleString("es-AR")}
                </p>
              </div>
              <div className="rounded-lg border bg-card px-4 py-3">
                <p className="text-xs text-muted-foreground">Documentos</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">
                  {documents.length.toLocaleString("es-AR")}
                </p>
              </div>
            </div>
          </div>

          {documents.length > 0 && (
            <section
              className="animate-fade-in-up space-y-4"
              style={{ animationDelay: "60ms" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                Documentos relacionados
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <Link
                      href={`/app/documents/${doc.id}`}
                      className="group flex flex-col gap-2 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium leading-snug group-hover:underline">
                            {doc.title}
                          </p>
                          {doc.document_number && (
                            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                              {doc.document_number}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {doc.ruleCount} reglas
                          </p>
                        </div>
                      </div>
                    </Link>
                    {doc.source_url && (
                      <a
                        href={doc.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "sm" }),
                          "w-fit gap-1 text-xs"
                        )}
                      >
                        Fuente oficial
                        <ExternalLink className="size-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section
            className="animate-fade-in-up space-y-4"
            style={{ animationDelay: "120ms" }}
          >
            <h2 className="text-lg font-semibold tracking-tight">
              Ingredientes en este listado
            </h2>
            <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando…</p>}>
              <ListDetailExplorer
                slug={slug}
                items={items}
                initialQuery={sp.q ?? ""}
              />
            </Suspense>
          </section>
        </div>
      </main>
    </>
  );
}
