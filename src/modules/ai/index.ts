/**
 * Módulo de IA — gobernanza y contratos (Sprint 8).
 * Sin implementación de proveedores ni llamadas a APIs.
 *
 * @see docs/BICA_AI_ARCHITECTURE.md
 */

export type { RegulatoryAIProvider } from "./provider";
export type {
  AIAnalysisResult,
  AIConfidenceLevel,
  AISuggestion,
  AISuggestionSource,
  AISuggestionType,
} from "./types";
export {
  AI_CONFIDENCE_THRESHOLDS,
  confidenceLevel,
  requiresExplicitReview,
} from "./types";
