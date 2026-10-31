# El modelo entero de la fábrica STR · línea base `fa31a9a` (30-oct-2026 19:07, antes del mapa de procesos)

**Autor:** Chat Arquitecto · **Fecha:** 31-oct-2026 · **Para:** Carlos, antes de ejecutar la vuelta atrás del mapa de procesos (LM-91) · **Fuente:** lectura completa del repo en el commit `fa31a9a` (copia de solo lectura) más los cuatro documentos que el modelo cita y viven solo en el proyecto de Claude. Nada inventado: cada fila dice de dónde sale. **Qué es:** la foto del modelo que existía cuando nació `mapa-procesos.json` (commit siguiente, `124715e`, 19:15); es el punto de retorno declarado.

## 0. En una frase

La fábrica ya tenía **nueve procesos formalizados con nombre ISO/IEC/IEEE 12207, cada uno con su plan, su LM, su dueño, sus guardias y sus prácticas COBIT**; un **camino del lote** (PROC-lote-v2) con fases BAI02 / BAI03 / BAI07 y un supervisor MEA01; una **nomenclatura** que nombra entidades, identificadores y fichas por objetivo COBIT; `cobit.json` con 40 objetivos y su estado; y un manual de cambios (`proceso-cambios.md`). Lo que **no** tenía: un circuito único con disparador, entradas, salidas y retorno por nodo (MJ-26 lo pidió), cuatro planes citados que no están en el repo, guardias de cinco procesos todavía en modo aviso y 22 brechas escritas en sus propias fuentes (§ 7). El mapa que construí no heredó de esto; por eso vuelve atrás.

## 1. Los nueve procesos (`interno/proceso.json › procesosFabrica`, LM-74)

Marco declarado: ISO/IEC/IEEE 12207:2017 como ancla, SDLC como lenguaje común, COBIT 2019 como gobierno. Manual: `claude/gobierno/proceso-cambios.md`.

| N | Nombre 12207 (cláusulas) | Plan que lo formaliza | LM | Dueño | Guardias (id · modo) | COBIT |
|---|---|---|---|---|---|---|
| 0 | Gestión de la configuración (6.3.5) · línea de producto y línea objetivo | `plan-configuracion-linea-base.md` v3 | LM-60, LM-80 | Arquitecto (producto) · Diseño (objetivo) | C1, C3, C7–C11 error; **C2 aviso→error; C5 aviso**; O1, O2 error; **O3 aviso** | BAI10.01–.05 (ok) |
| 1 | Definición de requisitos (6.4.2, 6.4.3) | `proceso-requerimientos-diseno.md` v2 (**solo en el proyecto de Claude**) + encargo rol-diseno 4.3 | LM-61, 76, 80 | Diseño | Q1–Q5, Q8 error; **Q6 aviso; Q7 métrica pendiente (JP)** | BAI02 (ok) |
| 2 | Evaluación y control del proyecto (6.3.2) · flujo | `plan-flujo-trabajo.md` v2 | LM-66, 72 | Jefe de proyecto | **F1–F7 avisos** («el primer mes»); F2 y F9 error desde 1-dic | BAI11.04/.07 parcial, .09; APO08.01 |
| 3 | Implementación e integración (6.4.7, 6.4.8) | `plan-construccion.md` (**solo en el proyecto**) | LM-63, 64, 72, 73, 77, 78 | Desarrollo y CLI | K1–K2 en pw; K9 error; **K3 medida; K4/K6/K8 aviso** | BAI03.03/.05/.06; BAI06.01–.04 |
| 4 | Verificación y validación (6.4.9, 6.4.11) · PRUEBAS-v2 | `plan-verificacion-aceptacion.md` | LM-62, 68, 71, 73, 78 | Arquitecto (desde 21-oct) | V5, V6 error; V3 (`--lote`); V1, V2, V7, V10 en pw/cola; V8 ficha; V9 humo | BAI03.07/.08; BAI07.03–.05 |
| 5 | Mantenimiento (6.4.13) · incidentes, solicitudes, problemas | `plan-incidentes-problemas.md` v2 | LM-65 | JP (decide) · Desarrollo (registra y arregla) | I1–I7 error **solo para INC nuevos** (desde 22-oct) | DSS02 ok; DSS03 parcial |
| 6 | Definición de arquitectura y decisiones (6.4.4, 6.3.3) | `plan-arquitectura.md` v2 | LM-67, 68 | Arquitecto | **A1/A2/A4/A5/A7/A8 avisos**; A6 en áreas sensibles; A3 manual | APO03.02/.05; BAI03.01–.02; APO04.06 |
| 7 | Gestión de riesgos y medición (6.3.4, 6.3.7) | `plan-riesgo-medicion.md` v2 | LM-71, 72 | JP (registro, metas) · Arquitecto (medidas) | Rg1, Rg2 error; **Rg3–Rg7 avisos hasta 30-nov**; Rg8 manual | APO12.02/.03/.06 ok, .04 parcial; MEA01.01–.05 |
| 8 | Gestión del conocimiento e información (6.2.6, 6.3.6) | `plan-conocimiento.md` v2 | LM-69, 70 | Arquitecto | **Cn1–Cn6 avisos**; Cn2 error desde 1-dic; Cn7–Cn8 sin guardia | BAI08.01–.04; APO14 |

