# Procesos del proyecto — STR Manager (nomenclatura COBIT 2019) · texto vigente hasta el 2026-10-18

> **Archivo (LM-74, 21-oct-2026).** Esta es la formalización anterior a MJ-17, conservada íntegra. El índice del manual vigente está en `claude/gobierno/proceso-cambios.md`. Sigue vigente de aquí el **modelo de operación (APO01)**; las secciones por objetivo COBIT (BAI02, BAI06, BAI07, BAI10, DSS02, MEA01) describen la práctica de septiembre y, donde un plan de `claude/marco/` las supera, manda el plan.

> Define **cómo trabajamos**: los procesos que venimos practicando, enmarcados en los procesos y prácticas de COBIT 2019 para que cualquier persona que se sume entienda el método con un estándar conocido. Cada proceso COBIT (BAI06, BAI07…) es un **macroproceso** nuestro; cada práctica (BAI06.01…) es un **proceso**; las **actividades** son nuestras y llevan sufijo `-a`, `-b`… porque ahí COBIT deja libertad. Al lado de cada código va siempre el nombre en español.
> COBIT 2019 es la versión vigente; ISACA anuncia una actualización para finales de 2026 — revisar entonces si cambia la nomenclatura. El detalle oficial de los 40 objetivos y nuestra posición frente a cada uno están en la página **Cobit** del STR (`interno/cobit.json`).
> **Última actualización: 2026-10-18** — sección APO01 (Arquitecto, LM-57, cruce de Carlos 18-oct 10:13): el Chat de diseño se separa en **Chat Diseño** (analista de negocio, Opus) y **Chat Jefe de proyecto** (nuevo, Sonnet, encargo `rol-jefe-proyecto`, `interno/proyecto.json`: planes y prioridades); el despertador v11.3 vigila y escala al Jefe de proyecto. Antes, 2026-10-09 — sección APO01 (Arquitecto, aprobado por Carlos): entra el **Chat de diseño** (Analista de negocio + Jefe de proyecto, encargo `rol-diseno`, `interno/diseno.json`, ficha BAI11-d) y el Chat de desarrollo queda con los roles técnicos; despertador con vigía de estancamiento; un token por chat que escribe y procedimiento `ins-007` para abrir chats; instrucciones del proyecto neutrales (`ins-proyecto`). Antes, 2026-09-29 (c) — sección 01.09: secciones fijas de los encargos con "te activa", "recibes de" y "entregas a" (cambio de modelo `b9cd211`; escrita por el Chat de desarrollo por única vez con autorización explícita de Carlos). Antes, 2026-09-29 (b) — sombrero **Arquitecto** (aprobado por Carlos el 29-sep-2026): dueño de la capa Marco, encargo `rol-arquitecto`, Chat de desarrollo a 10 roles, casilla "¿toca el modelo?" en la cabecera, tipo "modelo" en `cambios[]`, riesgos R-6…R-8. Antes, 2026-09-29 — nombres del arquitecto (Chat de desarrollo, Agente verificador, Agente CLI), Agente verificador montado y Chat asesor fuera del modelo. Antes, 2026-09-28 (noche): lecciones del primer ciclo completo bajo el modelo de operación (lotes 31–32, T-5): tiempos y costos medidos, nunca estimados (BAI07.05-e, APO06.05); verificación que depende de la hora con reloj real o simulado declarado (BAI07.05-e); objetos sintéticos en memoria como dato de prueba sin escritura (BAI07.05-f); barrido de un defecto de patrón con INC aparte para lo que no entra (BAI06.01-i); guardia en `tests/` (BAI03.06); fallo de la CLI por cupo y condición de batería de la tarea (Ciclo, paso 3); tolerancias R-1…R-5 aceptadas por Carlos. Antes, el mismo día: sección **"APO01 · Modelo de operación"** (capas, 19 roles en 4 sombreros, entradas y salidas con elemento tangible, encargos, `elementos.json`, puntos de corte entre chats), ajustes vigentes del 26–28 de septiembre y traslado a `claude/gobierno/`. Antes: 2026-09-26 — BAI10.02-c (mapa de relaciones); 2026-09-23 (b) — reescritura completa en nomenclatura COBIT 2019 y adopción parcial de APO11, APO12, BAI04, BAI08 y BAI11 ("de acuerdo" del usuario). Antes: "Proceso de Gestión de Cambios", 2026-09-07.

**Roles.** Carlos (dueño del negocio, EDM01): entrega pedidos y requerimientos funcionales, decide las DA-n, aprueba lo crítico y ejecuta lo que solo él puede (claves, Firebase, renovar hosting). Claude asume los 18 roles técnicos del modelo de operación (sección APO01) repartidos en siete sombreros: **Arquitecto** (procesos y agentes; dueño de la capa Marco, desde el 29-sep), **Chat Diseño** (analista de negocio; del 9 al 18-oct también jefe de proyecto), **Chat Jefe de proyecto** (orden y avance, desde el 18-oct, LM-57), **Chat de desarrollo** (arquitecto de software, gestor de cambios, conocimiento, supervisión, costos, riesgos, gobierno, calidad), **agente CLI** (desarrollador, construye en el PC de Carlos bajo `CLAUDE.md`), **agente verificador** (pruebas, soporte, configuración: acepta o registra INC, nunca corrige) y **agente de salud** (operador de plataforma, diferido a la operación real). Delegación vigente desde el 2026-09-26: Carlos confirma el REQ una vez; Claude decide categoría, redacta, encola, verifica y acepta sin pedir permiso por partes; Carlos vuelve a entrar solo ante una pregunta funcional (DA) o un lote crítico.

**Escala.** Un negocio, un equipo de tres, un desarrollador automatizado. Lo que COBIT pide a escala empresarial y aquí **no** adoptamos: comité de cambios, formularios aparte de la instrucción, ventanas de cambio, plan de reversión por cada lote, métricas de proceso.

**Estado de cada proceso:** ✅ practicado y formalizado aquí · 🟡 practicado, parcialmente formalizado · ◐ adoptado parcialmente (solo las prácticas listadas) · ⏳ definido, por incorporar · 🔮 futuro (requerimiento de proceso).

**Criterio de adopción (2026-09-23):** una práctica de COBIT se adopta solo si ataca un problema que ya tuvimos o uno que llega con la operación real. Nuestros problemas, en cinco frases: (1) los incidentes nacen del proceso, no de la lógica (alcance fuera de lote, correcciones mezcladas, redactar sin leer el código); (2) el dueño es el cuello de botella y Claude pierde contexto entre sesiones y modelos; (3) se verifica en producción con datos reales; (4) empieza a manejarse dinero y datos personales con normativa colombiana; (5) el portal aún no tiene uso real. Lo que no ataca nada de eso queda fuera aunque el estándar lo pida.

---

## Mapa

