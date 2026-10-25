# Plan de gestión de configuración de la línea base funcional del STR

**v3 · 25-oct-2026 (LM-80: línea de producto y línea objetivo; aprobado por Carlos «1, ok»; cruce Diseño M-1110, Jefe de proyecto M-1111, Desarrollo M-1112) · v2 · 20-oct-2026 · Dueño: Chat Arquitecto · Aprueba: Carlos · Cruzado con Diseño (M-925), Jefe de proyecto (M-926) y Desarrollo (M-927): los tres de acuerdo; sus ajustes ya están incorporados y marcados «(cruce)».**
Estructura según ISO 10007:2017, Anexo A. Apunta a lo que ya existe; no lo repite.

## A.1 Dos líneas (v3, LM-80)

| | **Línea de producto** (lo construido) | **Línea objetivo** (alcance evolutivo) |
|---|---|---|
| Dice | qué hace hoy cada módulo | qué debe hacer, según el alcance que Carlos cierra con Diseño |
| Dónde | `interno/linea-base/<MOD>.json` | `interno/linea-objetivo/<MOD>.json` (esquema en la misma carpeta) |
| Escribe | Arquitecto, con cada lote aceptado | **Diseño**, directo, con cada decisión de Carlos |
| Forma | ficha completa de capacidades y casos de uso | **solo diferencias** `D-<MOD>-n` (caso de uso nuevo, que cambia o que sale) con la decisión de Carlos (fecha, hora, ref) y estado borrador → validada → construida |
| Versión | foto por confirmación (`sistema.json`) | capacidad en revisión → cerrada (Carlos, capacidad por capacidad); módulo borrador → confirmado vN |

**Brecha** = diferencias validadas que aún no se construyen (`objetivo.py . --brecha [MOD]`). De la brecha salen los REQ (`reqs[].diferencias`); el lote nombra las que construye en su línea «Diferencias:»; al aceptarse, el Arquitecto las pasa a la línea de producto y las marca `construida`. Mientras un módulo tenga capacidades en revisión o diferencias en borrador, sus REQ quedan congelados (`proyecto.json › pausas[].modulos[]`, Jefe de proyecto); al confirmarlo, una pasada deja cada REQ vigente, ajustado o desestimado. Lo que impide operar el STR sigue por mantenimiento (proceso 5).

## A.2 Introducción

| Qué | Dónde |
|---|---|
| Propósito | Que la línea de producto (`interno/linea-base/`) diga siempre qué sabe hacer el STR hoy, módulo por módulo, y que ningún lote aceptado la deje atrás sin que se note; y que la línea objetivo (`interno/linea-objetivo/`) diga qué debe hacer, para que el alcance se analice y se cierre sobre ella. |
| Producto y elementos | STR Manager: sistema → 21 módulos → capacidades → casos de uso. **Elemento controlado: la capacidad** (152); el caso de uso (685) es su detalle y lleva el estado calculado. **(cruce, Diseño)** Un caso de uso puede llevar un peso propio cuando difiere del de su capacidad, como excepción visible en el explorador; así no hay que partir capacidades mixtas (INV catálogo, CAL reservas y bloqueos, K3 copia, HK ejecución del turno). |
| Herramientas | `linea-base.py` (integridad y estados; `--lote` con «Diferencias:»), `objetivo.py` (brecha y forma de la línea objetivo), `linea-base-pagina.py` (explorador «Línea base del STR»), `validar.py` (guardia del modelo; O1–O3), `ubicar.py` (hoy y objetivo), `mapa.py --ruta` (ruta de pruebas de un lote), la cola de LENOVO (regresión). |
| Documentos relacionados | `claude/gobierno/proceso-cambios.md` (BAI06/BAI10), `interno/instrucciones.json › reglas-comunes`, `interno/linea-base/esquema.json`, `interno/linea-objetivo/esquema.json`, `interno/mapa-modulos.json`, `herramientas/plantillas/revisor-previo.md`, MJ-16 en `interno/mejoras.json`, `claude/marco/propuesta-linea-objetivo-2026-10.md`. |
| Ritmo | Sin fechas: todo se dispara por eventos (lote aceptado, regresión, DA, confirmación de una capacidad, corte mensual). **(cruce, JP)** El corte mensual no es disparador todavía: no corre mientras el corte seguro (INC-175, 176, 177) siga en pausa y T-12 no exista. |

