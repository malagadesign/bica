-- Cosing AR — Etapa 1A: core rules + seed controlado
-- Tablas: ingredient_synonyms, ingredient_rules, restrictions, rule_versions
-- NOTA: source_record_id es clave del seed CSV actual (Etapa 1A).
--       En Etapa 2 la trazabilidad real será ImportBatch + ImportRow + ImportDiff.

-- ---------------------------------------------------------------------------
-- Ajustes Etapa 0
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredients
  ALTER COLUMN inci_name DROP NOT NULL;

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS color_index TEXT;

CREATE INDEX IF NOT EXISTS idx_ingredients_color_index
  ON public.ingredients (color_index)
  WHERE color_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ingredients_chemical_name
  ON public.ingredients (chemical_name);

ALTER TABLE public.regulatory_documents
  ADD COLUMN IF NOT EXISTS mercosur_reference TEXT,
  ADD COLUMN IF NOT EXISTS source_label TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_regulatory_documents_fingerprint
  ON public.regulatory_documents (
    authority_id,
    COALESCE(document_number, ''),
    COALESCE(source_url, ''),
    COALESCE(mercosur_reference, '')
  );

-- ---------------------------------------------------------------------------
-- ingredient_synonyms
-- ---------------------------------------------------------------------------

CREATE TABLE public.ingredient_synonyms (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id  UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE CASCADE,
  synonym        TEXT NOT NULL,
  synonym_type   TEXT NOT NULL DEFAULT 'other',
  source         TEXT DEFAULT 'csv_seed_1a',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ingredient_synonyms_unique
    UNIQUE (ingredient_id, synonym, synonym_type)
);

CREATE INDEX idx_ingredient_synonyms_ingredient
  ON public.ingredient_synonyms (ingredient_id);

CREATE INDEX idx_ingredient_synonyms_synonym
  ON public.ingredient_synonyms (synonym);

-- ---------------------------------------------------------------------------
-- ingredient_rules
-- ---------------------------------------------------------------------------

CREATE TABLE public.ingredient_rules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id     UUID NOT NULL REFERENCES public.ingredients(id) ON DELETE RESTRICT,
  authority_id      UUID NOT NULL REFERENCES public.regulatory_authorities(id) ON DELETE RESTRICT,
  list_id           UUID NOT NULL REFERENCES public.regulatory_lists(id) ON DELETE RESTRICT,
  document_id       UUID NOT NULL REFERENCES public.regulatory_documents(id) ON DELETE RESTRICT,

  rule_status       TEXT NOT NULL,

  -- Trazabilidad CSV / seed Etapa 1A (no identidad regulatoria permanente)
  source_record_id  TEXT NOT NULL,
  source_sheet      TEXT,
  source_row_start  INTEGER,
  source_row_end    INTEGER,
  entry_number_ar   TEXT,
  entry_number_eu   TEXT,
  conditions_raw    TEXT,

  needs_review      BOOLEAN NOT NULL DEFAULT false,
  review_reason     TEXT,

  -- Reservado Etapa 2 (NULL en seed 1A)
  import_batch_id   UUID,

  is_active         BOOLEAN NOT NULL DEFAULT true,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ingredient_rules_source_record_unique
    UNIQUE (source_record_id),

  CONSTRAINT ingredient_rules_context_unique
    UNIQUE (ingredient_id, list_id, document_id, source_record_id)
);

CREATE INDEX idx_ingredient_rules_ingredient
  ON public.ingredient_rules (ingredient_id);

CREATE INDEX idx_ingredient_rules_list
  ON public.ingredient_rules (list_id);

CREATE INDEX idx_ingredient_rules_document
  ON public.ingredient_rules (document_id);

CREATE INDEX idx_ingredient_rules_authority
  ON public.ingredient_rules (authority_id);

CREATE INDEX idx_ingredient_rules_needs_review
  ON public.ingredient_rules (needs_review)
  WHERE needs_review = true;

CREATE INDEX idx_ingredient_rules_status
  ON public.ingredient_rules (rule_status);

-- ---------------------------------------------------------------------------
-- restrictions
-- ---------------------------------------------------------------------------

CREATE TABLE public.restrictions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_rule_id  UUID NOT NULL REFERENCES public.ingredient_rules(id) ON DELETE CASCADE,
  application_area    TEXT,
  max_concentration   NUMERIC(12, 6),
  concentration_unit  TEXT,
  expressed_as        TEXT,
  limitation_text     TEXT,
  warning_text        TEXT,
  condition_text      TEXT,
  notes               TEXT,
  extended_conditions JSONB,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restrictions_rule
  ON public.restrictions (ingredient_rule_id);

-- ---------------------------------------------------------------------------
-- rule_versions (append-only)
-- ---------------------------------------------------------------------------

CREATE TABLE public.rule_versions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_rule_id UUID NOT NULL REFERENCES public.ingredient_rules(id) ON DELETE CASCADE,
  version_number     TEXT NOT NULL DEFAULT '1.0',
  schema_version     INTEGER NOT NULL DEFAULT 1,
  data_snapshot      JSONB NOT NULL,
  change_description TEXT DEFAULT 'Etapa 1A — seed inicial controlado desde CSV',
  created_by         TEXT DEFAULT 'seed_script_1a',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rule_versions_rule
  ON public.rule_versions (ingredient_rule_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER ingredient_rules_updated_at
  BEFORE UPDATE ON public.ingredient_rules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER restrictions_updated_at
  BEFORE UPDATE ON public.restrictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security (lectura autenticada)
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredient_synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "synonyms_select_authenticated"
  ON public.ingredient_synonyms FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rules_select_authenticated"
  ON public.ingredient_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "restrictions_select_authenticated"
  ON public.restrictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rule_versions_select_authenticated"
  ON public.rule_versions FOR SELECT
  TO authenticated
  USING (true);