Otros controles con guardia: mapa del STR M1/M2/M6/M7 error y M3/M4/M5 aviso; P1 forma de `proyectos.json`; R1–R9 del modelo de datos.

## 2. El camino del lote (tres fuentes que debían ser una)

- **PROC-lote-v2** (`proceso.json › lote.estados`; estados en `esquema.json › estados.lote`): previsto → espera DA → redactado → encolado (3 min) → construyendo (45 min sin log) → fallido (15) / construido (15) → verificando (15 desde `verificar.json`) → parcial (240) / aceptado / no aceptado (240) / revertido → superado / pospuesto. Fases COBIT en el propio JSON: previsto…fallido, construido, superado = **BAI03**; verificando…revertido = **BAI07**; pospuesto = APO. REQ: borrador → definido → aprobado → entregado = **BAI02**; construido = BAI03; aceptado, cerrado = BAI07. Lote del modelo: registrado → cruzado (APO01) → instalado → probado → publicado → aceptado/vigente/parcial → cerrado (BAI07).
- **Supervisor** (`proceso.json › supervisor`): «MEA01 · despertador»; plazos RecMin 30, RecCada 60, EscCada 120, FallaCada 60, VerifMin 15, VerifCada 60; métricas construido→aceptado (mediana ≤ 20 min; > 1 veredicto ≤ 15 %), espera del dueño, bloqueados.
- **Nomenclatura** (`herramientas/paginas/nomenclatura-modelo.html` § 4, todavía PROC-lote-**v1**): BAI02 Definir {definido, entregado} · BAI03 Construir {redactado, encolado, construyendo, construido, fallido} · BAI07 Verificar y aceptar {verificando 25 min, con veredicto, aceptado, bloqueado, no aceptado, pospuesto}. Fichas `<objetivo COBIT>-<letra>` (APO01.03-b, BAI07.05-v…): 19 en `conocimiento.json › fichas`.
- **`marco-trabajo.json`** (v1, 13-oct): 11 pasos 0a–10 por práctica COBIT (BAI02.01, BAI02.04, BAI08.02, BAI06.01/.02, BAI03.03/.08, BAI06.03, BAI07.03/.05/.06, DSS02.02, BAI08.03, BAI07.07, MEA01.04) con actores Carlos / Claude / CLI.

## 3. Roles y encargos (`interno/instrucciones.json`)

| Rol | Versión | Escribe | Cita |
|---|---|---|---|
| reglas-comunes | 17 reglas (11-oct…LM-80) | — | la 16 nombra los nueve procesos |
| rol-arquitecto | 3.2 (21-oct) | instrucciones, proceso, conocimiento, marco-trabajo, elementos, destinatarios, cobit, lotes-modelo, herramientas, proceso-cambios › APO01, claude/marco | dueño del proceso 4; línea objetivo «construida» |
| rol-desarrollo | 2.4 (21-oct) | seguimiento.json (plan, incs, dts, problemas, cambios, traspaso), cola | PROC-lote, LM-1 § 3, A6, A8, I7, F4 |
| rol-diseno | 4.3 (25-oct) | diseno.json, requerimientos-*.md, linea-objetivo/<MOD>.json | proceso 1 (29148), LM-76/80, ubicar.py, objetivo.py |
| rol-jefe-proyecto | 2.3 (21-oct) | proyecto.json (trabajo, tandas, pausas, planes, riesgos, metas, lecciones, traspaso) | FLUJO-v1 F1–F9, RIESGO-v1 |
| rol-verificador | 11-oct | solo `log\L-n-veredicto*.json` | juez local desde LM-19 |
| rol-agente-cli | 11-oct | código del STR | BAI03, BAI06, BAI07, BAI10 |

Roles formales además en `elementos.json › roles` (19 siglas) y `sombreros` (6), y `esquema.json › roles` (7 nombres).

## 4. Marcos y normas adoptados (y a qué nivel se declara)

