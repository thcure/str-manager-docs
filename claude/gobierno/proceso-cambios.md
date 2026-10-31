# Manual de la fábrica STR · índice

> **Qué es.** La fábrica es el conjunto de procesos, roles, guardias y herramientas con los que un requerimiento de Carlos se convierte en software aceptado en producción, y con los que lo que sale mal vuelve al proceso como regla. Este documento es el **índice del manual**: dice dónde está cada cosa y en qué marco se apoya; el detalle vive en los planes de `claude/marco/` y en los JSON de `interno/`. **Vigente desde el 21-oct-2026** (MJ-17 cerrada en su formalización; LM-74 numeración y nombres; MJ-23); al día al 25-oct (LM-68, LM-75 a LM-81: ráfaga, escucha, línea objetivo, hook v6, cola v12, despertador). Escritor: Arquitecto. La Parte II, más abajo, es la formalización anterior por objetivos COBIT (sept–oct 2026): sigue siendo la fuente del modelo de operación (APO01) y de las actividades que los planes no reescribieron; donde un plan la supera, manda el plan.

## 1. Marco

- **Ancla del ciclo de vida: ISO/IEC/IEEE 12207:2017** (procesos del ciclo de vida del software). Cada proceso nuestro lleva el nombre y la cláusula de la norma.
- **Lenguaje común: las fases del SDLC** (planificación, análisis y requisitos, diseño, construcción, pruebas, despliegue, operación y mantenimiento).
- **Gobierno: COBIT 2019**: el objetivo (BAI02, BAI07, DSS02…) va en la cabecera de cada plan y la posición frente a los 40 objetivos en `interno/cobit.json` (página Cobit).
- **Figura:** artefacto «Diagramas de la fábrica STR» › *Marco*: fases × procesos 12207 × nuestros procesos, con lo cubierto, lo parcial, lo que queda fuera por decisión y lo que falta. *Macro*: cómo se conectan los nueve. Por proceso: vista A (entradas, guardias, salidas) y vista B (lineal por carriles).
- **Regla del alcance:** la fábrica son los nueve procesos de abajo. Lo que el marco muestra como «parcial» o «falta» entra en `interno/mejoras.json` como propuesta con `revisarCuando` (hoy MJ-18…MJ-23), no como trabajo. Lo «fuera por decisión» cita la decisión: análisis de negocio, planificación de proyecto y cartera son de la **capa de proyectos** (ADR-008, ADR-009); la **operación** la hace Carlos y entra a la fábrica por el proceso 5.

## 2. Los nueve procesos

Numerados por orden de ejecución: 0 es el suelo; 1 → 2 → 3 → 4 es la línea que recorre un requerimiento y vuelve a 0; 5 es el retorno; 6, 7 y 8 son transversales. Los ids de control (C, Q, V, K, I, F, A, Cn, Rg) y los lotes del modelo (LM-n) son los que citan el código y los JSON; no cambian con los nombres.

