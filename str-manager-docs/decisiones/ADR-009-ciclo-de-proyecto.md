# ADR-009 — Capa de proyectos (PMI) sobre capa de fábrica (COBIT): fases, repositorios y desvinculación del STR

**Fecha:** 2026-10-13 (v2) · **Estado:** aceptada por Carlos el 13-oct-2026; el detalle de la metodología de proyectos (plantillas, estimación, aceptación del cliente) se diseña después, con un P02 para probarlo · **Autor:** Chat Arquitecto · **COBIT:** BAI11.01–.09, APO05, BAI07.06, MEA01.
Análisis completo: `claude/marco/adr-fabrica-proyectos-2026-10.md`. Este archivo es el registro de la decisión.

## Decisión
1. **Dos capas, dos marcos.** Proyectos (PMI): que cada software nazca, se planee, se ejecute, se controle y se cierre a satisfacción del cliente; unidad: el proyecto `Pnn`; decide Carlos en las puertas, gestiona Diseño. Fábrica (COBIT + nuestro modelo): que cada cambio se defina, construya, pruebe y acepte; unidad: el lote `L-n`; acepta el juez, cruza Carlos lo crítico. El proyecto llama a los servicios de la fábrica en planificación y ejecución; el proyecto no sabe de cola ni de juez; la fábrica no sabe de clientes ni de actas.
2. **Fases = cinco grupos de procesos del PMI** (inicio, planificación, ejecución, monitoreo y control transversal, cierre) con las puertas **P1** acta y admisión al portafolio, **P2** línea base, **P3** listo para entregar, **P4** cierre. «Operación» es ciclo del producto, no fase del proyecto. Artefacto mínimo por práctica (una página). Un hito = varios lotes con un entregable que firma Carlos; cambiar alcance, costo o hitos = DA de línea base.
3. **Roles:** Carlos patrocinador; Chat Diseño gerente de cada proyecto; Chat Arquitecto PMO (método, plantillas, infraestructura, lecciones); Desarrollo, CLI, juez como hoy. Quien construye no acepta; quien acepta no decide la puerta.
4. **Repositorios:** `fabrica` (modelo), `fabrica-servicio` (servicio + app), `P01-str-manager` (código; renombrar puede esperar), `P01-str-docs` (producto); uno de código y uno de docs por proyecto nuevo, desde plantilla. Separación con historia de git.
5. **Desvincular el STR sin perder nada:** D1 `proyectos.json` con P01 y herramientas leyendo de ahí · D2 separar `str-manager-docs` con historia · D3 `modelo/` a `fabrica-servicio` en `fabrica.…`, misma base · D4 el grupo Proyecto sale del STR y pasa a la app de la fábrica (reemplaza B8/B9b) · D5 regularizar el STR: acta y línea base v1 desde lo ya construido, P1 y P2 en un acto, queda en ejecución · D6 P02 de prueba (reemplaza B11).
6. **Modelo de datos:** tablas `proyecto`, `linea_base`, `hito`, `costo`; `riesgo` por proyecto; `evento` registra cada puerta.

## Consecuencias
Portafolio ligero (APO05) y BAI11 completo y proporcional; BAI01 fuera hasta el cuarto proyecto. `proceso.json` gana la sección `proyecto`; encargos: Diseño gerente, Arquitecto PMO; `conocimiento.json` gana nodos `fabrica`, `pruebas`, `proyectoP01`. Presupuesto mensual de la fábrica: cifras de Carlos.
