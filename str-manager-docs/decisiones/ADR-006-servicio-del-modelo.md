# ADR-006 — Servicio del modelo de operación (API + base propia)

**Fecha:** 2026-10-12 · **Estado:** aceptada por Carlos el 12-oct-2026 12:45 (opción B; carpeta `modelo/` en `str-manager`; la renovación de Hostinger se trata aparte, no traba B7-1) · **Autor:** Chat Arquitecto · **REQ:** REQ-MOD-6 · **Plan:** PT-M1 B5 (decide), B7 (servicio), B8 (páginas), B9 (conocimiento generado), B11 (segundo proyecto).
Copia idéntica en el proyecto de Claude: `claude/marco/adr-servicio-modelo-2026-10.md`. Esta es la fuente.

## 1. Contexto: cómo vive el modelo hoy y qué duele

Todo el modelo (requisitos, decisiones, lotes, cambios, veredictos, mensajes, encargos, fichas, situaciones) son archivos JSON en el repositorio **público** `thcure/str-manager-docs/interno/`. Los escriben tres chats, el verificador y la cola por `git` con un token por rol; las páginas del grupo Proyecto del STR los leen de `raw.githubusercontent.com`.

Lo que ya costó tiempo (situaciones G-11 y G-12, más lo visto del 8 al 12-oct):

| Dolor | Qué pasa | Ejemplo |
|---|---|---|
| Un archivo = un escritor | `mensajes.json` lo escriben todos → `rebase` con conflictos; la regla «un escritor por archivo» existe por git, no por el modelo | 11-oct, tres conflictos resueltos a mano |
| Caché de lectura | raw tarda hasta 5 min; el despertador y las páginas ven datos viejos (REQ-TB3 lo mitiga leyendo por sha) | S-dev: M-87 llegó 5 min tarde |
| Las tareas no escriben en el buzón | El verificador solo puede dejar archivos en una carpeta conectada; sin carpetas (tras un reinicio) queda mudo | 71-veredicto-bloqueado, 74 varado |
| Sin validación al escribir | Los errores entran y se descubren después (22 errores y 228 avisos en el primer informe de `validar.py`) | ids legado, estados fuera de lista, FK rotas |
| Público | Nada sensible puede vivir ahí (ni correos, ni costos reales, ni tokens); `comandos-usuario.md` queda aparte | regla BAI08.03-t |
| Historia solo por git | «¿Cuánto tardó el lote del construido al aceptado?» exige leer commits | métrica REQ-TB3 |
| Un solo proyecto | Nada lleva `proyecto`; un segundo proyecto copiaría el modelo entero | REQ-MOD-6, B11 |

Lo que sí funciona y hay que conservar: Carlos lee JSON y Markdown sin herramientas; git da respaldo e historia gratis; los chats ya saben usar git con token; el STR ya muestra todo en el grupo Proyecto.

## 2. Decisión propuesta

**Opción B: un servicio pequeño en el mismo hosting del STR (Hostinger Premium: PHP + PDO + MariaDB), con base de datos y carpeta propias, separado del despliegue del STR, con credencial por rol y `proyecto` en todas las tablas; exportación diaria a Git para lectura humana y respaldo.** Git deja de ser la fuente de verdad del estado y pasa a ser el espejo legible; `conocimiento.json`, `instrucciones.json` y las plantillas siguen en Git (son texto que se edita, no estado).

## 3. Alternativas consideradas

