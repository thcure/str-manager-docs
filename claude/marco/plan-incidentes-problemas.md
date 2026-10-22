# Proceso 5 (numeración por ejecución; paso 4 de MJ-17) · Incidentes y problemas (INCIDENTES-v1) · plan en cruce

**Estado:** v2 · **aprobada por Carlos (21-oct-2026 09:53, chat del Arquitecto)** tras el cruce (Desarrollo M-988, Diseño M-989, Jefe de proyecto M-990) · **LM-65 instalado en el repo (10:02)**: pasos 1, 2, 3 y 6 hechos; paso 4 (pasada de Desarrollo con `prioridad.py`) y 5 (revisión de INC-128) en curso; errores de `validar.py` desde el 22-oct · **Autor:** Chat Arquitecto · **Marco:** MJ-17 paso 4 · COBIT DSS02 (solicitudes e incidentes) y DSS03 (problemas) · ISO/IEC 20000-1:2018 §8.6.1 incidentes, §8.6.2 solicitudes de servicio, §8.6.3 problemas (por conocimiento de la norma; el enlace de Scribd no se deja leer sin navegador, Carlos puede pegar las cláusulas) · Referencias: Google SRE, *Postmortem Culture* (cap. 15); ITIL 4 (prioridad = impacto × urgencia; error conocido; incidente mayor).

## 1. Qué pide la norma y qué dicen los que la aplican

La 20000-1 pide, para **incidentes**, un procedimiento que los registre, clasifique, **priorice**, escale si hace falta, resuelva y cierre, con **criterios de incidente mayor** y un camino propio para ellos que informe a la dirección; para **solicitudes de servicio**, lo mismo sin la urgencia; para **problemas**, analizar los datos y **tendencias** de los incidentes para encontrar problemas, registrarlos, clasificarlos, priorizarlos, documentar **errores conocidos con su solución temporal**, actuar sobre la causa raíz por la gestión de cambios y revisar si la acción funcionó. COBIT DSS02 añade la clasificación por impacto y urgencia, la asignación a quien resuelve, el seguimiento hasta el cierre y la verificación con el usuario; DSS03 la gestión del conocimiento de errores conocidos y el cierre del problema cuando se elimina la causa.

Google SRE fija **cuándo** se escribe un postmortem (criterios decididos antes del incidente: caída o degradación visible, pérdida de datos, intervención manual como un rollback, resolución más larga que un umbral, fallo de monitoreo que hizo que se descubriera a mano), lo hace **sin culpables** («no se arreglan personas, se arreglan sistemas y procesos»), con un contenido fijo (incidente e impacto, qué se hizo, causas, acciones) y una revisión: un postmortem sin revisar «prácticamente no existe».

## 2. Lo que ya tenemos (bastante llegó de rebote en los procesos 2 y 3)

| Norma | Nuestro equivalente | Estado |
|---|---|---|
| Registro y clasificación | `seguimiento.json › incs[]` con severidad cerrada, `contra`, `originador`, `casoUso`, `contexto`, `causaRaiz`, `debioDetectarse` (V5, V6) | vigente desde 21-oct |
| Cierre con verificación | `cierre {lote, prueba}` · `{prueba}` · `{decision, motivo}` (K9) | vigente |
| Análisis de tendencias | `ficha-semanal.py`: escapes por etapa, INC abiertos/cerrados por módulo, DORA | instalado |
| Causa raíz → acción | V5: cada escape «revisión previa» o «tests» produce punto del revisor, guardia o riesgo aceptado | regla, sin guardia |
| Incidente mayor / emergencia | K8: INC alto o crítico en producción salta el orden con la línea del Jefe de proyecto; DA en 24 h | vigente |
| Vuelta atrás | K6: decisión revert o fix en ≤ 30 min desde el aviso | vigente (aviso del despertador pendiente) |
| Solicitudes de servicio | `diseno.json › pedidos[]` (15: 8 nuevos, 6 convertidos, 1 bloqueado) con las listas de entrada de Diseño (Q) | vigente |
| Deuda técnica | `seguimiento.json › dts[]` (27: 17 abiertas, 8 pagadas, 2 programadas) | sin disciplina propia |
| Prioridad | campo `prioridad` en 75 INC con valores sueltos (`P0`, `P1`, `P1 por destrabe`, `P2`, `P3`, `con fecha 2026-11-30`) | sin definición ni plazo |
| Problemas y errores conocidos | no existen como entidad: la causa común de varios INC vive repartida en notas, `CLAUDE.md` y lecciones | **falta** |
| Postmortem | no existe; el juez propone `causaRaiz` y `debioDetectarse` por INC, nada por incidente | **falta** |