## A.3 Políticas y responsabilidades

**Línea base = información aprobada en un punto del tiempo** (ISO 10007 §3.2). Hoy hay un levantamiento revisado por Diseño; la **primera línea base nace con la confirmación de Carlos del alcance del sistema** (M-858, `sistema.json › alcance.confirmacion`), que desde v3 se construye capacidad por capacidad en la línea objetivo. Desde ahí, cada lote aceptado es un cambio aprobado sobre la línea de producto.

**Autoridad de disposición por tipo de cambio** (§4.1 f, §5.4.4):

| Tipo de cambio | Categoría | Aprueba | Verifica |
|---|---|---|---|
| Alcance del sistema, objetivos, pasar algo a «fuera de alcance» | crítico | Carlos (DA-n) | Diseño |
| **Diferencia en la línea objetivo** (caso de uso nuevo, que cambia o que sale; capacidad cerrada) | normal | Carlos, con la ficha de cambio (Diseño la registra validada) | `validar.py` O1 |
| Peso de una capacidad, decisión de producto, capacidad nueva | normal | Diseño (línea objetivo; en la de producto, revisión en el archivo del módulo) | Arquitecto |
| Caso de uso nuevo o cambiado por un lote | normal | Lo cubre el REQ aprobado (y sus diferencias) | Juez (regresión) |
| Realización técnica (archivos, rutas, colecciones) | estándar | Desarrollo | Arquitecto |
| Corrección documental (texto, par de flujos, tipo de REL) | estándar | Arquitecto | `validar.py` |

Un escritor por archivo (reglas-comunes): `interno/linea-base/*.json` y `mapa-modulos.json` los escribe el Arquitecto; **`interno/linea-objetivo/<MOD>.json` lo escribe Diseño** (el esquema, el Arquitecto, que solo marca `construida` al aceptarse un lote). **(cruce, Diseño)** Las revisiones de Diseño a la línea de producto siguen llegando por el buzón y el Arquitecto las escribe en `revisiones[]` con «por: Chat Diseño (M-n)».

**Concesiones** (§5.4.1, nota): una limitante aceptada a propósito es una concesión. Llevan id `CN-n` en el caso de uso, con quién la aceptó y hasta cuándo, para poder reportarlas.

## A.4 Identificación

- Nomenclatura (ya vigente): `CAP-<MOD>-n`, `CU-<MOD>-n.m`, `REL-n`, `RT-n`, `REQ-<MOD>-n`, `DA-n`, `L-n`, `INC-n`, `CN-n`; **`D-<MOD>-n`** (diferencia de la línea objetivo, v3). Ids únicos, nunca se reutilizan.
- Estado de revisión: `version` y `estadoArchivo` por módulo; `revisiones[]` con fecha, por y qué. En la línea objetivo: `version`, `estado` (borrador · en revisión · confirmado) y `historial[]`.
- **Madurez por módulo** (`estadoArchivo`): `levantado` → `revisado-diseno` → `confirmado` (Carlos) → `anclado` (todo caso esencial con guion que lo cubre) → `verificado` (≥ 90 % comprobado, concesiones revisadas, auditoría física pasada). Un módulo no sube sin cumplir el criterio; `validar.py` lo comprueba.
- **Fotos de la línea base**: en cada confirmación de Carlos, `sistema.json` guarda `{commit, lineaBaseHasta: L-n, fecha}`; la foto anterior se conserva en el historial para comparar y volver atrás.

## A.5 Control de cambios

Un cambio de la línea base sigue el proceso de cambios vigente (BAI06): categoría, cabecera del lote, DA-n si es crítico. Lo que se agrega:

| # | Control | Regla | Guardia |
|---|---|---|---|
| C1 | Integridad | `linea-base.py` con 0 errores es parte de `validar.py`. | error |
| C2 | Lote ↔ caso de uso | Los casos de uso que toca un lote **se calculan** (ruta de `mapa.py` + `cubre` de sus guiones + anclaje REQ→caso + `casosUso.crea` del REQ, que entran como «nuevo, definido en REQ-X»); Desarrollo confirma o corrige en la cabecera. Valor explícito **«técnico, sin caso de uso»** para lotes que solo tocan guiones, cola, modelo o documentación. **(cruce, Desarrollo)** Es **aviso** hasta que la herramienta entregue la lista por borrador y Desarrollo la use en dos lotes seguidos; después, error. | aviso → error |
| C3 | Incidente ↔ caso de uso | Todo INC nuevo cuelga de un caso de uso o lleva «sin caso de uso». **(cruce)** En los INC del veredicto el juez propone el caso de uso y Desarrollo lo confirma (como `causaRaiz`, LM-56). Un INC «sin caso de uso» entra a `bolsa[]` de Diseño con ref T-n, el INC en la nota y tipo «alcance incompleto». | error |
| C4 | Guion ↔ caso de uso | Todo guion e2e declara `cubre`; el número de casos esenciales sin guion solo puede bajar; al llegar a 0 el aviso pasa a error. | trinquete |
| C5 | Frescura | Si hay una regresión más nueva que la de la página, aviso. | aviso |
| C6 | Relaciones | Toda REL lleva `tipo`; «por precisar» solo puede bajar. | trinquete |
| C7 | Pares de flujos | Toda salida A→B tiene su entrada B←A. | error |
| C8 | Cambio de alcance o peso | Exige revisión de Diseño en el archivo; si toca el alcance del sistema, además DA-n y confirmación de Carlos. | error |
| C9 | Madurez | Un módulo no cambia de `estadoArchivo` sin cumplir el criterio de A.4. | error |
| C10 | Fotos | Cada confirmación de Carlos deja su foto en `sistema.json`. | error |
| C11 | Lista de firma del lote | `revisor-previo.md` pasa de 17 a 19 puntos: casos de uso tocados confirmados contra lo calculado (o «técnico, sin caso de uso»); escenarios nuevos o cambiados **ya escritos en el REQ en la forma de la línea base** (proceso de requerimientos §4). Sin ellos no se encola. **(cruce, JP)** Rige desde que el LM-n esté instalado y la plantilla diga 19. | error |
| **O1** | Forma de la línea objetivo (v3) | Ids `D-<MOD>-n` únicos; tipo y estado válidos; `cambia`/`sale` sobre un caso de uso que existe; `nuevo` sobre uno que no; campos de la ficha; validada con decisión; construida con lote; capacidad cerrada con confirmación. | error |
| **O2** | REQ ↔ diferencia (v3) | Un REQ que cita una diferencia inexistente; el lote con «Diferencias:» que no existen o no están validadas → `--lote` rc 2. | error |
| **O3** | Decisiones en su lugar (v3) | Una nota de pedido de más de 3 000 caracteres sin especificación ni línea objetivo. | aviso |

Orden propuesto de instalación: C1, C9, C11 y la **herramienta de C2** primero (lo que evita que la línea base se desactualice en silencio); luego C3, C4, C6, C7, C8; C5 y C10 con la primera confirmación; C2 pasa a error cuando Desarrollo la haya usado en dos lotes. O1–O3 instalados con LM-80. **(cruce, JP)** La cola está en PAUSA por pedido de Carlos: un LM-n de este plan que necesite la cola es una excepción; el Jefe de proyecto la cruza con Carlos antes de encolar.

## A.6 Registro de estado y reportes

