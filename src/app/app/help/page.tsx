import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  getArticlesByCategory,
  getArticlesForViewer,
  toSearchItems,
} from "@/lib/knowledge-center/articles";
import { KnowledgeCategorySection } from "@/components/knowledge-center/knowledge-article-layout";
import { KnowledgeSearch } from "@/components/knowledge-center/knowledge-search";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Centro de Conocimiento — BICA",
  description:
    "Guías para consultar normativa, interpretar fichas y comprender documentos en BICA.",
};

export default async function AppKnowledgeCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  const isAdmin = current?.profile.role === "admin";

  const articles = getArticlesForViewer({
    isAuthenticated: true,
    isAdmin,
  }).filter((article) => article.audience !== "admin");

  const byCategory = getArticlesByCategory(articles);
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b, "es"));

  const searchArticles = getArticlesForViewer({
    isAuthenticated: true,
    isAdmin,
  });

  return (
    <>
      <AppHeader title="Centro de Conocimiento" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Centro de Conocimiento" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Centro de Conocimiento
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Guías para comprender la información regulatoria y usar BICA con
              criterio profesional. También podés consultar el{" "}
              <Link href="/app/help/glosario-regulatorio" className="text-primary hover:underline">
                glosario regulatorio
              </Link>{" "}
              o contenido institucional público.
            </p>
          </div>

          <KnowledgeSearch articles={toSearchItems(searchArticles)} />

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/ayuda"
              className="rounded-lg border border-border/60 px-3 py-1.5 text-muted-foreground hover:text-primary"
            >
              Contenido público
            </Link>
            {isAdmin && (
              <Link
                href="/app/help/admin"
                className="rounded-lg border border-border/60 px-3 py-1.5 text-muted-foreground hover:text-primary"
              >
                Guías de administración
              </Link>
            )}
          </div>

          <div className="space-y-10">
            {categories.map((category) => (
              <KnowledgeCategorySection
                key={category}
                category={category}
                articles={byCategory.get(category) ?? []}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
