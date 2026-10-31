# Marcos de referencia y fichas COBIT · análisis (31-oct-2026)

**Autor:** Chat Arquitecto · **Para:** Carlos («importante respetar los marcos; debe estar detallado en algún lado; ¿los procesos COBIT adoptados, dónde están, los tenemos claros?») · **Estado:** análisis con consulta abierta a los tres chats (M-1359/1360/1361); entra en LM-91 como criterio del mapa v2. **Fuentes:** `interno/cobit.json` (actualizadoEn 21-oct), `interno/proceso.json › procesosFabrica`, ADR-009, `claude/marco/plan-*.md`, «Diagramas de la fábrica STR» (25-oct), «Elección de términos» (30-oct).

## 1. La jerarquía de marcos: decidida, escrita en tres sitios, nunca junta

| Nivel | Marco | Dónde está escrito | Estado |
|---|---|---|---|
| 1 · Proyectos | PMI (cinco grupos de procesos; puertas P1–P4; Carlos patrocinador, Diseño gerente, Arquitecto PMO) | ADR-009 (13-oct; v5 17/28-oct): «el proyecto llama a los servicios de la fábrica en planificación y ejecución; el proyecto no sabe de cola ni de juez» | decidido; sin proceso formalizado («se diseña después, con un P02»); `proceso.json › proyecto` = "str" |
| 2 · Fábrica | ciclo de vida ISO/IEC/IEEE 12207 como ancla; SDLC como lenguaje | `proceso.json › procesosFabrica.marco`, `mapa-fabrica.md § Marco`, «Diagramas › Marco» (LM-74, 23-oct) | vigente: nueve procesos con plan, dueño, guardias |
| 3 · Procesos | COBIT 2019: objetivos y prácticas adoptadas por proceso | `cobit.json` (estado y «nuestra» por práctica); cabecera de cada plan; fichas `<objetivo>-<letra>` | vigente; sin niveles de capacidad; ningún validador lo lee |

Costuras: (a) ADR-009 dice «Fábrica (COBIT)» porque precede a LM-74; debe decir Proyectos (PMI) → Fábrica (12207) → prácticas COBIT. (b) En el nivel 1 compiten PMI (ADR-009) e ISO 21502 (`plan-flujo-trabajo.md` «por conocimiento»; artefacto «Elección de términos», que compara nuestro / ISO 21502 / COBIT / PRINCE2 sin PMI): lo decide Carlos. (c) No hay un lugar único que diga los tres niveles, qué entrega cada uno al de abajo y qué recibe: **propuesta** sección `marcos` en `proceso.json` (hermana de `procesosFabrica`) con página generada, y la primera figura del «Diagramas» generado sale de ahí.

## 2. Las fichas COBIT adoptadas: dónde están y qué tan claras

`cobit.json`: 40 objetivos; 7 adoptados, 8 `par` + 2 `parcial` (dos claves para lo mismo), 5 relacionados, 5 del dueño, 13 fuera. Cada ficha tiene `posicion` (cómo lo hacemos) y `practicasStr[]` con «nuestra» por práctica. **La atadura objetivo → proceso no está en el archivo**: va al revés (cada plan cita su objetivo). Cruce de las 17 fichas adoptadas o parciales con el proceso que las lleva y su último LM:

