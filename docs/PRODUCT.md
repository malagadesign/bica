# Cosing AR — Visión de Producto

**Versión:** 1.0  
**Fecha:** 26 de junio de 2026  
**Audiencia:** Product owner, diseño, stakeholders, nuevos integrantes del equipo

> Este documento describe **qué es el producto y para quién**.  
> No contiene decisiones técnicas, stack ni arquitectura de software.

---

## Qué es Cosing AR

Cosing AR es una **plataforma de consulta regulatoria cosmética**. Reúne en un solo lugar las reglas que distintos organismos (ANMAT, MERCOSUR, Unión Europea, FDA, ANVISA y otros) aplican a ingredientes utilizados en productos cosméticos: qué está permitido, qué está restringido, qué está prohibido, en qué concentración, con qué advertencias y bajo qué norma.

No es un repositorio de archivos Excel. No es un buscador genérico de internet. Es una **herramienta profesional** pensada para quien formula, evalúa o audita productos cosméticos y necesita respuestas precisas, trazables y actualizadas.

---

## Qué problema resuelve

Hoy, quien trabaja en formulación o asuntos regulatorios cosméticos enfrenta:

- **Normas dispersas** — resoluciones, anexos y listas en PDFs, Excel y sitios oficiales distintos.
- **Información difícil de cruzar** — la misma sustancia puede aparecer en varias listas con condiciones distintas.
- **Actualizaciones constantes** — una resolución nueva modifica cientos de entradas sin aviso claro.
- **Consultas lentas** — encontrar si un ingrediente está permitido en un protector solar leave-on bajo MERCOSUR puede llevar horas.
- **Riesgo de error** — usar una versión desactualizada de un listado puede invalidar una formulación entera.

Cosing AR centraliza esa información, la estructura, la versiona y la hace **consultable en segundos**, siempre indicando **de qué norma proviene cada dato**.

---

## Quién lo usa

### Usuario principal — Formulador / Responsable técnico

Persona que desarrolla o revisa fórmulas cosméticas. Necesita saber rápidamente si un ingrediente es viable en su producto, en qué concentración y con qué limitaciones.

### Usuario secundario — Regulatory affairs

Profesional que interpreta normativa, prepara dossiers y responde a auditorías. Necesita trazabilidad: documento, resolución, fecha de vigencia, historial de cambios.

### Usuario terciario — Laboratorio / QA

Equipo que verifica conformidad de materias primas y producto terminado. Necesita búsqueda por INCI, CAS o nombre químico y resultados claros.

### Usuario administrador — Operador de la plataforma

Persona del equipo Cosing AR que carga nuevas versiones normativas, gestiona documentos y mantiene la base actualizada. No es el usuario final masivo, pero es crítico para la calidad del producto.

---

## Propuesta de valor

| Hoy (sin Cosing AR) | Con Cosing AR |
|---------------------|---------------|
| Buscar en PDFs y Excel | Buscar por INCI, CAS o nombre |
| No saber qué versión aplica | Ver documento y fecha de vigencia |
| Copiar datos a mano | Consultar restricciones estructuradas |
| Perder historial de cambios | Acceder a versiones anteriores |
| Comparar normas manualmente | (Futuro) Comparar jurisdicciones en un clic |

---

## Cómo navega el usuario

### Primera visita (público)

El usuario llega a una **landing clara** que explica qué es la plataforma: consulta regulatoria cosmética profesional. Ve el valor — precisión, trazabilidad, múltiples organismos — y puede **registrarse o iniciar sesión**. No hay ruido ni funcionalidades expuestas sin autenticación.

### Dentro de la plataforma (autenticado)

El usuario entra a un **dashboard con sidebar**, estilo herramienta profesional (referencia: Linear, Stripe, Supabase):

```
Cosing AR
├── Dashboard          → resumen, accesos rápidos
├── Búsqueda           → corazón del producto (Etapa 3)
├── Ingredientes       → exploración del catálogo
├── Documentos         → normas y resoluciones (futuro)
├── Importaciones      → solo operador/admin (Etapa 2)
└── Administración     → solo admin (Etapa 4)
```

La navegación es **predecible**: sidebar fija, contenido amplio, dark mode por defecto. El usuario siempre sabe dónde está y cómo volver.

---

## Cómo consulta un ingrediente

### Búsqueda rápida

El usuario escribe en un campo de búsqueda:

- Nombre INCI (`Phenoxyethanol`)
- Número CAS (`122-99-6`)
- Nombre químico o abreviatura (`BHT`, `EDTA`)
- Texto libre (`conservante`, `filtro UV`)

La plataforma devuelve resultados **instantáneos**, agrupados por relevancia. Cada resultado muestra: nombre INCI, CAS si existe, y un resumen de en qué listas o marcos regulatorios aparece.

### Ficha de ingrediente

Al seleccionar un ingrediente, el usuario ve una **página de detalle** estructurada:

**Encabezado**
- Nombre INCI
- Nombre químico
- CAS / EINECS
- Función cosmética general

**Reglas regulatorias** (agrupadas por organismo y lista)

Para cada aparición normativa:

| Campo | Ejemplo |
|-------|---------|
| Organismo | MERCOSUR |
| Lista | Conservantes |
| Documento | Res. GMC 03/2020 |
| Vigencia | 01/01/2021 |
| Estado | Activo |

