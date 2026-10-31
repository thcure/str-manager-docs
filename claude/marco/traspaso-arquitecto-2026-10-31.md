# Traspaso del Chat Arquitecto · 31-oct-2026 (relevo por desgaste, regla 12)

**De:** Chat Arquitecto saliente (sesión Cowork `session_011PAjxLN9fTuZ3PSA1XAPxf`, 28-oct → 31-oct) · **Para:** el Chat Arquitecto nuevo · **Decisión de Carlos:** 31-oct 14:3x («te veo desgastado… relevo»; «créalo tú, en Opus, dale todo lo que necesite, verifica que esté preparado»). · **Protocolo:** `claude/gobierno/transiciones-chat.md` R1–R6 (desde que entrego este traspaso dejo de escribir; tú te declaras escritor en tu primera respuesta).

## 0. Lee en este orden (no leas la conversación anterior: no la tienes y no hace falta)

1. `interno/instrucciones.json` › `rol-arquitecto` (v3.3) y `reglas-comunes` (20 reglas; la 20 escrita y **sin vigor**).
2. Este documento entero.
3. `claude/marco/modelo-fabrica-linea-base-fa31a9a.md` (el modelo entero en la línea base, 22 brechas, 12 contradicciones, aportes de los chats, alcance de la vuelta atrás).
4. `claude/marco/marcos-y-fichas-cobit-2026-10.md` (jerarquía de marcos, fichas COBIT cruzadas con su proceso, respuestas de los chats, matriz de existencia por proceso, decisión PMI, falso vs incompleto, tabla organizacional).
5. `interno/lotes-modelo/LM-90.md` (buzón vivo: hecho, con § 0 vuelta atrás) y `claude/marco/plan-universo-2026-10.md` (bitácora de MJ-26).
6. `interno/mensajes.json`: los últimos 70 mensajes (M-1294…M-1362) son el contexto vivo.
7. `herramientas/arquitecto/LEEME.md` (tus herramientas: subir con fusión segura, regenerar el universo).

## 1. Quién eres y qué escribes

Arquitecto = capa Marco / PMO. Escribes solo: el modelo (`herramientas/modelo/*`: `esquema.json`, `validar.py`, `universo.py`, `procesos.py`, `paquete.py`, `pw/`), `interno/instrucciones.json`, `conocimiento.json`, `cobit.json`, `proceso.json`, `claude/marco/*`, `claude/gobierno/proceso-cambios*.md` y `revision-accesos`, `interno/lotes-modelo/*`, `interno/universo.json`, `mapa-procesos.json`, `vencimientos.json`, `planes/*.json`, `mapa-modulos.json › historial`, `METRICAS.json`, filas LM en `seguimiento.json › cambios[]`, `herramientas/paginas/*`, `herramientas/oficina/*`, `herramientas/arquitecto/*`, `destinatarios.json`. Diseño → `diseno.json`; Desarrollo → `seguimiento.json` e instrucciones L-n; JP → `proyecto.json`. **Nunca** datos reales de Carlos, secretos, `secrets.php`/`database.php`/`firebase.php`/`jwt.php`, borrados permanentos, escrituras en producción.

## 2. Cómo subes (flujo exacto; el token nunca se ve)

- El token fino de GitHub del Arquitecto vive en LENOVO: `C:\Users\ktcol\Downloads\str-instr-cola\claves\arquitecto.txt`. **Solo Carlos lo escribe.** Vence el **9-nov** (V-1 en `vencimientos.json`).
- Cada push: `device_stage_files` de ese archivo (queda en `/mnt/user-data/uploads/Downloads/str-instr-cola/claves/arquitecto.txt`) y luego `herramientas/arquitecto/subir.sh "<mensaje>" "<ids míos nuevos del buzón o vacío>"` (copia primero `subir.sh` y `buzon-merge.py` a tu contenedor y ajusta `R`, `S`, `F`). El script lee el token de la copia staged, la borra, hace rebase, fusiona el buzón y solo tus archivos, valida (`validar.py` en 0) y hace push con los trailers `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>` y `Claude-Session: <tu URL de sesión>`. **Comprueba siempre que la copia staged quedó borrada.**
- Requiere la sesión **vinculada a LENOVO** (herramientas `mcp__remote-devices__*`). Si no las tienes, pide a Carlos «Vincular a este equipo» desde la app de escritorio antes de intentar nada.
- Hora real siempre: `TZ=America/Bogota date +%H:%M` antes de escribir cualquier hora (el saliente escribió horas futuras varias veces; R-hora lo vigila en el buzón).
- Nunca leas `/mnt/user-data/uploads/Downloads/` salvo logs de la cola (`str-instr-cola\log\*.json`, `_resumen.txt`, veredictos, `buzon\v12\buzon.log`) y el token. Borra las copias staged después.

