-- Sprint 1C — Aliases adicionales según listados del PPT cliente

INSERT INTO public.search_term_aliases (alias_key, expand_terms) VALUES
  ('formaldehído', 'formaldehído formaldehido formaldehyde formaldehído adenda'),
  ('formaldehido', 'formaldehído formaldehido formaldehyde formaldehído adenda'),
  ('microperlas', 'microperlas microesferas microperla exfoliación'),
  ('triclosan', 'triclosan triclocarban antibacteriales cloflucarban'),
  ('uñas artificiales', 'uñas artificiales unas artificiales artificial nails'),
  ('unas artificiales', 'uñas artificiales unas artificiales artificial nails'),
  ('restrictiva', 'restrictiva restricción argentina restriccion argentina'),
  ('restricción argentina', 'restrictiva restricción argentina restriccion argentina'),
  ('restriccion argentina', 'restrictiva restricción argentina restriccion argentina'),
  ('colorantes', 'colorantes colorante color'),
  ('repelentes', 'repelentes repelente repellent repelentes ing funcionales'),
  ('filtros solares', 'filtros uv filtro uv filtros solares protector solar uv filter sunscreen'),
  ('prohibidos gbl', 'prohibidos gbl'),
  ('prohibidos metacrilato', 'prohibidos metacrilato arg metacrilato'),
  ('uso limitado', 'uso limitado limited permitted_with_limit restringido'),
  ('advertencia', 'advertencia advertencias warning contiene')
ON CONFLICT (alias_key) DO UPDATE SET expand_terms = EXCLUDED.expand_terms;
