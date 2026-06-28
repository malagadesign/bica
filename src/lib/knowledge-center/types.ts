export type KnowledgeAudience = "public" | "user" | "admin";

export type KnowledgeArticleFrontmatter = {
  title: string;
  description: string;
  audience: KnowledgeAudience;
  category: string;
  priority: string;
  productVersion: string;
  updatedAt: string;
  relatedRoutes?: string[];
};

export type KnowledgeArticleMeta = KnowledgeArticleFrontmatter & {
  slug: string;
  href: string;
  searchText: string;
};

export type KnowledgeArticle = KnowledgeArticleMeta & {
  content: string;
};

export type KnowledgeSearchItem = {
  slug: string;
  title: string;
  description: string;
  category: string;
  audience: KnowledgeAudience;
  href: string;
  searchText: string;
};
