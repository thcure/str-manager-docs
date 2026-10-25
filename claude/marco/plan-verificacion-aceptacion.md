# Proceso 4 · Verificación y validación (ISO/IEC/IEEE 12207 6.4.9, 6.4.11) · pruebas y aceptación · Verificación y aceptación (PRUEBAS-v2) · plan en cruce

**Estado:** **PRUEBAS-v2 vigente** · aprobado por Carlos 20-oct-2026 (19:05; umbral V9 3 s) · LM-62 instalado en el repo y en LENOVO (pw 0.11.0, juez v2); prueba real en el primer tren tras la pausa; `tec` y punto 21 del revisor por lote tras la pausa · cruce: Desarrollo M-940/943/946/949, Diseño M-941/944/947/950, Jefe de proyecto M-942/945/948/951 · **Autor:** Chat Arquitecto · **Marco:** MJ-17 paso 2 · COBIT BAI07.03–.05 y BAI03.07/.08 · ISO/IEC/IEEE 29119-1/-2 (2021), -3, -4 · **Sustituye al aprobarse:** PRUEBAS-v1 (LM-18), que sigue vigente mientras tanto.

**Al día al 25-oct:** la prueba de capacidad entra como prueba de rendimiento de la fábrica (V9 mide la página; la ráfaga mide el servidor): `herramientas/pw/rafaga.spec.js` v1.1b (LM-68), solo lectura, en `zz-verif-pruebas`, la lanza la cola v12 (LM-78) cada 10 lotes aceptados o al tocar `database.php`/`str-api.js`; criterio estricto 24×200 (INC-208), cualquier 1040, 1203 o 500 «Base de datos no disponible» es rojo. Primera corrida válida 21-oct 21:33. La línea objetivo (LM-80) añade al modelo de prueba los escenarios de las diferencias `D-<MOD>-n` validadas; el lote que las construye las cita en «Diferencias:».

## 1. Qué pide la norma y qué dicen los que la aplican

ISO/IEC/IEEE 29119-2:2021 ordena las pruebas en tres capas: el **proceso organizacional** (política y estrategia de pruebas de la casa), los **procesos de gestión** (estrategia y planificación, monitoreo y control, finalización) y los **procesos dinámicos** (diseño e implementación, entorno y datos, ejecución, reporte de incidentes). La edición 2021 cambió el diseño de pruebas: ya no parte de «condiciones de prueba» sino de **modelos de prueba** (para nosotros: el caso de uso y sus criterios), de los que salen los elementos de cobertura y los casos. La 29119-1 pone como eje las **pruebas basadas en riesgo**: la profundidad la decide el riesgo, no la costumbre. La 29119-3 fija los documentos: plan, informe de estado, informe de finalización, especificación de casos, requisitos de datos y entorno, informe de preparación del entorno, registro de ejecución e **informe de incidente**. La 29119-4 cataloga las técnicas (partición de equivalencia, valores límite, tablas de decisión, transición de estados, escenarios, adivinación de errores).

Referencias reales de cómo se vive esto a diario:

- **Google (Micco, 2016):** 1,5 % de las ejecuciones son inestables («flaky»), 16 % de los tests lo son alguna vez y 84 % de las transiciones verde→rojo tras un envío involucran uno inestable. Un test marcado inestable solo cuenta como rojo si falla 3 veces seguidas; una herramienta lo pone en **cuarentena** y abre un bug. El propio autor advierte el costo: tres reintentos de un test de 15 min tardan 45 en descubrir una rotura real, y la cuarentena puede esconder una condición de carrera.
- **GitLab:** un fallo se **reintenta una sola vez** en un proceso aparte; si pasa, el test queda etiquetado por causa (`state leak`, `dataset-specific`, `unreliable dom selector`, `datetime-sensitive`, `improper synchronization`, `unstable infrastructure`…). La cuarentena tiene una vía rápida cuando bloquea `master` y una de largo plazo con dueño; tableros de fallos a 30 días.
- **Mozilla (política de los sheriffs):** un test intermitente se escala si está en el top 20, falla ≥ 8 % de las veces o suma > 100 fallos en 30 días; needinfo al autor (2 días hábiles), luego al dueño del módulo (2 días), luego se deshabilita. Si falla ≥ 30 % se deshabilita primero y se investiga después; si se añadió hace menos de 7 días, se revierte el parche.

