import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getDocumentRules,
  getRegulatoryDocumentById,
} from "@/lib/data/regulatory-documents";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  NeedsReviewBadge,
  RuleStatusBadge,
} from "@/components/regulatory/status-badges";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { OFFICIAL_SOURCE_NOTE } from "@/lib/legal/microcopy";
import { OfficialSourceNote } from "@/components/legal/official-source-note";
import { ContextualKnowledgeLink } from "@/components/knowledge-center/contextual-knowledge-link";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(
    new Date(iso)
  );
}

export default async function DocumentDetailPage({ params }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { id } = await params;
  const document = await getRegulatoryDocumentById(supabase, id);
  if (!document) notFound();

  const rules = await getDocumentRules(supabase, id, 80);

  return (
    <>
      <AppHeader title={document.title} userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Breadcrumbs
                items={[
                  { label: "Inicio", href: "/app/dashboard" },
                  { label: "Documentos", href: "/app/documents" },
                  { label: document.document_number ?? document.title },
                ]}
              />
              <ContextualKnowledgeLink
                href="/app/help/documentos-y-listados"
                label="Documentos y listados"
                description="Fuentes oficiales y trazabilidad normativa"
              />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight leading-snug">
                {document.title}
              </h1>
              {document.document_number && (
                <p className="mt-2 font-mono text-sm text-muted-foreground">
                  {document.document_number}
                </p>
              )}
            </div>

            {document.source_url && (
              <a
                href={document.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "gap-1"
                )}
              >
                Abrir documento oficial
                <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>

          <OfficialSourceNote text={OFFICIAL_SOURCE_NOTE} />

          <section
            className="animate-fade-in-up grid gap-4 sm:grid-cols-2"
            style={{ animationDelay: "60ms" }}
          >
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Autoridad</p>
              <p className="mt-1 font-medium">{document.authorityName}</p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Publicación</p>
              <p className="mt-1 font-medium">
                {formatDate(document.publication_date)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Vigencia</p>
              <p className="mt-1 font-medium">
                {formatDate(document.effective_date)}
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-xs text-muted-foreground">Reglas</p>
              <p className="mt-1 font-medium tabular-nums">
                {document.ruleCount.toLocaleString("es-AR")}
              </p>
            </div>
            {document.mercosur_reference && (
              <div className="rounded-xl border bg-card p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Referencia MERCOSUR</p>
                <p className="mt-1 text-sm">{document.mercosur_reference}</p>
              </div>
            )}
            {document.summary && (
              <div className="rounded-xl border bg-card p-4 sm:col-span-2">
                <p className="text-xs text-muted-foreground">Resumen</p>
                <p className="mt-1 text-sm leading-relaxed">{document.summary}</p>
              </div>
            )}
          </section>

          {document.lists.length > 0 && (
            <section
              className="animate-fade-in-up space-y-4"
              style={{ animationDelay: "120ms" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">
                Listados regulatorios
              </h2>
              <div className="flex flex-wrap gap-2">
                {document.lists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/app/lists/${list.slug}`}
                    className="rounded-lg border bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/30"
                  >
                    {list.name}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section
            className="animate-fade-in-up space-y-4"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Reglas e ingredientes
              </h2>
              {rules.length >= 80 && (
                <span className="text-xs text-muted-foreground">
                  Mostrando primeras 80
                </span>
              )}
            </div>

            {rules.length > 0 ? (
              <div className="divide-y overflow-hidden rounded-xl border bg-card">
                {rules.map((rule, index) => (
                  <div
                    key={rule.id}
                    style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
                    className="animate-fade-in-up flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/app/ingredients/${rule.ingredient.id}`}
                        className="font-medium hover:underline"
                      >
                        {rule.ingredient.displayName}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <Link
                          href={`/app/lists/${rule.list.slug}`}
                          className="hover:underline"
                        >
                          {rule.list.name}
                        </Link>
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <RuleStatusBadge status={rule.rule_status} />
                      {rule.needs_review && <NeedsReviewBadge />}
                      <Link
                        href={`/app/rules/${rule.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Ver regla
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este documento no tiene reglas asociadas.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
