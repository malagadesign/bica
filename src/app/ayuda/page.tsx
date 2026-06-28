import type { Metadata } from "next";
import Link from "next/link";
import { BicaLogo } from "@/components/brand/bica-logo";
import {
  getArticlesByCategory,
  getArticlesForViewer,
  toSearchItems,
} from "@/lib/knowledge-center/articles";
import { KnowledgeCategorySection } from "@/components/knowledge-center/knowledge-article-layout";
import { KnowledgeSearch } from "@/components/knowledge-center/knowledge-search";

export const metadata: Metadata = {
  title: "Centro de Conocimiento — BICA",
  description:
    "Información institucional sobre BICA, aviso legal y preguntas frecuentes.",
};

export default function PublicKnowledgeCenterPage() {
  const articles = getArticlesForViewer({
    isAuthenticated: false,
    isAdmin: false,
  });
  const byCategory = getArticlesByCategory(articles);
  const categories = [...byCategory.keys()].sort((a, b) => a.localeCompare(b, "es"));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[var(--bica-border)] px-6 py-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <Link href="/">
            <BicaLogo height={36} showDescriptor />
          </Link>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Ingresar a BICA
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="space-y-10">
          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Centro de Conocimiento
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-primary">
              Conocé BICA
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Información institucional sobre la plataforma de conocimiento
              regulatorio cosmético. Si ya tenés acceso, ingresá para ver guías
              completas de consulta y uso.
            </p>
          </header>

          <KnowledgeSearch articles={toSearchItems(articles)} />

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
    </div>
  );
}
