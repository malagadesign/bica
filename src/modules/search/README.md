# Search — Sprint 1B

Búsqueda regulatoria vía PostgreSQL FTS + RPC.

- **Read model:** `ingredient_search_index` (VIEW)
- **RPC:** `search_ingredients(query_text, limit_count)`
- **Server:** `searchIngredientsQuery()` / `searchIngredientsAction()`
- **API:** `/api/search` (thin wrapper)

Ver `docs/SEARCH_STRATEGY.md`.