## 3. Los datos de hoy (`seguimiento.json`, 21-oct)

- 131 INC, **58 abiertos** (36 bajos, 17 medios, 4 altos, 1 crítico). Edad mediana 3 días, 7 con más de una semana. **INC-128 (crítico, PUT de turnos y movimientos del colaborador con 500) lleva 7 días abierto**; los 4 altos (INC-161 reinvitar activos, INC-175 y 176 corte con Drive revocado o sin respuesta, INC-187 la subida descarta lo rechazado con 401) llevan 3.
- Los 9 INC cerrados con fecha legible se cerraron en mediana 1 día, máximo 3: cuando se atienden, se cierran rápido; el problema es el backlog, no la velocidad.
- Quién detecta: 44 «Desarrollo, revisión técnica», ~30 veredictos del juez, 4 «solo en uso» (Carlos). **Ningún INC trae quién lo vio ni cuándo fuera de la fábrica**: `originador` existe desde ayer.
- Candidatos a **problema** (mismo módulo y causa, ≥ 3 INC): Calendario/construcción 6, Identidad y permisos/construcción 4, Shell 4, Flujos 4, API 3, servidor 3, Modelo 3; y 3 de entorno sin módulo. Nadie los ha agrupado ni tienen causa común escrita.
- 50 de los 58 abiertos traen `nota`; ninguna dice si hay solución temporal para quien opera.
- 27 DT: 16 sin severidad, ninguna con plazo ni dueño explícito.

Lectura: registramos bien y cerramos rápido lo que atendemos, pero **no priorizamos con regla** (un crítico abierto una semana), **no convertimos repeticiones en problemas** y **no aprendemos por incidente**, solo por INC suelto.

## 4. Brechas

| # | Brecha | Norma | Dato |
|---|---|---|---|
| Bi1 | Prioridad sin definición ni plazo; la severidad hace de prioridad | 20000-1 §8.6.1 priorizar; DSS02.02 | INC-128 crítico 7 días; `prioridad` con 6 valores sueltos |
| Bi2 | Sin entidad «problema» ni errores conocidos con solución temporal | §8.6.3; DSS03.01–.03 | 7 grupos módulo+causa con ≥ 3 INC |
| Bi3 | Sin revisión de incidente mayor (postmortem) | §8.6.1 incidente mayor; SRE | 0; INC-128 sin línea de tiempo ni acciones |
| Bi4 | Lo que ve Carlos o un usuario en producción entra por el chat, sin hora, pantalla ni quién | DSS02.01 registro; §8.6.1 | 4 «solo en uso», sin contexto |
| Bi5 | Deuda técnica sin dueño, severidad ni plazo | DSS03.04 (acciones), BAI03.10 | 16 de 27 sin severidad |
| Bi6 | V5 (escape → punto, guardia o riesgo) es regla sin guardia | §8.6.3 d) eficacia de la acción | 55 escapes «revisión previa» sin destino anotado |

## 5. Controles propuestos (I1–I7)