| Objetivo | Estado | Nombre | Última fecha en la ficha | Últimos LM citados | Proceso(s) que lo llevan | Último LM del proceso | Veredicto |
|---|---|---|---|---|---|---|---|
| APO01 | par | Marco de gestión de I&T | 09-28 | LM-36, LM-38 | APO01 (marco) | — | sin proceso de la fábrica que lo lleve |
| APO03 | parcial | Arquitectura empresarial | 10-15 | LM-67, LM-68 | 6 | LM-68 (21-oct) | al día |
| APO06 | par | Presupuesto y costos | 09-23 | — | — | — | sin proceso de la fábrica que lo lleve |
| APO08 | par | Relaciones | 10-09 | — | 2 | LM-90 (31-oct) | desfasada: la ficha se quedó en 10-09 y el proceso siguió hasta LM-90 |
| APO11 | par | Calidad | 09-23 | LM-38 | — | — | sin proceso de la fábrica que lo lleve |
| APO12 | ok | Riesgo | — | LM-71 | 7 | LM-72 (22-oct) | al día |
| BAI02 | ok | Definición de requisitos | — | — | 1 | LM-80 (25-oct) | desfasada: la ficha se quedó en — y el proceso siguió hasta LM-80 |
| BAI03 | par | Identificación y construcción de solucio | 09-23 | LM-40, LM-62 | 3, 4, 6 | LM-88 (31-oct), LM-89 (31-oct), LM-68 (21-oct) | desfasada: la ficha se quedó en LM-62 y el proceso siguió hasta LM-89 |
| BAI04 | par | Disponibilidad y capacidad | 09-23 | — | — | — | sin proceso de la fábrica que lo lleve |
| BAI06 | ok | Cambios de TI | — | — | 3 | LM-88 (31-oct) | desfasada: la ficha se quedó en — y el proceso siguió hasta LM-88 |
| BAI07 | ok | Aceptación y transición de cambios | — | LM-41, LM-62 | 4 | LM-89 (31-oct) | desfasada: la ficha se quedó en LM-62 y el proceso siguió hasta LM-89 |
| BAI08 | par | Conocimiento | 10-08 | — | 8 | LM-70 (22-oct) | desfasada: la ficha se quedó en 10-08 y el proceso siguió hasta LM-70 |
| BAI10 | ok | Configuración | 10-08 | LM-36 | 0 | LM-82 (26-oct) | desfasada: la ficha se quedó en LM-36 y el proceso siguió hasta LM-82 |
| BAI11 | par | Proyectos | 10-18 | LM-57, LM-66 | 2 | LM-90 (31-oct) | desfasada: la ficha se quedó en LM-66 y el proceso siguió hasta LM-90 |
| DSS02 | ok | Solicitudes de servicio e incidentes | — | LM-65 | 5 | LM-65 (21-oct) | al día |
| DSS03 | parcial | Problemas | — | LM-65 | 5 | LM-65 (21-oct) | al día |
| MEA01 | ok | Supervisión del rendimiento y la conform | — | LM-71 | 7 | LM-72 (22-oct) | al día |

Lectura: **5 al día, 8 desfasadas, 4 sin proceso de la fábrica que las lleve** (APO01, APO06, APO11, BAI04: viven en la ficha y en nadie). El caso que trajo Carlos: **BAI10** describe CLAUDE.md, `?v=`, `schema_version` y las líneas base de equipos (8-oct), y no nombra el proceso 0 (LM-60), la línea objetivo (LM-80), las guardias C1–C11/O1–O3 ni el explorador «Línea base del STR» (LM-58/82), que es su vista. Además BAI03.07 cita PRUEBAS-v1, BAI06.03 estados del modelo v1, BAI02 habla de `requerimientos-consolidado.md` (nadie lo mantiene; Diseño M-1356).

## 3. Qué entra al mapa v2 (LM-91) por esto

1. En `cobit.json`, cada objetivo adoptado o parcial lleva `proceso` (0–8 o «marco»/«proyectos»), `plan`, `guardias[]` y `vista` (dónde se ve: BAI10 → explorador de la línea base; BAI07 → veredictos y `cambios[]`; BAI11 → Oficina/«Lo que te toca»…); `par` y `parcial` se unifican; nivel de capacidad por objetivo cuando Carlos lo pida.
2. Guardia nueva (`validar.py`): objetivo adoptado sin proceso = error; proceso sin objetivo = error; LM que toca un proceso sin tocar la ficha de su objetivo = aviso (R-cobit).
3. Las fichas desfasadas se reescriben con lo que digan los chats que las viven (§ 4), no desde la memoria del Arquitecto.
4. El «Diagramas de la fábrica STR» generado pinta en la cabecera de cada proceso su ficha COBIT viva y, arriba, la jerarquía de marcos (§ 1).

## 4. Consulta a los chats (31-oct 12:5x)

A cada chat, por los objetivos que vive: por práctica, qué hace hoy de verdad, dónde queda la evidencia (archivo, guardia, log o vista), qué de la ficha ya no es cierto, y qué práctica COBIT hace que la ficha no tiene. A Diseño y al JP, además: qué marco de nivel 1 aplican de hecho (PMI de ADR-009 o ISO 21502) y qué de la capa de proyectos vive hoy (fases, puertas P1–P4, acta, línea base). Respuestas: se suman aquí en § 5.

## 5. Respuestas (pendiente)