| COBIT | Nombre | Nuestro macroproceso | Estado |
|---|---|---|---|
| **APO01** | Marco de gestión de I&T | **Modelo de operación**: capas, roles, entradas/salidas, encargos, índice de elementos (sección propia, abajo) | ◐ (01.03, 01.04, 01.05, 01.07, 01.09, 01.10, 01.11) · desde 2026-09-28 |
| **BAI02** | Gestión de la definición de requisitos | Registro de requerimientos y decisiones | ✅ |
| **BAI06** | Gestión de cambios de TI | Del requerimiento a la instrucción y al commit | ✅ (registro de cambios en `seguimiento.json → cambios[]`) |
| **BAI07** | Gestión de la aceptación y transición de cambios | Del commit a producción aceptada | ✅ (aceptación criterio por criterio desde el lote 29) |
| **BAI10** | Gestión de la configuración | Documentación y registro de lo desplegado; relaciones entre configuración; índice `elementos.json` | ✅ |
| **DSS02** | Gestión de solicitudes e incidentes | Incidentes INC-n | ✅ |
| **MEA01** | Supervisión del rendimiento y la conformidad | Informe de avance y revisión posimplementación | 🟡 |
| **BAI03** | Identificación y construcción de soluciones | Construcción de cada requerimiento por el agente CLI | ◐ (03.06, 03.09, 03.10) |
| **APO12** | Riesgo | Registro `riesgos[]` R-1…R-5 con escenario, tolerancia y respuesta | ◐ (12.03, 12.06) · tolerancias aceptadas por Carlos el 2026-09-28 |
| **BAI11** | Proyectos | Cada paso (5a, 5b, C…) como proyecto: ficha de inicio, `plan[]`, cierre | ◐ (11.02, 11.09) |
| **BAI08** | Conocimiento | Vigencia y retiro de los documentos; traspaso entre chats (`transiciones-chat.md`); carpetas por capa | ◐ (08.03, 08.04) |
| **BAI04** | Disponibilidad y capacidad | Comprobación diaria de salud del servidor (agente de salud) | ◐ (04.01) · al arrancar la operación |
| **APO11** | Calidad | Absorbido en DSS02 y BAI07.08 (defectos recurrentes → causa → acción) | ◐ (11.05) sin sistema aparte |
| **APO06** | Presupuesto y costos | Costo por lote (`cambios[].costo`) para calibrar el tamaño de lote | ◐ (06.05) · medido desde el lote 31 |
| **APO09** | Acuerdos de servicio | Qué promete cada plan | 🔮 con clientes (Fundación/billing) |

El estado por proceso también se sigue en `estado-proyecto.md` sección "Procesos del proyecto" y, con el detalle oficial, en la página Cobit.

---

## APO01 · Marco de gestión de I&T — Modelo de operación ◐ (desde 2026-09-28, REQ-SP5 ✔)

**Por qué.** El proyecto nació informal y todo estaba mezclado (documentos, JSON, páginas, artefactos, cola, tareas). Carlos pidió organizarlo "como un engranaje vivo hacia el COBIT y hacia el desarrollo de software", con dos premisas: poder **delegar procesos a otros chats o agentes** y no perder agilidad ni gastar créditos de más. Este modelo es la respuesta; se construyó en el REQ-SP5 con un subagente en el rol de Arquitecto de procesos (fichas SIPOC, RACI, encargos, catálogo) y se consolidó con Carlos el 28-sep. Vista publicada: artefacto **"Modelo de Operación STR"** y página **Elementos** del STR. **Probado el mismo 28-sep:** un chat nuevo arrancó en 1 minuto con `rol-desarrollo` + T-4 y cerró dos lotes (31 y 32) completos bajo el modelo.

### 01.04 · Estructura: tres engranajes y cuatro capas
- **Engranajes:** PMI (grupos de procesos = el ritmo: iniciar, planear, ejecutar, monitorear, cerrar) · SDLC (etapas = el trabajo: requisitos, diseño, construcción, pruebas, despliegue, operación) · COBIT (los 16 objetivos de interés = el control). Iterativo, no lineal: cada REQ recorre el ciclo completo.
- **Capas** (la carpeta es la capa; única estructura que permite el proyecto de Claude):

| Capa | Pregunta | Elementos |
|---|---|---|
| `claude/gobierno/` | ¿Cómo decidimos? | proceso-cambios · transiciones-chat · definiciones-proyecto · estado-proyecto (adelgazado) · `riesgos[]` |
| `claude/marco/` | ¿Cómo trabajamos? | patrones-codigo · comandos-usuario · `marco-trabajo.json` · `instrucciones.json` (incl. encargos rol-*) · `cobit.json` · `elementos.json` |
| `claude/producto/` | ¿Qué construimos? | requerimientos-consolidado · bocetos/ · `seguimiento.json` |
| operación (fuera del proyecto de Claude) | ¿Cómo lo hacemos día a día? | repo `str-manager` · `CLAUDE.md` · cola e instrucciones NN-instr · `log/` · tareas programadas · Chrome · producción |
| `claude/archivo/` | ¿Qué quedó atrás? | mapa-sistema · req-portal-colaborador · estado-proyecto-historial-2026-09 (punteros con fecha, BAI08.04) |

Las demás dimensiones (proceso COBIT, etapa, ritmo, rol, entradas y salidas, relaciones) no son carpetas: son **etiquetas** en `interno/elementos.json` (16 campos: `id, nombre, tipo, capa, cobit[], sdlc[], pmi[], rol, usa[], vive, estado, entrada_de[], salida_a[], relacion[], vigenciaDesde, notas`). Ese índice reemplaza la antigua tabla "Documentos: cuándo se revisan y cuándo se actualizan" de este documento (un dato, una fuente).

### 01.05 · Roles y responsabilidades: 19 roles, 4 sombreros

