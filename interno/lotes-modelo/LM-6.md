# LM-6 · Cola v4: la instrucción viaja a los hooks; infraestructura de confianza del modo automático

**Lote del modelo** · REQ-MOD-3, REQ-MOD-5 · ítem del plan A7 (parte 1 de 2) · **Categoría: normal** (dos líneas de entorno y un flag opcional; sin cambio de comportamiento si no existen hooks ni auto-mode.json) · Cruce: no requiere · Riesgo: bajo · ¿Toca el modelo? Sí · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: el primer lote que corra con v4 termina igual que con v3 (log sin error) · Reversión: `ejecutar-cola.v3.ps1` → `ejecutar-cola.ps1`.

## Qué cambia
- Antes de llamar a la CLI: `$env:STR_INSTR` (ruta completa de la instrucción) y `$env:STR_LOTE` (nombre base). Los hooks de A7 (`guard-bash.js`, `ctx.js`) los leen.
- Si existe `str-instr-cola\auto-mode.json`, se pasa `--settings <ruta>`: declara al clasificador del modo automático la infraestructura de confianza (`autoMode.environment`: github.com/thcure, app.apartamentosbucaramanga.com, la carpeta de la cola). Fuente: docs oficiales (`auto-mode-config`); esa clave no se lee desde `.claude/settings.json` del proyecto, por eso va por `--settings`.
- Carpeta nueva `str-instr-cola\hooks\` con los archivos que A7 copia al repo (`settings.json`, `guard-bash.js`, `stop-check.js`, `ctx.js`, `hooks.test.js`), probados aquí con 15 pruebas.

## Instalación
11-oct-2026 13:22 en LENOVO: respaldo `ejecutar-cola.v3.ps1`; `ejecutar-cola.ps1` v4; `auto-mode.json`; `hooks\`. Sintaxis comprobada (0 errores).

## Criterio de aceptación
El siguiente lote (A7 o el que sea) corre con v4 y su log no muestra error de flags; si la CLI rechazara `--settings`, el script sigue funcionando quitando `auto-mode.json` (sin tocar el script).