| | A. Seguir en Git + validador en hook | **B. Servicio en el hosting del STR (propuesta)** | C. Servicio externo (Supabase / Cloudflare D1 / Railway) | D. GitHub como base (API de contenidos + Issues) |
|---|---|---|---|---|
| Costo de dinero | 0 | **0** (el plan incluye varias bases MariaDB; sin Node, igual que el STR) | 0 en capa gratuita; cuenta nueva y tarjeta de Carlos para subir de plan | 0 |
| Esfuerzo | S (ya casi hecho: `validar.py`, REQ-TB3) | **M–L: 5–6 lotes del modelo** (§6) | L: lo mismo más otro despliegue, otro vendor y otro secreto | M, pero no resuelve nada de fondo |
| Escritura concurrente | No (sigue git) | **Sí (fila por entidad; eventos solo-añadir)** | Sí | No (mismos conflictos) |
| Validación al escribir | Solo en el hook de quien tenga el hook | **Sí, en el servidor, con las reglas de `esquema.json`** | Sí | No |
| Canal para tareas sin carpetas | No | **Sí: HTTPS con token de rol** (§7, prueba técnica primero) | Sí | Parcial (Issues) |
| Privacidad | No (repo público) | **Sí (base privada; lo público se exporta filtrado)** | Sí | No |
| «El STR caído no afecta al modelo» | Sí | **Parcial**: carpeta, base y despliegue separados → un lote roto del STR no toca el modelo; una caída del hosting sí afecta a los dos (mitigación: el espejo en Git sigue legible y los chats siguen pudiendo escribir en Git) | Sí | Sí |
| Mismos patrones que el STR (PHP, router `.htaccess`, réplicas en `tests/`, `?v=`) | — | **Sí: la CLI ya los conoce; cero curva** | No (otro lenguaje o SDK) | — |
| Varios proyectos | No | **Sí (`proyecto` en todo)** | Sí | No |
| Lock-in | Ninguno | **Bajo**: SQL exportable, PHP plano; igual que ADR-001/003 | Medio | Alto |

Por qué no A: deja los cinco dolores de arriba. Por qué no C: resuelve lo mismo que B a cambio de un vendor, una cuenta, un secreto y un camino de despliegue más, y las redes de los agentes no siempre dejan salir a dominios nuevos (hoy sí llegan a `app.apartamentosbucaramanga.com`). Por qué no D: es A con más rate-limit.

## 4. Diseño (lo justo para decidir)

**Dónde.** `public_html/modelo/` (fuera de `app/`): `modelo/api/` (router PHP como `str-api`), base `u…_modelo` (nueva, con su usuario), `modelo/secrets.php` fuera del repo (lo pone Carlos, como hoy con `secrets.php` del STR). Repositorio: carpeta `modelo/` dentro de `str-manager` (mismo `deploy.yml`, con exclusión mutua: un lote toca `app/` o `modelo/`, nunca los dos) — o repositorio propio si Carlos prefiere separar también el despliegue; propuesta: **misma raíz, carpeta aparte**, porque la cola, los hooks y los tests ya están ahí.

**Tablas** (todas con `proyecto`, `creado_en`, `actualizado_en`, `actualizado_por` = rol): `requisito`, `decision`, `pedido`, `plan_trabajo`, `lote`, `cambio` (solo modelo y aprobación/costo), `veredicto`, `incidente`, `deuda`, `riesgo`, `mensaje`, `evento` (solo-añadir: cada cambio de estado con hora y rol; de aquí salen las métricas), `leccion`, `situacion`. Los ids se conservan tal cual (`REQ-X-n`, `L-n`, `LM-n`, `V-n-m`, `M-n`, `DA-n`…): la base los valida con los patrones de `esquema.json`.

**API** (`/modelo/api/<entidad>` y `/modelo/api/<entidad>/<id>`): `GET` lista con filtros y `since`; `POST` crea; `PATCH` cambia estado o campos; nunca `DELETE` (se marca `superado`/`descartado`). `GET /modelo/api/estado` devuelve lo que hoy es `estado-vivo.json`. `GET /modelo/api/salud` sin token. Respuestas con `server_time` (lección DT-20: en milisegundos).

**Credenciales.** Un token por rol en la tabla `credencial` (`rol`, `hash`, `vence`, `proyectos`): `arquitecto`, `diseno`, `desarrollo`, `cola`, `verificador`, `verificador-critico`, `tablero` (solo lectura). El servidor aplica «un escritor por entidad» por rol (la misma matriz de `proceso.json` › RACI › R), no por archivo. Los tokens viven donde hoy: `claves\<rol>.txt` en LENOVO (los pone Carlos) y en `secrets.php`; nunca en el repo ni en mensajes (BAI08.03-t). Las páginas del STR entran con la sesión del STR (rol admin) a través de `str-api`, que reenvía al servicio con el token `tablero`: el navegador nunca ve un token del modelo.

