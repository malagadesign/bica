# BICA — Visión de Producto

**Versión:** 1.1  
**Fecha:** 26 de junio de 2026  
**Audiencia:** Product owner, diseño, stakeholders, nuevos integrantes del equipo

> Este documento describe **qué es el producto y para quién**.  
> No contiene decisiones técnicas, stack ni arquitectura de software.

---

## Qué es BICA

**BICA** (Base de Ingredientes Cosméticos Argentinos) es una **plataforma de conocimiento regulatorio cosmético**. Organiza en un solo lugar la información normativa sobre ingredientes utilizados en productos de higiene personal, cosméticos y perfumes: qué está permitido, restringido o prohibido, en qué concentración, con qué advertencias y bajo qué norma.

No es un repositorio de archivos Excel. No es un buscador genérico de internet. Es una **herramienta profesional** para quien formula, evalúa o audita productos cosméticos y necesita respuestas precisas, trazables y actualizadas.

---

## Alcance actual (implementado)

La versión desplegada cubre **Argentina / MERCOSUR**:

| Capacidad | Estado |
|-----------|--------|
| Autenticación y acceso manual (admin) | ✅ |
| Búsqueda regulatoria (INCI, CAS, CI, listas, documentos) | ✅ |
| Fichas regulatorias (Knowledge Pages) | ✅ |
| Listados y documentos normativos | ✅ |
| Workflow editorial (borrador → revisión → publicado) | ✅ |
| Actualizaciones normativas con revisión humana | ✅ |
| Gestión de usuarios y auditoría básica | ✅ |
| Disclaimers y aviso legal | ✅ |
| Centro de Conocimiento (`/ayuda`, `/app/help`) | ✅ |

Fuentes oficiales de referencia: **ANMAT**, **MERCOSUR**, **Boletín Oficial**, **Argentina.gob.ar**.

---

## Visión futura (no implementado)

Roadmap de producto — **sin compromiso de fecha**:

| Capacidad | Descripción |
|-----------|-------------|
| Multi-jurisdicción ampliada | Unión Europea, FDA, ANVISA y otros organismos |
| Comparador de jurisdicciones | Diferencias normativas entre marcos en un clic |
| Alertas de actualización | Notificación cuando cambia normativa relevante |
| Exportación avanzada | PDF de fichas, reportes de conformidad |
| Asistencia editorial | Herramientas de apoyo para administradores (con revisión humana obligatoria) |
| API pública | Integración con sistemas de formulación o ERP |

---

## Qué problema resuelve

Hoy, quien trabaja en formulación o asuntos regulatorios cosméticos enfrenta:

- **Normas dispersas** — resoluciones, anexos y listas en PDFs, Excel y sitios oficiales distintos.
- **Información difícil de cruzar** — la misma sustancia puede aparecer en varias listas con condiciones distintas.
- **Actualizaciones constantes** — una resolución nueva modifica cientos de entradas sin aviso claro.
- **Consultas lentas** — encontrar si un ingrediente está permitido puede llevar horas.
- **Riesgo de error** — usar una versión desactualizada de un listado puede invalidar una formulación.

BICA centraliza esa información, la estructura, la versiona y la hace **consultable en segundos**, indicando **de qué norma proviene cada dato**.

---

## Quién lo usa

### Usuario principal — Formulador / Responsable técnico

Persona que desarrolla o revisa fórmulas cosméticas. Necesita saber rápidamente si un ingrediente es viable en su producto, en qué concentración y con qué limitaciones.

### Usuario secundario — Regulatory affairs

Profesional que interpreta normativa, prepara dossiers y responde a auditorías. Necesita trazabilidad: documento, resolución, fecha de vigencia, historial de cambios.

### Usuario terciario — Laboratorio / QA

Equipo que verifica conformidad de materias primas y producto terminado. Necesita búsqueda por INCI, CAS o nombre químico y resultados claros.

### Usuario administrador — Operador de la plataforma

Persona del equipo BICA que incorpora actualizaciones normativas, gestiona documentos y mantiene la base actualizada.

---

## Propuesta de valor

| Hoy (sin BICA) | Con BICA |
|----------------|----------|
| Buscar en PDFs y Excel | Buscar por INCI, CAS o nombre |
| No saber qué versión aplica | Ver documento y fecha de vigencia |
| Copiar datos a mano | Consultar restricciones estructuradas |
| Perder historial de cambios | Timeline normativo en fichas |
| Comparar normas manualmente | (Futuro) Comparar jurisdicciones |

---

## Cómo navega el usuario

### Primera visita (público)

Landing que explica BICA como plataforma de conocimiento regulatorio. Acceso a **Centro de Conocimiento** público (`/ayuda`) y registro/login controlado.

### Dentro de la plataforma (autenticado)

```
BICA
├── Inicio              → búsqueda y accesos rápidos
├── Buscar              → consulta regulatoria
├── Listados            → exploración por listado normativo
├── Documentos          → normas y resoluciones
├── Ingredientes        → catálogo y fichas regulatorias
├── Reglas              → reglas regulatorias
├── Centro de Conocimiento → guías de uso y comprensión normativa
└── Administración      → solo admin
```

---

## Cómo consulta un ingrediente

1. Busca por INCI, CAS, CI o nombre.
2. Abre la ficha regulatoria: snapshot, reglas, restricciones, documentos, timeline.
3. Verifica la fuente oficial antes de decidir.

Ver guías en `/app/help` para detalle.

---

## Qué BICA NO es

- No reemplaza la normativa oficial ni el criterio profesional del formulador.
- No es asesoría legal vinculante — cita fuentes; el usuario interpreta en contexto.
- No es un ERP ni un LIMS.
- No publica cambios normativos sin revisión humana.

---

## Métrica de éxito

El producto funciona cuando un profesional puede responder **"¿puedo usar X en Y bajo Z normativa?"** en menos de un minuto, con confianza en la fuente, y comprendiendo el contexto regulatorio — no solo el dato aislado.

---

*Documento de visión de producto. Complementa `ARCHITECTURE_FREEZE.md` (contrato técnico) sin duplicarlo.*

*Nombre histórico del repositorio: `cosing-ar-next`. Marca de producto: **BICA**.*
