# instr — REQ-MOD-3 / A7b: hooks de la CLI (PreToolUse, Stop, SessionStart)
Categoría: **crítico** (cambia cómo trabaja la CLI en todos los lotes siguientes; cruce previo con Carlos: <fecha hora, en el chat del Arquitecto>; lote del modelo LM-7b; lo redacta el Arquitecto)
Alcance: `.claude/settings.json` · `.claude/hooks/guard-bash.js` · `.claude/hooks/stop-check.js` · `.claude/hooks/ctx.js` · `tests/hooks.test.js` · `tests/fixtures/hooks/` (carpeta nueva) · `tests/run.js` (solo si registra tests por lista) · `docs/claude/tests-y-despliegue.md` (una nota sobre los hooks) · **sin cambio de `?v=`** · `schema_version` igual · sin cambios de base de datos ni de datos
Impacto: tres reglas pasan de «escritas» a «automáticas»: no hay commit con archivos fuera del Alcance sin declararlo, ni sin actualizar el mapa del área, ni con tests rojos; la CLI no termina con cambios sin commit; tras cada compactación recupera las reglas fijas y la ruta de la instrucción.
Riesgo: medio (R-A). Un hook mal escrito bloquearía todos los commits. Mitigación: los scripts vienen probados (15 pruebas) y se copian tal cual desde la cola; si un hook falla por entorno, `--settings` con `{"disableAllHooks": true}` los apaga sin tocar el repo.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: sí: es un lote del modelo (LM-7); la CLI lo ejecuta porque los archivos viven en `str-manager`
Origen: PT-M1 ítem A7; situaciones G-8, G-9, G-16, G-17, G-25, G-29, G-35. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-3, REQ-MOD-5. Decisión: lote del modelo → en vez de DA-n, LM-7 en `interno/lotes-modelo/` y el cruce de Carlos (regla de `revisor-previo.md` punto 2).
¿Quién más depende de lo que cambia?: el Agente verificador lee `CLAUDE.md` («actualizado en el mismo commit») → desde A7a vale `CLAUDE.md` **o** `docs/claude/*.md` (nota en CLAUDE.md § 0; el Arquitecto lo lleva al texto de las tareas en la próxima edición agrupada). Antes de editar, busca en `tests/`, `ejecutar-cola.ps1` (en la cola) y `.github/` quién más lee `CLAUDE.md` por ruta y anótalo en el log; si algo lo parsea, no cambies lo que ese lector espera.
Reversión: `git revert <hash>` (quita `.claude/` y los tests)
Depende de: A7a **aceptado** (`ctx.js` lee `docs/claude/reglas-fijas.md`); cola v4 instalada (ya está: pasa `STR_INSTR` y `STR_LOTE`).
Precondiciones para verificar: ninguna en el navegador; archivos y tests.

## 1. Copiar, no reescribir
Los archivos están en `C:\Users\ktcol\Downloads\str-instr-cola\hooks\`: `settings.json` → `.claude/settings.json`; `guard-bash.js`, `stop-check.js`, `ctx.js` → `.claude/hooks/`; `hooks.test.js` → `tests/hooks.test.js`. No cambies su contenido. Si `tests/run.js` carga los tests por lista, añade `hooks.test.js`; si los descubre por carpeta, no lo toques.

## 2. Fixtures (sin comandos manuales con texto sensible)
Crea `tests/fixtures/hooks/reset-hard.json` con `{"tool_input":{"command":"git reset --hard"}}` y `tests/fixtures/hooks/vacio.json` con `{}`. Añade a `tests/hooks.test.js`, al final, dos pruebas de integración que ejecuten los hooks como procesos (`child_process.spawnSync('node', [ruta], { input: fs.readFileSync(fixture) })`): `guard-bash.js` con `reset-hard.json` termina con código 2 y motivo no vacío; `ctx.js` con `vacio.json` termina con 0 y su salida contiene el texto de `docs/claude/reglas-fijas.md`. Nada se ejecuta a mano ni por `echo`.

## 3. Nota en el mapa
En `docs/claude/tests-y-despliegue.md`: qué hace cada hook, cómo se apagan (`--settings` con `disableAllHooks`) y que `guard-bash.js` lee el Alcance de la instrucción por `STR_INSTR` (lo pone la cola).

## 4. Tests
`node tests/run.js` en verde con `hooks.test.js` (17 pruebas) incluido.

## 5. Pruebas derivadas (verificador crítico; sin navegador)
- a. `node tests/run.js` en verde, incluido hooks.test.js · perfil: tests/ · **Detener**
- b. `.claude/settings.json` y los tres `.js` de `.claude/hooks/` son idénticos byte a byte a los de `str-instr-cola\hooks\` · perfil: archivos · **Detener**
- c. Ningún HTML ni JS de la aplicación cambió y `?v=` sigue igual · perfil: archivos · **Detener**
- d. Primer lote siguiente: su `log\NN-*.txt` muestra al inicio las reglas fijas inyectadas por `ctx.js` («Instrucción del lote en curso:») · lo comprueba el Chat Desarrollo en el siguiente lote y lo anota en cambios[] · **Seguir**

## Cierre (lo escribe la CLI en `log\NN-hooks-cli.txt`)
Hecho / No hecho por apartado · declarados vs tocados · tests n/n · hash.
