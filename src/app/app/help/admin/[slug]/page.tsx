import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/profile";
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
    .filter((article) => article.audience === "admin")
    .map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug, "admin");
  if (!article) return { title: "Artículo no encontrado — BICA" };

  return {
    title: `${article.title} — Centro de Conocimiento BICA`,
    description: article.description,
  };
}

export default async function AdminKnowledgeArticlePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const current = await getCurrentProfile();
  if (!current || current.profile.role !== "admin") {
    redirect("/app/help");
  }

  const article = getArticleBySlug(slug, "admin");
  if (
    !article ||
    !canAccessArticle(article, { isAuthenticated: true, isAdmin: true })
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
                { label: "Administración", href: "/app/help/admin" },
                { label: article.title },
              ]}
            />
          </div>
          <KnowledgeArticleLayout
            article={article}
            backHref="/app/help/admin"
            backLabel="Guías de administración"
          >
            <KnowledgeArticleBody content={article.content} />
          </KnowledgeArticleLayout>
        </div>
      </main>
    </>
  );
}
