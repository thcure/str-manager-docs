# Mapa de la fábrica · vista 0 (sistema) · punto de partida

**Estado:** vista 0 solamente (ARQUITECTURA-v1 A7, LM-67, 21-oct-2026). La arquitectura completa de la fábrica (vistas de módulos, relaciones, decisiones propias) se diseña con la capa de proyectos (ADR-008 fases F1–F4, ADR-009); este documento solo fija qué piezas son de la fábrica y no del STR, para que el mapa del producto no las mezcle y para que la capa de proyectos herede una frontera ya dibujada. **Autor:** Chat Arquitecto. **Capa:** Marco.

## Qué es la fábrica
El conjunto de herramientas y reglas con el que se construye, verifica, acepta y gobierna un producto (hoy, solo el STR = P01). No guarda datos de ningún negocio. Un proyecto no escribe en la fábrica: pide por el buzón.

## Marco (LM-74)

Los nueve procesos de la fábrica se numeran por orden de ejecución y llevan el nombre de la ISO/IEC/IEEE 12207:2017 (`proceso.json › procesosFabrica`): 0 Gestión de la configuración · 1 Definición de requisitos · 2 Evaluación y control del proyecto · 3 Implementación e integración · 4 Verificación y validación · 5 Mantenimiento · 6 Definición de arquitectura y gestión de decisiones · 7 Gestión de riesgos y medición · 8 Gestión del conocimiento y de la información. El mapa SDLC × 12207 con lo cubierto, lo parcial, lo que queda fuera por decisión (capa de proyectos, operación de Carlos) y lo que falta (propuestas MJ-18…MJ-23) está en el artefacto «Diagramas de la fábrica STR» › Marco. COBIT 2019 sigue siendo el marco de gobierno de cada proceso.

## Piezas (vista 0)
| Pieza | Qué hace | Dónde vive hoy | Repo destino (ADR-009) | Escritor |
|---|---|---|---|---|
| Modelo (JSON) | `proceso.json`, `cobit.json`, `instrucciones.json` (encargos), `esquema.json`, `mejoras.json`, `conocimiento.json`, plantillas | `str-manager-docs/interno/*`, `herramientas/plantillas/` | `fabrica` | Arquitecto |
| Estado vivo del proyecto | `diseno.json`, `seguimiento.json`, `proyecto.json`, `mensajes.json`, línea base, mapa | `str-manager-docs/interno/*` | `P01-str-docs` (y el servicio del modelo, B7-6) | Diseño · Desarrollo · JP · Arquitecto |
| Cola | `ejecutar-cola.ps1`, `probar-lote.js`, `tren.js`, `aplicar.js`, `v2.js`, `metricas.js`, hooks de la CLI (`guard-bash.js`, `stop-check.js`, `ctx.js`) | LENOVO `str-instr-cola\` + `herramientas/pw`, `herramientas/hooks-cli` | `fabrica` | Arquitecto (hooks los copia Carlos) |
| Verificador | `pw` (Playwright 1.64.0), perfiles `zz-verif-`, semilla, guiones e2e del producto | LENOVO `str-instr-cola\pw\`; `tests/e2e/` del STR | `fabrica` (arnés) · `P01-str-manager` (guiones) | Arquitecto · Desarrollo |
| Juez | `texto-juez.md`, veredictos en `log\` | LENOVO `juez\` | `fabrica` | Arquitecto |
| Despertador y panel | vigía de estancamiento, panel de Carlos («ESPERAN DE TI»), `vigilar-buzon.ps1` | LENOVO; `herramientas/panel` | `fabrica` | Arquitecto · JP (reglas) |
| Servicio del modelo | `/modelo/api` (salud, export, carga) con base propia | `fabrica.apartamentosbucaramanga.com`; código en `str-manager/modelo/` | `fabrica-servicio` | CLI por LM-n |
| Grupo Proyecto en la app | Seg. Proyecto, COBIT, Elementos, Instrucciones, Marco (páginas dentro del STR) | `str-manager` (módulo PRJ) | `fabrica-servicio` (app de la fábrica) | CLI por LM-n |
| Chats con rol | Diseño, Desarrollo, Jefe de proyecto, Arquitecto, verificador, agente CLI | proyecto de Claude «Diseño y Desarrollo» | — (el proyecto en el arranque) | Carlos |

- **Riesgo y medición (RIESGO-v1, LM-71):** registro `proyecto.json › riesgos[]` (R-n con respuesta probada y dueño; JP escribe, Arquitecto propone), riesgo por módulo en el mapa (impacto desde la línea base, probabilidad que se mueve con los INC), tabla de medidas `esquema.json › riesgo.medidas[]` (20 en el semáforo, cada una con dueño y acción), metas del periodo `proyecto.json › metas[]`, `interno/METRICAS.json` (copia de la cola). La ficha de la tanda y «¿cómo vamos?» son la salida; una roja dos fichas seguidas produce una acción o un riesgo aceptado por Carlos.

## Relaciones con el producto (hoy)
| De | A | Mecanismo | Tipo |
|---|---|---|---|
| Cola | `str-manager` (código) | rama `claude/l<n>-*` → `main` (push de la CLI; hooks) | código |
| Verificador | STR en producción (cuenta `zz-verif-pruebas`) | HTTP con sesiones `zz-verif-`; guardia de escritura | terceros (desde el punto de vista del producto) |
| Servicio del modelo | STR (grupo Proyecto) | proxy `/api/modelo/*` (DA-39) | servidor |
| Modelo (JSON) | Todos los chats | lectura al arrancar (`ctx.js` inyecta `reglas-fijas.md` a la CLI) | código compartido |
| Carlos | Fábrica | hPanel, LENOVO, tokens, copias a mano de hooks | manual |

## Lo que la capa de proyectos decidirá (no aquí)
Separación de repos (F3), registro `proyectos.json`, qué chats son por proyecto, la app de la fábrica (§ 4b de ADR-009), el dominio propio (MJ-9), y la arquitectura interna de la cola y el verificador cuando sirvan a más de un proyecto.

## Decisiones de la fábrica ya tomadas
ADR-006 (servicio del modelo), ADR-007 (ambientes), ADR-008 (fábrica multiproyecto), ADR-009 (capa de proyectos), ADR-010 (conocimiento y agentes): `capa: fábrica` en `interno/arquitectura/decisiones.json`.
