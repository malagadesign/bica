# Responsive — estado y pendientes

Sprint 6 garantiza usabilidad en **tablet y notebook**, no mobile completo.

## Pantallas verificadas

| Pantalla | Tablet (768px+) | Notebook (1024px+) | Mobile (<768px) |
|----------|-----------------|--------------------|-----------------|
| Login / Register | OK | OK | Usable; formulario full-width |
| Inicio (dashboard) | OK | OK | Hero apilado; stat cards 2 col |
| Búsqueda | OK | OK | Resultados legibles |
| Knowledge Page | OK | OK | Snapshot en 1 col; tabs scroll |
| Admin Usuarios | OK | OK | Tabla con scroll horizontal |
| Workspace editorial | OK | OK | Cards 2 col en tablet |

## Patrones responsive aplicados

- Grids `sm:grid-cols-2`, `lg:grid-cols-3/4` en dashboard y listados
- Flex `flex-wrap` en headers y badges
- `max-w-*` + `mx-auto` para lectura cómoda en pantallas anchas
- Sidebar colapsable vía shadcn (comportamiento existente)

## Pendientes mobile (post-Sprint 6)

1. **Sidebar en mobile** — drawer dedicado; hoy depende del componente sidebar por defecto
2. **Tablas admin** — cards en lugar de tablas en usuarios/QA
3. **Knowledge Page tabs (admin)** — scroll horizontal o select nativo
4. **Búsqueda hero** — teclado virtual puede ocultar resultados; considerar posición fixed del panel
5. **Timeline** — indentación en pantallas muy estrechas
6. **Touch targets** — revisar mínimo 44px en acciones secundarias

## Recomendación para demo

Presentar en notebook o tablet landscape. Evitar mobile en demos formales hasta Sprint dedicado a mobile.
