import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = {
  title: "Administración — Centro de Conocimiento BICA",
  description: "Guías operativas para administradores de BICA.",
};

export default async function AdminKnowledgeCenterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") {
    redirect("/app/help");
  }

  const articles = getArticlesForViewer({
    isAuthenticated: true,
    isAdmin: true,
  }).filter((article) => article.audience === "admin");

  const byCategory = getArticlesByCategory(articles);
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b, "es"));

  const searchArticles = getArticlesForViewer({
    isAuthenticated: true,
    isAdmin: true,
  });

  return (
    <>
      <AppHeader title="Centro de Conocimiento — Admin" userEmail={user.email} />
      <main className="flex flex-1 flex-col gap-8 px-6 py-8">
        <div className="mx-auto w-full max-w-4xl space-y-10">
          <div className="animate-fade-in-up space-y-3">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Centro de Conocimiento", href: "/app/help" },
                { label: "Administración" },
              ]}
            />
            <h1 className="text-2xl font-semibold tracking-tight">
              Guías de administración
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Procedimientos operativos para actualizaciones normativas,
              workflow editorial y gestión de accesos.
            </p>
          </div>

          <KnowledgeSearch articles={toSearchItems(searchArticles)} />

          <Link
            href="/app/help"
            className="inline-flex text-sm text-muted-foreground hover:text-primary"
          >
            ← Volver al Centro de Conocimiento
          </Link>

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
