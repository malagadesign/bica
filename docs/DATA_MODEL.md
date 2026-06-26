# Cosing AR — Modelo de Datos y Validación de Dominio

**Documento:** `DATA_MODEL.md`  
**Versión:** 1.0  
**Fecha:** 26 de junio de 2026  
**Rol:** Revisión final pre-desarrollo — Software Architecture (DDD, regulatory platforms)  
**Estado:** Pendiente de aprobación → congelación en §10

---

> Este documento responde exclusivamente a la validación de dominio antes de Etapa 0.  
> No contiene código, SQL ni migraciones.

---

# 1. Aggregate Roots

En DDD, un **Aggregate Root** es la única puerta de entrada para modificar un cluster de entidades relacionadas. Las referencias entre aggregates son siempre por **identificador**, nunca por objeto anidado mutable.

## 1.1 Módulo Core

| Aggregate Root | Entidades internas (mismo aggregate) | Referencias externas (solo ID) |
|----------------|--------------------------------------|--------------------------------|
| **RegulatoryAuthority** | — (entidad raíz sola) | — |
| **RegulatoryDocument** | — | `authority_id` → RegulatoryAuthority |
| **RegulatoryList** | — | `authority_id` → RegulatoryAuthority |
| **Ingredient** | `IngredientSynonym` | — |
| **IngredientRule** | `Restriction`, `RuleVersion` | `ingredient_id`, `authority_id`, `list_id`, `document_id`, `import_batch_id` |

### Justificaciones

**RegulatoryAuthority**  
Catálogo de organismos. Cambia raramente. No contiene reglas ni ingredientes. Es referencia estable para todo el sistema. No debe absorber documentos ni listas porque esas entidades tienen ciclos de vida distintos y volumen distinto.

**RegulatoryDocument**  
Aggregate separado de Authority. Un documento puede ser referenciado por miles de `IngredientRules`, ser superseded independientemente, y debe existir antes de importar reglas. Tratarlo como entidad hija de Authority obligaría a cargar el aggregate Authority completo para operaciones sobre un solo documento — inviable a escala.

**RegulatoryList**  
Aggregate separado de Authority por la misma razón de ciclo de vida y referencia masiva. Una lista ("Conservantes") es un concepto estable del catálogo regulatorio, referenciado por reglas e import profiles. No es parte del documento: la misma lista recibe reglas de múltiples documentos a lo largo de 20 años.

**Ingredient**  
Maestro de sustancia. `IngredientSynonym` vive dentro del aggregate porque no tiene significado regulatorio independiente — solo enriquece la identidad del ingrediente. Las `IngredientRules` **no** pertenecen a este aggregate: son hechos regulatorios externos que referencian al ingrediente por ID.

**IngredientRule**  
**Aggregate central del dominio.** Es la unidad de consistencia regulatoria. `Restriction` no existe sin regla; `RuleVersion` es el historial de esa regla. Toda modificación normativa (concentración, advertencia, estado) entra por aquí. Separar `Restriction` como aggregate independiente rompería la invariante de consistencia transaccional al importar una fila CSV.

---

## 1.2 Módulo Imports

| Aggregate Root | Entidades internas | Referencias externas |
|----------------|-------------------|----------------------|
| **ImportProfile** | — | `authority_id`, `document_id` (default) |
| **ImportBatch** | `ImportRow`, `ImportDiff` | `import_profile_id`, `user_id` |

### Justificaciones

**ImportProfile**  
Configuración reutilizable. No es parte de ImportBatch porque un profile vive más que cualquier ejecución y se referencia por muchos batches. Es aggregate de configuración, no de ejecución.

**ImportBatch**  
Unidad transaccional de carga. `ImportRow` y `ImportDiff` son trazabilidad de esa ejecución concreta. Rollback opera sobre el batch completo. Mezclar rows de distintos batches en un aggregate común violaría límites de consistencia.

---

## 1.3 Módulos futuros (referencia, no implementar)

