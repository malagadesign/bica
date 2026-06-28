import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BicaLogo } from "@/components/brand/bica-logo";
import {
  canAccessArticle,
  getArticleBySlug,
} from "@/lib/knowledge-center/articles";
import { KnowledgeArticleLayout } from "@/components/knowledge-center/knowledge-article-layout";
import { KnowledgeArticleBody } from "@/components/knowledge-center/knowledge-article-body";
import { ThemeSelector } from "@/components/layout/theme-selector";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { getAllArticles } = await import("@/lib/knowledge-center/articles");
  return getAllArticles()
    .filter((article) => article.audience === "public")
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug, "public");
  if (!article) return { title: "Artículo no encontrado — BICA" };

  return {
    title: `${article.title} — Centro de Conocimiento BICA`,
    description: article.description,
  };
}

export default async function PublicKnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug, "public");
  if (
    !article ||
    !canAccessArticle(article, { isAuthenticated: false, isAdmin: false })
  ) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-[var(--bica-border)] px-6 py-6">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link href="/">
            <BicaLogo height={36} showDescriptor />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSelector variant="compact" />
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-primary"
            >
              Ingresar
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <KnowledgeArticleLayout
          article={article}
          backHref="/ayuda"
          backLabel="Centro de Conocimiento"
        >
          <KnowledgeArticleBody content={article.content} />
        </KnowledgeArticleLayout>
      </main>
    </div>
  );
}
