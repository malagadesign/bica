"use client";

import { useCallback, useState } from "react";
import { Copy, Check, Play, FlaskConical } from "lucide-react";
import type { IngredientSearchResult } from "@/modules/search/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const QA_BATTERY = [
  "Titanium",
  "Titanium Dioxide",
  "CI 77891",
  "77891",
  "13463-67-7",
  "Benzophenone",
  "Benzophenone-3",
  "Octocrylene",
  "Phenoxyethanol",
  "Filtros UV",
  "Conservantes",
  "Prohibidos",
  "Formaldehído",
  "Triclosan",
  "Microperlas",
  "Uñas artificiales",
  "Restrictiva",
  "contiene Benzophenone",
  "uso limitado",
  "advertencia",
] as const;

type QaResultRow = IngredientSearchResult & {
  relevance_score: number;
  match_field_raw: string;
};

type SearchQaPanelProps = {
  initialQuery?: string;
  initialResults?: QaResultRow[];
};

export function SearchQaPanel({
  initialQuery = "",
  initialResults = [],
}: SearchQaPanelProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<QaResultRow[]>(initialResults);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError("Mínimo 2 caracteres");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}&limit=10`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { results: IngredientSearchResult[] };
      setResults(
        (data.results ?? []).map((r) => ({
          ...r,
          relevance_score: r.rank,
          match_field_raw: r.matchField,
        }))
      );
    } catch {
      setError("Error al ejecutar búsqueda");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  async function handleCopy() {
    const payload = {
      query: query.trim(),
      executed_at: new Date().toISOString(),
      results: results.map((r, i) => ({
        rank: i + 1,
        id: r.id,
        display_name: r.displayName,
        inci_name: r.inci_name,
        cas_number: r.cas_number,
        color_index: r.color_index,
        match_field: r.matchField,
        match_context: r.matchContext,
        relevance_score: r.relevance_score,
        rule_count: r.ruleCount,
        needs_review: r.needsReview,
      })),
    };

    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void runSearch(query);
          }}
          placeholder="Query de prueba…"
          className="h-10 flex-1 rounded-lg border bg-background px-3 text-sm outline-none ring-ring focus:ring-2"
        />
        <button
          type="button"
          onClick={() => void runSearch(query)}
          disabled={loading}
          className={cn(buttonVariants(), "gap-2")}
        >
          <Play className="size-4" />
          {loading ? "Buscando…" : "Ejecutar"}
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
          >
            {copied ? (
              <Check className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
            {copied ? "Copiado" : "Copiar resultados"}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {QA_BATTERY.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setQuery(item);
              void runSearch(item);
            }}
            className="rounded-md border bg-muted/40 px-2.5 py-1 text-xs transition-colors hover:bg-muted"
          >
            {item}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {results.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Ingrediente</th>
                <th className="px-4 py-3 font-medium">Relevancia</th>
                <th className="px-4 py-3 font-medium">Coincidencia</th>
                <th className="px-4 py-3 font-medium">Contexto</th>
                <th className="px-4 py-3 font-medium">CAS / CI</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, index) => (
                <tr key={row.id} className="border-b last:border-b-0">
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <a
                      href={`/app/ingredients/${row.id}`}
                      className="hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {row.displayName}
                    </a>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums">
                    {row.relevance_score.toFixed(1)}
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                      {row.matchField}
                    </code>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                    {row.matchContext ?? "—"}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {row.cas_number && `CAS ${row.cas_number}`}
                    {row.cas_number && row.color_index && " · "}
                    {row.color_index && `CI ${row.color_index}`}
                    {!row.cas_number && !row.color_index && "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !loading &&
        !error &&
        query.trim().length >= 2 && (
          <p className="text-sm text-muted-foreground">Sin resultados.</p>
        )
      )}

      <p className="text-xs text-muted-foreground">
        Ver batería completa en{" "}
        <code className="rounded bg-muted px-1">docs/SEARCH_QA.md</code>
      </p>
    </div>
  );
}

export function QaInternalBanner() {
  return (
    <div className="bica-callout-warning flex items-start gap-3">
      <FlaskConical className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">Herramienta interna — solo administradores</p>
        <p className="mt-1 opacity-80">
          Validación de calidad de búsqueda. No visible en la navegación pública.
        </p>
      </div>
    </div>
  );
}