**Validación al escribir.** Las reglas R1–R8 de `validar.py` se replican en PHP (`modelo/api/reglas.php`) con réplica JS en `tests/modelo/` (patrón del repo): id con patrón, estado de la lista cerrada, transición permitida por `proceso.json`, FK existente, crítico sin DA/LM-n y cruce → 422 con el motivo. `proceso.json` y `esquema.json` se cargan desde el repo al desplegar (son la fuente; el servicio no los duplica).

**Exportación a Git.** `modelo/export.php` corre por cron del hosting una vez al día (y a pedido con el token `cola`): escribe `interno/seguimiento.json`, `diseno.json`, `mensajes.json` con la misma forma de hoy a una rama `espejo`, y la cola de LENOVO hace el commit con su token (el servidor no guarda un token de GitHub). Resultado: Carlos y cualquiera siguen leyendo JSON en GitHub; los chats que aún no escriban por API tienen un espejo al día.

## 5. Qué cambia en el STR (grupo Proyecto) — B8

| Página | Hoy lee | Pasa a leer | Tamaño |
|---|---|---|---|
| Seg. Proyecto (tablero, plan de trabajo, diseño, ítems, cambios; REQ-TB1/TB2/TB3) | 3 JSON de raw | `str-api/modelo.php` → servicio (`lote`, `requisito`, `cambio`, `mensaje`, `estado`); «Datos de las HH:MM» = `server_time` | 1 lote (la página ya separa datos de dibujo) |
| Instrucciones · Marco de trabajo · Cobit · Elementos · Nomenclatura · Base de conocimiento | JSON/HTML de raw | **No cambian en B8**: siguen de Git hasta B9, que las genera de `proceso.json` + encargos + fichas | 0 ahora; B9 |
| Shell (`str-app-shell.html`) | — | Sin cambio de menú; `applyRoleVisibility` igual (INC-76 sigue aparte) | 0 |
| `str-api/modelo.php` (nuevo) | — | Proxy de solo lectura con sesión admin → servicio con token `tablero`; lista blanca de entidades | en el mismo lote |

Criterio de REQ-MOD-6 «las páginas muestran lo mismo antes y después»: el lote de B8 lleva una prueba que compara, para el mismo instante, el JSON exportado y la respuesta de la API (conteos por entidad y por estado iguales).

## 6. Migración sin perder historia (B7, por lotes del modelo; cada uno con LM-n, cruce y verificador crítico)

| # | Lote | Qué | Prueba de aceptación |
|---|---|---|---|
| 1 | B7-1 Prueba técnica (sin cruce, solo lectura) | `GET /modelo/api/salud` desplegado en una carpeta vacía; desde cada agente (3 chats, cola, verificador en tarea, Chrome) una petición real `GET` y una `POST` a un eco: dice **quién puede escribir por HTTPS y quién no** | Tabla agente × GET/POST en `conocimiento.json` |
| 2 | B7-2 Base y esquema (crítico) | Carlos crea la base y el usuario en hPanel y pone `modelo/secrets.php`; migración `001_inicial.sql` con las tablas de §4; `proyecto = 'str'` | Tablas creadas; `salud` dice `db:true`; ningún dato aún |
| 3 | B7-3 Carga inicial (crítico, después de B3) | `migrar.py` lee los JSON normalizados (0 errores del validador) y carga todo, incluida la historia (`cambios[]` → `cambio` + `evento` + `veredicto`); corre en limpio tantas veces como haga falta | Conteos iguales JSON ↔ base; `validar.py` sobre la exportación = 0 errores |
| 4 | B7-4 API de lectura + exportación | `GET` de todas las entidades, `estado`, `export.php` + cron; rama `espejo` | La exportación reproduce los JSON byte a byte salvo el orden de claves |
| 5 | B7-5 API de escritura + credenciales (crítico) | `POST/PATCH` con reglas; tabla `credencial`; tokens que pone Carlos; prueba de 422 por cada regla | Réplica `tests/modelo/reglas.test.js` en verde; un lote real registrado por API por la cola |
| 6 | B7-6 Corte (crítico, con Carlos presente) | Los chats y la cola escriben por API; Git pasa a espejo (la rama `espejo` se fusiona a `main` a diario); el verificador deja el veredicto por API si B7-1 lo permitió, si no sigue por archivo y la cola lo sube | Un lote de punta a punta sin tocar JSON a mano; `estado-vivo.json` sale de `GET /estado` |