| Marco | Dónde se adopta | Nivel declarado |
|---|---|---|
| **COBIT 2019** | `cobit.json` (40 objetivos; `practicasStr[]` por práctica) | por estado: **ok 7** (APO12, BAI02, BAI06, BAI07, BAI10, DSS02, MEA01) · **par 8** (APO01, APO06, APO08, APO11, BAI03, BAI04, BAI08, BAI11) · **parcial 2** (APO03, DSS03; clave distinta a `par`) · **rel 5** (APO09, APO14, DSS04, DSS05, MEA03) · **own 5** (EDM01–05) · **off 13**. Sin niveles de capacidad. Ningún validador lo lee: solo `paquete.py` → página Cobit |
| ISO/IEC/IEEE 12207:2017 | `procesosFabrica.marco`, `proceso-cambios.md § 1`, LM-74 | ancla; `construccion.normas` aún cita 12207:**2008** |
| ISO/IEC/IEEE 29148 | proceso 1 | texto completo (2011) |
| ISO/IEC/IEEE 29119-1…5 | proceso 4 (`proceso.json › pruebas.normas`) | partes 2, 3, 5 texto completo |
| ISO 10007:2017 Anexo A | proceso 0 | citado |
| ISO/IEC 20000-1:2018 § 8.6 | proceso 5 | «por conocimiento» |
| ISO 21502, Kanban, Little, Reinertsen, DORA | proceso 2 | «por conocimiento» |
| ISO/IEC/IEEE 42010, ADR, C4 | proceso 6 | «por conocimiento» |
| ISO 31000, ISO/IEC/IEEE 15939, DORA | proceso 7 | «por conocimiento» |
| ISO 30401, Diátaxis, SECI, ADR-010 | proceso 8 | «por conocimiento»; Diátaxis en `esquema.conocimiento.piezas.tipos` |
| ITIL (tipos de cambio, prioridad), SRE postmortems | `esquema.categorias`, plan 5 | citado |
| **PMI/PMBOK** | solo campo `pmi` en `elementos.json` | **sin plan que lo adopte** (la capa de proyectos quedó para después: ADR-008/009) |

## 5. Artefactos y vistas

| Nombre | Qué muestra | Fuente | Dónde se cita |
|---|---|---|---|
| «Diagramas de la fábrica STR» | marco SDLC × 12207 (cubierto / parcial / fuera / falta), macroproceso, vistas A y B | generador del Arquitecto desde `claude/marco/` | PZ-39, `proceso-cambios.md § 1`, regla 16, `mapa-fabrica.md` |
| «Procesos de la fábrica STR» | estado vivo de los 9 procesos (v24) | manual | PZ-37, encargo rol-arquitecto |
| Explorador «Línea base del STR» + mapa gráfico | sistema, módulos, CU, cobertura, trinquetes | `linea-base-pagina.py`, `mapa.py`, flujo de GitHub | PZ-36, LM-82 |
| Oficina STR · Oficina 3D · «La Fábrica STR · 3D» | agentes, lotes en línea, buzón, INC, «cielo COBIT» | `estado-fabrica.py` (manual) | `oficina-fabrica-3d.md`; `elementos.json` estado **parcial** |
| «Plan de sitios LM-79» | fases 0–6 | db del artefacto | `LM-79.md` |
| «Inventario», «Árbol», «Circuito del universo» | inventario 0.1 y dibujos | — | `plan-universo-2026-10.md` |
| Páginas Marco de trabajo, Instrucciones, Cobit, Elementos, Base de conocimiento, Nomenclatura, Seg. Proyecto | vistas de los JSON | servicio del modelo (`paquete.py`, `sync.py`) | `elementos.json` |
| Panel STR | jornada, «esperan de ti» | `estado-vivo.json` | ficha APO01.10-j |
| Tablero COBIT, Modelo de Operación, Plan de trabajo STR | — | — | `elementos.json` **superado** |

## 6. Relaciones (archivo → quién lo consume)

`proceso.json` → despertador (plazos), `ubicar.py`, encargos, tablero · `esquema.json` → `validar.py`, `ficha-semanal.py`, `linea-base.py` · `cobit.json` → **solo** `paquete.py` → página Cobit · `conocimiento.json` → `conocimiento.py`, `catalogo_md.py`, `ficha-semanal.py` · `marco-trabajo.json`, `elementos.json`, `proyectos.json`, `proyecto.json` → `paquete.py` → servicio · `mapa-modulos.json` → `mapa.py` → `mapa-str.html`, instrucción y regresión · `linea-base/` + `linea-objetivo/` → `linea-base.py`, `objetivo.py`, `linea-base-pagina.py` · `mensajes.json` + `destinatarios.json` → despertador, `buzon.py`, `archivar.py` · `seguimiento.json` / `diseno.json` / `proyecto.json` → `validar.py`, `ficha-semanal.py`, `estado-fabrica.py`, `sync.py` → servicio · `METRICAS.json` (LENOVO) → repo por staging (Rg8) · `instrucciones.json` → chats; `hooks-cli/ctx.js` → `reglas-fijas.md` → CLI.

