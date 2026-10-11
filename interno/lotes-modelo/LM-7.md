# LM-7 · Hooks de la CLI y CLAUDE.md podado (A7)

**Lote del modelo** · REQ-MOD-3, REQ-MOD-5 · ítem del plan A7 · **Categoría: crítico** · Decisión: DA-31 (Diseño, 11-oct-2026, «visto bueno a A7, partido en A7a y A7b») · Cruce con Carlos: 11-oct-2026 13:31 en el chat del Arquitecto («a7 cruzado») · Riesgo R-A · ¿Toca el modelo? Sí · Redacta: Chat Arquitecto · Construye: Agente CLI en dos lotes de la cola · Acepta: Agente verificador crítico (archivos y tests) · Reversión: `git revert` de cada lote.

| Parte | Instrucción | Qué entrega | Depende de |
|---|---|---|---|
| LM-7a | `A7a-instr-poda-claude-md.md` | `docs/claude/` (reglas-fijas + 11 mapas por área, copia literal), `CLAUDE.md` ≤ 12 000, `tests/claude-md.test.js` (conservación ≥ 98 %, duplicados listados) | — · **Aceptado** 11-oct 14:08: lote 70, commit `28ae378` (2.º intento; el 1.º paró por «¿Toca el modelo?: sí»); CLAUDE.md 7 313 car., 12 mapas, conservación 106 %, tests 79/79 |
| LM-7b | `A7b-instr-hooks-cli.md` | `.claude/settings.json`, hooks `guard-bash.js` / `stop-check.js` / `ctx.js` (copiados de `str-instr-cola\hooks\`), `tests/hooks.test.js` (15 + 2 de integración con fixtures) | LM-7a aceptado · LM-6 aceptado |

Fuente de los hooks: `herramientas/hooks-cli/` (probados aquí: 15 pruebas, `node tests/hooks.test.js`). Revisor previo (Desarrollo, M-130/M-132): A7 9/12 → partido; A7a 12/12; A7b 9/12 → corregido (quién más depende, perfil de la prueba d, dependencia de LM-6, nota sobre hooks.test.js).

## Criterios de aceptación
1. A7a: veredicto aceptado con pruebas a–d; CLAUDE.md ≤ 12 000 y conservación ≥ 98 %.
2. A7b: veredicto aceptado con pruebas a–c; prueba d anotada por Desarrollo en el lote siguiente.
3. Registro: cambios[] LM-7 con los dos hashes; tablero PT-M1 A7 en «hecho».