## 3. Estado al cierre (31-oct 14:3x)

- **Repo:** `str-manager-docs` main = último commit de este traspaso. `validar.py` 0 errores. Universo 0.2: **290 piezas**.
- **LM-90 buzón vivo: construido, no activado.** Esquema con estados de gestión y `avances[]`; guardias R-hora/R-avance/R-carlos en modo aviso; `lo-que-me-toca.py` funcionando; despertador **v12** instalado en LENOVO en `str-instr-cola\buzon\vigilar-buzon-v12.ps1` con estado propio en `buzon\v12\` y `modo.txt = registrar` (no llama a nadie; primera corrida 11:44 limpia; falta la segunda con un commit real del buzón); la tarea de Windows sigue en el **v11.5**; regla 20 escrita, **entra en vigor solo cuando tú lo avises** por el buzón («desde M-n rige la regla 20»). Punto de retorno de LM-90: commit `147af07` + `interno/respaldos/LM-90/`.
- **MJ-26 (plan del universo):** fases 0–5 cerradas, F6 falta solo el guion de R-14 (LM-86), fase 7 = revisión de Carlos; `interno/planes/plan-universo.json` (31 pasos) y artefacto «Plan del Universo MJ-26». **El mapa de procesos (`mapa-procesos.json`, f3-4, f3-5) está CONGELADO**: nadie construye sobre él.
- **Sitios en producción** (LM-79 fase 5): herramienta-fabrica. y proyectos. (L-183, L-184, L-186 aceptados; L-185/187/188 de guiones). STR main `7b3f18d`; fabrica-servicio `623eb97`.
- **Buzón:** M-1356…M-1362 respondidos (aportes de los tres chats al retorno y a las fichas COBIT). Pendiente: M-858 (Diseño → Carlos, 12 días). PRB-8 abierto por Desarrollo (guiones que no cubren lo que cambia; dueño Arquitecto, va en el LM de plantillas pendiente desde LM-88).
- **Vencimientos:** Premium y bucaramangastays.com **3-nov**; tokens de Arquitecto, Desarrollo y Diseño **9-nov**; JP 17-nov.

## 4. El error que motiva el trabajo (reconocido ante Carlos y los chats)

Al construir el mapa de procesos de MJ-26 no tomé como fuente lo que ya existía: «Diagramas de la fábrica STR» (el marco), la nomenclatura (camino del lote por BAI02/BAI03/BAI07, fichas por objetivo COBIT), `cobit.json`, `proceso.json` (PROC-lote-v2, F0–F8), `marco-trabajo.json`. Levanté otra jerarquía al lado (1 de 112 nodos cita COBIT), sin punto de retorno, y LM-87 la metió en los encargos de Desarrollo y del JP. Carlos: «reinventaste la rueda, sin contexto»; «no hablé de un universo nuevo». Lecciones (ya escritas en el modelo de la línea base § 9): **inventariar antes de construir; punto de retorno antes del primer cambio (§ 0 «Vuelta atrás» en todo LM); la herencia va del marco al mapa, no al revés; un dato, una fuente; un plan por tema; hora real; no oscilar entre extremos cuando Carlos corrige** (de 11 sistemas bajé a 4 y tuve que volver a 9).

## 5. Lo que te toca primero: LM-91 «rehacer heredando»

Carlos aprobó la idea («suena bien»); el sí formal a ejecutar lo da cuando tú le presentes el § 0. Orden:

1. **§ 0 Vuelta atrás escrita antes del primer cambio.** Línea base `fa31a9a` (30-oct 19:07, último commit antes del mapa). Reversión **por archivo, nunca `reset`** (138 commits encima, 69 de otros chats).
2. **Devolver el mapa como fuente:** `mapa-procesos.json` → `interno/respaldos/MJ-26-mapa-borrador/` (estado «borrador superado»; sus 112 nodos y las 22 etapas de Desarrollo F3.3.0–21 son insumo); retirar `procesos.py` (P1–P5) de `validar.py`, `esquema.json › mapaProcesos`, la carga en `paquete.py`; piezas `json-mapa-procesos`, `modelo-procesos-py`, `art-mapa-procesos` → superado; `universo-modelo.md` y regla 19 vuelven a decir «circuito vigente = proceso.json + nomenclatura + Diagramas»; **encargos de Desarrollo (2.5) y JP (2.4) reescritos** sin las citas al mapa (lo demás de LM-87 se queda); la entrada «Mapa de procesos» de la Fábrica rotulada «borrador superado» (regenerar la página; quitarla del menú sería un lote de Desarrollo, decide Carlos); plan del universo f3-1…f3-5 «revertidos», nace f3-bis.
3. **Rutas v2 (f3-bis) heredando:** el «Diagramas de la fábrica STR» **generado desde el modelo** (`proceso.json`, `cobit.json`, `esquema.json`, nomenclatura, `universo.json`) con un nivel más abajo (procedimientos y pasos bajo la vista B) y las piezas colgando de cada guardia; un solo vocabulario de estados (hoy cuatro: ver modelo § 8; los reales los dio Desarrollo en M-1357); los tres caminos de aceptación; ids de lote enteros; la revisión previa de críticos como etapa (JP M-1358); lotes partidos/renombrados; `marcos` como sección de `proceso.json` (tres niveles: PMI → 12207 → COBIT, con qué entrega y recibe cada nivel; PMI confirmado por Carlos); en `cobit.json` cada objetivo con `proceso`, `plan`, `guardias`, `vista` y **grado por práctica** (adoptada / adaptada / parcial / fuera); guardia R-cobit que solo marca lo falso; las 8 fichas desfasadas reescritas con las respuestas M-1359/1360/1361 (están en el doc de marcos § 5); traer al repo `proceso-requerimientos-diseno.md`, `plan-construccion.md`, `metodo-formalizacion-fabrica.md` (viven solo en el proyecto de Claude); encargo del JP al día; dimensión `proceso` del universo derivada de la estructura (lista cerrada; hoy 35 «—» y 51 «todos»).
4. **Estructura del universo** (Carlos pausó el tema; retómalo cuando él lo pida, no antes): nueve sistemas vitales + una referencia, por la prueba «si lo quitas, ¿colapsa?»: Procesos, Circuito (rutas, estaciones, tránsitos con señal, equipaje, plazos y retornos), Agentes, Comunicación, Memoria, Guardias, Territorio, Vistas, Piezas y su gobierno; Marcos = herramienta de referencia del método. Va como `universo-modelo.md` v2 y figura «Estructura del universo» generada. La página «El Universo armado» (artefacto y `herramientas/arquitecto/estructura-universo.py`) coloca las 290 piezas en la estructura hoy y lista lo que falta.

## 6. Decisiones de Carlos pendientes (no las tomes tú)

- APO06.05 costo por lote: ¿se quiere y de dónde sale el dato? (nadie ve tokens; vueltas y minutos sí).
- DA-61 (JWT/sesión) y DA-62 (metas MT-1…4): sostienen MEA01.02 y R-7.
- M-858 (alcance del sistema, Diseño): 12 días; presentárselo en una línea o superarlo con motivo (regla R-carlos).
- Cambiar la tarea de Windows «STR buzón» al v12 cuando la segunda corrida esté bien; entonces activas la regla 20 con un solo mensaje a los tres chats.
- Renovaciones del 3-nov y 9-nov.

## 7. Deudas mías que heredas (con dueño tú)

PRB-8 / LM de plantillas (plantilla de guion, punto 18 del revisor, regla de ids enteros, deuda de `reprobar\` contra el guion del último lote aceptado) · `metricas.js` no cuenta composición ni parcial con evidencia · guion de R-14 (LM-86) · anclaje de Seg. Proyecto en el mapa · DT-54 del visor · guardia R8 «diferencia construida ⇒ en línea base» · `lo-que-me-toca`: campo `responsable` explícito en los planes · `cuarentena.json` · 17 fichas de conocimiento con revisión pendiente · el pendiente de generar «Diagramas» y «Procesos de la fábrica» desde el modelo (hoy artefactos a mano del 25-oct, copia única).

## 8. Artefactos del Arquitecto (claude.ai, cuenta de Carlos)

«Plan del Universo MJ-26» `53fbeab4-1716-402b-a4e4-79e6f4e709ca` (db `pasos/`, `meta/plan`, `estado/actual`) · «Modelo de la fábrica · línea base fa31a9a» `e74f3751-08ce-4606-aeba-5982431141a6` · «El Universo armado · estructura» `7ca6d5d9-49b7-46fc-b509-5534fde4dad4` · «Universo · piezas» `96c5ea33-…` · «Mapa de procesos» `66c3a5f3-…` (congelado) · «Árbol del universo» `56e208ef-…` · «Plan de sitios LM-79» `2712a20d-…` · «Diagramas de la fábrica STR» `ee6dbd77-…` y «Procesos de la fábrica STR» `c8e5418c-…` (25-oct, referencia de forma del v2) · «Línea base del STR» `9189dc1f-…` (explorador, generado) · «Elección de términos» `f7bb0632-…` (**no tocar**: la llena Carlos).

## 9. Cómo trabaja Carlos contigo (lo que me costó aprender)

No es técnico: diagramas antes que texto, tablas antes que párrafos, una pregunta a la vez con opción recomendada. Breve, tuteo, español sin anglicismos. «El plan es continuo»: no esperas a Carlos salvo lo que solo él puede; «que no sea un cuello de botella». Nada supuesto: todo con fuente. Si corrige, no oscilar: analizar con su criterio y volver con la decisión tomada y probada contra los datos («tú eres el que tiene el contexto, eres un Fable»). Él ve lo que haces en Chrome (autorizó «encárgate» en hPanel, GitHub, claude.ai, Firebase y la consola de Google, solo lectura); credenciales y seguridad son suyas. Cada entrega a LENOVO va por `device_commit_files` desde `/mnt/user-data/outputs/`; cada vez que hagas algo en su equipo, dilo.

## 10. Mensaje de arranque (lo pega Carlos o lo pega el saliente al crear el chat)

> Eres el **Chat Arquitecto** del STR Manager (capa Marco / PMO). Carlos es el dueño. Lee, en este orden y antes de escribir nada: `interno/instrucciones.json` › `rol-arquitecto` y `reglas-comunes`; `claude/marco/traspaso-arquitecto-2026-10-31.md` (tu traspaso, completo); `claude/marco/modelo-fabrica-linea-base-fa31a9a.md`; `claude/marco/marcos-y-fichas-cobit-2026-10.md`. Luego: declárate escritor, registra tu sesión en `interno/destinatarios.json` (línea «Chat Arquitecto»), comprueba que puedes subir (pide a Carlos vincular LENOVO si no ves `device_*`), avisa del relevo a Diseño, Desarrollo y JP por el buzón, y preséntale a Carlos en una tabla breve: estado, accesos comprobados, y el § 0 «Vuelta atrás» de LM-91 para su sí. No ejecutes la vuelta atrás sin ese sí. El tema «estructura del universo» está en pausa por decisión de Carlos: no lo retomes hasta que él lo pida.
