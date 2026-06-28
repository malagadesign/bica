-- Sprint 3 — Auditoría admin + endurecimiento RLS profiles

CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action          TEXT NOT NULL,
  old_value       JSONB,
  new_value       JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_target
  ON public.admin_audit_log (target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin
  ON public.admin_audit_log (admin_id, created_at DESC);

ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_audit_select"
  ON public.admin_audit_log FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_audit_insert"
  ON public.admin_audit_log FOR INSERT
  WITH CHECK (public.is_admin() AND admin_id = auth.uid());

-- Proteger campos admin en updates de usuarios no-admin (refuerzo además de Server Actions)
CREATE OR REPLACE FUNCTION public.protect_profile_admin_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() = NEW.id AND NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.access_status := OLD.access_status;
    NEW.access_expires_at := OLD.access_expires_at;
    NEW.notes := OLD.notes;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_admin_fields ON public.profiles;

CREATE TRIGGER protect_profile_admin_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_fields();

-- Simplificar policy de update propio (trigger protege campos sensibles)
DROP POLICY IF EXISTS "profiles_update_own_basic" ON public.profiles;

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

COMMENT ON TABLE public.admin_audit_log IS
  'Auditoría básica de cambios admin: role, access_status, access_expires_at.';
