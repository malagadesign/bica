-- Sprint 7A — Contexto de dominio regulatorio (tabla de pipeline, no producción)
-- Metadatos de la actualización normativa como activo regulatorio

ALTER TABLE public.regulatory_updates
  ADD COLUMN IF NOT EXISTS domain_context JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.regulatory_updates.domain_context IS
  'Contexto de dominio: fuente, tipo documental, número, URL oficial, fechas de revisión';
