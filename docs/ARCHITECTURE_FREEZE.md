# Cosing AR — Architecture Freeze

**Versión:** 1.0  
**Fecha:** 26 de junio de 2026  
**Estado:** CONGELADO — contrato arquitectónico oficial  
**Precedentes:** `ARCHITECT-HANDOFF.md` v2.0 · `DATA_MODEL.md` v1.0 · revisión crítica pre-implementación

> A partir de este documento no se modifican nombres de entidades, relaciones ni conceptos del dominio  
> salvo cambio regulatorio mayor o revisión arquitectónica explícita aprobada por el product owner.

---

## Visión del sistema

Cosing AR es una **plataforma SaaS regulatoria** para la industria cosmética. Centraliza ingredientes, reglas normativas, restricciones de uso y documentos oficiales de múltiples organismos (ANMAT, MERCOSUR, UE, FDA, ANVISA, etc.) en un modelo de datos normalizado, trazable y versionado.

No es un visor de Excel. No es un buscador genérico. Es el **sistema de referencia** donde un formulador, laboratorio o responsable regulatorio consulta qué se permite, qué está restringido y bajo qué norma.

**Principio rector del dominio:**

> La fuente legal es el documento normativo oficial.  
> La fuente operativa de carga es el CSV normalizado.  
> La fuente de consulta en runtime es la base de datos.

---

## Entidades oficiales

| Entidad | Tabla PostgreSQL | Bounded Context |
|---------|------------------|-----------------|
| RegulatoryAuthority | `regulatory_authorities` | Core |
| RegulatoryDocument | `regulatory_documents` | Core |
| RegulatoryList | `regulatory_lists` | Core |
| Ingredient | `ingredients` | Core |
| IngredientSynonym | `ingredient_synonyms` | Core |
| IngredientRule | `ingredient_rules` | Core |
| Restriction | `restrictions` | Core |
| RuleVersion | `rule_versions` | Core |
| ImportProfile | `import_profiles` | Imports |
| ImportBatch | `import_batches` | Imports |
| ImportRow | `import_rows` | Imports |
| ImportDiff | `import_diffs` | Imports |

**Entidad de identidad (fuera del dominio regulatorio):** `profiles` (extensión de auth).

**Capa futura documentada, no congelada como entidad:** Knowledge Layer, IngredientTerm (ver Decisiones descartadas / evolución monitoreada).

---

## Relaciones oficiales

### Diagrama conceptual (no es jerarquía lineal)

```
                    RegulatoryAuthority
                     /              \
                    /                \
         RegulatoryDocument      RegulatoryList
                    \                /
                     \              /
                      IngredientRule ────── Ingredient
                           │                    │
                           │              IngredientSynonym
                      Restriction
                      RuleVersion

ImportProfile ──< ImportBatch ──< ImportRow
                              └──< ImportDiff
ImportBatch ──(trazabilidad)──> IngredientRule
```

### Relación central (inmutable)

```
Ingredient  →  IngredientRule  →  Restriction
```

### Cardinalidades oficiales

| Desde | Hacia | Cardinalidad |
|-------|-------|--------------|
| RegulatoryAuthority | RegulatoryDocument | 1:N |
| RegulatoryAuthority | RegulatoryList | 1:N |
| RegulatoryAuthority | IngredientRule | 1:N |
| RegulatoryDocument | IngredientRule | 1:N |
| RegulatoryList | IngredientRule | 1:N |
| Ingredient | IngredientRule | 1:N |
| Ingredient | IngredientSynonym | 1:N |
| IngredientRule | Restriction | 1:0..N |
| IngredientRule | RuleVersion | 1:N |
| ImportProfile | ImportBatch | 1:N |
| ImportBatch | ImportRow | 1:N |
| ImportBatch | ImportDiff | 1:N |
| ImportBatch | IngredientRule | 1:N (trazabilidad, nullable) |

### Decisión congelada: RegulatoryDocument ↔ RegulatoryList

**Una RegulatoryList NO pertenece a un RegulatoryDocument.**

**Una RegulatoryList es un concepto permanente** del catálogo de una RegulatoryAuthority (ej. "Conservantes", "Colorantes", "Prohibidos"). Existe a través de múltiples documentos normativos a lo largo del tiempo.

**Una RegulatoryDocument** representa una norma concreta (resolución, anexo, adenda) que **alimenta reglas** dentro de listas existentes.

**La trazabilidad documento ↔ lista ocurre en IngredientRule**, que referencia ambos:

```
IngredientRule.document_id  →  de qué norma proviene
IngredientRule.list_id      →  en qué anexo temático aplica
```

**Justificación:** En la realidad regulatoria, "Conservantes" como categoría sobrevive a Res. GMC 03/2020, Res. 2024 y futuras adendas. Congelar la lista dentro de un documento obligaría a recrear listas en cada nueva resolución y rompería comparación histórica.