| Módulo | Aggregate Root propuesto | Notas |
|--------|--------------------------|-------|
| Search | Ninguno (read model) | Proyección sobre Core — no es dominio |
| Admin / Users | `UserProfile` | Extensión de identidad — bounded context separado |
| Subscriptions | `Subscription` | Bounded context comercial |
| Knowledge Layer | Ninguno (servicio) | Orquesta queries sobre aggregates existentes |
| API pública | Ninguno (anti-corruption layer) | Expone read models y commands acotados |

---

## 1.4 Mapa de bounded contexts

```
┌─────────────────────────────────────────────────────────┐
│  REGULATORY CORE (dominio principal)                    │
│  RegulatoryAuthority, RegulatoryDocument, RegulatoryList│
│  Ingredient, IngredientRule (+ Restriction, RuleVersion)│
└─────────────────────────────────────────────────────────┘
         ▲ referenciado por ID
┌─────────────────────────────────────────────────────────┐
│  IMPORTS (dominio de ingesta)                           │
│  ImportProfile, ImportBatch (+ ImportRow, ImportDiff)   │
└─────────────────────────────────────────────────────────┘
         ▲ consume eventos / commands hacia Core
┌─────────────────────────────────────────────────────────┐
│  IDENTITY, BILLING, SEARCH, API, KNOWLEDGE (satélites)  │
└─────────────────────────────────────────────────────────┘
```

---

# 2. Ownership

**Owner** = bounded context / aggregate que tiene autoridad final sobre el dato y es responsable de sus invariantes.

| Entidad | Owner | Creado por | Modificado por | Nunca modificado por |
|---------|-------|------------|----------------|----------------------|
| **RegulatoryAuthority** | Core | Admin / seed inicial | Admin | ImportBatch (solo referencia) |
| **RegulatoryDocument** | Core | Admin / seed | Admin | ImportBatch directamente |
| **RegulatoryList** | Core | Admin / seed | Admin | ImportBatch directamente |
| **Ingredient** | Core | ImportBatch, Admin | ImportBatch (merge campos), Admin | Usuario final, Search |
| **IngredientSynonym** | Core (vía Ingredient) | ImportBatch, Admin | ImportBatch, Admin | Usuario final |
| **IngredientRule** | Core | ImportBatch | ImportBatch, Admin | Usuario final, Search |
| **Restriction** | Core (vía IngredientRule) | ImportBatch | ImportBatch, Admin | Usuario final directo |
| **RuleVersion** | Core (vía IngredientRule) | Sistema (al cambiar regla) | **Nadie** (inmutable) | Todos |
| **ImportProfile** | Imports | Admin | Admin | ImportBatch |
| **ImportBatch** | Imports | Usuario admin / operador | Sistema (status transitions) | Rollback externo sin audit |
| **ImportRow** | Imports (vía ImportBatch) | Sistema (durante import) | **Nadie** (inmutable) | Todos |
| **ImportDiff** | Imports (vía ImportBatch) | Sistema (preview/commit) | **Nadie** (inmutable) | Todos |
| **UserProfile** | Identity | Supabase Auth trigger | Usuario (propio perfil) | ImportBatch |

### Reglas de ownership críticas

1. **ImportBatch crea/modifica datos de Core, pero no es owner de Core.**  
   El importador emite commands (`CreateIngredientRule`, `UpdateRestriction`) hacia aggregates de Core. No escribe directamente saltando invariantes.

2. **RuleVersion, ImportRow, ImportDiff son append-only.**  
   Owner es el sistema; humanos no editan.

3. **RegulatoryDocument es owner de su metadata, no de las reglas que cita.**  
   Superseder un documento no elimina reglas — cambia su `status`.

4. **Search, API, Knowledge Layer son consumidores.**  
   Nunca owners. Solo lectura + commands explícitos hacia aggregates.

---

# 3. Lifecycle

Leyenda: ✅ permitido · ⚠️ permitido con condiciones · ❌ prohibido

## RegulatoryAuthority

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Admin / seed |
| Update | ✅ | Metadata (nombre, URL) |
| Archive | ✅ | `is_active = false` |
| Delete | ❌ | Referenciada por documentos, listas, reglas |
| Version | ❌ | No aplica — catálogo estable |
| Merge | ⚠️ | Solo si no hay reglas (ej. duplicado en seed) |
| Split | ❌ | No previsto |