## 7. Brechas pendientes en la línea base (escritas en sus propias fuentes)

1. **No existe un circuito único** con disparador / entradas / salidas / retorno por nodo: el camino vive repartido en `proceso.json` (lote), nueve planes, la nomenclatura y los encargos (`mejoras.json › MJ-26`: «elementos.json 15 piezas atrás, marco-trabajo.json describe septiembre, los criterios de entrada y salida están en nueve planes y no en un mapa, 128 documentos viven solo en el proyecto de Claude»). — Arquitecto. *Es la brecha que MJ-26 quiso cerrar y que el mapa v1 no cerró bien.*
2. `universo-modelo.md › Preguntas abiertas`: ¿`elementos.json` evoluciona al Universo o nace un registro nuevo? — Carlos (resuelto de hecho por LM-83: nació `universo.json`).
3. **Cuatro documentos citados como vigentes no están en el repo**: `proceso-requerimientos-diseno.md`, `plan-construccion.md`, `metodo-formalizacion-fabrica.md`, `comandos-usuario.md` (solo en el proyecto de Claude). — Arquitecto.
4. `mejoras.json › MJ-17` sigue «en curso» con `porProbar` 0–8 (prueba d de Desarrollo con la cola; primer REQ con plantilla; primer tren tras la pausa; un mes de tamaños K3; primer INC desde producción; triage de los 16 REQ con Carlos; LM-68 y pasada de relaciones; lote estándar de docs y primer archivo del buzón; DA-62 y metas al 30-nov). — Arquitecto; DA-61/62 Carlos.
5. `MJ-17.puntoDePausa.pendientesArquitecto`: vista hoy · objetivo · brecha en el explorador; archivo del buzón; pasada de relaciones (10 por tanda); METRICAS por staging; texto de la notificación v11.5; hook ctx.js con rutas con punto. — Arquitecto.
6. **Guardias en modo aviso** en cinco procesos: F1–F7 (flujo), A1/A2/A4/A5/A7/A8 (arquitectura), Cn1–Cn6 (conocimiento), Rg3–Rg7 (riesgo), C2/C5, Q6/Q7, K3/K4/K6/K8, M3/M4/M5. — Arquitecto (umbrales del semáforo «LM aparte»).
7. `proceso.json › construccion.estado`: «LM-63 parcial… K5 y CLAUDE.md por la cola tras la pausa; K7 en ficha-semanal.py»; vuelta atrás K6 «aviso del despertador pendiente». — Desarrollo/Arquitecto.
8. `proceso.json › pruebas.implantacion`: «falta la primera corrida real» del juez N3; «prueba real: primer tren tras la pausa»; `cuarentena.json` no instalado. — Arquitecto/Desarrollo.
9. `mapaStr.reglas`: anotar `cubre` en los 146 casos existentes (cobertura por relación = 0 hasta entonces); A3 relaciones por precisar (76/112). — Desarrollo/Arquitecto.
10. `riesgo.pruebasReales`: DA con Carlos (R-6/R-7), primera ficha `--anterior`, primera probabilidad movida por INC, primera meta al 30-nov; Rg8 por staging; MJ-8 «METRICAS.json no llega al repo». — Arquitecto; DA-62.
11. **COBIT con práctica faltante**: APO01.04/.05 «en definición (REQ-SP5)»; APO06.02 «planes de suscripción pendiente»; APO12.04 «sin perfil agregado»; APO14.10 «importador y ensayo de restauración»; BAI07.04 «cuenta de pruebas pendiente»; BAI11.04/.07 «sin cronograma / avisos el primer mes»; DSS03.01–.04 parcial, .05 off; APO03 «RT-19 y RT-25 sin prueba automática»; APO08 solo .01; APO11 solo .05; BAI04 «al arrancar la operación real»; BAI08.04 sin guardia de retiro; BAI11.02/.09 sin fichas de PT; 13 objetivos `off` y EDM `own` por decisión. — Carlos/Arquitecto.
12. `conocimiento.json › fichas[].revisionPendiente` en 17 de 19 fichas («contrastar con el plan del paso n de MJ-17»). — Arquitecto.
13. `mejoras.json`: 5 propuestas desde el marco sin decisión (MJ-18 validación con usuarios 6.4.11; MJ-19 ventana de despliegue 6.4.10; MJ-20 revisión de código en críticos 7.2.4; MJ-21 diseño detallado 6.4.5; MJ-22 retención y disposición 6.4.14); 7 en curso; 4 decididas sin ejecutar (MJ-3, 5, 10, 12); 3 pospuestas; MJ-26 sin estado. — Carlos decide 18–22.
14. Oficina y Fábrica 3D «parcial; pasa a proyectos. tras LM-79»; actualización manual. — resuelto en parte por L-184 (Oficina viva); el 3D sigue manual.
15. `plan-configuracion-linea-base.md`: A.6 «hoy · objetivo · brecha (después)»; A.3 el corte mensual no es disparador (INC-175/176/177); A.7 auditoría física antes de «verificado» (carpeta `auditorias/` vacía); `linea-objetivo/` vacía pese a PZ-40 y LM-82. — Diseño/Arquitecto.
16. `plan-flujo-trabajo.md § 8.5`: triage de los 18 entregados con Carlos antes de levantar la pausa (M-858). — Diseño/Carlos.
17. `plan-arquitectura.md`: LM-68 (spec de ráfaga) y pasada de relaciones; DT-49 como DA de Carlos (DA-61 abierta). — Carlos.
18. `LM-79.md`: fase 6 (la cola construye solo en str-manager; clave de Firebase por host; ok formal de 5.4); fuera: D2, D5, D6, dominio propio. — Carlos/Arquitecto.
19. `nomenclatura-modelo.html § 6` destinos v2 no ejecutados: instrucciones.json → encargos.json + procedimientos.json; elementos.json → vista generada; marco-trabajo.json y situaciones → lecciones con `aplicadaEn`; mensajes.json → archivo mensual. — Arquitecto.
20. `mapa-fabrica.md`: «vista 0 solamente»; inicio, planeación, cierre, beneficios, multiproyecto y arquitectura de la fábrica quedan en la **capa de proyectos** (ADR-008 F1–F4, ADR-009). — pendiente de esa capa.
21. `esquema.conocimiento.archivo`: INC cerrados y lotes aceptados > 60 días → archivo (sin herramienta). — Arquitecto.
22. rol-diseno: retirar `planes[]` y `prioridades[]` de diseno.json tras L-151; `REQ_legado` aviso hasta el renombre B3. — Diseño/Arquitecto.