Lo común a los tres: **reintentar poco y contarlo**, umbral numérico de cuarentena, dueño y plazo para cada caso en cuarentena, y causa clasificada.

## 1b. Lectura del texto completo (29119-2:2013, 29119-3:2013 y -3:2021, 29119-5:2016; Carlos las pasó)

La estructura de 2013 y 2021 es la misma; el único cambio de fondo es «condiciones de prueba» → «modelos de prueba» (prólogo de la -3:2021). **Nuestro modelo de prueba es el caso de uso de la línea base**, y la cadena de trazabilidad que la norma exige (TD1–TD6: base → conjuntos de características → modelo → elementos de cobertura → casos → conjuntos → procedimientos) ya existe con otros nombres: REQ y caso de uso → módulo/capacidad → caso de uso con sus flujos → **criterio con letra** → **caso del guion con la misma letra** → `tests/e2e/<X>.spec.js` → el orden de los casos dentro del guion. Lo que la lectura añade o afina:

- **TP3–TP5, TD1–TD6:** el riesgo, clasificado producto/proyecto con exposición aprobada, prioriza *todo*: conjuntos, modelos, casos y procedimientos. Confirma V7 y le exige un dato: la instrucción muestra el riesgo del módulo en su «Ruta de pruebas» y la cola ordena por él (fase 1 vs tren).
- **TP5 c) y 29119-3 §6.2.7.9:** la estrategia declara **criterios de suspensión y reanudación**, quién suspende y qué se repite al reanudar. No los tenemos escritos → **V10**.
- **TP5 NOTE 3 y §6.2.7.10:** una desviación de la estrategia se registra con su autoridad. Nuestra «Regresión:» explícita es una desviación: lleva motivo en la instrucción y el revisor lo comprueba (se suma a V3).
- **TD6 a):** el **procedimiento de prueba** ordena los casos por sus pre y poscondiciones. Es exactamente el guion (a → b → e → c sobre la propiedad que crea a): por eso el reintento de V2 es del procedimiento entero, no del caso. La norma nos da la razón a Desarrollo y a mí.
- **TE2 b) e IR1:** si un reintento pasa, el informe de incidente se actualiza; todo resultado se analiza y termina en una de tres cosas: incidente, acción sin incidente, o nada (y esa decisión se habla con quien lo vio). Regla para el veredicto: **ningún rojo muere en silencio**: INC, entrada de cuarentena, o nota «acción sin INC» con motivo (se suma a V2 y V6).
- **IR2 NOTE 1 y 29119-3 §7.12.5:** un incidente puede ser contra el producto, el procedimiento (guion), la base (REQ) o el entorno; campos al abrirlo: momento, **originador**, **contexto** (elemento, procedimiento y caso, entorno y datos, proceso), descripción con reproducibilidad y evidencia, severidad, prioridad, riesgo. Afinan V6: `contra` (producto · guion · REQ · entorno · herramienta), `originador` (juez · tren · Diseño · Desarrollo · Carlos), `contexto` {lote, guion, caso, tren}; prioridad la fija Diseño al clasificar (ya lo hace), separada de la severidad.
- **TMC4 y §7.3 (informe de estado) / §7.4 (informe de finalización):** además de las medidas, piden **factores que bloquearon**, **desviaciones** de lo planeado, **riesgos residuales** y activos reutilizables. Afinan V8: la ficha semanal suma bloqueos de P4 con causa, desviaciones («Regresión:» explícita, criterios no verificables) y riesgos residuales (los trinquetes: casos esenciales sin guion).
- **TC2:** el entorno vuelve a un estado predefinido al terminar: nuestra semilla fija más el borrado de `zz-verif-L<n>-`; `pw\semilla.js` repone. Ya cumple; se nombra en §6.
- **29119-5 (palabras clave):** `herramientas/pw/guion.js` y `comun.js` son una **biblioteca de palabras clave** (h.captura, limpiar, crear propiedad…). La norma pide referencia cruzada (qué guion usa cuál), una autoridad, revisión periódica, sin redundancias y con versiones → **V11**.

## 2. Lo que ya tenemos, en el lenguaje de la norma