## RegulatoryDocument

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Admin registra norma |
| Update | ⚠️ | Solo metadata no normativa (summary, URL) |
| Archive | ✅ | `status = archived` |
| Delete | ❌ | Referenciado por IngredientRules |
| Version | ❌ | Nuevo documento supersede al anterior — no mutar |
| Merge | ❌ | |
| Split | ❌ | |
| Supersede | ✅ | `status = superseded` + nuevo documento | Transición de estado, no delete |

## RegulatoryList

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Admin / seed |
| Update | ✅ | Descripción, nombre display |
| Archive | ✅ | `is_active = false` |
| Delete | ❌ | Referenciada por reglas |
| Version | ❌ | |
| Merge | ⚠️ | Solo sin reglas vinculadas |
| Split | ❌ | |

## Ingredient

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Import o admin |
| Update | ✅ | Enriquecer maestro (CAS, función) |
| Archive | ✅ | `is_active = false` |
| Delete | ❌ | Referenciado por reglas |
| Version | ❌ | El maestro no se versiona — las reglas sí |
| Merge | ✅ | Unificar duplicados (mismo INCI/CAS) | Operación admin con audit |
| Split | ❌ | Un ingrediente no se divide |

## IngredientSynonym

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Vía aggregate Ingredient |
| Update | ✅ | |
| Archive / Delete | ✅ | Sin impacto regulatorio |
| Version | ❌ | |

## IngredientRule

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Import o admin |
| Update | ✅ | Genera RuleVersion automáticamente |
| Archive | ✅ | `rule_status = archived` |
| Delete | ❌ | Prohibido — integridad regulatoria |
| Version | ✅ | Via RuleVersion snapshot |
| Merge | ⚠️ | Solo duplicados exactos en misma lista+documento |
| Split | ❌ | Una regla no se divide — se crean reglas nuevas |
| Supersede | ✅ | `rule_status = superseded` cuando nuevo documento reemplaza |

## Restriction

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Vía aggregate IngredientRule |
| Update | ✅ | Genera RuleVersion en regla padre |
| Archive | ✅ | Soft delete dentro de regla |
| Delete físico | ❌ | |
| Version | ❌ | Versiona la regla padre, no la restriction aisladamente |
| Merge / Split | ❌ | |

## RuleVersion

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Sistema, append-only |
| Update | ❌ | Inmutable |
| Delete | ❌ | Inmutable |
| Archive | ❌ | Retención permanente |

## ImportProfile

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Admin |
| Update | ✅ | Nueva version del profile, no mutar en uso |
| Archive | ✅ | `is_active = false` |
| Delete | ⚠️ | Solo si nunca usado en batch |
| Version | ✅ | Campo `version` — perfil nuevo, no editar mapping de batches pasados |

## ImportBatch

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Operador sube archivo |
| Update | ⚠️ | Solo transiciones de status |
| Archive | ❌ | |
| Delete | ❌ | Historial regulatorio |
| Version | ❌ | |
| Rollback | ✅ | Revierte efectos en Core, marca `rolled_back` |

## ImportRow / ImportDiff

| Acción | Estado | Notas |
|--------|--------|-------|
| Create | ✅ | Append-only durante import |
| Update / Delete | ❌ | Inmutables |

---

# 4. Versioning Strategy

## 4.1 Entidades que DEBEN versionarse

| Entidad | Mecanismo | Justificación |
|---------|-----------|---------------|
| **IngredientRule** | `RuleVersion` (snapshot JSONB) | Toda modificación normativa debe ser auditable y reconstruible |
| **ImportProfile** | Campo `version` + perfil nuevo | Mapping de import no debe mutar retroactivamente |
| **RegulatoryDocument** | Nuevo registro + `superseded` | Una resolución no se edita — se reemplaza por otra |

## 4.2 Entidades que NUNCA deben versionarse