Debajo, las **restricciones** de esa regla:

| Condición | Valor |
|-----------|-------|
| Concentración máxima | 1.0 % |
| Uso leave-on | Sí |
| Uso rinse-off | Sí |
| Advertencia de rotulado | — |
| Extracto del documento | "No superar 1% en productos de cuidado personal" |

**Si el ingrediente está prohibido**, la ficha lo muestra claramente — sin tabla de concentraciones vacía que confunda. La regla dice "Prohibido en productos cosméticos" y cita el documento.

---

## Cómo entiende una restricción

Las restricciones no son texto legal crudo. Se presentan como **condiciones legibles**:

1. **Qué producto aplica** — leave-on, rinse-off, oral, zona ocular, infantil, aerosol, nano.
2. **Qué concentración** — máxima, mínima, unidad, expresada como (ej. "como ácido").
3. **Qué limitaciones** — "no usar en productos para ojos", "solo uso profesional".
4. **Qué advertencias de rotulado** — texto obligatorio en etiqueta.
5. **De dónde viene** — enlace al documento normativo y extracto original.

El usuario puede **confiar** porque cada dato cita su fuente. No hay caja negra.

Si hay **múltiples restricciones** para la misma regla (ej. distintas condiciones según tipo de producto), se muestran como filas o tarjetas separadas bajo la misma regla — nunca mezcladas en un párrafo ambiguo.

---

## Cómo encuentra una norma

### Por ingrediente (camino principal)

El usuario busca el ingrediente → ve todas las reglas → cada regla enlaza al **documento normativo** (resolución, anexo, adenda).

### Por documento (camino secundario — futuro)

El usuario navega a **Documentos** → selecciona "Res. GMC 03/2020" → ve metadata:

- Organismo emisor (MERCOSUR)
- Tipo (resolución)
- Número oficial
- Fecha de publicación y vigencia
- Enlace al PDF oficial
- Resumen del alcance
- Cantidad de ingredientes/reglas que contiene

Desde ahí puede explorar todas las reglas originadas en ese documento.

### Por lista regulatoria (camino terciario)

El usuario filtra por organismo + lista ("MERCOSUR → Conservantes") → ve el catálogo completo de sustancias permitidas como conservantes bajo ese marco.

---

## Cómo será la experiencia del usuario

### Sensaciones que debe transmitir

- **Confianza** — cada dato tiene fuente verificable.
- **Precisión** — no hay ambigüedad entre "permitido" y "restringido".
- **Claridad** — jerarquía visual: ingrediente → regla → restricción → documento.
- **Rapidez** — búsqueda en segundos, no minutos.
- **Profesionalismo** — se siente como herramienta de laboratorio, no como web genérica.

### Principios de UX

1. **Dark mode por defecto** — uso prolongado en entornos técnicos.
2. **Espaciado amplio** — la información regulatoria es densa; la UI no lo es.
3. **Tablas modernas** — sort, filtros, paginación, export (futuro).
4. **Estados vacíos claros** — "Este ingrediente no aparece en listas MERCOSUR" es un resultado válido, no un error.
5. **Sin sobrecarga** — mostrar lo esencial primero; detalle bajo demanda.
6. **Trazabilidad visible** — el documento normativo siempre a un clic.

### Flujo típico — caso real

> *María, formuladora, desarrolla un protector solar leave-on para MERCOSUR.*

1. Inicia sesión en Cosing AR.
2. Busca `Zinc Oxide`.
3. Ve que aparece en **Filtros UV** (MERCOSUR) según **Res. GMC XX/XXXX**.
4. Abre la restricción: máximo 25%, uso leave-on permitido, advertencia sobre nanopartículas.
5. Verifica el documento original con un clic.
6. Busca un segundo filtro UV para combinar — repite el flujo.
7. Exporta o guarda en favoritos (futuro) su selección.

**Tiempo objetivo:** minutos, no horas.

---

## Evolución del producto (visión, no compromiso de fecha)

| Fase | Capacidad para el usuario |
|------|---------------------------|
| **Hoy (Etapa 0–1)** | Acceso autenticado, catálogo base, ficha de ingrediente |
| **Buscador (Etapa 3)** | Consulta rápida por INCI, CAS, filtros avanzados |
| **Importador (Etapa 2)** | Operador carga nueva resolución; usuario ve datos actualizados |
| **Comparador** | "¿Qué diferencia hay entre MERCOSUR y UE para este ingrediente?" |
| **Alertas** | "La resolución que afecta 12 de tus favoritos fue actualizada" |
| **Asistente IA** | Pregunta en lenguaje natural con respuesta citando norma oficial |

---

## Qué Cosing AR NO es

- No reemplaza el criterio profesional del formulador — **informa**, no decide.
- No es asesoría legal — cita fuentes; el usuario interpreta en contexto.
- No es un ERP ni un LIMS — no gestiona inventario ni producción.
- No es un repositorio de PDFs — los PDFs son fuente; la consulta es estructurada.

---

## Métrica de éxito del producto

El producto funciona cuando un profesional regulatorio cosmético puede responder **"¿puedo usar X en Y bajo Z normativa?"** en menos de un minuto, con confianza en la fuente, sin abrir un Excel.

---

*Documento de visión de producto. Complementa `ARCHITECTURE_FREEZE.md` (contrato técnico) sin duplicarlo.*
