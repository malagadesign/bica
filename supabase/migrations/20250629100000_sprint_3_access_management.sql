-- Sprint 3 — Access Management 
-- Perfiles extendidos, RLS admin, trigger de registro

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS access_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'member'));

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_access_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_access_status_check
  CHECK (access_status IN ('active', 'suspended', 'pending'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles (role);
CREATE INDEX IF NOT EXISTS idx_profiles_access_status ON public.profiles (access_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen_at ON public.profiles (last_seen_at DESC NULLS LAST);

-- Usuarios existentes antes del sprint: mantener acceso activo
UPDATE public.profiles
SET
  access_status = 'active',
  role = COALESCE(role, 'member')
WHERE access_status = 'pending'
  AND created_at < now();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    full_name,
    whatsapp,
    role,
    access_status
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'whatsapp',
    'member',
    'pending'
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "profiles_update_own_basic"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
    AND access_status = (SELECT p.access_status FROM public.profiles p WHERE p.id = auth.uid())
    AND access_expires_at IS NOT DISTINCT FROM (
      SELECT p.access_expires_at FROM public.profiles p WHERE p.id = auth.uid()
    )
    AND notes IS NOT DISTINCT FROM (
      SELECT p.notes FROM public.profiles p WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "profiles_admin_manage"
  ON public.profiles FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

COMMENT ON COLUMN public.profiles.access_expires_at IS
  'Reservado para suscripciones futuras; vencimiento manual del acceso.';

COMMENT ON COLUMN public.profiles.access_status IS
  'active | suspended | pending — control manual de acceso.';