| Entidad | Motivo |
|---------|--------|
| **Ingredient** | Maestro identitario — la identidad de la sustancia no cambia normativamente; cambian sus reglas |
| **RegulatoryAuthority** | Catálogo de referencia |
| **RegulatoryList** | Catálogo de referencia |
| **IngredientSynonym** | Dato auxiliar de búsqueda |
| **ImportBatch** | Evento de ejecución — ya es registro histórico por naturaleza |
| **ImportRow / ImportDiff** | Log inmutable |

## 4.3 Entidades inmutables (append-only)

| Entidad | Regla |
|---------|-------|
| **RuleVersion** | Solo INSERT. Snapshot del estado de la regla en un punto del tiempo |
| **ImportRow** | Solo INSERT. Trazabilidad fila fuente |
| **ImportDiff** | Solo INSERT. Diff pre/post commit |

## 4.4 Entidades que solo cambian de estado

| Entidad | Transiciones |
|---------|--------------|
| **RegulatoryDocument** | draft → active → superseded / archived |
| **IngredientRule** | active → archived / superseded |
| **ImportBatch** | pending → validating → preview → committing → completed / failed / rolled_back |
| **RegulatoryAuthority / RegulatoryList / Ingredient** | is_active true ↔ false |

## 4.5 Relación con Event Sourcing

El modelo **no adopta Event Sourcing completo** en v1.0. Adopta **versionado por snapshot** (`RuleVersion`) + **audit log de importación** (`ImportDiff`). Esto es suficiente para:

- Reconstruir historial de una regla
- Rollback de un batch
- Responder "qué cambió" en Knowledge Layer futuro

Event Sourcing completo se reserva como evolución solo si el snapshot se vuelve insuficiente — no es necesario en Etapa 0–3.

---

# 5. Source of Truth

| Entidad | Fuente oficial | Fuente secundaria | No es fuente |
|---------|----------------|-------------------|--------------|
| **RegulatoryAuthority** | Decisión editorial admin + catálogo oficial de organismos | — | CSV, Excel |
| **RegulatoryDocument** | Resolución / disposición / anexo oficial publicado | PDF en boletín oficial, `source_url` | CSV normalizado |
| **RegulatoryList** | Estructura de anexos definida por la autoridad | CSV (mapeo de hojas) | Excel layout |
| **Ingredient** | CSV normalizado + consenso editorial (INCI, CAS) | Documentos regulatorios (nombre en norma) | Input del usuario final |
| **IngredientSynonym** | CSV + glosario interno + abreviaturas | — | — |
| **IngredientRule** | CSV normalizado interpretado contra RegulatoryDocument | Documento normativo (texto legal) | Excel original |
| **Restriction** | CSV normalizado + texto del documento (`source_excerpt`) | — | UI de admin (solo corrección) |
| **RuleVersion** | Sistema (derivado de cambios en regla) | — | — |
| **ImportProfile** | Configuración interna del equipo | — | Archivo fuente |
| **ImportBatch** | Sistema (registro de ejecución) | Archivo subido | — |
| **ImportRow** | Fila cruda del archivo fuente | — | — |
| **ImportDiff** | Sistema (derivado de preview/commit) | — | — |

### Principio rector

> **La fuente legal es siempre el documento normativo oficial.**  
> **La fuente operativa de carga es el CSV normalizado.**  
> **La fuente de verdad en runtime es PostgreSQL.**

El CSV es pipeline de ingesta, no modelo de dominio. El documento oficial es autoridad legal. La base de datos es autoridad de consulta.

---

# 6. Cardinalidad

## 6.1 Relaciones actuales

```
RegulatoryAuthority  1 ──< N  RegulatoryDocument
RegulatoryAuthority  1 ──< N  RegulatoryList
RegulatoryAuthority  1 ──< N  IngredientRule      ← ver §6.3

RegulatoryDocument   1 ──< N  IngredientRule
RegulatoryList     1 ──< N  IngredientRule

Ingredient           1 ──< N  IngredientSynonym
Ingredient           1 ──< N  IngredientRule

IngredientRule       1 ──< N  Restriction
IngredientRule       1 ──< N  RuleVersion

ImportProfile        1 ──< N  ImportBatch
ImportBatch          1 ──< N  ImportRow
ImportBatch          1 ──< N  ImportDiff
ImportBatch          1 ──< N  IngredientRule      (trazabilidad, nullable)

RegulatoryAuthority  1 ──< N  ImportProfile
RegulatoryDocument   0..1 ── default ── ImportProfile
```

