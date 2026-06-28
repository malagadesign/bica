import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  canAccessArticle,
  getArticleBySlug,
} from "@/lib/knowledge-center/articles";
import { AppHeader } from "@/components/layout/app-header";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { KnowledgeArticleLayout } from "@/components/knowledge-center/knowledge-article-layout";
import { KnowledgeArticleBody } from "@/components/knowledge-center/knowledge-article-body";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const { getAllArticles } = await import("@/lib/knowledge-center/articles");
  return getAllArticles()
    .filter((article) => article.audience === "user")
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug, "user");
  if (!article) return { title: "Artículo no encontrado — BICA" };

  return {
    title: `${article.title} — Centro de Conocimiento BICA`,
    description: article.description,
  };
}

export default async function AppKnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const article = getArticleBySlug(slug, "user");
  if (
    !article ||
    !canAccessArticle(article, { isAuthenticated: true, isAdmin: false })
  ) {
    notFound();
  }

  return (
    <>
      <AppHeader title={article.title} userEmail={user.email} />
      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-8">
            <Breadcrumbs
              items={[
                { label: "Inicio", href: "/app/dashboard" },
                { label: "Centro de Conocimiento", href: "/app/help" },
                { label: article.title },
              ]}
            />
          </div>
          <KnowledgeArticleLayout
            article={article}
            backHref="/app/help"
            backLabel="Centro de Conocimiento"
          >
            <KnowledgeArticleBody content={article.content} />
          </KnowledgeArticleLayout>
        </div>
      </main>
    </>
  );
}
