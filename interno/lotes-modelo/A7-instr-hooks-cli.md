# instr — REQ-MOD-3 / A7: hooks de la CLI y CLAUDE.md podado
Categoría: **crítico** (cambia cómo trabaja la CLI en todos los lotes siguientes; reestructura CLAUDE.md de 244 KB; cruce previo con Carlos: <fecha hora, en el chat del Arquitecto>; lote del modelo LM-7, lo redacta el Arquitecto)
Alcance: `.claude/settings.json` · `.claude/hooks/guard-bash.js` · `.claude/hooks/stop-check.js` · `.claude/hooks/ctx.js` · `docs/claude/` (carpeta nueva: `reglas-fijas.md` y un mapa por área) · `CLAUDE.md` · `tests/hooks.test.js` · `tests/claude-md.test.js` · `tests/run.js` (solo si hace falta registrar los tests nuevos) · **sin cambio de `?v=`** (no se toca ningún HTML ni JS de la aplicación) · `schema_version` igual · sin cambios de base de datos ni de datos
Impacto: tres reglas pasan de «escritas» a «automáticas»: no hay commit con archivos fuera del Alcance sin declararlo, ni sin actualizar el mapa, ni con tests rojos; la CLI no termina con cambios sin commit; tras cada compactación recupera las reglas fijas y la ruta de la instrucción. CLAUDE.md pasa de 244 KB a ≤ 12 000 caracteres y el detalle vive en `docs/claude/` por área, que la CLI lee solo cuando toca esa área.
Riesgo: medio (R-A). Un hook mal escrito bloquearía todos los commits. Mitigación: los tres scripts vienen probados (15 pruebas) y se copian tal cual desde la cola; si un hook falla por entorno, `--settings` con `{"disableAllHooks": true}` los apaga sin tocar el repo.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: sí, pero es el propio lote del modelo (LM-7); la CLI lo ejecuta porque los archivos viven en `str-manager`
Reversión: `git revert <hash>` (devuelve CLAUDE.md completo y quita `.claude/` y `docs/claude/`)
Origen: PT-M1 ítem A7; situaciones G-8, G-9, G-16, G-17, G-25, G-29, G-35 (reglas que no se cumplen con un CLAUDE.md de 244 KB). Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-3, REQ-MOD-5. Fuentes: `claude/marco/fuentes-oficiales-2026-10.md` (hooks, SessionStart compact, Stop, autoMode).
Depende de: cola v4 instalada (ya está: pasa `STR_INSTR` y `STR_LOTE` a la CLI); ningún lote de producto.
Precondiciones para verificar: ninguna en el navegador; todo se comprueba con archivos y tests.
¿Quién más depende de lo que cambia?: el Agente verificador lee `CLAUDE.md` para comprobar «CLAUDE.md actualizado en el mismo commit» → desde este lote vale `CLAUDE.md` **o** `docs/claude/*.md` (el Arquitecto ajusta el texto de las tareas en la próxima edición agrupada; mientras, el verificador lo lee en la nota de CLAUDE.md § 0). `herramientas/plantillas/revisor-previo.md` punto 4 ya lo contempla.