## 6.2 Cardinalidades validadas

| Relación | Cardinalidad | ¿Correcta? | Notas |
|----------|--------------|------------|-------|
| Ingredient → IngredientRule | 1:N | ✅ | Misma sustancia, múltiples contextos regulatorios |
| IngredientRule → Restriction | 1:N | ✅ | Múltiples condiciones por regla (leave-on, nano, etc.) |
| IngredientRule → RuleVersion | 1:N | ✅ | Historial completo |
| RegulatoryDocument → IngredientRule | 1:N | ✅ | Un documento alimenta miles de reglas |
| RegulatoryList → IngredientRule | 1:N | ✅ | Una lista contiene miles de reglas |
| IngredientRule → Restriction (mínimo) | 1:0..N | ✅ | PROHIBIDOS puede tener 0 restrictions |
| ImportBatch → IngredientRule | 1:N | ✅ | Un batch crea/actualiza muchas reglas |

## 6.3 Redundancia detectada: `authority_id` en IngredientRule

**Situación actual:** `IngredientRule` referencia `authority_id`, `list_id` y `document_id`.

**Análisis:**
- `list.authority_id` implica la authority de la lista.
- `document.authority_id` implica la authority del documento.
- En datos consistentes, los tres deberían coincidir.

**¿Es redundante?** Sí, parcialmente.

**¿Eliminarla?** No en v1.0. Justificación:

1. **Integridad cross-aggregate:** validar en commit que `list.authority_id = document.authority_id = rule.authority_id` es más simple con el campo explícito.
2. **Performance de queries:** filtrar reglas por authority sin JOIN triple.
3. **RLS futuro:** políticas por authority más directas.

**Invariante requerida:** los tres IDs de authority (directo, vía list, vía document) deben ser consistentes. El dominio lo valida en import commit.

**Alternativa descartada:** derivar authority solo de list. Falla cuando list y document temporalmente pertenecen a distintas fases de migración normativa.

## 6.4 Propuesta de mejora (sin cambiar nombres)

| Mejora | Descripción | Etapa |
|--------|-------------|-------|
| **Constraint de consistencia** | Validar `rule.authority_id = list.authority_id = document.authority_id` en application layer | 1 |
| **Unicidad de regla** | `UNIQUE (ingredient_id, list_id, document_id)` — una regla por ingrediente+lista+documento | 1 |
| **Restriction ordering** | Campo `sequence` en Restriction cuando hay múltiples condiciones ordenadas | 1 |
| **Document-Llist M:N opcional futura** | Si un anexo cruza documentos, tabla `document_list_mapping` — no necesaria en v1.0 | 6+ |

## 6.5 Estructura validada

**Conclusión:** la estructura `Ingredient → IngredientRule → Restriction` con referencias a `RegulatoryDocument` y `RegulatoryList` es correcta. No se propone reestructuración. Solo se refuerza con invariantes de consistencia.

---

# 7. Future Proof

Análisis de capacidad del modelo **sin cambiar entidades ni relaciones**.

| Escenario | ¿Soportado? | Observaciones |
|-----------|-------------|---------------|
| **100 países / authorities** | ✅ | `regulatory_authorities` es catálogo pequeño (decenas, no millones) |
| **500 documentos** | ✅ | Tabla pequeña, index por authority |
| **1M IngredientRules** | ✅ | Con índices compuestos `(authority_id, list_id, ingredient_id)` y particionado futuro por `authority_id` |
| **5M Restrictions** | ✅ | Ratio ~5 restrictions/rule es manejable; índice en `ingredient_rule_id` |
| **Versionado 20 años** | ✅ | `RuleVersion` append-only; retención por política, no por diseño |
| **Comparador regulatorio** | ✅ | Query cross-authority sobre mismo `ingredient_id` con distintos `authority_id` |
| **Knowledge Layer** | ✅ | Modelo tipado + textos en Restriction/Document alimentan RAG |
| **API pública** | ✅ | Read models sobre aggregates existentes |
| **IA** | ✅ | Respuestas citan `RegulatoryDocument` + `source_excerpt` |
| **Importadores nuevos** | ✅ | `ImportProfile.mapping_json` — zero code change |

