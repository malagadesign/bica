-- Sprint 7 — Regulatory Publication Pipeline
-- Actualizaciones normativas (workspace aislado de producción hasta publicar)

-- ---------------------------------------------------------------------------
-- regulatory_updates
-- ---------------------------------------------------------------------------

CREATE TABLE public.regulatory_updates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  source_type       TEXT NOT NULL CHECK (source_type IN ('csv', 'xlsx', 'pdf')),
  source_filename   TEXT NOT NULL,
  source_encoding   TEXT,
  source_sheet      TEXT,
  origin            TEXT NOT NULL DEFAULT 'Argentina / MERCOSUR',
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'processing',
    'validated',
    'in_review',
    'ready_to_publish',
    'published',
    'failed'
  )),
  notes             TEXT,
  row_count         INTEGER NOT NULL DEFAULT 0,
  validation_report JSONB NOT NULL DEFAULT '{}',
  diff_summary      JSONB NOT NULL DEFAULT '{}',
  conflict_count    INTEGER NOT NULL DEFAULT 0,
  version_number    INTEGER,
  created_by        UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  validated_at      TIMESTAMPTZ,
  published_at      TIMESTAMPTZ,
  published_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message     TEXT
);

CREATE INDEX idx_regulatory_updates_status ON public.regulatory_updates (status);
CREATE INDEX idx_regulatory_updates_created_by ON public.regulatory_updates (created_by);
CREATE INDEX idx_regulatory_updates_published_at ON public.regulatory_updates (published_at DESC NULLS LAST);

-- ---------------------------------------------------------------------------
-- regulatory_update_items — staging (nunca es producción hasta publicar)
-- ---------------------------------------------------------------------------

CREATE TABLE public.regulatory_update_items (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id           UUID NOT NULL REFERENCES public.regulatory_updates(id) ON DELETE CASCADE,
  row_index           INTEGER NOT NULL,
  entity_type         TEXT NOT NULL DEFAULT 'rule' CHECK (entity_type IN (
    'ingredient', 'rule', 'restriction', 'document', 'list'
  )),
  entity_key          TEXT NOT NULL,
  change_type         TEXT NOT NULL DEFAULT 'unchanged' CHECK (change_type IN (
    'create', 'update', 'delete', 'unchanged'
  )),
  normalized_payload  JSONB NOT NULL,
  published_snapshot  JSONB,
  field_diff          JSONB,
  has_conflict        BOOLEAN NOT NULL DEFAULT false,
  conflict_reason     TEXT,
  resolution          TEXT CHECK (resolution IN ('pending', 'keep_published', 'accept_update')),
  validation_issues   JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT regulatory_update_items_unique_key UNIQUE (update_id, entity_key)
);

CREATE INDEX idx_regulatory_update_items_update ON public.regulatory_update_items (update_id);
CREATE INDEX idx_regulatory_update_items_conflicts ON public.regulatory_update_items (update_id)
  WHERE has_conflict = true;

-- ---------------------------------------------------------------------------
-- regulatory_publications — historial de versiones publicadas
-- ---------------------------------------------------------------------------

CREATE TABLE public.regulatory_publications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id       UUID NOT NULL REFERENCES public.regulatory_updates(id) ON DELETE RESTRICT,
  version_number  INTEGER NOT NULL,
  change_summary  JSONB NOT NULL DEFAULT '{}',
  published_by    UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT regulatory_publications_version_unique UNIQUE (version_number)
);

CREATE INDEX idx_regulatory_publications_update ON public.regulatory_publications (update_id);

-- ---------------------------------------------------------------------------
-- Trazabilidad en reglas publicadas
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredient_rules
  RENAME COLUMN import_batch_id TO regulatory_update_id;

ALTER TABLE public.ingredient_rules
  ADD CONSTRAINT ingredient_rules_regulatory_update_fk
  FOREIGN KEY (regulatory_update_id)
  REFERENCES public.regulatory_updates(id)
  ON DELETE SET NULL;

CREATE INDEX idx_ingredient_rules_regulatory_update
  ON public.ingredient_rules (regulatory_update_id)
  WHERE regulatory_update_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- RLS — solo administradores
-- ---------------------------------------------------------------------------

ALTER TABLE public.regulatory_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_update_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY regulatory_updates_admin_all ON public.regulatory_updates
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY regulatory_update_items_admin_all ON public.regulatory_update_items
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY regulatory_publications_admin_select ON public.regulatory_publications
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY regulatory_publications_admin_insert ON public.regulatory_publications
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_regulatory_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_regulatory_updates_updated_at
  BEFORE UPDATE ON public.regulatory_updates
  FOR EACH ROW EXECUTE FUNCTION public.set_regulatory_updates_updated_at();