Vuelta atrás en cualquier punto: los JSON de Git siguen vigentes hasta el lote 6; en el 6, volver = reactivar la escritura en Git (los encargos v2 ya la describen) y apagar los tokens de escritura. Nada se borra.

## 7. Rutina de API para tests y canal para las tareas

- **Rutina (`tests/modelo/api.test.js`, corre en `node tests/run.js` y en el verificador):** `salud` → crea un `lote` en `proyecto = 'prueba'` → cambia estado por las transiciones de `proceso.json` → intenta una transición prohibida (espera 422) → intenta escribir con el rol equivocado (espera 403) → marca `superado`. El proyecto `prueba` se limpia solo (el servidor borra `prueba` con más de un día) y nunca se exporta. Sin PHP local (la CLI no lo tiene), la prueba corre contra el servicio desplegado como ya hacen los criterios «contra producción».
- **Canal para las tareas (verificador):** `POST /modelo/api/veredicto` con el token `verificador` = el mismo JSON que hoy deja en `log\`. Si la prueba técnica (B7-1) muestra que una tarea de Cowork no puede hacer `POST`, el canal queda como hoy (archivo en carpeta) y la cola lo sube; y el problema de «sin carpetas tras reinicio» se ataca por su ficha (BAI07.05-v), no por el servicio.
- **Despertador:** pasa de leer tres JSON de raw a `GET /estado` y `GET /mensaje?estado=pendiente` (B9); mismos avisos.

## 8. Costos y riesgos

| Qué | Valor |
|---|---|
| Dinero | 0 adicional. **Atención:** Hostinger Premium vence el **3-nov-2026** (R-3); renovarlo es prerrequisito de B7, con o sin este ADR |
| Tiempo de la CLI | ~6 lotes × 10–25 min |
| Tiempo de Carlos | Decidir este ADR (una línea) · crear base y usuario en hPanel y poner `secrets.php` (10 min, B7-2) · poner los tokens en `claves\` (5 min, B7-5) · estar presente en el corte (B7-6, 20 min) |
| Riesgos | Credenciales (crítico: tokens solo en `secrets.php` y `claves\`; el navegador nunca los ve) · doble escritura durante la transición (mitigación: Git es espejo de solo lectura desde B7-6; antes, la API no acepta escrituras de chats) · hosting compartido con el STR (mitigación §3) · el servicio **nunca** guarda datos del negocio (tenant `negocio`): solo el modelo |
| Qué NO entra | Tiempo real (polling, como ADR-001) · interfaz de edición (las páginas siguen de solo lectura; se escribe por los chats y la cola) · mover `conocimiento.json`, encargos y plantillas (siguen en Git) |

## 9. Lo que necesito de Carlos

1. **Sí o no a la opción B** (o «quiero C» con el proveedor). Con el sí, B7 arranca por B7-1 (prueba técnica, sin cruce) de corrido.
2. Renovar Hostinger antes del 3-nov (ya estaba en R-3; lo repito porque B7 depende de eso).
3. Preferencia: carpeta `modelo/` en el mismo repo `str-manager` (propuesta) o repositorio aparte.

## Consecuencias si se acepta
- `proceso.json` y `esquema.json` pasan a ser leídos por el servidor: cada cambio en ellos sigue siendo lote del modelo con cruce.
- Los encargos v2 cambian una línea en B7-6: «registro oficial = el servicio; Git = espejo».
- Se abre la puerta a un segundo proyecto (B11) sin copiar nada: `proyecto = 'otro'` y encargos derivados.