## 7.1 Puntos débiles (modelo, no performance)

| Punto débil | Riesgo | Mitigación |
|-------------|--------|------------|
| **RuleVersion como JSONB snapshot** | Schema drift si Restriction gana campos | Incluir `schema_version` en snapshot |
| **Sin identificador global de sustancia** | Mismo ingrediente con INCI distinto en distintas authorities | `IngredientMerge` admin + CAS como clave secundaria |
| **RegulatoryList sin vínculo temporal** | No saber qué listas aplicaban en 2018 vs 2024 | `RuleVersion` + `document.effective_date` — no se necesita en list |
| **ImportProfile mapping_json sin schema** | Perfiles inválidos en runtime | Validar mapping contra JSON Schema en Etapa 2 |
| **PROHIBIDOS sin Restriction** | UI debe manejar regla sin condiciones | Regla explícita en domain invariants |
| **Supersede en cascada** | Document superseded no auto-supersede reglas | Comportamiento de negocio explícito: reglas siguen activas hasta re-import |

---

# 8. Riesgos arquitectónicos (dominio, horizonte 5 años)

| # | Decisión | Riesgo de dominio | Severidad |
|---|----------|-------------------|-----------|
| 1 | IngredientRule referencia 3 aggregates (ingredient, list, document) | Regla huérfana si se archiva document sin política clara | Media |
| 2 | Restriction con muchos campos booleanos | Campos nuevos de normativa (ej. "reef safe") requieren migración | Media |
| 3 | Sin bounded context explícito para abreviaturas | Glosario químico mezclado con Core | Baja |
| 4 | Merge de Ingredients manual | Duplicados persistentes si no hay proceso operativo | Alta |
| 5 | ImportBatch modifica Core sin eventos formales | Acoplamiento Imports→Core difícil de auditar fuera de ImportDiff | Media |
| 6 | RegulatoryList independiente de document | Usuario confunde "lista" con "versión de lista" | Baja |
| 7 | RuleVersion snapshot vs diff | Storage crece; reconstrucción parcial más difícil que ES puro | Baja |
| 8 | Sin `RegulatoryFramework` entre Authority y Document | MERCOSUR+ANMAT relación no modelada (ANMAT adopta MERCOSUR) | Media |
| 9 | Status múltiples (`is_active`, `rule_status`, `document.status`) | Semántica de "activo" ambigua cross-entity | Media |
| 10 | CSV como fuente operativa | Si CSV tiene error, miles de reglas incorrectas antes de detectar | Alta — mitigado por preview |

### Riesgo #8 ampliado (único que podría requerir evolución futura)

Hoy: `RegulatoryAuthority` es plano.  
Realidad: ANMAT implementa normas MERCOSUR con adaptaciones locales.  
**v1.0:** no modelar jerarquía — documentar en `RegulatoryDocument.summary`.  
**v2.0 (solo si necesario):** entidad `RegulatoryFramework` o relación `adopts_authority_id` — **no congelar aún, monitorear**.

---

# 9. Domain Invariants

Reglas que **SIEMPRE** deben cumplirse. Violación = bug crítico o corrupción de datos regulatorios.

## 9.1 RegulatoryAuthority

- INV-A1: `code` es único globalmente.
- INV-A2: Una authority archivada no puede ser referenciada por nuevos documentos o reglas.
- INV-A3: Una authority nunca se elimina físicamente si tiene documentos, listas o reglas referenciadas.

## 9.2 RegulatoryDocument

- INV-D1: Todo documento pertenece a exactamente una RegulatoryAuthority.
- INV-D2: Un documento con `status = superseded` no acepta nuevas IngredientRules.
- INV-D3: Un documento nunca se elimina físicamente si tiene reglas referenciadas.
- INV-D4: `effective_date` ≤ fecha de vigencia de reglas creadas bajo ese documento (validación en import).

## 9.3 RegulatoryList

