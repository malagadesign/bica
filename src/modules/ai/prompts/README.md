# Prompts de IA — BICA

**Sprint 8 — placeholder.** No hay prompts productivos todavía.

## Reglas

- Los prompts **no** deben quedar dispersos en componentes React.
- Cada prompt debe **versionarse** (`v1`, `v2`, …).
- Los prompts críticos deben documentarse en `docs/BICA_AI_ARCHITECTURE.md`.

## Estructura futura

```
prompts/
  regulatory-update-analysis.v1.ts
  ingredient-match.v1.ts
  conflict-detection.v1.ts
  ...
```

## Principio

Toda salida de IA para operaciones regulatorias debe ser **JSON estructurado**, no texto libre.