---

## Aggregate Roots

| Aggregate Root | Entidades internas | Módulo |
|----------------|------------------|--------|
| **RegulatoryAuthority** | — | Core |
| **RegulatoryDocument** | — | Core |
| **RegulatoryList** | — | Core |
| **Ingredient** | IngredientSynonym | Core |
| **IngredientRule** | Restriction, RuleVersion | Core |
| **ImportProfile** | — | Imports |
| **ImportBatch** | ImportRow, ImportDiff | Imports |

**Regla:** referencias entre aggregates solo por ID. Modificaciones a Restrictions solo a través del aggregate IngredientRule.

---

## Reglas del dominio (invariantes esenciales)

### Identidad y trazabilidad

- Toda **IngredientRule** pertenece a exactamente un **Ingredient**, un **RegulatoryDocument**, un **RegulatoryList** y un **RegulatoryAuthority**.
- Toda **IngredientRule** debe provenir de un **RegulatoryDocument** — sin excepciones.
- Una **Restriction** nunca existe sin **IngredientRule**.
- `rule.authority_id = list.authority_id = document.authority_id` (consistencia cross-aggregate).

### Unicidad

- `(ingredient_id, list_id, document_id)` es único en IngredientRule.
- `(authority_id, code)` es único en RegulatoryList.
- `code` es único global en RegulatoryAuthority.

### Inmutabilidad y prohibiciones

- **Nunca DELETE físico** en IngredientRule, RuleVersion, ImportRow, ImportDiff.
- **RuleVersion** es append-only.
- Documento con `status = superseded` no acepta nuevas reglas.
- Modificación de regla activa **siempre** genera RuleVersion.

### Caso PROHIBIDOS (congelado)

- Una **IngredientRule** puede existir **sin Restrictions** (0:N).
- La prohibición es la regla misma; no requiere concentración ni advertencia estructurada.

### Importación

- Importador **nunca hardcodea** formatos — usa **ImportProfile**.
- Preview **obligatorio** antes de commit transaccional.
- ImportBatch **no es owner** de Core — emite commands hacia aggregates de Core.

---

## Decisiones congeladas

| # | Decisión |
|---|----------|
| 1 | Abandonar Laravel/PHP — greenfield en Next.js + Supabase |
| 2 | Nomenclatura: IngredientRule (no Entry), RegulatoryAuthority (no Jurisdiction), ImportBatch (no imports) |
| 3 | Relación central: Ingredient → IngredientRule → Restriction |
| 4 | RegulatoryList permanente, pertenece a Authority — **no** a Document |
| 5 | IngredientRule referencia Document + List + Authority + Ingredient |
| 6 | `authority_id` denormalizado en IngredientRule con invariante de consistencia |
| 7 | PROHIBIDOS: regla sin Restrictions es válido |
| 8 | RuleVersion por snapshot JSONB — no Event Sourcing completo en v1.0 |
| 9 | Document "versioning" = nuevo RegulatoryDocument + status superseded (no entidad DocumentVersion) |
| 10 | ImportProfile + ImportBatch suficientes para importador v1.0 |
| 11 | Sin DELETE físico en datos regulatorios |
| 12 | CSV = fuente operativa; documento oficial = fuente legal; DB = fuente de consulta |
| 13 | Knowledge Layer es capa futura — no altera entidades Core |
| 14 | IngredientTerm **no** se implementa en v1.0 — evolución monitoreada (ver descartadas) |
| 15 | Stack: Next.js 15+, React 19, TypeScript, Tailwind, shadcn, Supabase, Vercel, SQL nativo |

---

## Decisiones explícitamente descartadas

| Decisión descartada | Motivo |
|---------------------|--------|
| **Entry** como entidad | Ambiguo — reemplazado por IngredientRule |
| **Jurisdiction** como entidad | Modela países, no organismos — reemplazado por RegulatoryAuthority |
| **RegulatoryList hija de Document** | Lista es concepto permanente transversal a documentos |
| **DELETE físico** en reglas/versiones | Integridad regulatoria y auditoría |
| **Event Sourcing completo** | Complejidad prematura — RuleVersion + ImportDiff suficientes |
| **Entidad DocumentVersion** | Redundante — cada RegulatoryDocument ya es una versión normativa |
| **Prisma ORM v1.0** | Supabase + SQL + tipos generados suficientes |
| **Hardcode de columnas Excel/CSV** | ImportProfile configurable |
| **IngredientTerm en v1.0** | Ingredient + IngredientSynonym + campos CAS/EINECS cubren Etapa 1–3; evaluar si CI/EC masivos lo requieren |
| **RegulatoryFramework** (ANMAT adopta MERCOSUR) en v1.0 | Monitorear — documentar en summary del documento por ahora |
| **Reutilizar código Laravel** | Solo conocimiento de dominio |