| # | Control | Regla | Guardia |
|---|---|---|---|
| I1 | Prioridad con plazo | `prioridad` cerrada **P1–P4** = severidad × **quién lo sufre** (cruce, Diseño): huésped o tercero > **colaborador en turno** (si su portal falla, la limpieza se detiene y el huésped llega a una unidad sin preparar) > operador o admin > fábrica. **Piso por área:** si el INC toca un área crítica de K4 (datos reales que se pierden, quién ve, dinero, lo que sale a canales o terceros, obligaciones legales) es al menos **P2** aunque no lo sufra nadie todavía (INC-175, INC-187); **sobreventa o pérdida de datos en curso: P1**. El plazo es de **decisión**, no de construcción (cruce, Desarrollo y Jefe de proyecto): P1 30 min desde que llega el aviso (K6), P2 1 día, P3 una tanda, P4 un mes. `decision` es una de: lote en el plan · `bolsa[]` · pospuesto con motivo · solución temporal · **«espera la pausa de producto» citando la orden de Carlos (M-n o DA-n)**, que vale como decisión mientras la pausa dure. El Jefe de proyecto **ordena dentro de la prioridad, no la define**; sus etiquetas P0–P3 se recalculan. Un INC abierto más allá de su plazo sin `decision` sale en la ficha y en el semáforo. Los 75 valores viejos se normalizan con la **tabla de equivalencias del Arquitecto**; lo que no sale de la tabla va en lista a Diseño, sin inventar. | `esquema.json › incidente.prioridad` · `validar.py` error en INC nuevo sin prioridad; aviso por plazo vencido · despertador (P1–P2) · `ficha-semanal.py` |
| I2 | Registro desde producción | Lo que ve Carlos o un usuario entra como INC en ≤ 1 h con `originador: uso real`, `contexto {pantalla, hora, quién lo vio}` y `casoUso`; Carlos avisa por el chat de Desarrollo con una línea (plantilla de tres campos: qué pasó, dónde, cuándo); Desarrollo registra y confirma por el buzón. Un INC de uso real de prioridad P1 o P2 abre el camino de emergencia (K8). | plantilla `aviso-produccion.md` · `validar.py`: `uso real` sin `contexto` = error |
| I3 | Problemas y errores conocidos | `seguimiento.json › problemas[]` (escritor: Desarrollo, junto a `incs[]` y `dts[]`: mismo escritor, una lectura para `validar.py`; los candidatos los avisa `validar.py` o se los paso yo; Desarrollo abre el PRB): `PRB-n {titulo, modulo, causa, incs[], errorConocido {sintoma, solucionTemporal}, accion {tipo: REQ · DT · LM · guardia, id}, estado: abierto · con solución temporal · resuelto · cerrado}`. Se abre cuando **≥ 3 INC comparten módulo y `causaRaiz` en 30 días**, o cuando el juez o Desarrollo ven la misma causa en 2. Se cierra solo cuando la acción está aceptada y pasan 30 días sin INC nuevo de esa causa (§8.6.3 d). La ficha semanal lista problemas abiertos y candidatos. | `validar.py` aviso de candidato sin PRB; error PRB cerrado sin acción aceptada · `ficha-semanal.py` |
| I4 | Solución temporal visible | Todo INC abierto P1–P2 lleva `solucionTemporal` («cómo opera mientras tanto» o «ninguna») y, si hay PRB, apunta a él. La ficha semanal las lista para Carlos: es lo que un operador necesita saber. | `validar.py` error P1–P2 sin `solucionTemporal` |
| I5 | Revisión de incidente (postmortem corto, sin culpables) | Disparadores fijados ahora, no después: INC P1; pérdida o alteración de datos reales; revert o restauración; INC que tarda más de su plazo en decidirse; INC que descubrió Carlos y debió detectarlo una prueba. Contenido en el INC, campo `revision {queVimos, impacto, lineaDeTiempo, causas, queCambia[]}`, en 48 h, con plantilla en `herramientas/plantillas/revision-incidente.md`. **Quién la escribe, por la causa** (cruce): construcción, tests o guion → Desarrollo; entorno o herramienta → Arquitecto; REQ o producto → Diseño; las tres partes cuando se mezclan (Diseño: impacto en quién lo sufrió y qué cambia en el REQ o la bolsa; Desarrollo: lo técnico; Arquitecto: la causa raíz del proceso). Sin revisar por los otros dos no cuenta. Cada `queCambia` es un punto del revisor, una guardia, un REQ, un LM o un riesgo aceptado con quién lo aceptó. | `validar.py` aviso INC con disparador sin `revision` a las 48 h · ficha |
| I6 | Deuda técnica con dueño y plazo | Cada DT con `severidad`, `dueno`, y `plazo` o `aceptadaPor`: **DA-n con cruce si la DT toca un área crítica de K4 o cambia algo que Carlos decidió; M-n de Diseño con motivo si es menor** (texto, estilo, orden en pantalla) (cruce, Diseño); revisión mensual en la ficha: DT vencidas y DT sin plazo. Las 27 actuales se completan en una pasada de Desarrollo (severidad de las 16 sin ella), sin tocar texto. | `validar.py` error DT nueva incompleta; aviso en las viejas |
| I7 | El escape tiene destino | V5 gana guardia: todo INC con `debioDetectarse` = `revisión previa` o `tests` lleva, al cerrarse, `destino {tipo: punto · guardia · riesgo, ref}`; sin eso no se cierra. La ficha cuenta escapes con y sin destino. | `validar.py` error desde la instalación |