## 1. Hooks (copiar, no reescribir)
Los archivos están en `C:\Users\ktcol\Downloads\str-instr-cola\hooks\`: `settings.json`, `guard-bash.js`, `stop-check.js`, `ctx.js`, `hooks.test.js`. Cópialos así: `settings.json` → `.claude/settings.json`; los tres `.js` → `.claude/hooks/`; `hooks.test.js` → `tests/hooks.test.js`. No cambies su contenido. Si `tests/run.js` carga los tests por lista, añade `hooks.test.js` y `claude-md.test.js`; si los descubre por carpeta, no toques `run.js`.
Comprueba a mano, desde la raíz del repo, que funcionan: `echo {"tool_input":{"command":"git reset --hard"}} | node .claude/hooks/guard-bash.js` termina con código 2 y un motivo; `echo {} | node .claude/hooks/ctx.js` imprime las reglas fijas (después del punto 3).

## 2. `docs/claude/` — mover, no borrar
Crea `docs/claude/` y reparte el contenido actual de `CLAUDE.md` en mapas por área, **copiando los bloques tal cual** (sin resumir ni reescribir; se permite quitar duplicados exactos y cambiar niveles de título):
- `reglas-fijas.md` (≤ 3 000 caracteres): las reglas que valen para todo lote: ediciones quirúrgicas; migración al leer; `?v=` y `STR_API_VERSION` suben cuando cambia un HTML o JS; `node tests/run.js` en verde; un solo commit a `main` con «Hecho / No hecho» por punto y «declarados vs tocados»; mapa del área actualizado en el mismo commit; nunca datos reales; un bloqueo del modo automático no se rodea: «No hecho» con la causa; prefijo `modelo:` solo para la capa Marco.
- Un mapa por área, con los nombres exactos: `shell-y-api.md` (str-app-shell, str-api.js, login, invitacion, portal), `calendario.md`, `propiedades.md`, `flujos.md`, `housekeeping.md` (str-m1-housekeeping, cola de subida, guía visor), `inventario.md`, `usuarios-y-roles.md`, `proyecto.md` (seg-proyecto, elementos, cobit, conocimiento, base-conocimiento, marco-trabajo, instrucciones, nomenclatura), `servidor-php.md` (api/, .htaccess, base de datos, despliegue), `tests-y-despliegue.md`, `historial.md` (notas de lotes pasados, INC cerrados y decisiones técnicas que no son de ningún área).
- Cada mapa ≤ 60 000 caracteres; si un área no cabe, pártela en `<area>-2.md` y enlázala desde el índice.

## 3. `CLAUDE.md` nuevo (≤ 12 000 caracteres)
Contenido, en este orden: § 0 «Cómo usar este archivo» (lee `docs/claude/reglas-fijas.md` siempre y el mapa del área que vas a tocar antes de editar; el mapa del área se actualiza en el mismo commit; nota para el verificador: «CLAUDE.md actualizado» = CLAUDE.md o el mapa del área) · § 1 reglas fijas (el mismo texto que `reglas-fijas.md`, o un enlace si no cabe) · § 2 índice: tabla archivo/carpeta → mapa (una fila por cada `*.html`, `*.js`, `api/<carpeta>/`, `tests/`) · § 3 versión actual (`?v=`, `STR_API_VERSION`, `schema_version`) y la línea de INC-37 · § 4 patrón del mensaje de commit. Nada más.

## 4. Test `tests/claude-md.test.js`
Comprueba: `CLAUDE.md` ≤ 12 000 caracteres; existe `docs/claude/reglas-fijas.md` ≤ 3 000; cada `str-*.html`, `*.js` de la raíz y cada carpeta de `api/` aparece en el índice de CLAUDE.md; cada mapa ≤ 60 000; y **conservación**: la suma de caracteres de `CLAUDE.md` + `docs/claude/*.md` es ≥ 90 % del tamaño que tenía `CLAUDE.md` antes del lote (deja el número en el test como constante con el valor medido al empezar: `const ANTES = <n>`).

## 5. Tests
`node tests/run.js` en verde con `hooks.test.js` (15 pruebas) y `claude-md.test.js` incluidos.

## 6. Pruebas derivadas (verificador crítico; sin navegador: solo archivos y tests)
- a. `node tests/run.js` en verde, incluidos hooks.test.js y claude-md.test.js · perfil: tests/ · espera: log del lote con n/n · **Detener**
- b. `.claude/settings.json`, los tres hooks y `docs/claude/reglas-fijas.md` existen en `main` con el contenido de la cola (comparar byte a byte los `.js` y `settings.json` con `str-instr-cola\hooks\`) · perfil: archivos · **Detener**
- c. `CLAUDE.md` ≤ 12 000 caracteres y su índice nombra cada `str-*.html` del repo · perfil: archivos · **Detener**
- d. Ningún HTML ni JS de la aplicación cambió (el log «declarados vs tocados» solo lista los archivos del Alcance) y `?v=` sigue igual · perfil: archivos · **Detener**
- e. Primer lote siguiente: su `log\NN-*.txt` muestra al inicio las reglas fijas inyectadas por `ctx.js` (texto «Instrucción del lote en curso:») · perfil: archivos · lo comprueba el Chat Desarrollo en el siguiente lote y lo anota en cambios[] · **Seguir**

## Cierre (lo escribe la CLI en `log\NN-hooks-cli.txt`)
Hecho / No hecho por apartado · declarados vs tocados · tamaño de CLAUDE.md antes y después · lista de mapas creados con su tamaño · tests n/n · hash.
