-- Sprint 4 — Editorial workflow (Backoffice normativo)

-- ---------------------------------------------------------------------------
-- Editorial status on core content entities
-- ---------------------------------------------------------------------------

ALTER TABLE public.ingredients
  ADD COLUMN IF NOT EXISTS editorial_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS editorial_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editorial_updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.ingredient_rules
  ADD COLUMN IF NOT EXISTS editorial_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS editorial_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editorial_updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.restrictions
  ADD COLUMN IF NOT EXISTS editorial_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS editorial_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editorial_updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.regulatory_documents
  ADD COLUMN IF NOT EXISTS editorial_status TEXT NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS editorial_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS editorial_updated_by UUID REFERENCES public.profiles(id);

ALTER TABLE public.ingredients
  DROP CONSTRAINT IF EXISTS ingredients_editorial_status_check;
ALTER TABLE public.ingredients
  ADD CONSTRAINT ingredients_editorial_status_check
  CHECK (editorial_status IN ('draft', 'ready_for_review', 'published'));

ALTER TABLE public.ingredient_rules
  DROP CONSTRAINT IF EXISTS ingredient_rules_editorial_status_check;
ALTER TABLE public.ingredient_rules
  ADD CONSTRAINT ingredient_rules_editorial_status_check
  CHECK (editorial_status IN ('draft', 'ready_for_review', 'published'));

ALTER TABLE public.restrictions
  DROP CONSTRAINT IF EXISTS restrictions_editorial_status_check;
ALTER TABLE public.restrictions
  ADD CONSTRAINT restrictions_editorial_status_check
  CHECK (editorial_status IN ('draft', 'ready_for_review', 'published'));

ALTER TABLE public.regulatory_documents
  DROP CONSTRAINT IF EXISTS regulatory_documents_editorial_status_check;
ALTER TABLE public.regulatory_documents
  ADD CONSTRAINT regulatory_documents_editorial_status_check
  CHECK (editorial_status IN ('draft', 'ready_for_review', 'published'));

CREATE INDEX IF NOT EXISTS idx_ingredients_editorial_status
  ON public.ingredients (editorial_status);

CREATE INDEX IF NOT EXISTS idx_ingredient_rules_editorial_status
  ON public.ingredient_rules (editorial_status);

CREATE INDEX IF NOT EXISTS idx_regulatory_documents_editorial_status
  ON public.regulatory_documents (editorial_status);

-- Contenido seed existente: marcar como publicado
UPDATE public.ingredients
SET editorial_status = 'published', published_at = COALESCE(published_at, updated_at)
WHERE editorial_status IS DISTINCT FROM 'published';

UPDATE public.ingredient_rules
SET editorial_status = 'published', published_at = COALESCE(published_at, updated_at)
WHERE editorial_status IS DISTINCT FROM 'published';

UPDATE public.restrictions
SET editorial_status = 'published', published_at = COALESCE(published_at, updated_at)
WHERE editorial_status IS DISTINCT FROM 'published';

UPDATE public.regulatory_documents
SET editorial_status = 'published', published_at = COALESCE(published_at, updated_at)
WHERE editorial_status IS DISTINCT FROM 'published';

-- ---------------------------------------------------------------------------
-- Unified revision history (view-only in Sprint 4)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.content_revisions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type      TEXT NOT NULL,
  entity_id        UUID NOT NULL,
  editorial_status TEXT NOT NULL,
  change_summary   TEXT,
  snapshot         JSONB NOT NULL,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT content_revisions_entity_type_check
    CHECK (entity_type IN ('ingredient', 'rule', 'document', 'restriction'))
);

CREATE INDEX IF NOT EXISTS idx_content_revisions_entity
  ON public.content_revisions (entity_type, entity_id, created_at DESC);

ALTER TABLE public.content_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_revisions_select_admin"
  ON public.content_revisions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "content_revisions_insert_admin"
  ON public.content_revisions FOR INSERT
  WITH CHECK (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin write policies on content (read stays authenticated)
-- ---------------------------------------------------------------------------

CREATE POLICY "ingredients_admin_write"
  ON public.ingredients FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ingredient_rules_admin_write"
  ON public.ingredient_rules FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "restrictions_admin_write"
  ON public.restrictions FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "regulatory_documents_admin_write"
  ON public.regulatory_documents FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "ingredient_synonyms_admin_write"
  ON public.ingredient_synonyms FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "rule_versions_insert_admin"
  ON public.rule_versions FOR INSERT
  WITH CHECK (public.is_admin());

COMMENT ON COLUMN public.ingredients.editorial_status IS
  'draft | ready_for_review | published — workflow editorial Sprint 4';
