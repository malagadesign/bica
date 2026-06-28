import Link from "next/link";
import type { KnowledgeArticleMeta } from "@/lib/knowledge-center/types";

type KnowledgeArticleLayoutProps = {
  article: KnowledgeArticleMeta;
  backHref: string;
  backLabel: string;
  children: React.ReactNode;
};

export function KnowledgeArticleLayout({
  article,
  backHref,
  backLabel,
  children,
}: KnowledgeArticleLayoutProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Link
          href={backHref}
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-primary"
        >
          ← {backLabel}
        </Link>
        <header className="space-y-3 border-b border-[var(--bica-border)] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {article.category}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-primary">
            {article.title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {article.description}
          </p>
          <p className="text-xs text-muted-foreground">
            Actualizado: {article.updatedAt} · BICA {article.productVersion}
          </p>
        </header>
      </div>
      {children}
    </div>
  );
}

type KnowledgeArticleCardProps = {
  article: KnowledgeArticleMeta;
};

export function KnowledgeArticleCard({ article }: KnowledgeArticleCardProps) {
  return (
    <Link
      href={article.href}
      className="group block rounded-xl border border-border/60 bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:shadow-sm"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {article.category}
      </p>
      <h2 className="mt-2 text-lg font-semibold tracking-tight group-hover:text-primary">
        {article.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {article.description}
      </p>
    </Link>
  );
}

type KnowledgeCategorySectionProps = {
  category: string;
  articles: KnowledgeArticleMeta[];
};

export function KnowledgeCategorySection({
  category,
  articles,
}: KnowledgeCategorySectionProps) {
  if (articles.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{category}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {articles.map((article) => (
          <KnowledgeArticleCard key={`${article.audience}-${article.slug}`} article={article} />
        ))}
      </div>
    </section>
  );
}