Lo que **no** cambia: INC y DT siguen en `seguimiento.json` (Desarrollo escribe; el juez propone); `pedidos[]` de Diseño es la gestión de solicitudes y ya tiene sus listas; K6, K8 y K9 siguen como están.

## 6. Criterios

**Entrada (un INC está bien abierto):** título, módulo, caso de uso o «sin caso de uso», severidad, **prioridad**, `contra`, `originador`, contexto si vino de uso real, causa raíz y dónde debió verse (V5/V6).
**Cierre:** `cierre` con evidencia (K9) · `destino` si fue escape (I7) · si disparó revisión, `revision` revisada (I5) · si pertenece a un PRB, el PRB lo sabe.
**Problema cerrado:** acción aceptada y 30 días sin INC de esa causa.
**Finalización de tanda:** INC fuera de plazo = 0 en P1–P2 · problemas abiertos con solución temporal escrita · escapes sin destino = 0 · DT vencidas listadas. Entran en el semáforo del Jefe de proyecto en el mismo bloque que pruebas y construcción (M-990); con los datos de hoy salen en rojo (INC-128): línea de partida. El **despertador** recuerda los plazos de P1 y P2 (30 min y 1 día: un semáforo por tanda llegaría tarde); P3 y P4 los mira el Jefe de proyecto.

## 7. Quién, cuándo, cómo

| Quién | Cuándo | Qué |
|---|---|---|
| Carlos / usuario | Al ver algo en producción | Tres campos por el chat de Desarrollo (qué, dónde, cuándo); Carlos no clasifica. |
| Desarrollo | ≤ 1 h · al cerrar | Registra con prioridad y contexto; abre PRB cuando toca; escribe `revision` en 48 h; completa DT. |
| Juez | En cada veredicto | Propone severidad, prioridad, causaRaiz y debioDetectarse (ya hoy, más prioridad). |
| Diseño | Al clasificar | Confirma caso de uso y prioridad cuando hay huésped o tercero; revisa lo de producto de una `revision`; decide `aceptadaPor` de una DT de producto. |
| Jefe de proyecto | Semáforo | INC fuera de plazo, problemas abiertos, DT vencidas; ordena la emergencia. |
| Arquitecto | Semanal · en cada `revision` | Ficha; candidatos a PRB; convierte `queCambia` de proceso en puntos del revisor o guardias. |

## 8. Orden de instalación (LM-65)

Hecho el 21-oct (pasos 1, 2, 3 y 6; `interno/lotes-modelo/LM-65.md`): `esquema.json` 0.6, `validar.py` I1–I7 (0 errores; línea de partida: 29 P2 fuera de plazo, 7 candidatos a PRB, 19 DT incompletas), `incidentes.py` (+40 pruebas), `prioridad.py`, `ficha-semanal.py`, `aviso-produccion.md`, `revision-incidente.md`, juez con `prioridad`, `proceso.json › incidentes`, COBIT DSS02/DSS03. En curso: paso 4 (Desarrollo y Diseño) y paso 5 (Arquitecto).


