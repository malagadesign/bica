# Datos de demostración

Registro de enriquecimiento manual para consistencia visual en demos. **No altera el CSV original de seed.**

## Selección automática de ingredientes demo

El panel **"Ingredientes recomendados para demostración"** (`getDemoIngredients`) puntúa ingredientes activos según:

- Cantidad de restricciones
- Documentos normativos vinculados
- Reglas regulatorias
- Flag `needs_review`
- Variedad de estados (Permitido / Restringido / Prohibido)

Se muestran hasta 8 ingredientes en `/app/admin/workspace`. Solo visible para administradores.

## Enriquecimiento manual pendiente

Sprint 6 no ejecutó scripts de enriquecimiento en base de datos remota. Si algún ingrediente demo carece de:

- Documentos visibles en "Respaldado por"
- Eventos en timeline
- Sinónimos

…completar desde el panel editorial (`/app/admin/ingredients/[id]`) y documentar acá:

| Ingrediente | Campo enriquecido | Fecha | Notas |
|-------------|-------------------|-------|-------|
| _(pendiente)_ | | | |

## Queries útiles para identificar candidatos

En Supabase SQL Editor:

```sql
-- Ingredientes con más restricciones y documentos
SELECT i.inci_name, i.cas_number,
  count(DISTINCT ir.id) AS rules,
  count(DISTINCT r.id) AS restrictions,
  count(DISTINCT ir.document_id) AS documents
FROM ingredients i
JOIN ingredient_rules ir ON ir.ingredient_id = i.id
LEFT JOIN restrictions r ON r.ingredient_rule_id = ir.id
GROUP BY i.id
ORDER BY restrictions DESC, documents DESC
LIMIT 10;
```

## Regla

Todo enriquecimiento para demo debe hacerse vía flujo editorial (borrador → publicar), no UPDATE directo en producción salvo emergencia documentada.
