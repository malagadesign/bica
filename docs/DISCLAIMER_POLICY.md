# Política de disclaimers — BICA

## Por qué existe

BICA organiza información regulatoria derivada de fuentes oficiales. No es un organismo emisor de normativa ni un servicio de asesoramiento vinculante.

El disclaimer:

- establece el carácter **informativo** de la plataforma;
- remite a **fuentes oficiales** como autoridad;
- protege al usuario y a Eternia frente a interpretaciones incorrectas;
- prepara el marco para futura **IA asistiva** (sin exponerla al cliente final prematuramente).

---

## Texto oficial

Texto completo en `src/lib/legal/disclaimer-content.ts` → `DISCLAIMER_GENERAL`

Versión pública en `/legal/disclaimer`.

---

## Dónde debe mostrarse

| Ubicación | Formato | Sprint 8 |
|-----------|---------|----------|
| Landing pública — footer | Texto corto + link | ✅ |
| Login / Register | Link discreto | ✅ |
| App autenticada — footer | Texto corto + link | ✅ |
| Knowledge Page (ingrediente) | Nota breve en fuentes | ✅ |
| Documentos normativos | Nota junto a link oficial | ✅ |
| Actualizaciones normativas — publicar | Microcopy de verificación | ✅ |
| Página legal dedicada | Texto completo | ✅ `/legal/disclaimer` |
| Sidebar / perfil | Link "Aviso legal" | ✅ |

---

## Cuándo reforzar

| Contexto | Refuerzo |
|----------|----------|
| Publicar actualización normativa | Verificar contra fuente oficial |
| Links a documentos externos | Nota de fuente oficial |
| Knowledge Page | Información derivada, no vinculante |
| Decisiones comerciales o de formulación | Ver normativa oficial + asesor profesional |

---

## Fuente oficial vs base informativa

| Fuente oficial | Base informativa BICA |
|----------------|----------------------|
| ANMAT, MERCOSUR, Boletín Oficial | Organización estructurada para consulta |
| Publicación primaria | Derivada, con trazabilidad |
| Vinculante | Informativa |
| Siempre prevalece | Debe verificarse contra la oficial |

---

## Relación con IA futura

- El disclaimer de IA (`DISCLAIMER_AI_INTERNAL`) vive en código y documentación interna.
- **No se muestra al cliente final** en Sprint 8 — la IA asistirá primero al administrador.
- Cuando exista IA visible, se actualizará `/legal/disclaimer` y esta política.

Principio de IA: `docs/BICA_AI_ARCHITECTURE.md`

---

## Microcopy

Definido en `src/lib/legal/microcopy.ts`:

- `FOOTER_DISCLAIMER_SHORT`
- `PUBLISH_UPDATE_VERIFICATION`
- `OFFICIAL_SOURCE_NOTE`
- `KNOWLEDGE_SOURCE_NOTE`
- `AI_ASSISTANCE_NOTE` (reservado, admin futuro)

---

## Mantenimiento

- Cambios al texto oficial → actualizar `disclaimer-content.ts` y revisar `/legal/disclaimer`
- Nuevas superficies de UI → consultar tabla "Dónde debe mostrarse"
- Integración de IA → actualizar `BICA_AI_ARCHITECTURE.md` y esta política antes de exponer al usuario
