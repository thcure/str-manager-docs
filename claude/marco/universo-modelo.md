# Universo · modelo de clasificación y gobierno de todas las piezas

**Estado:** instalado (LM-83, 30-oct-2026) dentro de MJ-26 («encárgate de eso»); plan en `plan-universo-2026-10.md`. Este documento es la **definición** del modelo; los datos viven en `interno/universo.json` (piezas) e `interno/mapa-procesos.json` (circuito); las listas cerradas en `herramientas/modelo/esquema.json › universo` y `› mapaProcesos`; las guardias en `herramientas/modelo/universo.py` (U1–U6) y `herramientas/modelo/procesos.py` (P1–P5), que corre `validar.py`; las páginas generadas en `herramientas/paginas/universo.html`, `arbol-universo.html` y `mapa-procesos.html`, servidas por el servicio del modelo. Cruzado con Diseño, Jefe de proyecto y Desarrollo el 30-oct (M-1304/1305/1306, sin objeción; dos observaciones de Diseño aplicadas). **COBIT:** BAI10 (configuración), APO01 (modelo de operación), APO03.02 (arquitectura de referencia).

## Idea

El Universo es el conjunto de **todas** las piezas del proyecto de Claude «Diseño y Desarrollo»: la capa Proyectos (portafolio y P01 STR Manager), la capa Herramientas (la Fábrica, primera herramienta: método, herramientas, servicio del modelo) y lo transversal (identidades, cuentas y credenciales; plataformas donde vive cada cosa). Incluye las piezas propias de Claude (instrucciones del proyecto, mensaje de arranque de cada chat, memoria, skills, tareas programadas, artefactos, docs del proyecto) y las externas (GitHub, Hostinger, Firebase, Google Cloud, MySQL, LENOVO). Cada pieza es un ítem de configuración con dos caras: **dimensiones** que la clasifican y **atributos de gobierno** que la responsabilizan.

Reglas: todo lo que está en el Universo es **real** (existe hoy, alguien lo usa o lo mantiene) y cita su **fuente** (archivo, mensaje, pantalla vista); nada supuesto. Lo que ya no se usa entra como «superado», no se borra. Un dato, una fuente: lo que el Universo absorbe deja de mantenerse en el archivo viejo (`elementos.json` es desde LM-83 una vista heredada hasta L-183). Los **eventos** del circuito no son piezas: son el enlace entre nodos del mapa (M-1305).

## El árbol: capa y rama

El árbol no es otro archivo: es la ruta de cada pieza (`capa` + `rama`) y la página `arbol-universo.html` se genera de ahí. Dos capas del ADR-009 v5 y una transversal:

- **proyectos** (gobierna, PMI): `proyectos/portafolio`, `proyectos/P01` con sus ramas `producto`, `alcance`, `decisiones`, `construccion`, `arquitectura`, `orden`, `pruebas`, `vistas`.
- **herramientas** (sirven; la Fábrica es la primera): `herramientas/fabrica/metodo/{procesos, gobierno, roles, plantillas, conocimiento}`, `herramientas/fabrica/herramientas/{modelo, cola, verificacion, comunicacion}`, `herramientas/fabrica/servicio`. Las futuras herramientas cuelgan de `herramientas/<nombre>`.
- **transversal**: `transversal/identidades` (identidad → cuenta → rol → credencial → rotación; de una credencial solo se registra que existe y dónde, nunca su valor) y `transversal/plataformas`.

Los menús de los sitios (L-183 Fábrica, L-184 proyectos.) salen de estas ramas, no de `elementos.json › puesto`.

## Dimensiones (clasifican; listas cerradas en `esquema.json › universo`)

| Dimensión | Pregunta | Valores |
|---|---|---|
| Naturaleza | ¿Qué es? | proceso · agente · herramienta · dato · documento · vista · decisión · infraestructura · instrucción · credencial · identidad (persona, agente, cuenta o credencial, entre paréntesis) |
| Forma | ¿En qué está hecho? | .json · .md · .html · .txt · código · chat · tarea programada · tarea de Windows · artefacto · sitio · repo · base de datos · texto · carpetas · archivos · cuenta · skill · mensaje · hosting · dominio · servicio · equipo · software · perfil · workflow · cron · proyecto de Claude |
| Plataforma | ¿Dónde está físicamente? | GitHub · proyecto de Claude · Claude · chat de Claude · LENOVO · ASUS · Hostinger · Firebase · Google Cloud · MySQL · varias |
| Capa y rama | ¿Dónde cuelga del árbol? | capa ∈ {proyectos, herramientas, transversal}; rama = ruta que cuelga de la capa (lista `ramas` del propio `universo.json`) |
| Proceso | ¿En qué proceso del método nace o se usa? | F0 línea base · F1 requerimientos · F2 flujo · F3 construcción · F4 verificación · F5 incidentes · F6 arquitectura · F7 riesgo · F8 conocimiento (o «—») |
| Estado | ¿Vive? | vigente · parcial · desfasado (vigente pero atrasado; pedido por Diseño) · propuesto · diferido · superado · duda · fuera (existe en la cuenta pero no pertenece al universo) |