## 8. Contradicciones entre fuentes (lo que el mapa v2 tiene que resolver, no repetir)

- **Estados del lote, cuatro vocabularios:** `esquema.estados.lote` (15, con `desplegado`), `proceso.json › lote` (14), nomenclatura § 4 (PROC-lote-v1 con `con veredicto` y `bloqueado`, verificando 25 min), rol-desarrollo punto 2 (`en redacción → encolado → desplegado → parcial`), `marco-trabajo.json` (10 pasos sin estados).
- **Estados del REQ:** `esquema.estados.requisito` vs rol-diseno punto 2 (`en definición → espera DA → listo → entregado`) vs `proceso-cambios.md § 2` («REQ listo»).
- **Supervisor desactualizado:** `proceso.json › supervisor` dice «vigilar-buzon.ps1 v10.3… plazos en constantes» (el script v11.5 lee `proceso.json` desde v11); `roles.verificador` «tareas de Cowork» vs juez local; `redactado.senal` «20/20» vs revisor de 23.
- **cobit.json:** `par` y `parcial` conviven; BAI03.07 cita PRUEBAS-v1; BAI03.08 severidades distintas a `esquema.incidente.severidad`; BAI06.03 estados del modelo v1.
- **Mediana construido→aceptado:** 12 min (`pruebas.metricas`) vs 18 min (`plan-flujo-trabajo.md § 3`, `plan-construccion.md § 3`).
- **12207:** 2017 vs 2008 según el archivo; los títulos de tres planes no llevan el nombre 12207 (LM-74 decía aplicarlo a todos).
- **Roles:** `sombreros.chat-desarrollo` incluye JP y AN; `conocimiento.json › mapa` «Diseño = Analista + Jefe de proyecto» (superado por LM-57); fichas BAI11-d/p con dueño viejo; nomenclatura «R riesgo · Arquitecto» vs RIESGO-v1 (escribe el JP).
- **ins-proyecto** se dice copia de referencia pero omite rol-jefe-proyecto y reglas-comunes.
- **marco-trabajo.json paso 7** («con la sesión admin de Carlos») contradice la regla 9 y `verificando.guardas`.
- **metodo-formalizacion-fabrica.md** (solo en el proyecto) conserva el orden viejo y «Por hacer» en 2–8; PZ-18 lo lista como vigente.
- **Numeración doble** paso n de MJ-17 ↔ proceso N (`procesosFabrica.pasoMJ17`).
- **Duplicidad de fuente:** límites de flujo en `proceso.json` y `esquema.json`; controles K/I/F/A/Rg en proceso.json, esquema.json y planes; `conocimiento.json › cobit` repite `cobit.json`.
- Carpeta `str-manager-docs/` anidada marcada histórica pero aún citada como «repo».

