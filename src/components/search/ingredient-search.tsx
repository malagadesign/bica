"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search, Sparkles } from "lucide-react";
import type { IngredientSearchResult } from "@/modules/search/types";
import { SearchResultRow } from "@/components/search/search-result-row";
import { cn } from "@/lib/utils";

type IngredientSearchProps = {
  variant?: "hero" | "compact";
  placeholder?: string;
  autoFocus?: boolean;
  initialQuery?: string;
  className?: string;
};

function SearchSkeleton() {
  return (
    <div className="space-y-1 px-2 py-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2 px-3 py-3">
          <div className="h-4 w-2/3 animate-shimmer rounded-md" />
          <div className="h-3 w-1/2 animate-shimmer rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function IngredientSearch({
  variant = "hero",
  placeholder = "INCI, CAS, nombre químico o sinónimo…",
  autoFocus = false,
  initialQuery = "",
  className,
}: IngredientSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<IngredientSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const trimmed = query.trim();
  const showPanel = open && focused;
  const showHint = focused && trimmed.length < 2;
  const showResults = showPanel && trimmed.length >= 2;
  const isPending =
    showResults && (loading || resolvedQuery !== trimmed);

  const fetchResults = useCallback(async (value: string) => {
    const q = value.trim();
    if (q.length < 2) {
      setResults([]);
      setResolvedQuery(null);
      setFetchError(false);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setFetchError(false);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&limit=8`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = (await res.json()) as { results: IngredientSearchResult[] };
      if (controller.signal.aborted) return;
      setResults(data.results);
      setResolvedQuery(q);
      setActiveIndex(0);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (controller.signal.aborted) return;
      setResults([]);
      setResolvedQuery(q);
      setFetchError(true);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed.length >= 2) {
      setLoading(true);
      debounceRef.current = setTimeout(() => fetchResults(query), 120);
    } else {
      abortRef.current?.abort();
      setResults([]);
      setResolvedQuery(null);
      setLoading(false);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, trimmed.length, fetchResults]);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const input = containerRef.current?.querySelector("input");
        input?.focus();
        setOpen(true);
        setFocused(true);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showResults || !results.length) {
      if (e.key === "Enter" && trimmed) {
        router.push(`/app/search?q=${encodeURIComponent(trimmed)}`);
        setOpen(false);
        setFocused(false);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIndex];
      if (target) {
        router.push(`/app/ingredients/${target.id}`);
        setOpen(false);
        setFocused(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFocused(false);
    }
  }

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div
        className={cn(
          "relative flex items-center bica-search-shell transition-all duration-200",
          isHero ? "h-14 px-4" : "h-10 px-3"
        )}
      >
        {isPending ? (
          <Loader2
            className={cn(
              "shrink-0 animate-spin text-muted-foreground",
              isHero ? "size-5" : "size-4"
            )}
          />
        ) : (
          <Search
            className={cn(
              "shrink-0 text-primary/60 transition-colors",
              focused && "text-primary",
              isHero ? "size-5" : "size-4"
            )}
          />
        )}
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setFocused(true);
          }}
          onBlur={() => {
            /* cierre manejado por click outside */
          }}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          aria-label="Buscar ingredientes"
          role="combobox"
          aria-expanded={showPanel}
          aria-haspopup="listbox"
          aria-controls="ingredient-search-results"
          className={cn(
            "flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60",
            isHero ? "px-4 text-base" : "px-3 text-sm"
          )}
          autoComplete="off"
          spellCheck={false}
        />
        {isHero && (
          <kbd className="hidden rounded-md border bg-muted/80 px-2 py-0.5 text-xs text-muted-foreground sm:inline-block">
            ⌘K
          </kbd>
        )}
      </div>

      {showPanel && (
        <div
          id="ingredient-search-results"
          role="listbox"
          className="animate-fade-in-scale absolute top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-xl border bg-popover shadow-lg"
        >
          {showHint && (
            <div className="flex items-start gap-3 px-4 py-4 text-sm text-muted-foreground">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
              <div>
                <p className="font-medium text-foreground">
                  Buscá por identificador o nombre
                </p>
                <p className="mt-1 text-xs leading-relaxed">
                  INCI, CAS, Color Index, nombre químico o sinónimo. Mínimo 2
                  caracteres.
                </p>
              </div>
            </div>
          )}

          {isPending && results.length === 0 && <SearchSkeleton />}

          {showResults &&
            !isPending &&
            fetchError &&
            resolvedQuery === trimmed && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium">Error al buscar</p>
              <p className="mt-1 text-xs text-muted-foreground">
                No pudimos consultar la base normativa. Intentá de nuevo.
              </p>
            </div>
          )}

          {showResults &&
            !isPending &&
            !fetchError &&
            resolvedQuery === trimmed &&
            results.length === 0 && (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-medium">Sin coincidencias</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Probá con otro término o revisá la ortografía de INCI/CAS.
              </p>
            </div>
          )}

          {showResults && results.length > 0 && (
            <>
              <ul
                className={cn(
                  "max-h-80 overflow-y-auto py-1 transition-opacity duration-150",
                  isPending && "opacity-60"
                )}
              >
                {results.map((result, index) => (
                  <li key={result.id}>
                    <SearchResultRow
                      result={result}
                      active={index === activeIndex}
                      showMatchContext={false}
                      onNavigate={() => {
                        setOpen(false);
                        setFocused(false);
                      }}
                    />
                  </li>
                ))}
              </ul>
              <div className="border-t px-4 py-2.5">
                <Link
                  href={`/app/search?q=${encodeURIComponent(trimmed)}`}
                  onClick={() => {
                    setOpen(false);
                    setFocused(false);
                  }}
                  className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  Ver todos los resultados →
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