| 29119-2 | Nuestro equivalente | Estado |
|---|---|---|
| Política y estrategia organizacional | PRUEBAS-v1 (LM-18): niveles N1–N4, independencia (quien construye no escribe el guion ni acepta), producción con semilla `zz-verif-`, guardia de red | vigente |
| Plan de pruebas (por lote) | sección «Pruebas» de la instrucción (P2) + «Ruta de pruebas» (LM-41) + «Casos de uso:» (LM-60) | vigente |
| Monitoreo y control | `pw\metricas.js` → `log\METRICAS.json` semanal (LM-39c); revisión semanal del Arquitecto; semáforo del Jefe de proyecto | instalado |
| Finalización | veredicto `L-n-veredicto.json`; guion conservado en `tests/e2e/`; datos `zz-verif-L<n>-` borrados y listados; lecciones BAI08 | vigente |
| Diseño e implementación | criterios del REQ con letra, nivel y caso de uso (LM-61) → casos a, b, c del guion; `cubre` por caso | vigente desde LM-61 |
| Entorno y datos | `pw\semilla.js`, `pw\humo.js`, `pre-vuelo.json` (informe de preparación del entorno), P4 bloquea sin gastar | instalado |
| Ejecución | cola v9 + pw 0.7.0: fase 1 por lote, fase 2 en tren (LM-49); regresión por ruta (LM-39b); centinelas | instalado |
| Reporte de incidentes | `seguimiento.json › incs[]` con `causaRaiz`, `debioDetectarse`, severidad, etapa | vigente |
| Cuarentena | LM-39a escrito y MJ-1 decidida; `cuarentena.json` **no instalado** | pendiente |

## 3. Los datos de hoy (fuente: `log\METRICAS.json` del 15-oct, `seguimiento.json` del 20-oct)

- Semana del 12-oct: 80 corridas, **33 repruebas (41 %)**, 26 rojos de los cuales **73 % ajenos al lote**, 10 bloqueadas en P4, cola 5,2 min y pw 4,7 min por corrida, 0,7 h de construido a aceptado.
- 36 guiones, 123 casos, 1 477 ejecuciones, 35 fallos (2,4 %); 29 casos con algún fallo; el peor, `REQ-INV2-7-1-hk-turno d`, 4 de 22 (18 %). **`casosAlerta` vacío**: el umbral actual (≥ 2 fallos y ≥ 30 %) no salta nunca con historiales largos.
- Lotes con `tiempos`: 30; **7 con más de un veredicto (23 %)**, meta ≤ 15 %; 9 bloqueados.
- Trinquete: **200 casos de uso esenciales sin guion**; cobertura de criterios por guion o `tests/`: sin medir desde v1.
- Incidentes: 130 (57 abiertos). De los 81 con `debioDetectarse`: **55 «revisión previa»**, 18 «tests», 4 «solo en uso», 3 «REQ», 1 «verificación». 49 sin `causaRaiz` ni `debioDetectarse`. La severidad tiene 7 valores para 4 niveles (`bajo/baja/menor`, `medio/media`).
- El tren del 19-oct dio rojo por un caso (138/139), causa: nombre de prueba más largo que el campo (INC-204): una prueba que falla por su propio dato, no por el producto.

Lectura: el producto no es lo que más falla; **falla la prueba** (ajenos 73 %, repruebas 41 %) y **falla antes de probar** (55 de 81 escapes debieron caer en la revisión previa). La norma apunta ahí: control de la salud de los casos, finalización con lecciones que vuelven al proceso, y diseño de casos con técnica.

## 4. Brechas

| # | Brecha | Norma | Dato |
|---|---|---|---|
| B1 | Sin cuarentena ni umbral vivo: un caso inestable rechaza lotes ajenos o se reprueba a mano | 29119-2 §7.3 control; Google, GitLab, Mozilla | 73 % rojos ajenos; alerta nunca salta |
| B2 | Repruebas sin regla: se repite hasta que da verde, sin dejar huella de inestabilidad | §8.4 ejecución; GitLab 1 reintento | 41 % repruebas |
| B3 | Criterios de salida del lote implícitos: «aceptado si todo cumple», pero no se mide qué criterios del REQ quedaron sin caso | §7.2 criterios de finalización; BAI07.03 | cobertura «sin medir»; 200 esenciales sin guion |
| B4 | Casos sin técnica: cada guion inventa sus casos; faltan límites, negativos y permisos por rol de forma sistemática | 29119-4; §8.2 modelos → cobertura → casos | INC-204 (dato límite); revisor previo punto 7 solo 403 |
| B5 | Los escapes no vuelven al proceso: `debioDetectarse` se anota pero no cambia el revisor ni las guardias | §7.4 lecciones; BAI03.08 | 55 de 81 «revisión previa» |
| B6 | Informe de incidente incompleto: 49 INC sin causa ni etapa; severidad con 7 valores | 29119-3 §informe de incidente | 49 / 130 |
| B7 | Profundidad igual para todo riesgo: la ruta se deriva de la estructura, no del riesgo del módulo | 29119-1 pruebas basadas en riesgo | riesgo por módulo existe en el mapa, no manda en la regresión |
| B8 | Sin prueba no funcional mínima: tiempo de respuesta, tamaño de página | 29119-1 tipos de prueba | ninguna |