## 9. Lo que MJ-26 sí dejó y se conserva (hallazgos y lecciones)

**Se conserva (no depende del mapa):**
- `interno/universo.json` (289 piezas con dimensiones y gobierno, capa y rama del árbol), `universo.py` con U1–U7, páginas generadas `universo.html` y `arbol-universo.html`, y los dos sitios que las muestran (L-183, L-184, L-186). Carlos lo está revisando (f7-1).
- `interno/vencimientos.json` (V-1…V-8) con guardia U7: Premium y bucaramangastays.com vencen el **3-nov**; tokens de tres chats el **9-nov**.
- `claude/gobierno/revision-accesos-2026-10.md` (19 identidades: bajas, rotaciones, restricciones, aclaraciones) y `claude/marco/d2-particion-repos-guion.md` (D2 con vuelta atrás).
- Reglas 18 (cierre Hecho/Fallo/Bloqueado) y 20 (buzón vivo, LM-90), `lo-que-me-toca.py`, despertador v12, Oficina desde el dato.
- **Las respuestas de los tres chats a la consulta F0** (M-1294 Diseño, M-1295 JP, M-1296 Desarrollo) y los **22 pasos de la instrucción** aportados por Desarrollo (F3.3.0–F3.3.21): son material de primera mano para el mapa v2; no se pierden, se guardan con el borrador.
- LM-88 (tres caminos de aceptación; ids de lote enteros) y LM-89 (pw 0.15.2) nacidos de los lotes de los sitios.

