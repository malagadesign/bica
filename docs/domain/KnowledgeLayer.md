# Knowledge Layer

**Tipo:** Capa arquitectónica (no tabla única)  
**Etapa:** 6+ — **no implementar ahora**

---

## Qué representa

Una **capa futura de conocimiento regulatorio** que transforma el modelo estructurado (`Ingredient`, `IngredientRule`, `Restriction`, `RegulatoryDocument`, `RuleVersion`) en respuestas inteligentes para usuarios y sistemas integrados.

No es un módulo de IA genérico. Es la **capacidad de razonar sobre el dominio regulatorio** usando datos ya normalizados.

---

## Qué NO representa

- **No es ChatGPT pegado a un buscador.**
- **No reemplaza el modelo relacional** — se construye encima.
- **No es Etapa 0, 1, 2 ni 3** — requiere datos poblados, buscador y versionado funcionando.
- **No es una tabla `knowledge_*`** — es servicios + índices + opcionalmente embeddings.

---

## Preguntas que debe poder responder (futuro)

| Pregunta | Fuentes de datos |
|----------|------------------|
| ¿Qué cambió entre versiones normativas? | `RuleVersion`, `ImportDiff`, `RegulatoryDocument.status` |
| ¿Qué documentos afectan a un ingrediente? | `IngredientRule.document_id` → `RegulatoryDocument` |
| ¿Qué restricciones aplican a un producto leave-on? | `Restriction.leave_on = true` |
| ¿Qué ingredientes tienen advertencias obligatorias? | `Restriction.warning_text IS NOT NULL` |
| ¿Qué reglas se originan en determinada resolución? | `IngredientRule` WHERE `document_id` |
| ¿Puedo usar X en un protector solar en MERCOSUR? | `IngredientRule` + `Restriction` + authority + application_area |
| ¿Diferencias MERCOSUR vs UE para ingrediente Y? | Comparador cross-authority |

---

## Relaciones con entidades existentes

```
KnowledgeLayer (lógica)
  ├── lee → Ingredient, IngredientRule, Restriction
  ├── lee → RegulatoryDocument, RegulatoryAuthority
  ├── lee → RuleVersion, ImportDiff
  └── opcional → embeddings sobre condition_text, summary, warning_text
```

---

## Decisiones de diseño (desde Etapa 0)

Estas decisiones **de hoy** preparan la Knowledge Layer **de mañana**:

1. **Toda regla trazada a documento** — sin documento, no hay contexto para IA.
2. **RuleVersion con snapshot JSONB** — historial queryable para "qué cambió".
3. **Restriction con campos tipados + texto** — SQL para lo estructurado, embeddings para lo narrativo.
4. **ImportDiff en importador** — diff machine-readable entre versiones.
5. **RegulatoryDocument.summary** — texto curado para RAG.

---

## Arquitectura futura (conceptual)

```
Usuario pregunta en lenguaje natural
  → Router (¿SQL directo vs RAG vs híbrido?)
  → SQL Generator (consultas sobre modelo tipado)
  → RAG (embeddings sobre textos normativos)
  → Response synthesizer (cita documento + regla + restricción)
  → UI con fuentes verificables (link a RegulatoryDocument)
```

**Principio crítico:** toda respuesta de IA debe **citar fuentes** (documento, resolución, extracto). Es una plataforma regulatoria — la trazabilidad no es opcional.

---

## Stack candidato (Etapa 6+, no decidido)

- Vercel AI SDK + modelo vía AI Gateway
- Embeddings sobre `Restriction.source_excerpt`, `RegulatoryDocument.summary`
- pgvector en Supabase (extensión PostgreSQL) para búsqueda semántica
- SQL tool calling para consultas estructuradas precisas

---

## Ejemplos de uso

- Asistente: "¿El Phenoxyethanol está permitido en productos leave-on bajo MERCOSUR?" → SQL + cita Res. GMC 03/2020.
- Alerta: "Nueva resolución supersede Res. 03/2020 — 12 ingredientes afectados" → diff automático post-import.
- API IA: laboratorio integra endpoint que responde compliance de una fórmula.

---

## Qué NO hacer antes de Etapa 6

- No agregar tablas de embeddings en Etapa 0.
- No construir chat UI.
- No acoplar OpenAI al importador.
- **Sí** mantener el modelo de dominio que hace posible la capa después.
