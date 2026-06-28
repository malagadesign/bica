# Arquitectura de IA en BICA

> **Principio rector:** En BICA, la inteligencia artificial nunca reemplaza el criterio regulatorio. Su función es asistir al especialista, reducir tareas repetitivas y detectar posibles inconsistencias. La decisión final de revisar, corregir y publicar siempre pertenece a un responsable humano.

Este documento define la gobernanza, los límites y la preparación técnica para futura integración de IA. **Sprint 8 no conecta ningún proveedor.**

---

## 1. Rol de la IA

### 1.1 Qué puede hacer la IA

La IA puede **asistir** en:

| Área | Descripción |
|------|-------------|
| Clasificación de cambios | Sugerir si un registro es alta, modificación o baja |
| Detección de cambios | Señalar posibles altas, modificaciones o eliminaciones |
| Normalización preliminar | Proponer nombres químicos o INCI normalizados |
| Inconsistencias | Detectar campos contradictorios o fuera de patrón |
| Coincidencias | Sugerir matches entre sustancias similares |
| Resumen de impacto | Sintetizar el efecto de una actualización normativa |
| Campos faltantes | Identificar datos ausentes en registros |
| Ayuda editorial | Asistir redacción en workspace (futuro) |

### 1.2 Qué NO puede hacer la IA

La IA **no puede**:

- publicar información a producción;
- reemplazar al especialista regulatorio;
- decidir si una norma está correctamente interpretada;
- modificar producción sin revisión humana;
- emitir dictámenes regulatorios vinculantes;
- responder sin trazabilidad a fuentes documentales;
- inventar datos faltantes;
- ocultar incertidumbre o presentar suposiciones como hechos.

---

## 2. Ubicación en el pipeline

```
Documento fuente / URL / CSV / PDF
        ↓
Parser estructural          ← Sprint 7 (sin IA)
        ↓
JSON normalizado
        ↓
AI Analysis                 ← Futuro (asistivo, opcional)
        ↓
Propuesta editable          ← regulatory_update_items
        ↓
Revisión humana
        ↓
Confirmación manual
        ↓
Publicación normativa
```

### Prohibido explícitamente

```
Fuente oficial → IA → Producción
```

La IA nunca puede saltear el workspace de revisión ni la confirmación manual.

---

## 3. Provider abstraction

Interfaz conceptual: `RegulatoryAIProvider`

Ubicación del contrato: `src/modules/ai/provider.ts`

Implementaciones futuras: `src/modules/ai/providers/` (no creado en Sprint 8)

### Métodos conceptuales

| Método | Propósito |
|--------|-----------|
| `analyzeRegulatoryUpdate()` | Análisis global de una actualización normativa |
| `suggestIngredientMatches()` | Coincidencias entre sustancias |
| `detectPotentialConflicts()` | Conflictos potenciales vs base publicada |
| `summarizeUpdateImpact()` | Resumen de impacto asistido |
| `normalizeSubstanceName()` | Normalización preliminar de nombres |

**No implementar proveedores en Sprint 8.**

---

## 4. Output estructurado

Toda operación crítica de IA devuelve **JSON estructurado**, nunca texto libre.

Tipo base: `AISuggestion` en `src/modules/ai/types.ts`

Cada sugerencia incluye:

| Campo | Descripción |
|-------|-------------|
| `suggestion_type` | Tipo de sugerencia |
| `confidence` | Score numérico 0–1 |
| `confidence_level` | `high` / `medium` / `low` |
| `source` | Referencia documental trazable |
| `explanation` | Explicación breve |
| `affected_fields` | Campos impactados |
| `requires_human_review` | Siempre `true` para media/baja confianza |
| `warnings` | Advertencias explícitas |

---

## 5. Confidence score

| Nivel | Rango | Comportamiento |
|-------|-------|----------------|
| Alta confianza | ≥ 0.85 | Sugerencia visible; revisión humana igualmente obligatoria antes de publicar |
| Media confianza | 0.60 – 0.84 | Requiere revisión explícita |
| Baja confianza | < 0.60 | Requiere revisión explícita; destacar incertidumbre |

**Regla:** aun con alta confianza, la publicación final requiere aprobación humana.

Constantes: `AI_CONFIDENCE_THRESHOLDS` en `src/modules/ai/types.ts`

---

## 6. Auditoría

Cada sugerencia de IA debe poder auditarse. Campos futuros en tabla `ai_suggestions` (no creada en Sprint 8):

| Campo | Descripción |
|-------|-------------|
| `model` | Modelo utilizado |
| `prompt_version` | Versión del prompt |
| `created_at` | Timestamp de generación |
| `accepted_by` / `rejected_by` | Usuario que decidió |
| `final_outcome` | Resultado aplicado |
| `source_document_id` | Fuente documental |

---

## 7. Prompts

- **No** dispersar prompts en componentes React.
- Ubicación futura: `src/modules/ai/prompts/`
- Cada prompt versionado (`*.v1.ts`, `*.v2.ts`)
- Cambios de prompt documentados en este archivo

---

## 8. Seguridad y configuración

Sprint 8:

- ❌ No API keys de IA en código ni `.env` productivo expuesto
- ❌ No llamadas a OpenAI, Gemini, Anthropic
- ❌ No embeddings, chat, ni análisis automático real
- ❌ No tablas `ai_suggestions` ni `prompt_versions`

Cuando se integre un proveedor:

- Keys solo en variables de entorno server-side
- Llamadas exclusivamente desde Server Actions o módulo `src/modules/ai/`
- Nunca desde el cliente

---

## 9. Relación con disclaimers

- Disclaimer general: visible al usuario (`/legal/disclaimer`)
- Disclaimer de IA: documentado internamente; **no expuesto al cliente final** hasta que exista funcionalidad IA visible
- Ver: `docs/DISCLAIMER_POLICY.md`

---

## 10. Filosofía

BICA puede incorporar inteligencia artificial, pero **nunca debe vender automatización ciega**.

El valor de la IA no será reemplazar al especialista, sino ayudarlo a:

- trabajar mejor;
- revisar más rápido;
- detectar posibles inconsistencias antes de publicar.

---

## Referencias

- Lenguaje de dominio: `docs/DOMAIN_LANGUAGE.md`
- Pipeline normativo: `docs/REGULATORY_UPDATES.md`
- Contratos TypeScript: `src/modules/ai/`
