import type { KnowledgeAudience } from "./types";

export function getArticleHref(
  slug: string,
  audience: KnowledgeAudience
): string {
  switch (audience) {
    case "public":
      return `/ayuda/${slug}`;
    case "user":
      return `/app/help/${slug}`;
    case "admin":
      return `/app/help/admin/${slug}`;
  }
}

export function stripMarkdownForSearch(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