| Nº | Proceso (12207) | Cláusulas | Lo vive | Dueño | Plan | Controles · LM | Guardias que cortan |
|---|---|---|---|---|---|---|---|
| 0 | **Gestión de la configuración** · línea de producto y línea objetivo | 6.3.5 | Arquitecto (producto) y Diseño (objetivo) | Arquitecto | `plan-configuracion-linea-base.md` (v3) | C1–C11, O1–O3 · LM-60, LM-80 | `linea-base.py` en `validar.py` (C1), C3, C7–C11; O1–O3 sobre la línea objetivo; `--lote` con «Diferencias:» (rc 2); trinquetes C4 y C6 |
| 1 | **Definición de requisitos** · tres modos: escucha, revisión de alcance, REQ | 6.4.2, 6.4.3 | Diseño | Diseño | `proceso-requerimientos-diseno.md` · encargo `rol-diseno` v4.3 | Q1–Q8 · LM-61, LM-76, LM-80 | `--req` Q1, Q2, Q4; `validar.py` Q3, Q5, Q8, O2; crítico sin DA no es «listo»; regla 17 (ubicar antes de presentar) |
| 2 | **Evaluación y control del proyecto** · flujo de la fábrica | 6.3.2 | Jefe de proyecto | Jefe de proyecto | `plan-flujo-trabajo.md` | F1–F9 · LM-66, LM-72 | avisos F1–F7; F2 y F9 error desde el 1-dic |
| 3 | **Implementación e integración** · construcción y cambio | 6.4.7, 6.4.8 | Desarrollo y la CLI | Desarrollo | `plan-construccion.md` | K1–K9, R1 · LM-63, LM-64, LM-72, LM-73, LM-77, LM-78 | hook v6 (tests, Alcance, línea «Lote:»; reinyecta la cabecera tras compactar), `--lote` rc 2, cola v12 (DA, cruce, revisión previa, ok de crítico, ráfaga), P4 (K1, K2) |
| 4 | **Verificación y validación** · pruebas y aceptación | 6.4.9, 6.4.11 | cola y juez | **Arquitecto** (estrategia, pw, juez, métricas; Diseño y Desarrollo diseñan los casos; la validación con Carlos (`reqs[].validacion`) y el ok de producto de los críticos son de Diseño; el juez verifica contra los criterios por letra; condiciones en `proceso.json › procesosFabrica.dueno`) | `plan-verificacion-aceptacion.md` | V1–V11 · LM-62, LM-68, LM-71, LM-73, LM-78 | P4 entrada, V2, V3, V10; guardia de escritura (solo `zz-verif-`); veredicto que nadie toca; ráfaga de capacidad sola por tanda en ventana nocturna (cola v12) |
| 5 | **Mantenimiento** · incidentes, solicitudes y problemas (20000-1 §8.6) | 6.4.13 | juez, Desarrollo, Jefe de proyecto, Diseño (regla de producto, prioridad por quién lo sufre I1, parte de producto de la revisión I5, bolsa de INC sin caso de uso C3) | Jefe de proyecto (decisión) · Desarrollo (registro y fix) | `plan-incidentes-problemas.md` | I1–I7 · LM-65 | prioridad y contexto obligatorios (I1, I2), PRB (I3), revisión P1 (I5), DT completa (I6), destino del escape (I7), cierre con evidencia (K9) |
| 6 | **Definición de arquitectura y gestión de decisiones** | 6.4.4, 6.3.3 | Arquitecto y Desarrollo | Arquitecto | `plan-arquitectura.md` | A1–A8 · LM-67, LM-68 | `--lote` A6 en áreas sensibles, punto 23 del revisor, A1, A5, A7 |
| 7 | **Gestión de riesgos y medición** | 6.3.4, 6.3.7 | Jefe de proyecto y Arquitecto | Jefe de proyecto (registro y metas) · Arquitecto (propone, medidas) | `plan-riesgo-medicion.md` | Rg1–Rg8 · LM-71, LM-72 | Rg1 forma, Rg2 destino con R-n; Rg6 y Rg7 error desde el 1-dic |
| 8 | **Gestión del conocimiento y de la información** · lecciones, relevos, buzón | 6.2.6, 6.3.6 | todos | Arquitecto | `plan-conocimiento.md` | Cn1–Cn8 · LM-69, LM-70 | `claude-md.test.js`, hook `ctx.js`; Cn2 error desde el 1-dic |

Fuente única de esta tabla: `interno/proceso.json › procesosFabrica`; estado vivo en el artefacto «Procesos de la fábrica STR» y en `cobit.json`.

## 3. Los tres perfiles de ejecución

El perfil no lo elige nadie: lo calculan el Alcance, el riesgo del módulo (p × i en el mapa) y las áreas sensibles. Un lote que toque datos reales, permisos, dinero, canales, obligaciones legales, migración, scripts que corren solos o secretos (K4) es crítico aunque se redacte como ligero; la cola lo rechaza sin DA, sin cruce o sin el ok del revisor.

| | Ligero | Estándar | Crítico |
|---|---|---|---|
| Qué es | documentación, guiones, herramientas de la fábrica; no toca el producto («técnico, sin caso de uso») | REQ, INC o DT de producto en un módulo con riesgo < 6, fuera de áreas sensibles | lista cerrada de K4 o módulo con riesgo ≥ 6 |
| Carlos | nunca | nunca | una vez: DA con opción recomendada y cruce, en «definido» |
| Definir (1) | no aplica | REQ con plantilla, criterios con letra y nivel, `--req` | igual + DA-n y «Toca decisión» |
| Redactar (3) | plantilla, revisor 23 puntos en subagente, `--lote` rc 0, «Revisión previa: 23/23» | igual + «Riesgo:» con R-n si el módulo lo tiene, «Decisión: ninguna (motivo)» | igual + «Decisión: ADR/DA», ok del revisor de críticos (Diseño producto · JP fábrica) citado en la cabecera |
| Probar (4) | tests N1 + humo | ruta por `mapa.py --ruta`; guion N2 donde el criterio lo pide; profundidad por p × i | ruta completa en fase 1, centinelas, juez con Opus; capacidad si toca el sobre (RT-25) |
| Aceptar (4) | juez (humo + tests) | juez; quien construye no acepta | juez + evidencia cruzada; último clic en producción, Carlos |
| Cerrar (0, 5, 8) | fila del mapa, `cambios[]` | + escapes con destino, lección si la hubo | + ADR/DA al día, R-n revisado, aviso de producción si cambia algo visible |