## 5. Controles propuestos (V1–V11)

| # | Control | Regla | Guardia |
|---|---|---|---|
| V1 | Cuarentena con umbral | Un caso entra en cuarentena cuando falla **≥ 8 % en las últimas 30 corridas o ≥ 3 veces en 10**; si falla ≥ 30 % entra de inmediato. Al entrar: INC con **causa clasificada** (`estado compartido`, `dato de prueba`, `selector`, `tiempo/fecha`, `sincronización`, `entorno`) y dueño (Desarrollo). **La causa `producto` no es cuarentena** (cruce, Desarrollo): es un defecto real, INC normal y el lote se rechaza. En cuarentena el caso corre y se registra, pero no rechaza. Sale cuando lleva 20 corridas en verde tras el arreglo. **Plazo: dos lotes aceptados, de cualquier grupo**; vencido, **la cola salta el caso desde `cuarentena.json`** (no se borra del guion, que eso exige un lote y pierde la prueba) y el INC queda como deuda de cobertura; lo reactiva el lote que lo arregla. | cola (LM-39a con estos umbrales) · `metricas.js` escribe candidatos en `cuarentena.json` · despertador recuerda el vencimiento (plazos en `proceso.json`); el semáforo del Jefe de proyecto lo comprueba al cerrar la tanda y avisa por el buzón |
| V2 | Un reintento del guion, contado por caso | Un guion con un rojo se reintenta **una vez, entero, después de su `limpiar()`** (cruce, Desarrollo: los casos de un guion dependen de los anteriores y `limpiar()` corre al final, así que reintentar un caso solo daría un rojo falso; `correrGuion` recarga el spec y RUN es nuevo). Cada caso que pase en el reintento suma «inestable» a su historial (cuenta para V1) y el veredicto lo lista. Costo: un guion más, uno o dos minutos, solo cuando hay rojo. Nunca dos reintentos; nunca repetir el lote entero «a ver si pasa» sin INC. | pw (`probar-lote.js`) · juez: campo `inestables[]` |
| V3 | Criterios de salida del lote | El veredicto dice, por criterio del REQ con letra: caso que lo cubre (N1/N2/N3/N4) y resultado. **Aceptado** exige todos los N1/N2 verdes y ningún criterio sin caso salvo los declarados «no verificable» con motivo. `linea-base.py --lote` ya calcula los casos de uso; se extiende a **criterios sin caso** (lee las letras del REQ, LM-61) y la cola lo exige en P4. Cuenta como «caso» (cruce, Desarrollo): el caso N2 del guion con la misma letra; un **N1 en `tests/` declarado en P2 para esa letra** (como L-158 con REL-22, que un guion no puede llamar al cron, RT-22); en un **lote de INC sin REQ**, las letras salen de los criterios de la instrucción; un **lote técnico sin caso de uso** no tiene letras y pasa. Un criterio **«no verificable»** lleva en el REQ el motivo y cómo se comprueba en su lugar (N3 inspección o N4 demostración con Carlos, y quién); sin motivo, `--req` lo marca como error (cruce, Diseño). | `linea-base.py --lote` (rc 2) y `--req` · revisor previo 13 |
| V4 | Técnica por nivel | Mínimo por criterio: N1 → partición de equivalencia + **un valor límite** por campo numérico, fecha o longitud; N2 → **escenario** (camino principal del caso de uso + un alterno + un negativo); permisos → **tabla de decisión** rol × acción para todo caso de uso con más de un rol. **La tabla la marca Diseño en el REQ** (cruce, Diseño: quién puede qué es decisión de producto, DA-53 a DA-56) como criterio «permisos»: roles de la línea base (admin, operador con o sin el permiso X, colaborador), acción y resultado esperado (permitido, o 403 y el dato no cambia); Desarrollo deriva de ella los casos negativos, no la deduce; un caso de uso multirrol sin tabla lo devuelve el revisor previo. La técnica va como **campo del caso** en el guion, `tec: 'límite' | 'escenario' | 'decisión'` (cruce, Desarrollo), para que el juez y `metricas.js` la lean sin adivinar; toca `tests/e2e-esquema.test.js`, así que entra en un lote después de la pausa junto con el punto 21. | revisor previo **punto 21** · plantilla `instruccion.md` y `guion-e2e.js` · `--req` (tabla en multirrol) |
| V5 | Escapes que vuelven | Todo INC nuevo lleva `causaRaiz` y `debioDetectarse` (lista cerrada: `REQ`, `revisión previa`, `tests`, `guion`, `verificación`, `solo en uso`). En la revisión semanal, cada INC con `debioDetectarse = revisión previa` o `tests` produce **una de tres cosas**: punto nuevo del revisor, guardia en `validar.py`/hook, o «aceptado como riesgo» con nota. Métrica: **escapes por etapa** por semana. | validar.py error para INC con fecha ≥ instalación · ficha semanal |
| V6 | Informe de incidente | Severidad en lista cerrada `bajo · medio · alto · crítico` (se normalizan los 7 valores actuales en una pasada); campos mínimos del INC: título, módulo, **caso de uso**, pasos o guion que lo reproduce, esperado vs. obtenido, evidencia (ruta en `log\`), severidad, estado. El caso de uso lo pone **Desarrollo al abrir el INC con `--cu`** (seguimiento.json es suyo); Diseño lo revisa al clasificar y corrige por el buzón; «sin caso de uso» entra a su `bolsa[]` como alcance incompleto (C3) (cruce, Diseño). Con `contra = REQ` (el defecto está en el requerimiento, no en el código) el INC pasa a Diseño para corregir el REQ y **cuenta como volatilidad (Q7)** (M-947). | validar.py (esquema de `incs[]`) |
| V7 | Riesgo manda la profundidad | Módulo con riesgo **alto** en el mapa: regresión completa de su ruta en fase 1 (no espera al tren) + centinela; **medio**: centinela + guiones de la ruta en el tren; **bajo**: humo. El riesgo lo confirman Carlos y Diseño (regla LM-40, ya existe); aquí solo se conecta a la selección. | `pw\ruta.js` lee `riesgo` del mapa |
| V8 | Informe de finalización por tanda | La revisión semanal añade tres filas: casos en cuarentena (entradas, salidas, vencidos), escapes por etapa y **cobertura de criterios** (criterios con caso / criterios totales de los lotes de la semana; meta ≥ 70 % hoy, 90 % cuando bajen los trinquetes). | `metricas.js` + ficha semanal del Arquitecto |
| V10 | Suspensión y reanudación | **Se suspende** el tren o la fase 1 cuando P4 bloquea por entorno (semilla rota, sesión caída, `/api/health` sin respuesta, `?v=` viejo) o cuando dos guiones seguidos fallan por la misma causa de entorno; suspende la cola, lo registra en `pre-vuelo.json` y avisa por `estado-vivo.json`. **Se reanuda** cuando humo y semilla dan verde; se repite la **fase 1 completa del lote** (no solo lo que faltaba) y el tren desde el primer guion suspendido. Sin créditos de juez mientras está suspendido. La suspensión y la reanudación **quedan dichas en el buzón** al Jefe de proyecto y a Desarrollo, no solo en `pre-vuelo.json` (M-948: una suspensión detiene el orden). La fase 1 repetida tras una suspensión por entorno **no cuenta** como «lote con más de un veredicto» ni como reprueba (M-946: la meta del 15 % no debe mezclar entorno con lote); `metricas.js` la marca `suspendida`. | cola (`probar-lote.js`, `pre-vuelo.json`, mensaje M-n) · `metricas.js` · despertador avisa |
| V11 | Biblioteca de palabras clave | `guion.js` y `comun.js` son la biblioteca; `guiones-e2e.js` genera la **referencia cruzada** (palabra clave → guiones que la usan, cuántas veces) en `guiones-e2e.json`. Autoridad: Arquitecto (archivos de `herramientas/pw/`); Desarrollo propone por el buzón. Una palabra clave nueva o cambiada entra por lote y la cola corre todos los guiones que la usan. Sin dos palabras para la misma acción; sin palabras sin uso (aviso en la revisión mensual). | `guiones-e2e.js` · validar.py aviso |
| V9 | No funcional mínimo | El humo semanal mide el tiempo de `/api/health` y de las tres páginas más usadas (tablero, calendario, inventario) con sesión `zz-verif-oper`; **umbral 3 s** en LENOVO; por encima, INC de severidad media. Nada más por ahora: accesibilidad y compatibilidad quedan declaradas fuera. | `humo-pw.spec.js` + `metricas.js` |

Lo que **no** cambia: niveles N1–N4, independencia, producción con `zz-verif-`, el juez local, P1–P7 como columna vertebral. v2 añade salud de los casos (V1, V2), salida medible (V3, V8), técnica (V4), aprendizaje (V5, V6) y riesgo (V7, V9).

## 6. Criterios de entrada y salida, explícitos

**Entrada a pruebas (P4, cola):** despliegue con `?v=` del lote · `tests/` en verde · guion igual byte a byte · semilla íntegra · sesiones vivas · **ningún criterio del REQ sin caso ni declaración** (V3) · ningún caso del lote con el mismo nombre que uno en cuarentena vencida · «Regresión:» explícita solo con motivo escrito (desviación registrada, 29119-3 §6.2.7.10).

**Suspensión y reanudación:** V10. **Estado predefinido del entorno** (TC2): semilla `zz-verif-` íntegra y sin datos `zz-verif-L<n>-` de lotes anteriores.

**Salida (P6, juez):** todos los N1/N2 verdes (con a lo sumo un reintento contado por caso, V2) · N3 concluyentes o «parcial» con motivo · N4 en «dispositivo» · datos `zz-verif-L<n>-` borrados o listados · veredicto con `criterios[]` (letra, nivel, caso, resultado, técnica), `inestables[]`, `cuarentena[]`.

**Finalización de tanda (semanal):** cuarentena ≤ 5 casos y ninguno vencido · repruebas ≤ 15 % · rojos ajenos ≤ 20 % · cobertura de criterios ≥ 70 % · escapes «revisión previa» con destino. Las cuatro filas entran en el semáforo de tanda junto con Q7 (cruce, Jefe de proyecto); con los datos de hoy saldrían en rojo repruebas y rojos ajenos: se anotan como **línea de partida**, y los umbrales rigen desde que Carlos apruebe v2.

## 7. Quién, cuándo, cómo

| Quién | Cuándo | Qué |
|---|---|---|
| Diseño | P1 | Criterios con letra, nivel y caso de uso (LM-61); marca los que exigen tabla de decisión (más de un rol). |
| Desarrollo | P2 | Casos con técnica declarada (V4); `--lote` sin criterios huérfanos (V3); revisor previo 21/21. |
| Cola · pw | P4–P5 | Entrada (§6); un reintento por caso (V2); cuarentena (V1); profundidad por riesgo (V7). |
| Juez | P6 | Veredicto con `criterios[]`, `inestables[]`, `cuarentena[]`. |
| Desarrollo | P7 | INC completo (V6) con causa y etapa (V5); dueño de los casos en cuarentena. |
| Arquitecto | Semanal | Informe de finalización (V8): cuarentena, escapes, cobertura; convierte escapes en puntos o guardias (V5); trinquetes. |
| Jefe de proyecto | Semáforo de tanda | Repruebas, ajenos, cuarentena vencida, cobertura; Q7 de requerimientos. |
| Carlos | Una vez | Aprueba v2; confirma el riesgo por módulo cuando cambie (regla LM-40); no prueba. |

## 8. Orden de instalación (LM-62, instalado el 20-oct: pasos 1–6 hechos; prueba real en el primer tren tras la pausa; `tec` y punto 21 por lote)

1. Esquema: severidad cerrada, campos mínimos del INC, `debioDetectarse` cerrada; pasada de normalización de los 130 INC (solo valores, sin tocar texto). V5, V6 en `validar.py` para INC nuevos.
2. `linea-base.py --lote`: criterios sin caso (V3); revisor previo punto 21 y plantilla (V4).
3. `metricas.js`: umbrales de V1, candidatos a cuarentena, cobertura de criterios, escapes por etapa, bloqueos, desviaciones y riesgos residuales (V8); `casosAlerta` pasa a saltar con los datos reales; `guiones-e2e.js` con la referencia cruzada de palabras clave (V11).
4. LM-39a con los umbrales de V1, el reintento del guion de V2 y la suspensión/reanudación de V10 en `probar-lote.js`; veredicto con los tres campos nuevos y «acción sin INC»; `ruta.js` lee riesgo (V7).
5. Humo con tiempos (V9).
6. `proceso.json › pruebas` v2, `cobit.json`, ficha de conocimiento, artefacto «Procesos de la fábrica».

Prueba de cada paso: N1 con `tests/` y `pruebas-v1.test.js`; la prueba con uso real de 3–5 es el primer tren tras la pausa.

## 9. Cruce

**Tras el cruce**, la lectura del texto completo de las normas (§1b) añadió V10 (suspensión y reanudación) y V11 (biblioteca de palabras clave) y afinó V3, V6 y V8. Sin objeción de los tres (M-946, M-947, M-948), con tres notas incorporadas: la repetición por suspensión no cuenta como reprueba (Desarrollo), suspensión y reanudación avisadas por el buzón (Jefe de proyecto), INC `contra = REQ` va a Diseño y cuenta como volatilidad (Diseño).

**Cerrado, de acuerdo con ajustes:** Desarrollo (M-940: `producto` fuera de la cuarentena, saltar en vez de borrar, plazo en lotes de cualquier grupo, reintento del guion entero, `tec` como campo, tres cosas que cuentan como caso en `--lote`), Diseño (M-941: tabla rol × acción en el REQ, «no verificable» con motivo, caso de uso del INC lo pone Desarrollo), Jefe de proyecto (M-942: cuatro filas en el semáforo como línea de partida, despertador recuerda y semáforo comprueba). Todo incorporado arriba. Preguntas que quedaron para Carlos: punto 4.

Preguntas originales:

1. **Desarrollo:** ¿los umbrales de V1 (8 % en 30, 3 en 10, 30 % inmediato) y el plazo de dos lotes son vivibles? ¿Un reintento por caso dentro del mismo tren cabe en pw 0.7.0 sin rehacer las fases? ¿La técnica en una palabra junto al caso (V4) te estorba o te ayuda?
2. **Diseño:** ¿la tabla de decisión rol × acción la marcas tú en el REQ (criterio «permisos» con los roles) o la deriva Desarrollo del caso de uso? ¿Aceptas que un criterio «no verificable» exija motivo escrito?
3. **Jefe de proyecto:** ¿las cuatro filas de la finalización de tanda (§6) entran en el semáforo tal cual? ¿Quién recuerda el vencimiento de una cuarentena: el despertador o el semáforo?
4. **Carlos:** umbral de 3 s para V9; que v2 sustituya a v1 en un solo LM; levantar la pausa de la cola es prerrequisito de la prueba real de V1–V2 y V7.

## Fuentes

ISO/IEC/IEEE 29119-2:2013 texto completo (TP3–TP5, TMC1–TMC4, TC1–TC4, TD1–TD6, TE1–TE3, IR1–IR2) · 29119-3:2013 texto completo (§5.3.5 criterios de entrada/salida, completación, retest y regresión; §6.2.7 estrategia del plan; §6.4 informe de finalización; §7.12 informe de incidente) · 29119-3:2021 (prólogo: condiciones → modelos; §6.2 política; §8.2 especificación del modelo de prueba) · 29119-5:2016 (§6.2 identificación de palabras clave, §6.5 modularidad y mantenimiento) · 29119-1:2022 y -4:2021 por referencia · J. Micco, *Flaky Tests at Google and How We Mitigate Them*, Google Testing Blog, 27-may-2016 · GitLab, *Unhealthy tests* (docs de desarrollo) y *Test Quarantine Process* (handbook) · Mozilla, *Sheriffing/Test Disabling Policy* · COBIT 2019 BAI03.07/.08, BAI07.03–.05 · PRUEBAS-v1 (claude/marco/proceso-pruebas-2026-10.md) · log\METRICAS.json (LM-39c).