### Evolución monitoreada (no congelada, no implementar sin revisión)

- **IngredientTerm / IngredientIdentifier:** entidad unificada para CAS, INCI, CI, EC, EINECS, aliases. Documentar cuando colorantes CI masivos expongan límites del modelo actual.
- **RegulatoryFramework:** jerarquía entre authorities (ANMAT implementa MERCOSUR).
- **Restriction híbrida:** columnas tipadas + JSONB `extended_conditions` para campos normativos emergentes.

---

## Revisión crítica pre-freeze (hallazgos)

### Flujo principal — corrección importante

El flujo **no es una cadena lineal**:

~~Authority → Document → List → Rule → Restriction → Ingredient~~ ❌

**Modelo correcto (congelado):**

- **RegulatoryAuthority** es raíz del catálogo regulatorio.
- **RegulatoryDocument** y **RegulatoryList** son **conceptos hermanos** bajo Authority.
- **Ingredient** es maestro independiente.
- **IngredientRule** es el **punto de unión** que conecta Ingredient + Document + List + Authority.
- **Restriction** cuelga exclusivamente de IngredientRule.

**Veredicto:** el modelo actual es correcto. **Debe mantenerse.** No reorganizar en jerarquía lineal.

### IngredientRule como Aggregate Root — confirmado

| Pregunta | Respuesta |
|----------|-----------|
| ¿Regla sin Restriction? | **Sí** — PROHIBIDOS, presencia en lista sin condiciones |
| ¿Restriction sin Regla? | **No** — inválido siempre |
| ¿Casos de fallo? | Ninguno estructural si UI/API tratan "0 restrictions" como regla válida |

### RuleVersion vs DocumentVersion

| Mecanismo | Suficiente |
|-----------|------------|
| **RuleVersion** | Sí — audita cambios en reglas y restricciones |
| **DocumentVersion** | No necesario — nuevo RegulatoryDocument + `superseded` ya modela versiones normativas |

### Importador — suficiente con debilidades conocidas

ImportProfile + ImportBatch son **suficientes** para v1.0 y años de formatos nuevos, siempre que:

- `mapping_json` tenga schema versionado
- Perfiles no se muten retroactivamente (nueva `version`)
- Rollback opere a nivel batch

**Puntos débiles aceptados (no bloquean freeze):** multi-sheet Excel complejo, imports cross-authority en un solo archivo, errores masivos en CSV antes de preview.

---

## Alcance Etapa 0

**Objetivo:** fundación limpia, profesional, desplegable.

**Incluye:**
- Proyecto Next.js 15+ (TypeScript, Tailwind, shadcn, dark mode)
- Supabase Auth SSR + middleware de protección
- Layout dashboard con sidebar + landing pública
- Migración SQL: `profiles`, `regulatory_authorities`, `regulatory_documents`, `regulatory_lists`, `ingredients`
- Entorno Vercel-ready
- Documentación congelada

**Excluye:**
- IngredientRule, Restriction, RuleVersion
- ImportProfile, ImportBatch, ImportRow, ImportDiff
- Importador, buscador, CRUD completo
- Suscripciones, roles avanzados, API pública, IA

---

## Alcance Etapa 1

**Objetivo:** core regulatorio validado contra CSV normalizado.

**Incluye:**
- Tablas: `ingredient_synonyms`, `ingredient_rules`, `restrictions`, `rule_versions`
- Seed/import inicial desde CSV normalizado
- Invariantes INV-R1…INV-S6 en application layer
- Página de detalle de ingrediente (lectura)
- Validación del modelo contra datos reales MERCOSUR/ANMAT

**Excluye:**
- Importador transaccional con preview
- Full Text Search
- Admin avanzado, pagos

---

## Alcance Etapa 2

**Objetivo:** importador configurable y trazable.

**Incluye:**
- Tablas: `import_profiles`, `import_batches`, `import_rows`, `import_diffs`
- Pipeline: upload → parse → validate → preview → commit → rollback
- ImportProfile con `mapping_json` y `validation_rules_json`
- Commands desde ImportBatch hacia aggregates de Core
- Historial de importaciones

**Excluye:**
- Buscador FTS (Etapa 3)
- Knowledge Layer, API pública, IA

---

## Firmas de cierre

| Rol | Estado |
|-----|--------|
| Revisión crítica pre-freeze | Completada |
| Modelo de dominio | **Aprobado para implementación** |
| Architecture Freeze v1.0 | **VIGENTE** |

---

*Documento generado tras revisión adversarial del dominio.  
Es el contrato arquitectónico oficial de Cosing AR.*
