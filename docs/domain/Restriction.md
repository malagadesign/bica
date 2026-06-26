# Restriction

**Tabla:** `restrictions`  
**Etapa:** 1

---

## Qué representa

Una **condición concreta de uso** asociada a una `IngredientRule`. Una regla puede tener **múltiples restrictions** cuando el mismo ingrediente tiene distintas condiciones según tipo de producto, vía de exposición o campo de aplicación.

Ejemplos reales:

**Conservante — Phenoxyethanol:**
- max_concentration: 1.0%, concentration_unit: %, rinse_off: true, leave_on: true

**Filtro UV — Zinc Oxide:**
- max_concentration: 25%, application_area: "sunscreen", nano: true, warning_text: "Not for use on damaged skin"

**Colorante — CI 77491:**
- application_area: "all cosmetic products except eye area", eye_area: false

**Prohibido — Formaldehyde:**
- (IngredientRule en lista PROHIBIDOS puede tener 0 restrictions — la prohibición es la regla misma)

---

## Qué NO representa

- **No es el ingrediente** → es `Ingredient`.
- **No es la regla regulatoria** → es `IngredientRule` (la regla agrupa restrictions).
- **No es el documento normativo** → es `RegulatoryDocument`.
- **No es texto libre sin estructura** — `condition_text` captura lo no modelable; campos tipados capturan lo queryable.

---

## Relaciones

```
IngredientRule
  └── has many → Restriction
```

---

## Campos conceptuales (Etapa 1 — diseño completo, implementación incremental)

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID | PK |
| ingredient_rule_id | UUID | FK → ingredient_rules |
| application_area | TEXT | Campo de aplicación (protector solar, cabello…) |
| product_type | TEXT | Tipo de producto cosmético |
| max_concentration | NUMERIC | Concentración máxima |
| min_concentration | NUMERIC | Concentración mínima (si aplica) |
| concentration_unit | TEXT | %, ppm, mg/kg |
| expressed_as | TEXT | "expressed as acid", "as total parabens" |
| condition_text | TEXT | Condición en texto normativo original |
| limitation_text | TEXT | Limitaciones de uso |
| warning_text | TEXT | Advertencia de rotulado obligatoria |
| professional_use_only | BOOLEAN | Solo uso profesional |
| rinse_off | BOOLEAN | Producto enjuague |
| leave_on | BOOLEAN | Producto de permanencia |
| oral_use | BOOLEAN | Uso oral |
| eye_area | BOOLEAN | Zona ocular |
| children_use | BOOLEAN | Uso en niños |
| nano | BOOLEAN | Forma nanométrica |
| aerosol | BOOLEAN | Presentación aerosol |
| source_excerpt | TEXT | Extracto literal del documento fuente |
| notes | TEXT | Notas internas |
| created_at / updated_at | TIMESTAMPTZ | Auditoría |

**Nota:** No todos los campos se implementan en la primera migración de Etapa 1. El diseño contempla el modelo completo; la migración puede ser incremental.

---

## Decisiones de diseño

1. **Separada de IngredientRule** — permite N condiciones por regla sin duplicar la regla.
2. **Campos booleanos queryables** — "ingredientes leave-on con advertencia obligatoria" es SQL directo.
3. **`condition_text` como fallback** — lo que no entra en campos tipados queda en texto + FTS futuro.
4. **Pregunta abierta:** ¿20+ columnas vs JSONB `conditions`?  
   **Propuesta híbrida:** columnas para filtros frecuentes (concentration, leave_on, nano, warning_text) + JSONB `extended_conditions` para casos raros.

---

## Ejemplos de consultas futuras (Knowledge Layer)

```sql
-- Restricciones leave-on con advertencia obligatoria
SELECT ... FROM restrictions WHERE leave_on = true AND warning_text IS NOT NULL;

-- Ingredientes nano en filtros UV
SELECT ... FROM restrictions WHERE nano = true AND application_area ILIKE '%sun%';
```

---

## Ejemplos de uso

- UI detalle ingrediente: tabla de restrictions agrupadas por IngredientRule.
- Export PDF regulatorio: incluir warning_text y source_excerpt.
- Comparador MERCOSUR vs UE: diff de restrictions para mismo Ingredient.