La «capa» del índice viejo (gobierno · marco · producto · operación · archivo) se conserva solo como `capaVieja` para la trazabilidad y se retira con `elementos.json` (decisión de Carlos en F7).

## Atributos de gobierno (responsabilizan; toda pieza los tiene)

| Atributo | Qué responde |
|---|---|
| responsable | rol con sigla que lo lleva hoy (DU = Carlos cuando es suyo: secretos, hPanel, Firebase, cuentas) |
| mantenimiento | cómo cambia: automático (commit, Action, generado) · a mano por el escritor · por LM con ok de Carlos; qué lo dispara |
| control | qué guardia lo vigila (C, Q, F, K, V, I, A, Rg, Cn, M, E, U, P) o «ninguno» (U1 avisa si la pieza está vigente y sin control) |
| relaciones | depende de · alimenta a · se genera desde · lo muestra (vista) |
| respaldo | dónde está la copia y cómo se vuelve a levantar |
| acceso | quién lee, quién escribe, si guarda secretos o datos del negocio |
| estado | la dimensión de vigencia (arriba), desde cuándo |
| historial | de dónde viene y qué la cambió (pedido por Diseño: visible por pieza en la página) |
| fuente | dónde se comprobó que existe (archivo, mensaje M-n, pantalla vista en Chrome o inventario de LENOVO) |
| hallazgo | lo que se vio al registrarla y falta resolver (opcional) |

## Guardias (en `validar.py`)

| Guardia | Qué comprueba | Severidad |
|---|---|---|
| U1 forma | ids únicos, listas cerradas, rama que cuelga de su capa, gobierno completo; vigente sin control = aviso | error |
| U2 datos | todo `interno/*.json` y carpeta de `interno/` tiene pieza | aviso → error el 10-nov |
| U3 herramientas | todo archivo de `herramientas/` tiene pieza (los `.py`/`.js` del modelo pueden contar dentro de otra) | aviso → error el 10-nov |
| U4 proyectos | todo sitio y repo de `interno/proyectos.json` tiene pieza | error |
| U5 nacimiento | un lote que dice «pieza nueva» queda citado en la fuente de alguna pieza | error |
| U6 vigencia | la ruta de toda pieza vigente existe en el repo (o la pieza vive en el proyecto de Claude) | aviso → error el 10-nov |
| P1–P5 | circuito cerrado: disparador con origen, salida con destino, siguiente y bifurcaciones existentes, nodos N2–N4 con dueño y retorno, hojas con herramienta o piezas | error |

## El circuito: mapa de procesos (`interno/mapa-procesos.json`)

Niveles: **N0** portafolio (PF) · **N1** el proyecto por fases PMI (`P01.ini/pla/eje/mon/cie`, puertas P1–P4) · **N2** los procesos de la fábrica F0–F8 · **N3** etapas de cada proceso tal como las describieron los chats que las viven (Diseño F1.Z1, E1–E3, R1–R8, C1–C8, Z2; JP F2.1–13 y F7.1–7; Desarrollo F3.1–8, F4.1–5, F5.1–7; Arquitecto F0.x, F6.x, F8.x) · **N4** pasos de un procedimiento (hoy F3.3.0–F3.3.21: la instrucción L-n, 22 pasos de Desarrollo). Cada nodo tiene `rol`, `disparador{evento, de, otros}`, `entradas[piezas]`, `hace`, `salidas{piezas, evento, alternos}`, `siguiente[]`, `bifurca[{si, a}]`, `retorno`, `guardias[]`, `herramientas[piezas]`, `plazo`, `fuente`, `estado`. La regla del circuito: la salida de un nodo es el disparador de otro; todo evento no externo lo emite alguien y, si no es terminal, lo dispara alguien; toda entrada, salida y herramienta es una pieza del Universo. Los eventos de origen `externo` (pedido de Carlos, relevo de chat, mejora adoptada, incidente visto…) y los `terminal` cierran los extremos.

## Qué sucede a qué

| Archivo o artefacto viejo | Lo absorbe | Estado |
|---|---|---|
| `interno/elementos.json` (78 elementos, `puesto`) | `universo.json` (277 piezas) | vista heredada hasta L-183; luego superado (F7) |
| `interno/marco-trabajo.json` (12 pasos de septiembre) | nodos N2–N4 del mapa | desfasado; superado cuando N4 cubra las etapas hoja (F3.5) |
| artefactos «Universo STR», «Árbol del universo», «Circuito del universo», «Inventario del universo» | páginas generadas universo / arbol-universo / mapa-procesos | pasan a superados en F4.2 |
| «situaciones» y nomenclatura del camino del lote | el mapa es la fuente; la nomenclatura y los encargos citan de ahí (F3.4) | en curso |

## Revisión periódica de lo que vive fuera del repo

Chats, tareas programadas, Hostinger, Firebase, GitHub y LENOVO no los ve ninguna guardia automática. El Arquitecto los repasa al cerrar cada LM que los toque y el Jefe de proyecto los incluye en su «¿cómo vamos?» (campo `revisarCuando` en el control de la pieza). Lo que tenga fecha de vencimiento (tokens, plan de hosting, dominio) va a `claves/vencimientos.json` sin valores (F6.7).
