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

## 5. Respuestas (M-1359 Diseño, M-1360 Desarrollo, M-1361 JP; 31-oct 13:01)

**Marco de nivel 1, de hecho: ninguno.** Diseño trabaja con el modelo propio (pedido → REQ → entrega → aceptación) bajo BAI02, sin fases ni puertas; «conozco ADR-009 (PMI) y no lo ejecuto»; «Elección de términos» no lo hizo ella: es una tabla en la que Carlos elige. El JP usa el vocabulario de FLUJO-v1 (lote, tanda, pausa, flujo continuo): «si Carlos decide PMI o 21502, lo implemento; hoy no cumplo ninguno». **De la capa de proyectos vive**: P01 en `proyectos.json`, línea de producto y objetivo como alcance, `objetivos[]` como acta informal, `reqs[].validacion` como aceptación de Carlos, `planes/prioridades/trabajo/tandas/pausas/riesgos/metas/lecciones` en `proyecto.json`. **No existe**: acta, puertas P1–P4 como eventos, línea base de proyecto (alcance + cronograma + costo), interesados, hitos que firma Carlos, cierre de proyecto; las puertas reales son de lote (DA + cruce + ok del JP) y de tanda (hasta + ficha).

**Fichas, lo que ya no es cierto (confirmado por quien las vive):**
- BAI02 (Diseño): `requerimientos-consolidado.md` no existe como práctica; «el dueño aprueba al autorizar el lote» es falso (aprueba antes: `reqs[].validacion`, Q5); BAI02.02 no es «off»: factibilidad y alternativas viven en `das[]` (49) y las lecturas de código → pasa a parcial; la sección «Supuestos» hoy es `supuestosAbiertos` + Q3. Lo que hace y la ficha no tiene: trazabilidad REQ ↔ caso de uso, método N1–N4, `palabras-vagas.json`, frontera, 29148, lectura del código con archivo y líneas, tres modos (LM-76/80), regla 17, aprobación por capacidad y módulo en la revisión de alcance. BAI10 por su lado: la ficha no nombra la línea objetivo (`linea-objetivo/`, `objetivo.py --brecha`, estados borrador → validada → construida → retirada); falta la guardia «diferencia construida ya está en la línea base» (M-1294 R8).
- BAI03/BAI06/BAI07 (Desarrollo): «la CLI construye según la instrucción» se queda corto (el código se escribe y simula al redactar; la CLI aplica literal: K1 `aplicar.js`, hashes); BAI03.07 es PRUEBAS-v2 con fases y tren, no v1; BAI03.06 «réplicas de Node» es historia (84 + 16 archivos de tests, revisor de 24 puntos, `linea-base.py --lote`); BAI06.01 «cruce del commit antes de desplegar» es falso: el cruce es antes de encolar y delegado (M-1144/1176); BAI06.03 estados del modelo v1 → hoy previsto → redactado → encolado → construido → aceptado | parcial | no aceptado (+ espera DA, pospuesto, superado, fallido); BAI07.05 no dice nada de la composición ni de la puerta de independencia; DSS02.04/.07 citan `patrones-codigo.md` (no existe) y `estado-proyecto.md § 5`. Brecha propia: «Lección» de cada instrucción vacía en L-183…L-188. Candidato a PRB: «guiones del lote que no cubren lo que cambia» (INC-216/217/218).
- BAI11/APO12/MEA01/APO06/APO11/APO01 (JP): 11.02 «ficha en estado-proyecto.md» ya no (hoy brief por buzón + fila de `trabajo[]`, sin guardia de meta y criterios); 11.04 falta tandas, pausa con excepciones, orden de la cola; 11.07 falta ficha de tanda, METRICAS, «¿cómo vamos?»; 11.09 posimplementación va en la nota de tanda; hace y no está: ok a críticos de fábrica, excepciones de pausa, composición, lista de guiones. APO12: R-14, R-7, R-16 sin respuesta probada; 12.04 sin perfil. **MEA01.02 dice «ok» con 4 metas y no debería**: MT-1…4 escritas, no acordadas (DA-62). **APO06.05 costo por lote no se anota** y nada lo vigila (el JP no tiene tokens; decidir de dónde sale el dato). **APO11.05**: las rojas repetidas MD-n cuentan, pero la acción no va a MJ-n como dice la ficha sino a `trabajo[]` clase f: corregir ficha o práctica. APO01 lo mantiene de hecho el Arquitecto; el encargo del JP está desfasado (2.3/«v2.1», 23 vs 24 puntos). Pendiente mío: `metricas.js` no cuenta composición ni parcial con evidencia.