| Reporte (§5.5.3) | Dónde |
|---|---|
| Lo que incluye la línea base N | Foto en `sistema.json` + `git diff` entre fotos |
| Estado de revisión e historial por módulo | `revisiones[]` y `historial[]` del mapa; `historial[]` de la línea objetivo |
| Estado de cambios | `seguimiento.json` (lotes, INC) y `diseno.json` (REQ, DA) |
| **Brecha por módulo** (v3) | `objetivo.py . --brecha [MOD]`; en `ubicar.py` la línea «Línea objetivo»; en el explorador, hoy · objetivo · brecha (después) |
| Concesiones vigentes | Lista de `CN-n` (sección nueva del explorador) |
| Semáforo | Explorador (única fuente): cobertura, estados, madurez por módulo, trinquetes C4 y C6. **(cruce, JP)** Al cerrar cada tanda de lotes el Jefe de proyecto deja en `proyecto.json` una línea con la lectura y el enlace; si un trinquete retrocede lo lleva a Diseño por el buzón para abrir la decisión (él no abre DA). |

Entorno (§5.5.2.3): repositorio Git con historial, respaldo diario del hosting, página autónoma que se puede abrir sin servidor.

## A.7 Auditorías (§5.6)

| Auditoría | Qué comprueba | Quién | Cuándo |
|---|---|---|---|
| **Funcional** | Que cada caso de uso tocado hace lo que dice su escenario | Juez (regresión de la cola) | En cada lote |
| **Física** | Que la línea base describe el código real: rutas, colecciones, pantallas, relaciones | Agente auxiliar (muestreo), coordinado por el Arquitecto; hallazgos a Diseño y Desarrollo por el buzón; informes en `interno/linea-base/auditorias/` (escritor: Arquitecto) | A pedido de Carlos y **antes de que un módulo pase a `verificado`**; el corte mensual se suma cuando el corte seguro corra (INC-175–177, T-12). El Jefe de proyecto anota la tarea en `proyecto.json` cuando se dispara |

Formato del informe de auditoría: módulo, muestra, coincide/no coincide por caso, INC o corrección propuesta, firma del agente. Va a `interno/linea-base/auditorias/`.

## Quién hace qué

| Quién | Cuándo | Qué |
|---|---|---|
| Desarrollo | Al construir cada lote | `cubre` en los guiones; confirma los casos tocados que le calcula la herramienta; línea «Diferencias:» si el REQ cierra diferencias; origen de cada INC. |
| Verificador (juez) | Al aceptar | Último freno: no acepta si C2 o C11 fallan o un caso tocado quedó en rojo. |
| Arquitecto | Tras cada lote aceptado y cada regresión | Responsable de que cada caso tenga prueba y de que la línea de producto refleje el lote (incluidas las diferencias construidas, que marca `construida`); recalcula, valida, republica. |
| Diseño | En la revisión de alcance con Carlos; cuando hay un INC sin caso de uso; cuando entra un REQ | **Escribe la línea objetivo** (diferencias, capacidades, versión del módulo) el mismo día; los REQ citan las diferencias que cierran; las revisiones a la línea de producto, por el buzón. |
| Jefe de proyecto | Al cerrar cada tanda de lotes; al cambiar el estado de un módulo en revisión | Semáforo; congela y descongela REQ por módulo en `pausas[]`; abre decisión si un trinquete retrocede. |
| Agente auxiliar | Corte mensual, a pedido, antes de `verificado` | Auditoría física. |
| Carlos | Hitos | Confirma capacidades y módulos en la línea objetivo y el alcance (crea la foto), aprueba DA y subidas a `verificado`. |

## Referencias
ISO 10007:2017 (§3.2, §4, §5.3–5.6, Anexo A; líneas funcional y de producto) · ISO/IEC/IEEE 12207:2017 6.3.5 · COBIT 2019 BAI10 · NIST SP 800-53 CM-2 (frecuencia definida, fotos conservadas) · OpenTitan (estados de madurez por bloque) · Kubernetes KEP (lista de firma con ítems requeridos) · Teamscale y jamb (trazabilidad calculada en el pipeline) · Rust Reference (anotaciones de prueba por regla, editor responsable de la cobertura) · Ford/Parsons, fitness functions (trinquetes) · TOGAF (arquitectura base, objetivo y análisis de brechas).
