# Propuesta · Línea objetivo (alcance evolutivo) y los tres modos de trabajo de Diseño — LM-80

**Estado:** propuesta en cruce (Diseño, Jefe de proyecto, Desarrollo), 25-oct-2026 17:04. Carlos: «suena bien» a la línea objetivo; pidió además retroalimentar a Diseño sobre el cumplimiento de su proceso y darle un norte. **Autor:** Chat Arquitecto. **Cambia:** `plan-configuracion-linea-base.md` (v2 → v3), `rol-diseno` (v4.2 → v4.3), `reglas-comunes` (regla 17, si Carlos la aprueba). **Proceso:** 0 Gestión de la configuración y 1 Definición de requisitos (ISO/IEC/IEEE 12207 6.3.5, 6.4.2; ISO 10007 líneas funcional y de producto; 29148 § 6.2).

## 1. Problema
- La «línea base» de hoy es la **línea de producto**: lo que el STR sabe hacer (escribe el Arquitecto con cada lote aceptado). No hay **línea funcional**: lo que el STR debe hacer. Al revisar el alcance con Carlos, Diseño no tiene dónde dejar los cambios: hoy se acumulan en la nota de P-15 (≈ 20 000 caracteres) y en un documento de especificación.
- Diseño trabaja con Carlos en un modo que el encargo no describe: la **revisión de alcance** (sesiones largas por módulo). El encargo tiene el proceso del REQ y la escucha; la revisión quedó en medio y Diseño la llevó en conversación libre (lección de Diseño del 24-oct: empezó Inventario sin ubicar; Carlos lo notó).
- Los REQ entregados sin lote (18) y los borradores van a cambiar o caerse con el alcance nuevo.

## 2. Línea objetivo
| | Línea de producto (lo construido) | Línea objetivo (evolutiva) |
|---|---|---|
| Dice | qué hace hoy cada módulo | qué debe hacer según el alcance que Carlos cierra con Diseño |
| Escribe | Arquitecto, con cada lote aceptado | **Diseño**, directo, con lo que Carlos decide |
| Se guarda | `interno/linea-base/<MOD>.json` (igual que hoy) | `interno/linea-objetivo/<MOD>.json`: **solo diferencias** sobre la de producto: CU nuevo, CU que cambia (campos), CU que sale, capacidad nueva o peso que cambia, cada una con su decisión de Carlos (fecha y hora) |
| Versión | foto por confirmación (`sistema.json`) | por módulo: `borrador` mientras se revisa → `confirmado vN` cuando Carlos cierra ese módulo; global v1 = alcance confirmado (M-858) |

**Brecha** (calculada, no escrita): por caso de uso, igual · nuevo · cambia · sale · construido sin alcance. De la brecha salen los REQ; cada REQ cita las diferencias que cierra; cuando un lote aceptado las construye, pasan a la línea de producto y la diferencia se cierra. Herramientas: `linea-base.py --brecha [MOD]`, `ubicar.py` muestra «hoy» y «objetivo», el explorador muestra hoy · objetivo · brecha. Diseño puede anotar diferencias desde el primer día; las herramientas llegan después.

## 3. REQ en cola durante la revisión
No se revisan uno a uno ahora. **Se congelan por módulo**: los REQ del módulo en revisión esperan; el **punto de actualización** es la confirmación de ese módulo en la línea objetivo; entonces una sola pasada mapea cada REQ contra la brecha: **vigente · se ajusta · se desestima** (con motivo). Los REQ de módulos que no están en revisión siguen su curso (p. ej. T-33). Excepción de siempre: lo que impide operar el STR va por mantenimiento (proceso 5). La pausa de producto (JP, `pausas[]`) pasa a decir esa condición.

## 4. Los tres modos de Diseño con Carlos (el norte)
| Modo | Cuándo | Entrada obligatoria | Dónde escribe | Salida |
|---|---|---|---|---|
| **Escucha** | frase suelta, «sobra / va después / ¿ya está?» | tarjeta de `ubicar.py` | P-n, bolsa, nota de lo abierto | un destino de los cinco, el mismo día |
| **Revisión de alcance** | sesión por módulo («revisemos Inventario») | ficha de ubicación: CU con estado, decisiones vigentes, vecinos por relación (como pide el skill `gestion-requerimientos` § 1) | **línea objetivo** del módulo (decisiones con hora) + especificación del tema | módulo «confirmado vN» por Carlos; lista de brechas |
| **REQ** | cerrar brechas y construir | brechas que cierra; lista de entrada del proceso de requerimientos | `reqs[]` + `requerimientos-*.md` | «listo para construir» (Q1–Q8) |
Reglas: el primer mensaje de cualquier modo es la ficha (nunca diálogo sin ubicar); el encargo dice el **qué** y es obligatorio, el skill `gestion-requerimientos` dice el **cómo** y no lo contradice; una nota de pedido no es el lugar de las decisiones de alcance (va a la línea objetivo).

## 5. Regla común propuesta (17)
«Antes de presentarle a Carlos un tema como abierto o nuevo, ubicas lo ya decidido: `ubicar.py`, `decisiones.json` y el análisis completo del ADR o la especificación.» Nace de dos escapes de esta semana: Diseño empezó Inventario sin ubicar (24-oct) y el Arquitecto presentó como abierta la decisión de sitios del 17-oct (24-oct, ADR-009 v5 sin leer).

## 6. Guardias (después de instalar)
`validar.py`: aviso si una nota de pedido supera 3 000 caracteres sin especificación ni línea objetivo del módulo; aviso si un REQ «listo» de un módulo con línea objetivo no cita diferencias. `linea-base.py --brecha` en el arranque de Diseño cuando revisa un módulo.

## 7. Preguntas del cruce
Diseño: ¿los tres modos describen tu trabajo? ¿escribir diferencias en `linea-objetivo/<MOD>.json` te sirve, y empiezas con Inventario volcando lo de P-15? ¿el skill se queda como el cómo? JP: ¿congelar por módulo con el punto de actualización en la confirmación del módulo te cabe en `pausas[]`? Desarrollo: ¿citar en la cabecera del lote las diferencias que cierra te cabe (línea «Casos de uso:» ampliada)?