Igual en los tres, a propósito: plantilla, revisor, línea de trazabilidad en el commit (hook v5), veredicto del juez, ficha de la tanda. Los procesos 5, 6, 7 y 8 corren igual en los tres.

**Caminos de aceptación escritos (LM-88, 31-oct-2026):** (1) **juez**: veredicto «aceptado». (2) **parcial + evidencia cruzada**: el juez deja en `criteriosPendientes` lo que la instrucción reservó al Arquitecto (p. ej. a0 / a, lo que solo se ve en GitHub, en el servicio o en LENOVO) y el Arquitecto (o el JP si el lote toca archivos del Arquitecto) lo cierra con mensaje nuevo que cita lo visto. (3) **composición de veredictos**: cuando un lote posterior aceptado corrige **solo el guion** de un lote anterior (INC de prueba, no de producto) y la puerta de independencia de `reprobar\` bloquea la reprueba del anterior, el anterior se acepta si **cada criterio** tiene veredicto verde del juez en alguno de los dos, sobre el mismo despliegue (mismo commit del sitio), y nada queda sin juez; lo decide el Arquitecto, lo escribe en `LM-n.md` y en la aceptación de `cambios[]` («composición L-a-veredicto-n + L-b-veredicto»), y el JP lo anota en la tanda. La evidencia cruzada cierra criterios, nunca veredictos: un «no aceptado» por un criterio de producto no se compone. El revisor del lote de guion exige la lista de guiones que recorren lo que el lote cambia, cada uno en verde en la simulación (lección de L-183: INC-216 e INC-217). Deuda abierta (Arquitecto): `reprobar\` debe comparar el guion contra el del último lote aceptado que lo tocó; mientras tanto aplica el camino 3. Los ids de lote son enteros (`L-n`): la cola no lee letras.

## 4. Política de calidad (una página)

1. **Verificación antes de aceptar, siempre, y proporcional al riesgo.** El riesgo del módulo manda la profundidad (V7); nada se acepta sin veredicto; el juez verifica contra los criterios por letra del REQ, y la validación con Carlos y el ok de producto de los críticos son de Diseño.
2. **Independencia.** Quien construye no escribe la prueba que lo aprueba (K2) ni acepta (juez); quien redactó no revisa (revisor en subagente); si el lote toca las herramientas del dueño de pruebas, el cierre por evidencia lo hace el JP.
3. **Un dato, una fuente; un escritor por archivo.** Lo que vive en un JSON no se repite en prosa; los chats se hablan por el buzón, nunca a través de Carlos. Antes de presentarle a Carlos un tema como abierto o nuevo, se ubica lo ya decidido (regla 17).
4. **Nada sobre datos reales.** Pruebas solo en la cuenta `zz-verif-pruebas` (R11, RT-2); en producción, solo lectura y último clic de Carlos.
5. **Ningún rojo muere en silencio.** Todo fallo termina en INC con causa y etapa, en cuarentena con dueño y plazo, o en «acción sin INC» con motivo.
6. **Lo rojo tiene dueño.** Cada medida del semáforo dice quién actúa y qué hace; una roja dos fichas seguidas produce una acción, un riesgo aceptado por Carlos o el retiro de la medida (Rg6).
7. **Toda lección tiene destino.** Regla, punto del revisor, guardia, plantilla, ficha, ADR o riesgo; lo que no cambia nada se retira (Cn3, Cn5).
8. **La máquina corta lo que puede cortar.** Una regla que depende de la memoria de un chat es un aviso hasta que tenga guardia; las guardias nuevas nacen de escapes reales, no de la norma por la norma.
9. **Decidir a tiempo vale más que arreglar rápido.** La prioridad de un incidente mide el plazo de decidir (I1); un «no se hace» o «fuera de alcance» con referencia es una decisión válida.
10. **Carlos toca el sistema en pocos puntos y todos están marcados:** alcance, DA de críticos, «¿cómo vamos?», firma de riesgos y metas, hooks y guardias de la cola.

## 5. Términos: el nuestro y el de la norma

tanda = iteración · ficha de la tanda = informe de finalización de pruebas (29119-3) · «¿cómo vamos?» = informe de estado · revisor previo = revisión técnica (12207 7.2.6) · juez = verificador independiente · cola = canal de integración y pruebas · instrucción de lote = orden de cambio (BAI06) · LM-n = cambio del modelo · línea base funcional (10007) · escape = defecto escapado. Las herramientas y los archivos conservan el nombre nuestro.

## 6. Dónde vive cada cosa

- **Reglas de todos:** `interno/instrucciones.json › reglas-comunes` (regla 16: los nueve procesos; regla 17: ubicar antes de presentar) y el encargo de cada rol (`rol-diseno`, `rol-jefe-proyecto`, `rol-desarrollo`, `rol-arquitecto`, `rol-verificador`, `rol-agente-cli`).
- **Modelo y guardias:** `herramientas/modelo/esquema.json` (listas cerradas, umbrales, medidas, fechas de error), `validar.py` (0 errores o nada se instala), `linea-base.py --req | --lote`, `objetivo.py --brecha`, `ubicar.py`, `mapa.py --ruta`, `ficha-semanal.py`, `buzon.py`, `conocimiento.py`, `archivar.py`, `riesgos.py`, `incidentes.py`, `flujo.py`.
- **Cola y pruebas:** `herramientas/ejecutar-cola.ps1` (v12), `herramientas/vigilar-buzon.ps1` (despertador v11.5), `herramientas/pw/` (probar-lote, aplicar, guion, metricas, rafaga), `herramientas/juez/texto-juez.md`, `herramientas/hooks-cli/` (hook v6; lo copia Carlos).
- **Plantillas:** `herramientas/plantillas/` (requerimiento, instrucción, revisor-previo, adr, traspaso, aviso-produccion, revision-incidente, como-vamos, pregunta-a-carlos).
- **Datos vivos:** `interno/diseno.json` (Diseño), `proyecto.json` (JP: trabajo, tandas, pausas, riesgos, metas), `seguimiento.json` (Desarrollo: lotes, INC, DT, PRB, cambios), `mensajes.json` (buzón), `mapa-modulos.json`, `linea-base/` (producto, Arquitecto), `linea-objetivo/` (objetivo, Diseño), `arquitectura/decisiones.json`, `conocimiento.json`, `mejoras.json`, `cobit.json`, `proceso.json`.
- **Planes de los procesos:** `claude/marco/plan-*.md` y `proceso-requerimientos-diseno.md`; método en `metodo-formalizacion-fabrica.md`; mapa de piezas en `mapa-fabrica.md`.
- **Vistas:** artefactos «Procesos de la fábrica STR», «Diagramas de la fábrica STR», explorador «Línea base del STR», mapa del STR.

## 7. Lo que falta probar y lo que queda fuera

- **Pruebas reales pendientes** (`mejoras.json › MJ-17.porProbar`): el primer REQ de producto con la plantilla; el primer tren tras la pausa; un mes de tamaños de lote; el primer INC desde producción con la plantilla; la primera tanda al levantar la pausa; la primera revisión de alcance confirmada en la línea objetivo (Inventario, en curso); el primer archivo del buzón; la DA-62 (riesgos aceptados y metas).
- **Propuestas desde el marco** (no entran al alcance hasta su `revisarCuando`): MJ-18 validación con usuarios reales · MJ-19 ventana o escalón de despliegue · MJ-20 revisión del código en críticos · MJ-21 diseño detallado en críticos · MJ-22 retención y disposición completas · MJ-23 este índice como política de calidad y modelo del ciclo de vida (hecho con esta versión).
- **Fuera por decisión:** capa de proyectos (ADR-008/009), operación (Carlos), comité de cambios, formularios, ventanas de cambio, CMDB completa, certificaciones.

---

# Parte II · Formalización por objetivos COBIT (2026-09-23 → 2026-10-18)

> Texto anterior a MJ-17. Sigue vigente el **modelo de operación (APO01)**: capas, roles y sombreros, entradas y salidas con elemento tangible, un escritor por elemento, encargos, infraestructura del marco y puntos de corte. Las secciones BAI02, BAI06, BAI07, BAI10, DSS02 y MEA01 describen la práctica de septiembre; donde un plan de `claude/marco/` las supera (Q, K, V, C, I, F, Rg), manda el plan. Lo que aquí se llama «Chat de desarrollo» con ocho roles son hoy Desarrollo, Jefe de proyecto y Arquitecto; `estado-proyecto.md`, `transiciones-chat.md` y `patrones-codigo.md` ya no existen (sustituidos por `proyecto.json`, el traspaso de cada rol y las lecciones con destino, LM-69).

>
> El texto íntegro de esa formalización se conserva en `claude/gobierno/proceso-cambios-2026-10-18.md`.