| COBIT | Rol | Qué hace |
|---|---|---|
| EDM01 | **Dueño / patrocinador** (Carlos) + **Gestor de gobierno TI** | Carlos decide; el gestor de gobierno cuida la coherencia con COBIT, prepara las DA con opciones, vigila "un dato una fuente" |
| APO01 | **Arquitecto de procesos** + **Arquitecto de agentes** | Procesos, capas, roles, entradas/salidas, encargos; el de agentes convierte cada encargo en chat, agente, tarea o guion y mantiene la cola y las tareas |
| APO06 | Controlador de costos | Costo por lote en `cambios[].costo` |
| APO09 | Gestor de servicio | Promesas por plan (diferido) |
| APO11 | Analista de calidad | Defectos recurrentes → causa raíz → acción |
| APO12 | Gestor de riesgos | `riesgos[]` R-n; condiciona lotes |
| BAI02 | Analista de negocio (Chat Diseño) | Pedido → REQ «listo para construir» (ejemplos con datos, casos borde, boceto, criterios dado/cuando/entonces, lectura del código real); DA con recomendación; nivel P0–P3 propuesto |
| BAI03 | Arquitecto de software + Desarrollador (agente CLI) | Instrucción del lote leyendo código real; la CLI construye |
| BAI04 | Operador de plataforma | Salud diaria de producción |
| BAI06 | Gestor de cambios | Categoría, cola, estados, cierre, registro de cambios |
| BAI07 | Ingeniero de pruebas (nunca quien construyó) | Verificación punto por punto; aceptado/no; posimplementación |
| BAI08 | Gestor del conocimiento | Traspaso entre chats; vigencia y retiro |
| BAI10 | Administrador de configuración | `CLAUDE.md`, patrones-codigo, `?v=`, declarados vs tocados, `elementos.json` |
| BAI11 | Jefe de proyecto (Chat Jefe de proyecto, desde LM-57) | Planes y orden del trabajo (`proyecto.json → planes[], prioridades[]`), revisión previa de críticos, vigilar que el plan avance; el Chat de desarrollo lleva `plan[]` por lotes |
| DSS02 | Analista de soporte | INC con nivel y causa; fix en lote propio |
| MEA01 | Supervisor de desempeño | Informe "en qué vamos", metas, acciones correctivas |

**Consolidación (la regla de agilidad):** separar por rol dice *qué* se hace; ejecutarlo lo hace quien ya tiene el contexto más barato. Sombreros:

| Sombrero | Roles | Quién lo ejecuta | Encargo |
|---|---|---|---|
| **Arquitecto** (desde el 2026-09-29; aprobado por Carlos el 29-sep-2026) | Arquitecto de procesos, Arquitecto de agentes | El chat de Cowork "Arquitecto" (antes Chat asesor) | `rol-arquitecto` |
| **Chat Diseño** (desde el 2026-10-09; analista solo desde LM-57) | Analista de negocio | Chat del proyecto «🎨 Diseño» (Opus), con Carlos | `rol-diseno` (v3) |
| **Chat Jefe de proyecto** (desde el 2026-10-18, LM-57; cruce de Carlos) | Jefe de proyecto | Chat del proyecto «🗂 Jefe de proyecto» (Sonnet) | `rol-jefe-proyecto` |
| **Chat de desarrollo** (escritor único de las capas gobierno y operación) | Arquitecto de software, Gestor de cambios, Conocimiento, Supervisión, Costos, Riesgos, Gobierno, Calidad (8 roles) | Chat del proyecto «🛠 Desarrollo» (Opus 5.5; relevo del 9-oct) | `rol-desarrollo` (sucede a ins-001) |
| **Agente verificador** | Ingeniero de pruebas, Analista de soporte, Administrador de configuración | El juez local de la cola en LENOVO (`claude -p`, desde LM-19); las tareas programadas del verificador remoto están pausadas desde el 14-oct | `rol-verificador` |
| **Agente CLI** | Desarrollador | Cola de Windows (la tarea se sigue llamando "STR cola CLI") | `CLAUDE.md` |
| **Agente de salud** | Operador de plataforma | Tarea diaria (diferido) | — |

Lo que **no** hacemos: dos chats escribiendo el mismo archivo (cada chat tiene los suyos y se hablan por el buzón `interno/mensajes.json`), un chat por proceso COBIT, duplicar en `.md` lo que vive en el JSON. **Cuatro chats desde el 18-oct** (Diseño, Jefe de proyecto, Desarrollo, Arquitecto): el qué lo define Carlos con el Chat Diseño; el orden y el avance, el Jefe de proyecto; el cómo es del Chat de desarrollo; el modelo, del Arquitecto. Las instrucciones del proyecto en claude.ai son neutrales (`ins-proyecto`): el rol de cada chat lo fijan su arranque y su encargo.

Nombres vigentes (2026-09-29, los del arquitecto, definidos por Carlos): **Chat de desarrollo**, **Agente verificador**, **Agente CLI**, **Agente de salud**. **Arquitecto (desde el 2026-09-29, aprobado por Carlos el 29-sep-2026):** el antiguo Chat asesor deja de ser apoyo fuera del modelo y pasa a ser el sombrero **Arquitecto**, dueño y **único escritor de la capa Marco** (sección APO01 de este documento, `marco-trabajo.json`, `instrucciones.json`, `cobit.json`, `elementos.json`, `comandos-usuario.md`). El Chat de desarrollo propone y el Arquitecto evalúa, presenta a Carlos y escribe con su aprobación; cada cambio al modelo lleva tipo "modelo" en `cambios[]` y commit con prefijo `modelo:`.

### 01.03 · Procesos: entradas y salidas con un elemento tangible
La salida de un proceso es la entrada del siguiente y **siempre viaja en un elemento que otro chat o agente puede abrir**; nada queda solo en la conversación. Los traspasos del ciclo:

| Traspaso | Elemento |
|---|---|
| Carlos → BAI02 (Chat de diseño): pedido | `diseno.json → pedidos[]` (P-n) |
| BAI02 → Carlos: decisión abierta | `diseno.json → das[]` (DA-n con opciones y recomendación) |
| BAI02 → BAI03/BAI06 (Chat de desarrollo): REQ listo | texto en `producto/requerimientos-*.md` + `diseno.json → reqs[]` + mensaje del buzón «REQ-X listo para construir»; el Chat de desarrollo lo registra en `items[]` |
| BAI02 → BAI11: nivel P0–P3 propuesto | mensaje «REQ-X listo para construir» también al Jefe de proyecto |
| BAI11 (Chat Jefe de proyecto) → BAI06: orden del trabajo | `proyecto.json → prioridades[]` (mientras no exista, `diseno.json`) |
| BAI06 → BAI11: plan de lotes | `plan[]` (previsto → encolado → desplegado → aceptado → cerrado · espera DA), que el Jefe de proyecto lee |
| Despertador → BAI11: estancamiento | frase fija del vigía al Chat Jefe de proyecto (si no existe, al Chat Diseño): trabajo libre, nada en curso, 60 min sin movimiento |
| APO12 → BAI06: riesgo del lote | cabecera de la instrucción con su R-n |
| BAI03 → BAI06: instrucción del lote | `NN-instr-*.md` en la cola |
| BAI06 → agente CLI: lote encolado | archivo en `str-instr-cola\` + tarea de Windows |
| CLI → BAI07: commit + log | commit en `main` + `log\NN-*.txt` ("Hecho / No hecho", declarados vs tocados) |
| BAI07 → BAI06: veredicto | `cambios[].aceptacion {fecha, resultado, modoVerificacion?, criterios[{c, ok, observado}]}` |
| BAI07 → DSS02: hallazgo | ítem INC-n con nivel y causa |
| DSS02 → BAI03: fix | `NN-instr-fix-*.md` |
| BAI07 → BAI11/APO11: posimplementación | `posimplementacion[]` (5 preguntas por paso) |
| BAI06 → APO06: costo | `cambios[].costo {tokens, minutosCLI, minutosDueno, nota}` — medido, no estimado |
| Carlos → BAI06: visto bueno de un crítico | `cambios[].cruceDueno` |
| BAI10 → BAI03/DSS02: configuración | `CLAUDE.md`, `marco/patrones-codigo.md` |
| BAI11/BAI08 → chat siguiente: traspaso | `gobierno/transiciones-chat.md` + encargo `rol-*` |
| MEA01 → Carlos: informe | semáforo de `estado-proyecto.md` + Seg. Proyecto |
| APO11/MEA01 → APO01: regla nueva | este documento + `marco-trabajo.json` (ajustes vigentes) |

### 01.07 · Propiedad de la información: un escritor por elemento
| Elemento | Escribe | Leen |
|---|---|---|
| `diseno.json` (pedidos, bolsa, REQ, DA, objetivos, lecciones de producto, traspaso) y documentos de requerimientos `producto/requerimientos-*.md` | Chat Diseño | Jefe de proyecto, Chat de desarrollo, Carlos |
| `proyecto.json` (planes, prioridades, lecciones de seguimiento, traspaso) | Chat Jefe de proyecto | Diseño, Desarrollo, despertador, Carlos (Seg. Proyecto desde L-151) |
| `seguimiento.json` · items, plan, riesgos, posimplementacion | Chat de desarrollo | Carlos (Seg. Proyecto), Chat de diseño, agentes |
| `seguimiento.json` · `cambios[].aceptacion`, INC | Agente verificador | Chat, Carlos |
| Documentos `.md` de gobierno y operación (estado-proyecto, transiciones-chat, patrones) | Chat de desarrollo | Chat siguiente, Carlos |
| `mensajes.json` (buzón) | Quien envía crea el mensaje; quien recibe solo cambia estado y respuesta | Todos los chats |
| `destinatarios.json`, `conocimiento.json`, `herramientas/`, instrucciones del proyecto en claude.ai | Arquitecto | Todos |
| Cola `NN-instr-*.md` | Chat de desarrollo | Agente CLI, verificador |
| Código, `CLAUDE.md`, `log/` | Agente CLI | Verificador, chat |
| `patrones-codigo.md` · errores conocidos | Agente verificador | Chat, CLI |
| `instrucciones.json` · encargos rol-* | Arquitecto | Carlos, todos los sombreros |
| `elementos.json`, `marco-trabajo.json`, `cobit.json`, sección APO01, `comandos-usuario.md` (capa Marco) | Arquitecto (con aprobación de Carlos, prefijo `modelo:`) | Todos |

**Escritura en `str-manager-docs` (2026-09-28; ampliado 2026-10-09, INC-87):** los chats del proyecto no tienen selector de repositorios y el proxy no inyecta credencial para ese repo; cada chat que escribe usa **su propio token** *fine-grained* (solo ese repo, Contents lectura y escritura) que Carlos le pega al abrirlo, con `git -c http.extraheader="AUTHORIZATION: basic <base64 de x-access-token:TOKEN>" push`. El token nunca se escribe en archivos, documentos ni en la URL del remoto, ni pasa por otro chat.

### 01.09 · Encargos por rol (procedimientos delegables)
Cada sombrero tiene un **encargo** en `instrucciones.json` (`para: "rol-<nombre>"`, visible en Instrucciones con botón Copiar) con estas secciones fijas: propósito · proceso COBIT y prácticas · te activa · recibes de · qué lee al arrancar · qué produce y dónde lo deja · entregas a (une el antiguo 'cómo entrega al siguiente rol') · criterios de terminado · qué no toca · reglas vigentes. Un chat nuevo lo abre el Arquitecto con el procedimiento **`ins-007`** (relevo o rol nuevo: equipo LENOVO, modelo, arranque con el encargo, token propio, sesión registrada en `destinatarios.json`) y debe poder arrancar en menos de 10 minutos sin leer la conversación anterior (tolerancia de R-5; medido: 1 minuto el 28-sep). Al arrancar comprueba sus accesos (equipo y carpetas, Chrome, `git push --dry-run` en `str-manager-docs`) y los dice en la primera respuesta junto con su identificador de sesión.

### 01.10 · Infraestructura del marco
Cola CLI (`ejecutar-cola.ps1`, tarea de Windows cada minuto, un equipo activo a la vez: ins-002/003/005), tarea programada "Agente verificador" (sin horario propio: el Chat de desarrollo la activa por lote; escribe solo `log\NN-veredicto.json`, que el chat copia sin cambios al seguimiento; reemplaza desde el 28-sep a "Revisar cola STR") y recordatorios de la propia sesión, repo público `str-manager-docs/interno/*.json` como bus y como fuente de las páginas del grupo Proyecto, Chrome con la extensión para verificar, y el **despertador** (`herramientas/vigilar-buzon.ps1`, tarea de Windows "STR buzon" cada 3 min, sin Claude): avisa a cada chat con una frase fija cuando tiene mensaje en el buzón, veredicto nuevo o lote terminado, y su **vigía** despierta al Chat Jefe de proyecto (si no existe, al Chat Diseño; v11.3) si el plan tiene trabajo libre y nadie se mueve en 60 min (7:00–22:00; fichas APO01.03-b y BAI11-d en `conocimiento.json`). Regla de créditos: los agentes se disparan **por estado, no por reloj** (salvo la salud), y leen **su porción del JSON**, nunca los `.md` completos. **La tarea de Windows no lleva condiciones de energía** ("No iniciar en modo Batería" dejó la cola quieta sin error el 28-sep) y el equipo activo no se suspende.

### 01.11 · Mejora del marco
Cada lección (INC, posimplementación, transición) entra aquí con fecha y origen, y como "ajuste vigente" en `marco-trabajo.json`. Ajustes de septiembre: una escritura por documento al cierre · un lote a la vez · revisar la cola 15 min tras encolar y luego cada 5 min · instrucciones cortas · texto fijo de la tarea programada · un dato una fuente (REQ-SP4) · cambio de alcance = REQ-Xn.1 · una corrección = fix propio · corte de chat solo en un punto limpio. **28-sep (noche, T-5):** tiempos y costos medidos, nunca estimados; la espera no es trabajo (IT-4) · verificación dependiente de la hora con reloj real o simulado, dicho en la aceptación · barrido completo de un defecto de patrón; lo que no entra al lote, INC aparte (INC-81) · fallo de la CLI sin commit: leer el log antes de tocar la instrucción; si es por cupo, reencolar igual (INC-80) · tarea de Windows sin condición de batería · guardia en `tests/` contra un patrón que ya falló (INC-79).

### Puntos de corte limpios entre chats
| # | Corte | Debe estar escrito |
|---|---|---|
| 1 | REQ registrado | REQ con supuestos y criterios; ítem en `items[]`; ninguna DA que lo bloquee |
| 2 | Plan de lotes | Ficha de paso; `plan[]` con orden y riesgo |
| 3 | Lote encolado | Instrucción con cabecera completa; `cambios[]` en "encolado" — **no cortar mientras esté encolado y sin desplegar** |
| 4 | Lote desplegado | Commit; `log\NN-*.txt`; `/api/health` responde |
| 5 | Veredicto | `cambios[].aceptacion`; INC con nivel y causa; datos de prueba borrados |
| 6 | DA pendiente | DA-n con opciones y consecuencias; el lote afectado no se encola |
| 7 | Cierre de sesión | `estado-proyecto.md` + `transiciones-chat.md` + encargo del rol que sigue; el saliente suelta la escritura |

---

## BAI02 · Gestión de la definición de requisitos ✅

| Práctica | Nuestro proceso | Actividades |
|---|---|---|
| BAI02.01 Definir y mantener requisitos | Todo requerimiento, corrección o decisión del usuario se registra en `producto/requerimientos-consolidado.md` **antes** de construir, con código (`REQ-Xn`, ampliación `REQ-Xn.1`) y etapa en `seguimiento.json → items[]` | **-a** Claude registra en la misma sesión en que el usuario lo dice, aunque después vaya a preguntar o investigar. **-b** Decisiones abiertas → `DA-n` en `items[]` (necesitaDecision); se cierran con la respuesta textual del usuario y fecha. **-c (2026-09-28, adoptado por Carlos)** Lo que Carlos deja "para después" entra como pedido `P-n` en `pedidos[]` |
| BAI02.03 Gestionar el riesgo de los requisitos | Precisiones y correcciones del usuario quedan citadas ("dijo…") junto al REQ | **-a** Cuando Claude asume algo (roles fijos, valores por defecto), lo marca como supuesto y lo pregunta. **-b (2026-09-23, ISACA 02.03 act. 1)** Sección **"Supuestos"** en cada REQ nuevo; permanece marcada hasta que el usuario la confirme o corrija |
| BAI02.01 act. 9 · Validar requisitos con prototipos | Antes de redactar la instrucción de un lote con lógica de negocio, Claude presenta un **ejemplo numérico o una maqueta de pantalla** para que el usuario confirme | **-a** Aplica a lotes `normal` y `crítico`; en `estándar` no hace falta. Bocetos en `producto/bocetos/` |
| BAI02.04 Aprobar requisitos | El usuario aprueba al confirmar el REQ una vez ("ok", "dale"); desde ahí la delegación técnica cubre todos sus lotes; los cambios de alcance se vuelven a preguntar | — |

Vocabulario: en la interfaz y en los documentos, el tenant se llama **negocio** (nunca "cuenta", que se confunde con cuenta bancaria); en código sigue `cuenta_id`.

---

## BAI06 · Gestión de cambios de TI ✅

| Práctica | Nuestro proceso | Actividades | Estado |
|---|---|---|---|
| **BAI06.01** Evaluar, priorizar y autorizar solicitudes de cambio | Cada lote = una instrucción `NN-instr-<lote>.md` con **evaluación de riesgo, alcance e impacto** en la cabecera. Esa evaluación decide el alcance de las pruebas (BAI07.03) y el nivel de autorización | **-a Cabecera obligatoria** (ver plantilla). **-b Categoría:** `estándar` (UI, textos, docs) · `normal` (lógica, datos, permisos de UI) · `crítico` (auth, `api/col`, migraciones, dinero, sync). **-c Leer el código real** que el lote va a tocar antes de redactar (evitó INC-63/64; halló la causa de INC-78). **-d** Un lote = una funcionalidad completa (datos + API + pantallas + verificación); ni mínimos ni gigantes. **-e** Autorización (ISACA 06.01 act. 4): `estándar` = **preaprobado**; `normal` = la delegación de Carlos lo autoriza; `crítico` = Claude cruza el commit ("Hecho / No hecho") con Carlos antes de desplegar y deja `cambios[].cruceDueno`. **-f** (ISACA 06.01 act. 6) casillas: **¿toca datos personales o dinero?** (→ APO14/DSS05), **¿toca normativa?** (→ MEA03) y, desde el 2026-09-29 (aprobado por Carlos el 29-sep-2026), **¿toca el modelo (capa Marco)? sí / no**: si es sí, no entra a la cola; la resuelve el Arquitecto como cambio de tipo "modelo". **-g (2026-09-26)** El campo "Impacto: módulos vecinos" se llena consultando el mapa de relaciones (BAI10.02-c), no de memoria. **-h (2026-09-28)** La cabecera enlaza el riesgo con su `R-n`. **-i (2026-09-28, INC-79/81)** Ante un defecto de patrón (p. ej. fecha UTC), barrer todos los módulos antes de redactar: lo que entra al lote se declara en el alcance; lo que no (otra categoría, otro módulo), se registra como INC aparte y no se toca | ✅ |
| **BAI06.02** Gestionar cambios de emergencia | Hotfix en su propio commit, sin esperar el lote en curso; se documenta después como INC | **-a Definición (ISACA 06.02 act. 1):** emergencia = producción caída, pérdida de datos o acceso indebido; todo lo demás espera su lote. **-b** Instrucción corta "un solo tema"; **-c** INC en `items[]` con causa; **-d** el usuario ejecuta sin cruce previo (la urgencia manda) y Claude revisa después | ✅ (INC-55/56) |
| **BAI06.03** Seguir e informar el estado de los cambios | Trazabilidad requerimiento → instrucción → hash → verificación → aceptación | **-a Registro único de cambios** en `seguimiento.json → cambios[]` (REQ-SP4, desde el lote 17): lote · fecha · hash · versión · REQ · categoría · resumen · estado · observación · `aceptacion` · `costo` · `cruceDueno`. El historial B1 → lote 16 quedó en `archivo/estado-proyecto-historial-2026-09.md`. **-b Estados (ISACA 06.03 act. 1)** en `plan[]`: `previsto` → `encolado` → `desplegado` → `aceptado` / `no aceptado` → `cerrado`; `espera DA` si depende de Carlos | ✅ |
| **BAI06.04** Cerrar y documentar los cambios | El lote se cierra cuando está aceptado (BAI07.05) y documentado (BAI10) | **-a** Commit con lista **"Hecho / No hecho" por punto** y archivos realmente tocados; si difieren de los declarados, la CLI explica por qué. **-b** Una corrección = su propio fix, nunca "punto 0" de otro lote (INC-57). **-c** "Cómo quedó" en el REQ. **-d (ISACA 06.04 act. 3):** `CLAUDE.md` actualizado por la CLI en el mismo commit es **criterio de cierre** | ✅ |

### Plantilla de cabecera de instrucción (BAI06.01-a)

```
# instr-<lote> — <título> (<REQ/INC que cubre>)
Categoría: estándar | normal | crítico
Alcance: archivos que toca · tablas/colecciones/campos que crea o cambia · versión ?v= y schema_version destino
Impacto: quién lo siente si falla (admin / operador / colaborador / huésped) · módulos vecinos que comparten código o datos (consultar BAI10.02-c)
Riesgo: por qué esa categoría (auth, permisos, migración, dinero, sync, pérdida de datos) · R-n del registro de riesgos
¿Datos personales o dinero?: sí / no · ¿Normativa?: sí / no · ¿Toca el modelo (capa Marco)?: sí / no (si es sí, no va a la cola: la resuelve el Arquitecto)
Pruebas derivadas: réplica (qué lógica) · producción (qué zonas) · qué NO se prueba y por qué
Reversión: git revert <hash> + despliegue (y si hay migración, cómo queda la base)
```

---

## BAI07 · Gestión de la aceptación y transición de cambios ✅

| Práctica | Nuestro proceso | Actividades | Estado |
|---|---|---|---|
| **BAI07.01** Plan de implementación | La instrucción es el plan: orden de puntos, migraciones idempotentes, migración al leer para datos viejos | **-a** Reglas fijas de `CLAUDE.md` (sin `alert/confirm/prompt`, sin PR, push a `main`, ediciones quirúrgicas, defaults) | ✅ |
| **BAI07.03** Planificar pruebas de aceptación | La sección "Pruebas derivadas" de cada instrucción son los **criterios de aceptación**, derivados de la evaluación de riesgo (BAI06.01). Se escriben antes de construir, con valores esperados | **-a** Casos con datos concretos. **-b** Alcance proporcional: `estándar` → comprobación mínima; `normal` → réplica de la lógica + zona tocada; `crítico` → además login real, permisos 403, sesión del colaborador si aplica. **-c (ISACA 07.03 act. 8):** cada criterio dice qué pasa si falla: *seguir* (INC bajo), *detener* (fix obligatorio antes del siguiente lote) o *revertir* | ✅ |
| **BAI07.04** Ambiente de pruebas | No existe: se verifica en producción con datos de prueba propios (prefijo reconocible) que se borran al final; nunca con los datos reales de Carlos (R11) | **🔮 Requerimiento de proceso:** cuenta de pruebas en la misma base cuando arranque la operación real | 🔮 |
| **BAI07.05** Ejecutar pruebas de aceptación | Dos capas: **réplica** en la CLI antes del commit (`tests/`) y **verificación en producción** en Chrome, punto por punto contra la instrucción | **-a** Réplicas en `tests/` solo para lógica pura que ya se rompió una vez; cada lote que las toque agrega casos. **-b Verificación por zona tocada:** auth → login real; `api/col` → 403 del colaborador y merge; reservas → `sync-ical/ultimo`; portal/HK → sesión del colaborador si aplica. **-c** Resultado **criterio por criterio** en `cambios[].aceptacion.criterios[]` (desde el lote 29); un criterio incumplido deja el lote **"desplegado, no aceptado"** y el fix es obligatorio antes del siguiente lote. **-d Independencia (ISACA 07.05 act. 4):** quien construye (agente CLI) nunca acepta; acepta el agente verificador (o el chat en ese rol); lo que solo la CLI probó por réplica se reporta como tal. **-e (2026-09-28, lotes 31–32)** Si el criterio depende de la hora (fechas, tolerancias, "hoy"), la aceptación dice si se usó el **reloj real** o uno **simulado** (`aceptacion.modoVerificacion`); simular = reemplazar `Date` solo en memoria y restaurarlo. **-f (2026-09-28)** Cuando basta con presentación o cálculo, el dato de prueba puede ser un **objeto sintético en memoria** pasado a las funciones de la página (o un `getProps` temporal restaurado al final): no escribe nada y no deja datos que borrar | ✅ |
| **BAI07.06** Promover a producción | Push a `main` → despliegue automático → comprobar que ocurrió | **-a Comprobación mínima siempre:** `/api/health`, HTML con `?v=` nuevo, consola limpia. **-b** Reversión: `git revert`; migraciones aditivas. **-c** La documentación se actualiza en la misma sesión. **Cierre del REQ:** ✔ cuando todos sus lotes están `aceptado`, sin INC abiertos y con "cómo quedó"; **✔ c/obs.** con observación escrita | ✅ |
| **BAI07.07** Soporte inicial | Datos de prueba con prefijo reconocible y borrados; lista de "datos que quedan" en el punto de pausa | — | ✅ |
| **BAI07.08** Revisión posimplementación | Una por **paso**, tras uso real, con forma fija en `posimplementacion[]` | **-a Cinco preguntas:** ¿qué se prometió? · ¿qué quedó? · ¿se usa? (responde Carlos) · ¿qué costó de más? · ¿qué regla cambia? **-b** Salidas: decisión (seguir / ajustar / parar), patrón de incidentes, cero o una regla nueva en este documento. **-c** Primera: Paso 5(a), cuando Andrés o Betty hayan trabajado dos o tres turnos reales | ⏳ |

---

## BAI10 · Gestión de la configuración ✅

| Práctica | Nuestro proceso | Actividades |
|---|---|---|
| BAI10.01 Modelo de configuración | `interno/elementos.json` (índice de todo elemento del proyecto con capa, rol, proceso, entradas/salidas y relaciones) → página Elementos; `marco/patrones-codigo.md` describe el código | **-a** Un elemento nuevo entra al índice en la sesión que lo crea; uno superado pasa a `superado` con puntero |
| BAI10.02 Repositorio de configuración | `CLAUDE.md` (lo lee la CLI) y `patrones-codigo.md` (lo lee Claude); `?v=` y `schema_version` identifican la versión desplegada | **-a** Cada lote sube `?v=` en todos los HTML, `STR_API_VERSION`, iframes del shell y `_irAFlujos`. **-b** Cada migración sube `schema_version`, idempotente |
| **BAI10.02-c (2026-09-26) Mapa de relaciones entre configuración** | Registro liviano de qué piezas comparten código o datos, para que la evaluación de impacto (BAI06.01-g) consulte una tabla | **-a** Vive en `CLAUDE.md` (sección de módulos y colecciones), no en `mapa-sistema.md` (archivado). **-b** Se actualiza cuando un lote descubre un acoplamiento no documentado |
| BAI10.03 Mantener y controlar los elementos | Qué documento se revisa y se actualiza cuándo: campos `usa[]`, `entrada_de[]`, `salida_a[]` y `notas` de `elementos.json` | `CLAUDE.md` por lote; `.md` al cierre de sesión; JSON al cerrar cada lote |
| BAI10.04 Informes de configuración | Página Elementos y `cambios[]` dicen qué hay desplegado | **-a (ISACA 10.04 act. 2):** archivos declarados en la instrucción vs archivos del commit; toda diferencia exige explicación (INC-55) |

Regla: **una cosa vive en un solo documento**; revisar es barato y ocurre al iniciar; actualizar ocurre **antes de construir** (requerimientos) y **después de aceptar** (JSON, patrones), nunca a mitad de camino; los `.md` una sola vez al cierre.

---

## DSS02 · Gestión de solicitudes e incidentes ✅

| Práctica | Nuestro proceso | Actividades |
|---|---|---|
| DSS02.01 Esquema de clasificación y escalamiento | **Tres niveles:** **crítico** = pérdida de datos, acceso indebido o bloqueo de uso → hotfix el mismo día (BAI06.02); **medio** = función incorrecta sin pérdida → fix propio antes del siguiente lote; **bajo** = cosmético → deuda técnica (DT) o siguiente lote del módulo | **-a** El nivel se escribe en el INC al registrarlo |
| DSS02.02 Registrar, clasificar y priorizar | Todo hallazgo en verificación o en uso es `INC-n` en `seguimiento.json → items[]` con fecha, módulo, descripción, **nivel** y estado | **-a** Lo observado literal; lo registra el verificador o el chat. **-b (2026-09-28)** Un defecto anterior al lote que se verifica, hallado durante la verificación, es INC propio (no hace fallar el lote) y dice "anterior al lote N" (INC-79) |
| DSS02.04 Investigar, diagnosticar | Reproducir en producción con Chrome o por réplica; escribir la **causa**, no el síntoma | **-a (ISACA 02.04 act. 1):** lista de **errores conocidos** en `marco/patrones-codigo.md`; se revisa antes de cada diagnóstico y se amplía con cada INC cerrado. **-b (2026-09-28, INC-80)** Un fallo de la cola sin commit se diagnostica en `log\NN-*.txt` antes de tocar la instrucción; si la causa es el cupo de sesión de la CLI, se reencola el mismo archivo sin cambios |
| DSS02.05 Resolver | Fix en su propio lote (`NN-instr-fix-*.md`, "un solo tema"), nunca mezclado | — |
| DSS02.06 Cerrar | Solo con verificación en producción; el INC queda ✔ con hash y qué se verificó | — |
| DSS02.07 Seguimiento y tendencias | La posimplementación (BAI07.08) mira los INC del paso juntos para hallar el patrón | — |

Deuda técnica (`DT-n`) en `estado-proyecto.md` sección 6 y en `items[]`; riesgos (`R-n`) en `riesgos[]`.

---

## MEA01 · Supervisión del rendimiento y la conformidad 🟡

| Práctica | Nuestro proceso | Actividades |
|---|---|---|
| MEA01.02 Fijar metas | **Una meta medible por paso (SMART):** qué, cuánto, para cuándo, en términos del negocio. Paso 5(a): "Andrés cierra 3 turnos reales desde el celular antes del 2026-10-15". Paso 5(b): "la liquidación de octubre sale de la app" | **-a** La meta va en la ficha de inicio del paso (BAI11.02) y se evalúa en la posimplementación |
| MEA01.04 Analizar e informar | **Informe de avance** a pedido ("en qué vamos"): prosa de 150–250 palabras desde `estado-proyecto.md` y `seguimiento.json` (plantilla en `estado-proyecto.md` sección 11) | **-a** Si el informe revela que el estado está atrasado, actualizarlo primero. **-b (2026-09-28, IT-4)** Toda hora o duración que se informa sale del reloj o de un log; si no se midió, se dice "sin medir" o se pide a Carlos |
| MEA01.05 Acciones correctivas | Las lecciones de incidentes, posimplementación y transiciones entran como actividades nuevas en este documento, con su origen | Incorporadas: leer el código antes (INC-63/64, INC-78) · declarados vs tocados (INC-55) · corrección en fix propio (INC-57) · comprobar el despliegue antes de verificar (R8) · verificar contra la spec (INC-52) · login real cuando se toque auth (INC-55) · una clave de colección solo la escribe `/api/col` (INC-45) · el servidor manda si conoce la colección; migraciones al leer tras el primer pull (INC-78) · un dato una fuente (REQ-SP4) · tiempos medidos (IT-4) · reloj real o simulado declarado y barrido de patrón (INC-79/81) · diagnóstico en el log y reencolar por cupo (INC-80) · tarea sin condición de batería (lote 31) |

---

## Objetivos adoptados parcialmente (2026-09-23, actualizado 2026-09-28)

Solo las prácticas listadas; el resto de cada objetivo queda fuera a esta escala. Detalle y posición completa en la página Cobit.

| COBIT | Práctica adoptada | Nuestro proceso | Cuándo |
|---|---|---|---|
| **APO01.03/.04/.05/.07/.09/.10/.11** | Marco de gestión | Sección "Modelo de operación" de este documento | Desde 2026-09-28 (REQ-SP5 ✔) |
| **BAI03.06** Aseguramiento de calidad (act. 3) | Carpeta `tests/` con las réplicas de la lógica que ya se rompió una vez; `node tests/run.js` antes de cada commit que las toque. **Guardias de patrón:** un test puede recorrer el código y fallar si reaparece un patrón que ya causó un INC (`tests/fecha-local.test.js` contra `toISOString().slice(0,10)`, INC-79) | Desde B1/B2 (18 archivos al 28-sep) |
| **BAI03.09** Cambios a los requisitos | Un cambio de alcance durante un lote no se cuela: se registra como `REQ-Xn.1` y va en un lote nuevo | Ya |
| **BAI03.10** act. 4 Patrón de mantenimiento | La pregunta 4 de la posimplementación mira los INC del paso juntos | Con BAI07.08 |
| **DSS02.01 / 02.04** | Tres niveles de incidente y lista de errores conocidos | Ya |
| **BAI10.04** act. 2 | Archivos declarados vs tocados | Desde B1 |
| **MEA01.02** | Meta SMART por paso | Ya |
| **BAI11.02** Iniciar (act. 1 y 3) · **BAI11.09** Cerrar (act. 2 y 5) | Cada **paso** es un proyecto: ficha de media página en `estado-proyecto.md` (alcance, meta SMART, criterios de éxito, riesgos, supuestos), plan de lotes en `plan[]`, cierre con posimplementación. Sin PMO, sin cronograma | Fichas de 5(b) y 6 escritas |
| **BAI08.03 / 08.04** Compartir y retirar | Traspaso entre chats (`transiciones-chat.md` + encargo rol-*); fecha de vigencia en cada elemento (`elementos.json`); lo superado pasa a `claude/archivo/` como puntero con fecha | Carpetas por capa desde 2026-09-28 |
| **APO12.03** act. 2 · **APO12.06** act. 1 | `riesgos[]` con escenario, tolerancia y respuesta probada: R-1 pérdida de datos · R-2 acceso indebido · R-3 hosting vencido · R-4 dueño indisponible · R-5 contexto perdido | Publicado 2026-09-28; **tolerancias aceptadas por Carlos el 28-sep**; R-5 probado (1 min) |
| **BAI04.01** act. 2 y 3 | Comprobación diaria automática de `/api/health` y de la última corrida de `sync-ical`; aviso al dueño si falla (agente de salud) | Al arrancar la operación real |
| **APO11.05** act. 3 | Defectos recurrentes → causa raíz → acción acordada; lo hacen DSS02 y BAI07.08 | — |
| **APO06.05** act. 8 | Costo por lote en `cambios[].costo {tokens, minutosCLI, minutosDueno, nota}`, para calibrar el tamaño de lote. **Medido, nunca estimado** (log de la cola, reloj); lo que no se midió queda en `null` con nota; **la espera no es trabajo**. **Regla de consolidación (2026-09-24):** juntar lotes cuando mismo módulo/pantalla, misma categoría, sin dependencia de aceptación y ≤ 8 min de CLI; separar cuando hay migración, dinero/datos personales, corrección de producción o dos módulos con lógica distinta | Desde el lote 31 |
| **APO09.03** | Qué promete cada plan | 🔮 con clientes; hoy solo el contrato con Hostinger (vence 2026-11-03) |

**Fuera, aunque ISACA lo pida:** modelos de cobro y asignación de costos (APO06.04), catálogos y acuerdos de servicio con proveedores (APO09.01–.02), sistema de gestión de calidad y certificaciones (APO11.01–.03), taxonomía y perfil agregado de riesgo (APO12.01–.04), oficina de proyectos (BAI11.01), CMDB completa (BAI10.02), planes de continuidad probados (DSS04), ubicación de la función de TI y habilidades objetivo (APO01.06, 01.08).

## Ciclo de una sesión (resumen operativo)

1. **Iniciar:** si es un **chat nuevo**, pegar el encargo `rol-desarrollo` (Instrucciones) y leer la última entrada de `gobierno/transiciones-chat.md`, declararse escritor único y firmar la recepción con la hora del reloj (BAI08). Luego `gobierno/estado-proyecto.md` (semáforo, punto de pausa, decisiones abiertas, próximos pasos) y `seguimiento.json` (`plan[]`, `cambios[]`, ítems con "necesita tu decisión"); comprobar accesos (equipo y carpetas, Chrome, escritura en `str-manager-docs`); confirmar el objetivo con Carlos; registrar lo nuevo (BAI02).
2. **Redactar:** leer el código real a tocar; validar con un ejemplo o maqueta si hay lógica de negocio (BAI02.01-9); si el defecto es de patrón, barrer todos los módulos (BAI06.01-i); instrucción corta con cabecera (categoría, alcance, impacto consultando el mapa de relaciones, riesgo con R-n, datos/normativa, pruebas derivadas con su consecuencia, reversión). `estándar` y `normal` no esperan autorización; `crítico` cruza el commit con Carlos antes de desplegar.
3. **Construir por la cola (agente CLI):** dejar `NN-instr-<lote>.md` en `C:\Users\ktcol\Downloads\str-instr-cola\` del equipo activo con `device_commit_files` y anotar la hora del reloj; la tarea de Windows "STR cola CLI" (cada minuto, sin condiciones de energía) ejecuta `ejecutar-cola.ps1`, que corre la CLI con `--permission-mode auto`, hace push y mueve el archivo a `hechas\` (o a `fallidas\` y detiene la cola). **Un lote a la vez.** Programar la revisión (+15 min; luego cada 5 min). `plan[]` en `encolado`. Si falla sin commit, leer el log: por cupo de sesión, reencolar igual (INC-80). Los `crítico` nunca entran a la cola sin el cruce previo. Detalle en `marco/comandos-usuario.md` e ins-002/003/004/005.
4. **Desplegar:** el push a `main` despliega; comprobación mínima (`/api/health`, `?v=`).
5. **Aceptar (agente verificador o el chat en ese rol):** verificación por zona y punto por punto en Chrome con datos de prueba propios borrados al final u objetos sintéticos en memoria; reloj real o simulado declarado si el criterio depende de la hora; archivos declarados vs tocados; `CLAUDE.md` actualizado; INC-n con nivel y causa por cada incumplimiento; `cambios[].aceptacion` criterio por criterio y `costo` medido; `plan[]` en `aceptado` o `no aceptado`.
6. **Documentar (JSON al momento, `.md` al cierre):** `cambios[]`, INC, `plan[]` se escriben al cerrar el lote (push al repo de docs, sin lote); "cómo quedó" en el REQ y bitácora en `patrones-codigo.md` al cierre de sesión; un acoplamiento nuevo va al mapa de relaciones de `CLAUDE.md`.
7. **Cerrar la sesión:** `estado-proyecto.md` (semáforo, punto de pausa, deuda, decisiones, próximos pasos, fecha), `seguimiento.json` al día, entrada nueva en `transiciones-chat.md` con el mensaje de traspaso y el encargo que sigue; una sola escritura por documento; el chat saliente deja de escribir (R1). Cortar solo en un punto de corte limpio.
7b. **Siempre que se escriba un documento del proyecto:** leer primero la versión actual (`project_read`) y aplicar el cambio sobre ella (IT-1).
8. **Por paso:** ficha de inicio con meta SMART (BAI11.02, MEA01.02) y posimplementación con las cinco preguntas en `posimplementacion[]` cuando haya uso real (BAI07.08, BAI11.09).

---

## Regla de oro

> **Verificación antes de aceptar — siempre; y proporcional al riesgo.**
> Un bug en producción le cuesta más al negocio que el tiempo de verificar; verificar todo por igual cuesta más que evaluar el riesgo primero.

---

*Creado: 2026-08-27 · Reorganizado: 2026-09-07 · Enmarcado en COBIT 2019 y revisado contra el detalle oficial de ISACA: 2026-09-23 · Cola automática incorporada al ciclo: 2026-09-24 · Transiciones de chat (BAI08.03) e IT-1: 2026-09-25 · Mapa de relaciones entre configuración (BAI10.02-c): 2026-09-26 · Modelo de operación (APO01), capas y fuente única del seguimiento: 2026-09-28 · Lecciones del primer ciclo bajo el modelo (lotes 31–32, T-5): 2026-09-28 noche · Chat de diseño, despertador con vigía y un token por chat: 2026-10-09 · Chat Jefe de proyecto separado de Diseño (LM-57): 2026-10-18 · Archivado como Parte II del manual: 2026-10-21 (LM-74)*
