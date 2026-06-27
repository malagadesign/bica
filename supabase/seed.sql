-- Seed mínimo de desarrollo (opcional)
-- Ejecutar manualmente después de la migración inicial

INSERT INTO public.regulatory_authorities (name, code, country, region, description) VALUES
  ('MERCOSUR', 'MERCOSUR', NULL, 'MERCOSUR', 'Mercado Común del Sur — normativa cosmética'),
  ('ANMAT', 'ANMAT', 'AR', 'LATAM', 'Administración Nacional de Medicamentos, Alimentos y Tecnología Médica'),
  ('Unión Europea', 'EU', NULL, 'EUROPE', 'Regulación cosmética de la Unión Europea')
ON CONFLICT (code) DO NOTHING;
