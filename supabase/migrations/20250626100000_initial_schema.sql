-- Cosing AR — Schema inicial Etapa 0
-- Tablas: profiles, regulatory_authorities, regulatory_documents,
--         regulatory_lists, ingredients

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Perfiles (extensión auth.users)
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Autoridades regulatorias
CREATE TABLE public.regulatory_authorities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  code         TEXT NOT NULL UNIQUE,
  country      TEXT,
  region       TEXT,
  description  TEXT,
  website_url  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_regulatory_authorities_code
  ON public.regulatory_authorities (code);

CREATE INDEX idx_regulatory_authorities_active
  ON public.regulatory_authorities (is_active)
  WHERE is_active = true;

-- Documentos normativos
CREATE TABLE public.regulatory_documents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id      UUID NOT NULL REFERENCES public.regulatory_authorities(id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  document_type     TEXT NOT NULL,
  document_number   TEXT,
  publication_date  DATE,
  effective_date    DATE,
  source_url        TEXT,
  file_path         TEXT,
  language          TEXT DEFAULT 'es',
  summary           TEXT,
  status            TEXT NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT regulatory_documents_status_check
    CHECK (status IN ('draft', 'active', 'superseded', 'archived'))
);

CREATE INDEX idx_regulatory_documents_authority
  ON public.regulatory_documents (authority_id);

CREATE INDEX idx_regulatory_documents_type
  ON public.regulatory_documents (document_type);

CREATE INDEX idx_regulatory_documents_status
  ON public.regulatory_documents (status);

-- Listas regulatorias
CREATE TABLE public.regulatory_lists (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  authority_id  UUID NOT NULL REFERENCES public.regulatory_authorities(id) ON DELETE RESTRICT,
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  description   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT regulatory_lists_authority_code_unique
    UNIQUE (authority_id, code)
);

CREATE INDEX idx_regulatory_lists_authority
  ON public.regulatory_lists (authority_id);

-- Ingredientes (maestro)
CREATE TABLE public.ingredients (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inci_name      TEXT NOT NULL,
  chemical_name  TEXT,
  cas_number     TEXT,
  einecs         TEXT,
  function       TEXT,
  notes          TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ingredients_inci_name ON public.ingredients (inci_name);

CREATE INDEX idx_ingredients_cas_number ON public.ingredients (cas_number)
  WHERE cas_number IS NOT NULL;

-- updated_at automático
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER regulatory_authorities_updated_at
  BEFORE UPDATE ON public.regulatory_authorities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER regulatory_documents_updated_at
  BEFORE UPDATE ON public.regulatory_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER regulatory_lists_updated_at
  BEFORE UPDATE ON public.regulatory_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER ingredients_updated_at
  BEFORE UPDATE ON public.ingredients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_authorities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "authorities_select_authenticated"
  ON public.regulatory_authorities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "documents_select_authenticated"
  ON public.regulatory_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "lists_select_authenticated"
  ON public.regulatory_lists FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ingredients_select_authenticated"
  ON public.ingredients FOR SELECT
  TO authenticated
  USING (true);