1. Esquema: `incidente.prioridad` P1–P4 con plazos, `solucionTemporal`, `revision`, `destino`; `problema` (PRB-n); `deuda` con `dueno`, `plazo`, `aceptadaPor`. `validar.py`: I1, I2, I4, I5, I6, I7 como errores solo para lo nuevo; avisos para lo viejo; candidatos a PRB (I3).
2. `ficha-semanal.py`: INC fuera de plazo por prioridad, problemas y candidatos, soluciones temporales, DT vencidas, escapes con destino.
3. Plantilla `herramientas/plantillas/aviso-produccion.md` (tres campos) y texto del juez (propone prioridad).
4. Pasada de Desarrollo: normalizar `prioridad` de los 75 INC, completar las 27 DT, abrir los primeros PRB de los 7 candidatos (sin tocar texto de los INC).
5. Primera `revision`: **INC-128** (crítico, 7 días; causa «arquitectura»: MySQL 2002, 500 «Base de datos no disponible»): la escribe el **Arquitecto**, con lo de construcción de Desarrollo (los reintentos de L-110, L-111 y L-118) y lo de producto de Diseño.
6. Tabla de equivalencias de prioridad (Arquitecto, al aprobarse LM-65): `P0`, `P1`, `P1 por destrabe` → P1 si la severidad es crítico o alto, si no P2 · `P2` → P2 · `P3` → P3 · `con fecha …` → P3 con `decision: pospuesto, <fecha>` · sin valor → por severidad y área de K4 (crítico → P1, alto o área crítica → P2, medio → P3, bajo → P4); los que no salgan de la tabla, en lista a Diseño.

## 9. Cruce

**Cerrado, de acuerdo con ajustes:** Desarrollo (M-988: el plazo es de decisión y «espera la pausa» vale como decisión; reloj de P1 desde el aviso; `problemas[]` en `seguimiento.json`; normalización mecánica con tabla de equivalencias y lista a Diseño para lo que no salga; postmortem por causa: construcción/tests/guion Desarrollo, entorno/herramienta Arquitecto, REQ/producto Diseño; INC-128 es del Arquitecto), Diseño (M-989: colaborador en turno por encima del operador; piso P2 por área crítica de K4; sobreventa o pérdida de datos en curso P1; ella escribe la parte de producto de la revisión; DT crítica = DA-n, menor = M-n), Jefe de proyecto (M-990: cuatro filas en el semáforo como línea de partida; despertador para P1–P2, semáforo para P3–P4; «pausa de producto» como decisión; él ordena dentro de la prioridad). Todo incorporado arriba. Para Carlos: la plantilla de aviso de tres campos y el primer postmortem (INC-128).

Preguntas originales:

1. **Desarrollo:** ¿los plazos de decisión P1 30 min · P2 1 día · P3 una tanda · P4 un mes son vivibles? ¿`problemas[]` en `seguimiento.json` (tuyo) o archivo aparte? ¿La pasada de normalización de 75 prioridades y 27 DT te cabe en una sesión?
2. **Diseño:** la urgencia la define quién lo sufre (huésped o tercero > operador > fábrica): ¿coincide con tu criterio de crítico de K4? ¿La `revision` de producto la escribes tú o la revisas?
3. **Jefe de proyecto:** ¿INC fuera de plazo en P1–P2 = 0 como fila del semáforo? ¿Quién recuerda el plazo: despertador (plazos en `proceso.json`) o tu semáforo?
4. **Carlos:** la plantilla de aviso de tres campos (qué, dónde, cuándo) cuando veas algo en producción; y hacer el primer postmortem sobre INC-128.

## Fuentes

ISO/IEC 20000-1:2018 §8.6.1–8.6.3 (por conocimiento de la norma; sin el texto a mano) · COBIT 2019 DSS02.01–.07, DSS03.01–.05 · Google SRE Book, cap. 15 *Postmortem Culture: Learning from Failure* · ITIL 4, prácticas de gestión de incidentes y de problemas · `seguimiento.json` (131 INC, 27 DT), `diseno.json › pedidos[]`, PRUEBAS-v2 (V5, V6), CONSTRUCCIÓN-v1 (K6, K8, K9).
