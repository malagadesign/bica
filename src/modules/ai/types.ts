/**
 * Tipos para integración futura de IA en BICA.
 * Sprint 8 — solo contratos; sin implementación ni llamadas a proveedores.
 */

export type AIConfidenceLevel = "high" | "medium" | "low";

export type AISuggestionType =
  | "change_classification"
  | "ingredient_match"
  | "conflict_detection"
  | "name_normalization"
  | "impact_summary"
  | "missing_field"
  | "editorial_assistance";

export type AISuggestionSource = {
  type: "document" | "rule" | "url" | "record_id" | "internal";
  reference: string;
  label?: string;
};

/** Sugerencia estructurada — nunca texto libre para operaciones críticas */
export type AISuggestion = {
  id: string;
  suggestion_type: AISuggestionType;
  confidence: number;
  confidence_level: AIConfidenceLevel;
  source: AISuggestionSource;
  explanation: string;
  affected_fields: string[];
  requires_human_review: boolean;
  warnings: string[];
  proposed_value?: unknown;
  metadata?: Record<string, unknown>;
};

export type AIAnalysisResult = {
  update_id: string;
  suggestions: AISuggestion[];
  summary: string | null;
  model: string | null;
  prompt_version: string | null;
  analyzed_at: string;
};

export function confidenceLevel(score: number): AIConfidenceLevel {
  if (score >= 0.85) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

export function requiresExplicitReview(suggestion: AISuggestion): boolean {
  return (
    suggestion.requires_human_review ||
    suggestion.confidence_level !== "high"
  );
}

/** Umbrales documentados en BICA_AI_ARCHITECTURE.md */
export const AI_CONFIDENCE_THRESHOLDS = {
  high: 0.85,
  medium: 0.6,
} as const;