**Decisiones que quedan para Carlos:** (1) marco de nivel 1: PMI (ADR-009) o ISO 21502, o dejar escrito que hoy la capa de proyectos es FLUJO-v1 sin fases ni puertas hasta P02; (2) APO06.05: si se quiere costo por lote, de dónde sale el dato (tokens no los ve nadie; vueltas y minutos sí); (3) MT-1…4 (DA-62) y DA-61, que sostienen MEA01 y R-7.
**Lo que hago yo con esto (LM-91):** reescribir las 8 fichas desfasadas con estas respuestas; BAI02.02 a parcial; MEA01.02 a parcial hasta DA-62; APO11.05 corregido a la práctica real (acción en `trabajo[]`); `proceso/plan/guardias/vista` por objetivo; sección `marcos`; guardia R-cobit; encargo del JP al día. **Respondido a Desarrollo (M-1362):** sí al PRB de los guiones y a llenar «Lección» al cerrar cada lote.

## 6. Existencia y documentación de cada proceso (Carlos, 31-oct 13:0x: «COBIT es un marco integrador de alcance enorme; la estructura ya la validamos; lo que falta es ver que cada proceso exista, esté documentado y, si no, validar»)

Un proceso «existe» si tiene dueño, documento vigente en el repo, LM instalado, guardias vivas, ficha COBIT al día y una vista donde se ve. Veredicto por proceso con la línea base fa31a9a más las respuestas de hoy:

| Proceso | Dueño | Documento | En el repo | Guardias | Ficha COBIT | Vista | Veredicto |
|---|---|---|---|---|---|---|---|
| **Nivel 1 · Proyectos (PMI)** | Diseño gerente · Arquitecto PMO · Carlos | ADR-009 (decisión); sin plan de proceso | sí (ADR) | ninguna (sin campos en `proyecto.json`) | BAI11 par (desfasada), APO05 off | proyectos. (P01, Portafolio) | **no existe como proceso**: hay decisión y sitio, no fases ni puertas; nadie lo aplica (M-1359, M-1361). Validar con Carlos: PMI, 21502 o «FLUJO-v1 hasta P02» |
| 0 · Configuración | Arquitecto · Diseño (objetivo) | `plan-configuracion-linea-base.md` v3 | sí | C1–C11, O1–O3 (C2, C5, O3 aviso) | BAI10 **desfasada** (LM-36) | explorador «Línea base del STR» (generado) | **existe y documentado**; ficha por reescribir; falta guardia «construida ⇒ en línea base» (R8) |
| 1 · Requisitos | Diseño | `proceso-requerimientos-diseno.md` v2 | **no** (solo proyecto de Claude) | Q1–Q8 (Q6 aviso, Q7 pendiente) | BAI02 **desfasada**; BAI02.02 mal «off» | páginas Seg. Proyecto, línea objetivo | **existe; documento fuera del repo** → traer al repo (D2 lo preveía) |
| 2 · Evaluación y control | JP | `plan-flujo-trabajo.md` v2 | sí | F1–F7 **avisos** (F2/F9 error 1-dic) | BAI11 **desfasada**, APO08 desfasada | Oficina, «Lo que te toca», ficha de tanda | **existe y documentado**; guardias aún blandas; encargo del JP desfasado |
| 3 · Implementación | Desarrollo · CLI | `plan-construccion.md` (CONSTRUCCIÓN-v1) | **no** (solo proyecto) | K1–K9 (K3 medida, K4/K6/K8 aviso) | BAI03 **desfasada**, BAI06 **desfasada** | log de la cola, `cambios[]` | **existe; documento fuera del repo; LM-63 parcial** (K5 hook, K8 CLAUDE.md pendientes) |
| 4 · Verificación y validación | Arquitecto | `plan-verificacion-aceptacion.md` (PRUEBAS-v2) | sí | V1–V10 (juez, cola, validar) | BAI07 **desfasada** (sin LM-88) | veredictos, `_resumen.txt`, regresión | **existe y documentado**; falta primera corrida real de N3 y `cuarentena.json` |
| 5 · Mantenimiento | JP · Desarrollo | `plan-incidentes-problemas.md` v2 | sí | I1–I7 (solo INC nuevos) | DSS02 al día (salvo .04/.07), DSS03 al día | Seg. Proyecto › INC | **existe y documentado** |
| 6 · Arquitectura y decisiones | Arquitecto | `plan-arquitectura.md` v2 | sí | A1–A8 **avisos** | APO03 al día | `decisiones.json`, mapa del STR | **existe y documentado**; guardias blandas; pasada de relaciones pendiente |
| 7 · Riesgos y medición | JP · Arquitecto | `plan-riesgo-medicion.md` v2 | sí | Rg1–Rg2 error; Rg3–Rg7 **avisos** | APO12 al día; MEA01.02 **mal «ok»** (DA-62) | ficha de tanda, semáforo | **existe y documentado**; metas sin acordar; `metricas.js` no cuenta composición |
| 8 · Conocimiento e información | Arquitecto | `plan-conocimiento.md` v2 | sí | Cn1–Cn6 **avisos**; Cn7–Cn8 sin guardia | BAI08 **desfasada** | páginas Base de conocimiento, Nomenclatura | **existe y documentado**; 17 fichas con revisión pendiente; archivo sin herramienta |
| Método (MJ-17) | Arquitecto | `metodo-formalizacion-fabrica.md` | **no** (solo proyecto; orden viejo) | — | APO01 par (sin proceso) | «Diagramas», «Procesos de la fábrica» (a mano, 25-oct) | **documento fuera del repo y desactualizado**; las vistas no se generan |
| Objetivos sin proceso | — | — | — | — | APO01, APO06, APO11, BAI04 | — | **validar con Carlos**: a qué proceso van (APO01 → método; APO06.05 → 2 o se retira; APO11.05 → 7 con las MD-n; BAI04 → espera operación real) |

Resumen: los nueve procesos de la fábrica **existen**; dos tienen su documento fuera del repo (1 y 3) y el método también; cinco tienen guardias en modo aviso; ocho fichas COBIT desfasadas y una marcada «ok» sin serlo; el nivel 1 no existe como proceso. Nada de esto requiere inventar: es traer documentos, reescribir fichas con lo que dijeron los chats, endurecer guardias cuando toque, y una decisión de Carlos sobre el nivel 1 y los cuatro objetivos sueltos.

## 7. Decisión de Carlos sobre el nivel 1 (31-oct 13:1x)

**PMI se mantiene** como marco del nivel 1 (ADR-009): los proyectos se enmarcan en los cinco grupos de procesos del PMI (inicio, planificación, ejecución, monitoreo y control, cierre). Que hoy ni Diseño ni el JP lo apliquen no es una contradicción sino el estado esperado: la capa de proyectos se definió hace poco (el modelo «siguió subiendo de nivel») y **casi todo en ella está por definir**. Consecuencias para el modelo: (a) la sección `marcos` dice nivel 1 = PMI, estado «definido, por formalizar», con sus cinco grupos como estructura y P1–P4 como puertas previstas; (b) ISO 21502 queda como referencia de vocabulario (artefacto «Elección de términos», elige Carlos) y no como marco; (c) ADR-009 se corrige solo en la frase «Fábrica (COBIT)» → «Fábrica (ciclo de vida 12207, gobernada con COBIT)»; (d) ninguna guardia exige todavía fases ni puertas de proyecto: se escribirán cuando el proceso del nivel 1 se formalice (con el método MJ-17, P02 como prueba). Siguen abiertas las decisiones 2 (APO06.05) y 3 (DA-61/62).
