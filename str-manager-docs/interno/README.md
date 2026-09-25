# `interno/`

Esta carpeta **no es documentación del sistema** (ver README raíz). Contiene datos generados
para el módulo interno **"Seg. Proyecto"** del propio STR Manager (bajo el grupo de menú
"Punto de partida", solo visible para el rol `superadmin`), que le da seguimiento al *desarrollo
del STR Manager* desde dentro de la app.

- `seguimiento.json` — lo mantiene Claude (Cowork) al cerrar cada lote de desarrollo; el módulo del
  STR lo lee por `fetch()` directo a `raw.githubusercontent.com` (repo público, sin autenticación).
  Fuente de verdad real: `estado-proyecto.md` / `requerimientos-consolidado.md` en el proyecto de
  Claude — este archivo es una vista derivada, no autoritativa.

Definido en REQ-SP1 / DA-18 (proyecto "Diseño y Desarrollo Web" de Claude, 2026-09-25).