**Hallazgos útiles para corregir:**
- U1: **118 piezas vigentes sin control escrito**, casi todas identidades sin revisión de accesos → la revisión de accesos y los vencimientos salieron de ahí.
- Dos piezas del universo tenían nombres de personas y asuntos ajenos (lo detectó Desarrollo): renombradas; regla de datos reales reforzada.
- El inventario confirmó la brecha 3: cuatro documentos del modelo viven solo en el proyecto de Claude.
- Los lotes de los sitios mostraron que el juez reprueba por guiones que recorren partes cambiadas (INC-216/217/218) y que `reprobar\` tiene una puerta de independencia que bloquea la reprueba legítima → LM-88 y deuda del juez.
- `METRICAS.json` solo se regeneraba a mano: ahora tiene disparador escrito (cierre de tanda → Arquitecto).

**Lecciones de método (las que motivan la vuelta atrás):**
1. **Inventariar antes de construir.** El Arquitecto construyó el mapa sin leer la nomenclatura, `cobit.json`, `proceso.json` ni `marco-trabajo.json` como fuentes; Carlos lo había pedido («revisa los elementos del Arquitecto, docs, artefactos»). Regla para el encargo: ninguna pieza nueva sin citar de qué existente hereda; si duplica, no nace.
2. **Punto de retorno antes del primer cambio** (BAI10 línea base, BAI06 vuelta atrás escrita): el guion de D2 lo tenía; LM-79 fase 5 y MJ-26 no. Desde LM-90 todo LM lleva § 0 «Vuelta atrás».
3. **La herencia va en una dirección:** f3-4 decía «la nomenclatura toma del mapa el camino del lote»; es al revés: el mapa hereda de la nomenclatura y de `cobit.json`.
4. **Un dato, una fuente:** el mapa v1 creó un quinto vocabulario de estados en vez de unificar los cuatro de § 8.
5. **Un plan por tema:** la fase 7 mezcló pendientes ajenos al universo (Carlos: «estás mezclando cosas»); salieron a su casa.
6. **Hora real siempre:** varias bitácoras llevaron horas futuras; ahora R-hora lo vigila en el buzón y la misma disciplina aplica a los `.md`.
7. **El buzón no puede ser privado:** nadie veía el plan completo ni declaraba quietud (LM-90).

## 10. Qué toca la vuelta atrás (para que no haya sorpresas)

| Pieza | Qué pasa |
|---|---|
| `interno/mapa-procesos.json`, `herramientas/modelo/procesos.py`, `herramientas/paginas/mapa-procesos.html`, artefacto «Mapa de procesos» | se mueven/marcan **borrador superado** (`interno/respaldos/MJ-26-mapa-borrador/`); la página servida muestra «Borrador superado · en reconstrucción» |
| `esquema.json › mapaProcesos`, `validar.py` (P1–P5), `paquete.py` (`fabrica/mapa-procesos`) | se retiran |
| `universo-modelo.md` (§ circuito), regla 19 («el circuito es mapa-procesos.json») | vuelven a decir: circuito vigente = `proceso.json` (PROC-lote-v2, F0–F8) + nomenclatura + `marco-trabajo.json` hasta el mapa v2 |
| **Encargos LM-87**: rol-desarrollo 2.5 cita F3.1–F3.8 y F3.3.0–21 del mapa; rol-jefe-proyecto 2.4 cita F2/F7; rol-arquitecto 3.3 | se reescriben citando `proceso.json` y la nomenclatura (lo demás de LM-87 —24 puntos, cola + juez, reglas 18/19— se queda) |
| Piezas del universo `json-mapa-procesos`, `modelo-procesos-py`, `art-mapa-procesos` | estado `superado` con motivo |
| Plan del universo f3-1…f3-5 | «revertidos» con motivo; nace **f3-bis «Mapa v2: hereda, no inventa»** |
| Lo que **no** se toca | universo.json, árbol, U1–U7, vencimientos, accesos, D2, reglas 18 y 20, LM-88/89/90, sitios |

**Referencia de forma del mapa v2 (Carlos, 31-oct 12:3x):** el artefacto «Diagramas de la fábrica STR» (25-oct, PZ-39) **es** el modelo organizativo: marco (SDLC × 12207 como ancla; COBIT como gobierno, recogiendo lo ya adoptado) → macroproceso → nueve procesos con nombre de norma, dueño y plan → por proceso vista A (por dónde cambia cada cosa y qué guardia lo frena) y vista B (quién hace qué y en qué orden) → tabla de guardias. El ejercicio correcto del universo era continuar esas capas hacia abajo (procedimientos y pasos debajo de la vista B) y hacia los lados (las piezas del universo colgando de cada guardia y carril), no levantar otra jerarquía al lado. El v2 es ese artefacto **generado desde el modelo** (`proceso.json`, `cobit.json`, `esquema.json`, nomenclatura, `universo.json`), con un nivel más abajo y una guardia que lo mantenga al día; el explorador de la línea base (`linea-base-pagina.py` + flujo de GitHub) es el patrón ya probado. El artefacto del 25-oct es hoy la única copia (su generador no sobrevivió) y no recoge LM-85/87/88/90.

**Mapa v2 (f3-bis), criterios de salida:** cada etapa cita práctica COBIT de `cobit.json` y nombre 12207/PMI; el camino del lote es el de la nomenclatura (actualizada a PROC-lote-v2, un solo vocabulario de estados que `esquema.json`, `proceso.json`, encargos y nomenclatura compartan); guardia que no deja etapa sin práctica ni práctica «adoptada» sin etapa; `marcos.json` (o sección en `cobit.json`) con qué adoptamos y a qué nivel por marco; las 22 brechas de § 7 quedan asignadas (a un paso, a una DA de Carlos o a «se deja así, con motivo»).

## 11. Aportes de los chats (M-1356 Diseño, M-1357 Desarrollo, M-1358 JP; 31-oct 12:18)

Los tres están de acuerdo con devolver el mapa y reconstruirlo desde la nomenclatura, `cobit.json` y `proceso.json`. Lo que suman:

**Conservar (coinciden los tres):** el inventario con la regla 19 / guardia U5 (a cada uno le mostró duplicados o piezas que no veía); la regla 18 de cierre (Diseño cerró 11 encargos viejos; el JP dos de 10 días); vencimientos; ramas `data-rama` en los sitios; LM-88 y METRICAS por disparador; **sus etapas de la consulta F0** (Diseño proceso 1; JP P2-1…13 y P7-1…7; Desarrollo F3.3.0–21) como insumo del v2 «si se renombran con las fichas de la nomenclatura», no como invento.

**Estados reales hoy (la contradicción § 8 confirmada desde adentro):**
- Lote (Desarrollo, `plan[].estados` 30–31 oct): previsto → redactado → encolado → construido → aceptado | parcial | no aceptado; además espera DA, pospuesto, superado y una vez fallido. **Nunca** construyendo, verificando, desplegado ni revertido (la cola y el juez no dan señal para escribirlos). «con veredicto» y «bloqueado» de la nomenclatura son resultados de `pruebas.json`, no estados. `cambios[].estado` en producto: registrado al encolar; aceptado / no aceptado / parcial con el veredicto; instalado / probado / cerrado son del camino del modelo.
- REQ (Diseño): `diseno.json` borrador, definido, entregado, aceptado, descartado; encargo 4.3 «en definición, espera DA, listo, entregado, construido»; «definido» = «listo»; «construido» no está en el esquema; «aceptado» sin dueño escrito. Pedidos y DA con estados fuera de lista («aprobado», «pospuesta», «propuesto a Carlos…»).
- trabajo[] y tandas (JP): texto libre, sin lista cerrada ni validación («por redactar», «en lote L-182», «en espera de eventos…»); `salio[]` mezcla ids y frases.

**Brechas nuevas que no estaban en § 7:**
- Salida de «redactado» a «encolado» repartida en cuatro sitios (revisor 24, cruce en la línea 2, ok del JP en la línea 4, `linea-base --lote` rc 0); la cola solo guarda dos; el cruce no lo comprueba nadie (Desarrollo).
- La revisión previa de críticos de fábrica (ok del JP en la línea 4, cruce delegado, excepciones por orden de Carlos) no está en el encargo del JP ni en `proceso.json`; «revisión previa» no es un estado (JP).
- Dos caminos no aceptado → fix (reprobar o composición por la puerta de independencia); solo uno en la nomenclatura. Ids de lote enteros no escritos. Lotes partidos o renombrados (L-184a/b, L-183b → L-185) rompen la trazabilidad; no hay estado «reabierta» ni regla (Desarrollo, JP).
- Los plazos de la nomenclatura (construyendo 45, verificando 25…) no los mide nada en el flujo real (Desarrollo).
- `cobit.json › BAI02` dice que todo REQ se escribe en `requerimientos-consolidado.md` (nadie lo mantiene) y que el dueño aprueba «al autorizar el lote»; en la práctica Carlos valida escenario y boceto antes (Q5) (Diseño).
- Sin criterio escrito de salida de la revisión de alcance (cuándo un módulo pasa a «confirmado vN») ni de la escucha; la congelación de módulo depende de una orden de Carlos cada vez, sin guardia (Diseño).
- Frontera de la capa de proyectos (`flujo.frontera`): «entregará objetivos y prioridades y recibirá la ficha» — no está viva; los objetivos llegan por orden de Carlos vía Arquitecto o Diseño (JP). De MJ-17 › porProbar: probado el 5 y el 8 en lo del JP; 6 y 8 esperan a Carlos (DA-61, DA-62); 0–4 y 7 sin saber.
- Ids de mensaje duplicados cuando dos chats escriben a la vez (M-1259, M-1337); el push choca («cannot lock ref») y la fusión por JSON no está en ninguna regla (JP, Desarrollo); `trabajo[]` (95+ filas) y `tandas[]` no se archivan (JP); `mapa.py --ruta` reescribe `mapa-str.*` (Desarrollo); límites de la cola que cambian cómo se escribe un guion y no están en la plantilla (observado 900 caracteres, tema antes de las capturas, muestras independientes del estado) (Desarrollo); los scripts de construcción y simulación de Desarrollo viven solo en su contenedor, sin respaldo; la ficha de tanda falla con `salio[]` de textos (JP).
- Una DA con dos preguntas dentro (DA-57 vs la carta A/B de M-892) debe separarse (Diseño). Las decisiones de Carlos se registran al momento, no al final de la sesión (lección de Diseño con destino).
- Las horas estimadas también en los `.md` del JP: la regla 15 no tiene guardia fuera del buzón (JP).

**Lo que el mapa v2 debe responder, en sus palabras:** por estado del lote, su **señal** (qué archivo o línea de log lo prueba), quién lo escribe (chat, cola, juez), la práctica COBIT y la condición de salida verificable; los tres caminos de aceptación con quién decide; la relación lote fix ↔ padre; para Diseño, dada una diferencia o un REQ, en qué etapa está, qué le falta, quién recibe su salida y con qué criterio, qué BAI02/BAI07/BAI08 cubre cada etapa y cuáles están «off» a propósito, y qué cambia si el módulo está en pausa; para el JP, qué espera y qué hace en cada estado, la lista cerrada de estados de trabajo y tanda con su camino de aceptación, la revisión previa de críticos como etapa con retorno, y dónde se registra una excepción de pausa.

**Inventario (Diseño):** correcto salvo tres piezas, ya corregidas (`diseno-esquema-desfasado` y `artefacto-plan-trabajo-diseno` → superado; `json-lo-que-viene` sin escritor: candidato JP). Desarrollo advierte que al devolver el mapa la entrada «Mapa de procesos» de la Fábrica mostrará un borrador superado: quitarla o rotularla es un lote suyo (decide Carlos).
