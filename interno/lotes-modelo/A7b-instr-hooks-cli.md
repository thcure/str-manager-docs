# instr — REQ-MOD-3 / A7b: hooks de la CLI (PreToolUse, Stop, SessionStart)
Categoría: **crítico** (cambia cómo trabaja la CLI en todos los lotes siguientes; DA-31 · cruce previo con Carlos: <fecha hora, en el chat del Arquitecto>; lote del modelo LM-7b; lo redacta el Arquitecto)
Alcance: `.claude/settings.json` · `.claude/hooks/guard-bash.js` · `.claude/hooks/stop-check.js` · `.claude/hooks/ctx.js` · `tests/hooks.test.js` · `tests/fixtures/hooks/` (carpeta nueva) · `tests/run.js` (solo si registra tests por lista) · `docs/claude/tests-y-despliegue.md` (una nota sobre los hooks) · **sin cambio de `?v=`** · `schema_version` igual · sin cambios de base de datos ni de datos
Impacto: tres reglas pasan de «escritas» a «automáticas»: no hay commit con archivos fuera del Alcance sin declararlo, ni sin actualizar el mapa del área, ni con tests rojos; la CLI no termina con cambios sin commit; tras cada compactación recupera las reglas fijas y la ruta de la instrucción.
Riesgo: medio (R-A). Un hook mal escrito bloquearía todos los commits. Mitigación: los scripts vienen probados (15 pruebas) y se copian tal cual desde la cola; si un hook falla por entorno, `--settings` con `{"disableAllHooks": true}` los apaga sin tocar el repo.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: sí: es un lote del modelo (LM-7); la CLI lo ejecuta porque los archivos viven en `str-manager`
Origen: PT-M1 ítem A7; situaciones G-8, G-9, G-16, G-17, G-25, G-29, G-35. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-3. Decisión: DA-31 + LM-7 en `interno/lotes-modelo/LM-7.md` + cruce de Carlos.
¿Quién más depende de lo que cambia?: (1) `ejecutar-cola.ps1` v4 (LM-6) pone `STR_INSTR` y `STR_LOTE`; `guard-bash.js` y `ctx.js` los leen; si faltan, `guard-bash.js` no comprueba Alcance (solo destructivos, mapa y tests) y `ctx.js` imprime solo las reglas fijas. (2) Sesiones de la CLI fuera de la cola (interactivas de Carlos, o el verificador si alguna vez abriera la CLI): los hooks corren igual: PreToolUse bloquea destructivos y commits sin mapa o con tests rojos; Stop exige tests verdes y sin cambios pendientes (si una sesión interactiva quiere salir con cambios, hace commit, stash, o pasa `--settings` con `{"disableAllHooks": true}`). (3) `ctx.js` lee `docs/claude/reglas-fijas.md` (A7a). (4) El Agente verificador: «CLAUDE.md actualizado» = CLAUDE.md o mapa del área (nota de A7a). Antes de editar, busca en `tests/`, `.github/` y la cola quién más lee `.claude/` o `CLAUDE.md` y anótalo en el log.
Reversión: `git revert <hash>` (quita `.claude/` y los tests)
Depende de: A7a **aceptado** (`ctx.js` lee `docs/claude/reglas-fijas.md`) y LM-6 **aceptado** (cola v4: lo acepta el log de A7a sin error de flags).
Precondiciones para verificar: ninguna en el navegador; archivos y tests.

## 1. Copiar, no reescribir
Los archivos están en `C:\Users\ktcol\Downloads\str-instr-cola\hooks\`: `settings.json` → `.claude/settings.json`; `guard-bash.js`, `stop-check.js`, `ctx.js` → `.claude/hooks/`; `hooks.test.js` → `tests/hooks.test.js`. `settings.json` y los tres `.js` van tal cual, sin cambios; `hooks.test.js` solo se amplía en el punto 2. Si `tests/run.js` carga los tests por lista, añade `hooks.test.js`; si los descubre por carpeta, no lo toques.

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
- d. Primer lote siguiente: su `log\NN-*.txt` muestra al inicio las reglas fijas inyectadas por `ctx.js` («Instrucción del lote en curso:») · perfil: log de la cola · lo comprueba el Chat Desarrollo en el siguiente lote y lo anota en cambios[] · **Seguir**

## Cierre (lo escribe la CLI en `log\NN-hooks-cli.txt`)
Hecho / No hecho por apartado · declarados vs tocados · tests n/n · hash.
