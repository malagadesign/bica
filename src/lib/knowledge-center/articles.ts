import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type {
  KnowledgeArticle,
  KnowledgeArticleFrontmatter,
  KnowledgeArticleMeta,
  KnowledgeAudience,
  KnowledgeSearchItem,
} from "./types";
import { getArticleHref, stripMarkdownForSearch } from "./paths";

const CONTENT_ROOT = path.join(process.cwd(), "content/help");

const AUDIENCE_DIRS: Record<KnowledgeAudience, string> = {
  public: "public",
  user: "user",
  admin: "admin",
};

function parseFrontmatter(
  slug: string,
  raw: ReturnType<typeof matter>
): KnowledgeArticleMeta | null {
  const data = raw.data as Partial<KnowledgeArticleFrontmatter>;
  if (
    !data.title ||
    !data.description ||
    !data.audience ||
    !data.category ||
    !data.priority ||
    !data.productVersion ||
    !data.updatedAt
  ) {
    return null;
  }

  const audience = data.audience;
  const searchText = stripMarkdownForSearch(raw.content);

  return {
    slug,
    title: data.title,
    description: data.description,
    audience,
    category: data.category,
    priority: data.priority,
    productVersion: data.productVersion,
    updatedAt: data.updatedAt,
    relatedRoutes: data.relatedRoutes ?? [],
    href: getArticleHref(slug, audience),
    searchText,
  };
}

function readArticlesFromDir(audience: KnowledgeAudience): KnowledgeArticle[] {
  const dir = path.join(CONTENT_ROOT, AUDIENCE_DIRS[audience]);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = matter(fs.readFileSync(path.join(dir, file), "utf8"));
      const meta = parseFrontmatter(slug, raw);
      if (!meta || meta.audience !== audience) return null;

      return {
        ...meta,
        content: raw.content.trim(),
      } satisfies KnowledgeArticle;
    })
    .filter((article): article is KnowledgeArticle => article != null);
}

export function getAllArticles(): KnowledgeArticle[] {
  return (["public", "user", "admin"] as const).flatMap(readArticlesFromDir);
}

export function getArticleBySlug(
  slug: string,
  audience: KnowledgeAudience
): KnowledgeArticle | null {
  const filePath = path.join(CONTENT_ROOT, AUDIENCE_DIRS[audience], `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = matter(fs.readFileSync(filePath, "utf8"));
  const meta = parseFrontmatter(slug, raw);
  if (!meta || meta.audience !== audience) return null;

  return {
    ...meta,
    content: raw.content.trim(),
  };
}

export function getArticlesForViewer(options: {
  isAuthenticated: boolean;
  isAdmin: boolean;
}): KnowledgeArticleMeta[] {
  const { isAuthenticated, isAdmin } = options;

  return getAllArticles()
    .filter((article) => {
      if (article.audience === "public") return true;
      if (!isAuthenticated) return false;
      if (article.audience === "user") return true;
      return isAdmin;
    })
    .map((article) => {
      const { content, ...meta } = article;
      void content;
      return meta;
    });
}

export function canAccessArticle(
  article: KnowledgeArticleMeta,
  options: { isAuthenticated: boolean; isAdmin: boolean }
): boolean {
  if (article.audience === "public") return true;
  if (!options.isAuthenticated) return false;
  if (article.audience === "user") return true;
  return options.isAdmin;
}

export function getArticlesByCategory(
  articles: KnowledgeArticleMeta[]
): Map<string, KnowledgeArticleMeta[]> {
  const grouped = new Map<string, KnowledgeArticleMeta[]>();

  for (const article of articles) {
    const list = grouped.get(article.category) ?? [];
    list.push(article);
    grouped.set(article.category, list);
  }

  for (const list of grouped.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title, "es"));
  }

  return grouped;
}

export function toSearchItems(
  articles: KnowledgeArticleMeta[]
): KnowledgeSearchItem[] {
  return articles.map((article) => ({
    slug: article.slug,
    title: article.title,
    description: article.description,
    category: article.category,
    audience: article.audience,
    href: article.href,
    searchText: article.searchText,
  }));
}

export function findArticleByRelatedRoute(
  route: string,
  options: { isAuthenticated: boolean; isAdmin: boolean }
): KnowledgeArticleMeta | null {
  const articles = getArticlesForViewer(options);
  return (
    articles.find((article) => article.relatedRoutes?.includes(route)) ?? null
  );
}
