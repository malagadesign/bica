"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { KnowledgeSearchItem } from "@/lib/knowledge-center/types";

type KnowledgeSearchProps = {
  articles: KnowledgeSearchItem[];
  placeholder?: string;
};

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function KnowledgeSearch({
  articles,
  placeholder = "Buscar en el Centro de Conocimiento…",
}: KnowledgeSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];

    const needle = normalize(trimmed);
    return articles
      .filter((article) => {
        const haystack = normalize(
          `${article.title} ${article.description} ${article.category} ${article.searchText}`
        );
        return haystack.includes(needle);
      })
      .slice(0, 12);
  }, [articles, query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className="pl-9"
          aria-label="Buscar artículos"
        />
      </div>

      {query.trim().length >= 2 && (
        <div className="rounded-xl border border-border/60 bg-card">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No encontramos artículos para &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="divide-y divide-border/60">
              {results.map((article) => (
                <li key={`${article.audience}-${article.slug}`}>
                  <Link
                    href={article.href}
                    className="block px-4 py-3 transition-colors hover:bg-accent/30"
                  >
                    <p className="font-medium">{article.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {article.description}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {article.category}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
