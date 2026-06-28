/**
 * Abstracción de proveedor de IA — Sprint 8 (contrato conceptual).
 * Implementaciones concretas (OpenAI, etc.) NO deben existir hasta Sprint posterior.
 */

import type { AIAnalysisResult, AISuggestion } from "./types";

export type AnalyzeRegulatoryUpdateInput = {
  updateId: string;
  normalizedRules: unknown[];
  domainContext: Record<string, unknown>;
};

export type SuggestIngredientMatchesInput = {
  name: string;
  casNumber?: string | null;
  inciName?: string | null;
  candidates: Array<{ id: string; label: string; score?: number }>;
};

export type DetectPotentialConflictsInput = {
  proposed: Record<string, unknown>;
  published: Record<string, unknown> | null;
};

export type SummarizeUpdateImpactInput = {
  diffSummary: Record<string, unknown>;
  itemCount: number;
};

export type NormalizeSubstanceNameInput = {
  rawName: string;
  context?: string;
};

/**
 * Interfaz futura para cualquier proveedor de IA regulatoria en BICA.
 * Ubicación: src/modules/ai/providers/ (implementaciones futuras)
 */
export interface RegulatoryAIProvider {
  readonly providerId: string;

  analyzeRegulatoryUpdate(
    input: AnalyzeRegulatoryUpdateInput
  ): Promise<AIAnalysisResult>;

  suggestIngredientMatches(
    input: SuggestIngredientMatchesInput
  ): Promise<AISuggestion[]>;

  detectPotentialConflicts(
    input: DetectPotentialConflictsInput
  ): Promise<AISuggestion[]>;

  summarizeUpdateImpact(
    input: SummarizeUpdateImpactInput
  ): Promise<AISuggestion>;

  normalizeSubstanceName(
    input: NormalizeSubstanceNameInput
  ): Promise<AISuggestion>;
}