- INV-L1: Toda lista pertenece a exactamente una RegulatoryAuthority.
- INV-L2: `(authority_id, code)` es único.
- INV-L3: Una lista archivada no acepta nuevas reglas.

## 9.4 Ingredient

- INV-I1: Un ingrediente tiene al menos `inci_name` o identificador químico (CAS).
- INV-I2: Un ingrediente nunca se elimina físicamente si tiene IngredientRules.
- INV-I3: IngredientSynonym siempre referencia un Ingredient existente.
- INV-I4: Merge de ingredients transfiere todas las IngredientRules al ingrediente destino.

## 9.5 IngredientRule

- INV-R1: Toda IngredientRule pertenece a exactamente un Ingredient.
- INV-R2: Toda IngredientRule referencia exactamente un RegulatoryDocument.
- INV-R3: Toda IngredientRule referencia exactamente un RegulatoryList.
- INV-R4: Toda IngredientRule referencia exactamente un RegulatoryAuthority.
- INV-R5: `rule.authority_id = list.authority_id = document.authority_id`.
- INV-R6: `(ingredient_id, list_id, document_id)` es único — una regla por contexto.
- INV-R7: Una IngredientRule nunca se elimina físicamente.
- INV-R8: Toda modificación a una regla activa genera un RuleVersion.
- INV-R9: Una regla `superseded` no puede volver a `active` — se crea regla nueva.
- INV-R10: Si `import_batch_id` está presente, el batch debe existir y estar en status `completed` o `rolled_back`.

## 9.6 Restriction

- INV-S1: Toda Restriction pertenece a exactamente una IngredientRule.
- INV-S2: Una Restriction nunca existe sin IngredientRule.
- INV-S3: Una Restriction nunca se elimina físicamente — solo archiva.
- INV-S4: Modificación de Restriction genera RuleVersion en regla padre.
- INV-S5: Si `max_concentration` está presente, `concentration_unit` es obligatorio.
- INV-S6: PROHIBIDOS puede tener cero restrictions — la prohibición es la regla misma.

## 9.7 RuleVersion

- INV-V1: RuleVersion es append-only — no UPDATE, no DELETE.
- INV-V2: Todo RuleVersion referencia la IngredientRule que snapshotearon.
- INV-V3: `data_snapshot` incluye estado completo de la regla y sus restrictions al momento del cambio.

## 9.8 ImportProfile

- INV-P1: Todo ImportProfile referencia una RegulatoryAuthority.
- INV-P2: `mapping_json` debe ser válido contra schema antes de activar profile.
- INV-P3: Un profile usado en batch completado no se edita — se versiona.

## 9.9 ImportBatch

- INV-B1: Un batch completado es inmutable en sus ImportRows e ImportDiffs.
- INV-B2: Rollback de batch revierte cambios en Core y genera RuleVersions de reversión.
- INV-B3: Un batch `failed` no escribe en Core (excepto logs).
- INV-B4: Preview obligatorio antes de commit transaccional.

## 9.10 Cross-cutting

- INV-X1: Nunca eliminar físicamente datos regulatorios (reglas, versions, diffs, rows).
- INV-X2: Toda regla debe trazarse a un documento normativo.
- INV-X3: El importador no hardcodea formatos — usa ImportProfile.
- INV-X4: Usuario final (no admin) no modifica Core directamente.
- INV-X5: Search y API son read-only respecto al dominio regulatorio.

---

# 10. Arquitectura congelada

## ¿El modelo está suficientemente sólido para comenzar el desarrollo?

### **Sí.**

El dominio cumple:

- ✅ Separación clara Ingredient / IngredientRule / Restriction
- ✅ Trazabilidad a documento normativo
- ✅ Versionado auditable sin Event Sourcing prematuro
- ✅ Importación desacoplada via ImportProfile
- ✅ Escalabilidad conceptual a 1M+ reglas
- ✅ Preparación para Knowledge Layer, comparador y API
- ✅ Invariantes definidas y violaciones identificables
- ✅ Bounded contexts identificados (Core + Imports)

**Condiciones de inicio:**

