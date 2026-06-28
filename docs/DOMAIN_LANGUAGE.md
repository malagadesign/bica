# Lenguaje de dominio — BICA

> **BICA no administra archivos. BICA administra conocimiento regulatorio derivado de fuentes oficiales.**

Este documento es la referencia de producto para futuros desarrollos del módulo de actualizaciones normativas y del workspace regulatorio en general.

---

## Por qué dejamos de hablar de importaciones

La idea inicial del proyecto incluía un flujo técnico de “importar CSV”. Eso reflejaba la implementación, no el trabajo real de un especialista regulatorio.

En la práctica, el trabajo comienza cuando aparece una **nueva normativa** — una disposición ANMAT, una resolución MERCOSUR, un anexo, una guía técnica — publicada en fuentes oficiales como:

- ANMAT
- MERCOSUR
- Boletín Oficial
- Argentina.gob.ar
- Guías técnicas

El archivo (PDF, Excel, CSV) es **soporte documental**. No es la unidad de trabajo.

Por eso en BICA hablamos de:

| Evitar (técnico) | Usar (dominio) |
|------------------|----------------|
| Importación | Actualización normativa |
| Archivo | Documento fuente |
| Batch | Actualización |
| Subir archivo | Incorporar normativa |
| CSV | Documento recibido (si corresponde) |

Las referencias técnicas internas (`source_type`, `parse`, etc.) pueden permanecer en código. La interfaz habla el lenguaje del especialista.

---

## Documento fuente vs actualización normativa

| Concepto | Qué es |
|----------|--------|
| **Actualización normativa** | Unidad de trabajo: una normativa oficial que puede modificar la base de conocimiento BICA |
| **Documento fuente** | Soporte recibido (PDF, Excel, CSV) que permite el análisis asistido |
| **Activo regulatorio** | Todo lo que entra a BICA y genera conocimiento: disposición, anexo, guía, resolución, formulario |

La pregunta inicial del sistema es:

> **¿Qué actualización normativa desea incorporar?**

Nunca:

> ¿Qué archivo desea subir?

---

## Revisión asistida

BICA **no publica automáticamente** una nueva normativa.

El flujo es:

1. **Análisis automático/asistido** — parse, normalización, validación, diff
2. **Propuesta editable** — staging en workspace aislado
3. **Revisión manual** — el especialista valida interpretación
4. **Corrección** — nombres químicos, ortografía, transcripción, concentraciones
5. **Confirmación explícita** — declaración de revisión completada
6. **Publicación final** — incorporación a la base publicada + historial

Nunca:

```
Fuente oficial → publicación directa
```

Esto responde al contexto real del cliente: actualizaciones pequeñas (~10–20 sustancias cada ~2 años) que requieren control humano fino.

---

## Principio de control humano

- El sistema **propone**, el especialista **decide**.
- Las advertencias de validación informan; no bloquean silenciosamente.
- Los conflictos requieren resolución explícita.
- La publicación requiere confirmación de revisión manual previa.

---

## Ciclo de vida de una actualización

| Estado | Significado |
|--------|-------------|
| En revisión | Normativa incorporada y analizada; propuesta lista para revisar/corregir |
| Lista para publicar | Revisión manual confirmada por el administrador |
| Publicada | Cambios aplicados a la base normativa vigente |

### Recorrido visible

1. Normativa incorporada
2. Análisis realizado
3. Revisión manual
4. Correcciones (si aplica)
5. Confirmación
6. Publicación

---

## Fuentes y tipos documentales

### Fuentes regulatorias (catálogo)

Definidas en `data/regulatory-sources.json`. Agregar una fuente no requiere cambiar código de aplicación.

Ejemplos: ANMAT, MERCOSUR, Boletín Oficial, Argentina.gob.ar, Carga manual.

### Tipos documentales (catálogo)

Definidos en `data/regulatory-document-types.json`.

Ejemplos: Resolución, Disposición, Anexo, Guía Técnica, Formulario, Boletín Oficial, Otro.

Esta clasificación es conceptual en Sprint 7A. El parser no la utiliza todavía.

---

## Resumen de impacto

La métrica principal para el especialista no es “cambios detectados” sino **resumen de impacto**:

- Ingredientes nuevos / modificados / eliminados
- Restricciones modificadas
- Documentos relacionados
- Registros que necesitan revisión

---

## Filosofía de diseño

> En BICA el protagonista nunca es el archivo.  
> El protagonista siempre es la normativa.

Toda decisión futura — UI, API, integraciones, IA — debe respetar este principio.

---

## Visión: activos regulatorios

Más allá de ingredientes, documentos y reglas como entidades técnicas, BICA gestiona **activos regulatorios**: cada normativa, anexo o guía que entra al sistema y deriva conocimiento estructurado.

Esta visión permite escalar hacia:

- comparadores normativos
- alertas de cambios
- trazabilidad por fuente
- integraciones con portales oficiales

…sin rediseñar el producto desde cero.

---

## Referencias técnicas

- Pipeline: `docs/REGULATORY_UPDATES.md`
- Catálogo fuentes: `data/regulatory-sources.json`
- Catálogo tipos: `data/regulatory-document-types.json`
- Módulo: `src/modules/regulatory-updates/`