1. Implementar invariantes INV-R5, INV-R6, INV-B4 en application layer desde Etapa 1.
2. Monitorear riesgo #8 (jerarquía ANMAT/MERCOSUR) — no bloquea Etapa 0.
3. Documentar semántica de `status` / `is_active` / `rule_status` en glosario UI.

---

# ARCHITECTURE FREEZE v1.0

**Efectivo tras aprobación de este documento.**  
Modificaciones a nombres, relaciones y conceptos del dominio requieren **cambio regulatorio mayor** o **revisión arquitectónica explícita** — no refactors oportunistas.

## Entidades congeladas (nombres oficiales)

| Concepto | Nombre oficial | Tabla PostgreSQL |
|----------|----------------|------------------|
| Autoridad regulatoria | `RegulatoryAuthority` | `regulatory_authorities` |
| Documento normativo | `RegulatoryDocument` | `regulatory_documents` |
| Lista / anexo | `RegulatoryList` | `regulatory_lists` |
| Ingrediente maestro | `Ingredient` | `ingredients` |
| Sinónimo | `IngredientSynonym` | `ingredient_synonyms` |
| Regla regulatoria | `IngredientRule` | `ingredient_rules` |
| Condición de uso | `Restriction` | `restrictions` |
| Versión de regla | `RuleVersion` | `rule_versions` |
| Perfil de importación | `ImportProfile` | `import_profiles` |
| Lote de importación | `ImportBatch` | `import_batches` |
| Fila de importación | `ImportRow` | `import_rows` |
| Diff de importación | `ImportDiff` | `import_diffs` |

## Relación central congelada

```
Ingredient  →  IngredientRule  →  Restriction
```

## Aggregates congelados

| Aggregate Root | Módulo |
|----------------|--------|
| RegulatoryAuthority | Core |
| RegulatoryDocument | Core |
| RegulatoryList | Core |
| Ingredient (+ IngredientSynonym) | Core |
| IngredientRule (+ Restriction, RuleVersion) | Core |
| ImportProfile | Imports |
| ImportBatch (+ ImportRow, ImportDiff) | Imports |

## Decisiones de diseño congeladas

1. **No Event Sourcing completo en v1.0** — snapshot versioning via RuleVersion.
2. **No DELETE físico** en datos regulatorios.
3. **Toda IngredientRule referencia RegulatoryDocument** — sin excepciones.
4. **ImportProfile configurable** — importador sin hardcode de columnas.
5. **authority_id denormalizado en IngredientRule** — con invariante INV-R5.
6. **RegulatoryList separada de RegulatoryDocument** — lista transversal a documentos.
7. **PROHIBIDOS permite 0 Restrictions** — la regla es la prohibición.
8. **CSV normalizado es fuente operativa; documento oficial es fuente legal; PostgreSQL es fuente de consulta.**
9. **Knowledge Layer es capa futura** — no altera entidades Core.
10. **Laravel legacy no se reutiliza** — solo conocimiento de dominio.

## Stack congelado (Etapa 0–3)

- Next.js 15+ App Router, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui, dark mode
- Supabase (PostgreSQL + Auth + RLS)
- SQL nativo — sin Prisma en v1.0
- Vercel deploy

## Etapa 0 — scope congelado

**Crear:**
- `profiles`, `regulatory_authorities`, `regulatory_documents`, `regulatory_lists`, `ingredients`
- Auth SSR, middleware, layout dashboard, landing

**No crear:**
- `ingredient_rules`, `restrictions`, `rule_versions`
- `import_profiles`, `import_batches`, `import_rows`, `import_diffs`
- Buscador, importador, pagos, IA, API pública

## Exclusiones explícitas del freeze (pueden evolucionar)

| Tema | Estado |
|------|--------|
| Jerarquía Authority (ANMAT adopta MERCOSUR) | Monitorear — no modelar en v1.0 |
| Restriction: columnas vs JSONB híbrido | Decidir en Etapa 1 al ver CSV real |
| `ingredient_synonyms` en Etapa 0 vs 1 | Etapa 1 (congelado) |
| Particionado PostgreSQL por authority | Infraestructura — no dominio |

---

*Fin del documento. Aprobación pendiente del arquitecto y del product owner antes de iniciar implementación Etapa 0.*
