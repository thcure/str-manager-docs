# instr — L-177 · LM-79 fase 5.3: el STR suelta el grupo Proyecto — sus ocho páginas salen del repo (ya se ven en proyectos. y herramienta-fabrica.) y en el menú queda una sola entrada, «Proyectos (fábrica) ↗», solo para el admin
Categoría: **crítico** (toca el menú del shell, capa común del STR, y retira páginas en uso; DA: LM-79 · cruce previo con Carlos: PENDIENTE (lo da el Arquitecto por delegación, M-1144))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-30 08:37
Decisión: ADR-009 (v5, § 4b y 4c, aceptada; contrato de la fase 5, regla 7) y DA: LM-79
Alcance: `str-app-shell.html` (grupo Proyecto con una sola entrada externa; ningún grupo arranca plegado) · borrar con `git rm` (§ 1) las ocho páginas del grupo (`str-seg-proyecto.html`, `str-marco-trabajo.html`, `str-instrucciones.html`, `str-cobit.html`, `str-elementos.html`, `str-base-conocimiento.html`, `str-nomenclatura.html`, `str-linea-base.html`), nueve tests que prueban su código (`tests/plan-trabajo.test.js`, `tests/tablero.test.js`, `tests/tablero-metrica.test.js`, `tests/tablero-items.test.js`, `tests/diseno.test.js`, `tests/nomenclatura.test.js`, `tests/nomenclatura-ancho.test.js`, `tests/base-conocimiento-diagrama.test.js`, `tests/linea-base-pagina.test.js`) y cinco guiones que solo las abren (`tests/e2e/L-151.spec.js`, `tests/e2e/REQ-TB-3.spec.js`, `tests/e2e/REQ-TB-4.spec.js`, `tests/e2e/REQ-TB-5.spec.js`, `tests/e2e/LM-82.spec.js`) · ajustar `tests/menu-sh2.test.js`, `tests/roles.test.js`, `tests/tablero-al-dia.test.js` y `tests/e2e/REQ-SH-2.spec.js` · guion nuevo `tests/e2e/LM-79-str.spec.js` · docs: `CLAUDE.md`, `docs/claude/proyecto.md`, `docs/claude/shell-y-api.md`, `docs/claude/tests-y-despliegue.md`, `tests/README.md` · `?v=` igual · `schema_version` igual · sin cambios de base de datos
Versión: `?v=` igual (p5c113) · `schema_version` igual (14)
Origen: M-1227 (Arquitecto: arranque de 5.3, regla 7 del contrato), M-1229 y M-1228 (Jefe de proyecto: tabla de reemplazos, nadie pierde otra entrada, limpieza manual de Carlos fuera de la cola), M-1230 (diseño de la entrada y los tres sitios que publican el STR); `claude/marco/plan-sitios-fase5-contrato.md` (regla 7). Requerimiento: `interno/lotes-modelo/LM-79.md` (fase 5)
Impacto: el admin deja de ver en el STR las ocho páginas del grupo Proyecto y ve en su lugar «Proyectos (fábrica) ↗», que abre https://proyectos.apartamentosbucaramanga.com/ en pestaña nueva (tabla de § 0: dónde quedó cada página). El operador y el colaborador no ven nada distinto (nunca vieron el grupo). Un favorito guardado de una página retirada queda atenuado con «✕ quitar» (el shell ya lo hace). Después del lote, Carlos borra a mano las ocho páginas en los tres sitios (paso de Carlos, abajo).
Reglas transversales que toca: RT-14 (el menú solo oculta; la entrada nueva lleva `data-roles="admin"` como hoy el grupo; no cambia ningún rol) · RT-20 (versionado y despliegue: el borrado no llega solo al hosting; limpieza manual por sitio, lección INC-210)
Mapa: módulos y relaciones que cambia: retira el módulo «Grupo Proyecto (interno)» (PRJ: sus ocho páginas) y la relación «lectura de str-manager-docs desde el grupo Proyecto» (queda la de Lo que viene); SH cambia (grupo Proyecto con una entrada externa). Salen los 5 guiones y los 9 tests del Alcance; el Arquitecto retira el módulo y ajusta `cubre` al aceptarse (CU-PRJ → CU-MOD-3.1/3.2 en proyectos.; línea base → visor; M-1230)
Casos de uso: CU-KN-6.1, CU-OP-4.1, CU-PRJ-1.1, CU-PRJ-2.1, CU-PRJ-2.2, CU-PRJ-2.3, CU-PRJ-3.1, CU-PRJ-3.5, CU-PRJ-3.6, CU-PRJ-9.1, CU-PRJ-10.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.2, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-U-2.5
Riesgo: medio (R-1 del lote; R-12: SH, el shell, tiene riesgo 6). Puede salir mal: (1) que algún enlace del STR apunte a una página retirada: ninguna referencia en html, js, php ni .htaccess fuera de las propias páginas (solo comentarios en `str-lo-que-viene.html`, que no cambian); (2) que un contador del menú quede viejo (INC-209): se cambian en el mismo lote `menu-sh2.test.js`, `roles.test.js` (19 → 12 ítems con `data-roles`, 10 que abren algo) y `REQ-SH-2.spec.js` (18 → 11 entradas del admin), y `node tests/run.js` debe dar 84/84; (3) que el hosting siga sirviendo las páginas (Git no borra): paso de Carlos y caso d. Si el modo automático bloquea el `git rm`, no se rodea (§ 0, plan B). Conexiones a MySQL: ninguna nueva.
Tamaño: 9 archivos de código (el shell y las 8 páginas borradas), ≈ 4 360 líneas, casi todo páginas enteras que se borran; un solo objetivo (el retiro del grupo); cabe en una sesión.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce delegado)
Reversión: un solo `git revert <hash>` (vuelven las ocho páginas, sus tests y guiones, y el grupo con sus ocho entradas); las páginas reaparecen en los sitios con el despliegue normal.
Depende de: L-174, L-175 y L-176 aceptados (5.2c cerrada: las ocho páginas tienen reemplazo) · Precondiciones para verificar: perfiles zz-verif-admin, zz-verif-oper y zz-verif-colab; para d, el paso de Carlos hecho en los tres sitios
¿Quién más depende de lo que cambia?: el Arquitecto (retira el módulo del mapa, ajusta `cubre` y la foto `guiones-e2e.json`); la regresión del menú (`REQ-SH-2`, `menu-sh2`, `roles`); Carlos, que usaba esas páginas a diario (tabla de § 0); después vienen el ajuste de INC-214 y el ok de Carlos de 5.4.

## 0. Contexto y reglas de este lote
Dónde quedó cada página del grupo Proyecto (las ve un administrador de la fábrica, con su cuenta de Google):

| Página del STR | Dónde está ahora |
|---|---|
| Seg. Proyecto | proyectos. › Lo que te toca, Resumen (objetivos, planes, quién tiene qué y plan del proyecto), Alcance, Decisiones, Construcción (lotes, veredictos, incidentes y cambios) y Buzón |
| Marco de Trabajo | herramienta-fabrica. › Modelo de trabajo (marco de trabajo) |
| Instrucciones | herramienta-fabrica. › Modelo de trabajo (instrucciones) |
| Cobit | herramienta-fabrica. › Gobierno (COBIT) |
| Elementos | herramienta-fabrica. › Conocimiento (elementos) |
| Base de conocimiento | herramienta-fabrica. › Conocimiento (conocimiento) |
| Nomenclatura | herramienta-fabrica. › Modelo de trabajo › «Abrir la nomenclatura del modelo» |
| Línea base | proyectos. › Línea base › «Abrir la línea base» |

- Orden: § 1 (borrar), § 2 (pares), § 3 (guion nuevo), `node tests/run.js` y § 4 (commit). Si algo no cuadra, para sin commit.
- Si el modo automático bloquea el `git rm` de § 1: no lo rodees (ni `rm`, ni mover, ni vaciar), deja str-manager sin cambios con `git restore --staged str-seg-proyecto.html str-marco-trabajo.html str-instrucciones.html str-cobit.html str-elementos.html str-base-conocimiento.html str-nomenclatura.html str-linea-base.html tests/plan-trabajo.test.js tests/tablero.test.js tests/tablero-metrica.test.js tests/tablero-items.test.js tests/diseno.test.js tests/nomenclatura.test.js tests/nomenclatura-ancho.test.js tests/base-conocimiento-diagrama.test.js tests/linea-base-pagina.test.js tests/e2e/L-151.spec.js tests/e2e/REQ-TB-3.spec.js tests/e2e/REQ-TB-4.spec.js tests/e2e/REQ-TB-5.spec.js tests/e2e/LM-82.spec.js` y luego `git restore str-seg-proyecto.html str-marco-trabajo.html str-instrucciones.html str-cobit.html str-elementos.html str-base-conocimiento.html str-nomenclatura.html str-linea-base.html tests/plan-trabajo.test.js tests/tablero.test.js tests/tablero-metrica.test.js tests/tablero-items.test.js tests/diseno.test.js tests/nomenclatura.test.js tests/nomenclatura-ancho.test.js tests/base-conocimiento-diagrama.test.js tests/linea-base-pagina.test.js tests/e2e/L-151.spec.js tests/e2e/REQ-TB-3.spec.js tests/e2e/REQ-TB-4.spec.js tests/e2e/REQ-TB-5.spec.js tests/e2e/LM-82.spec.js` (archivos nombrados uno a uno: el hook no deja `git restore .`) y di «No hecho: borrado bloqueado». Plan B: Carlos corre § 1 a mano y el lote se repite desde § 2.
- No abras `api/config/database.php`, `credenciales.php`, `firebase.php` ni ningún `secrets.php`. No toques la carpeta de los hooks ni el cliente común de la API (su bloque `STRApi.docs` lo sigue usando Lo que viene).
- La entrada nueva no lleva `data-fav-url` (si lo llevara, el favorito la abriría en un iframe); su favorito reutiliza su propio clic.

## 1. Borrar las páginas, sus tests y sus guiones
```bash
git rm -q str-seg-proyecto.html str-marco-trabajo.html str-instrucciones.html str-cobit.html str-elementos.html str-base-conocimiento.html str-nomenclatura.html str-linea-base.html
git rm -q tests/plan-trabajo.test.js tests/tablero.test.js tests/tablero-metrica.test.js tests/tablero-items.test.js tests/diseno.test.js tests/nomenclatura.test.js tests/nomenclatura-ancho.test.js tests/base-conocimiento-diagrama.test.js tests/linea-base-pagina.test.js
git rm -q tests/e2e/L-151.spec.js tests/e2e/REQ-TB-3.spec.js tests/e2e/REQ-TB-4.spec.js tests/e2e/REQ-TB-5.spec.js tests/e2e/LM-82.spec.js
git status --short | grep -c '^D '      # 22
```

## 2. Cambios en los archivos que se quedan
Aplica cada par tal cual (cada «Busca» aparece una sola vez en su archivo). Son 39 pares más **D1**, que reemplaza un archivo entero.

**D1 · `docs/claude/proyecto.md`** (reemplázalo entero: queda el mapa de Conocimiento y Lo que viene, con la nota del retiro). Contenido completo:
```md
# Mapa — Conocimiento y Lo que viene (el grupo Proyecto pasó a los sitios de la fábrica en L-177)
Al día hasta L-177 · dueño: PRJ, MOD

> Archivos: `str-conocimiento.html` (biblioteca de guías del negocio) y `str-lo-que-viene.html` (lo que falta del STR por área). Las ocho páginas internas del grupo Proyecto (Seg. Proyecto, Marco de Trabajo, Instrucciones, Cobit, Elementos, Base de conocimiento, Nomenclatura y Línea base) salieron del STR en L-177 (LM-79 fase 5.3).
> Movido **literal** desde `CLAUDE.md` en el lote 70 (REQ-MOD-5 / A7a). Las referencias a "abajo"/"arriba"/"este archivo" del texto original apuntan al CLAUDE.md completo de antes del lote 70 (`git show 9fa6948:CLAUDE.md`); lo demás de este mapa sigue vigente. Se actualiza en el mismo commit que cambia el área.

## Archivos

| Archivo | Módulo | Notas |
|---|---|---|
| `str-conocimiento.html` | Biblioteca de guías (REQ-K2) | Módulo del shell (`openModule`, mismo patrón lista+editor lateral que Flujos). Dueño de la colección `guias` (`persistGuias()` → `_persistCol('guias', guias)`); admin/operador escriben, colaborador solo lee (igual que el resto de `/api/col` salvo `turnos`/`tickets`). Editor: título, categoría, etiquetas, texto (textarea + mini-toolbar **negrita**/lista), adjuntos (`STRApi.upload('guia', guia.id, file)` para imágenes — arrastrar para reordenar, mismo patrón nativo de drag&drop que las tareas de Flujos; "Agregar enlace" con miniatura de YouTube si aplica) y "¿Dónde se usa?" (`_usosDeGuia(id)`, escanea `flujos` por `guias.indexOf(id)`, enlaza a `str-flujos.html?edit=<flujoId>`). Borrar con guía referenciada pide confirmación mostrando esos usos (`confirmarEliminar`); el borrado es un tombstone normal de `/api/col` (lo hace `_persistCol()` solo, comparando contra `str-col-lastpush-v1`, sin `deletedIds` explícito). El catálogo compartido por plan (`ambito:'plataforma'`) está previsto en el modelo (campo `ambito`) pero no se construye todavía — hoy todas las guías son `ambito:'cuenta'`. |
| `str-lo-que-viene.html` | Lo que viene (REQ-SH-2) | Solo admin (misma guarda que las páginas de Proyecto). Lee `interno/lo-que-viene.json` (escritor: Diseño; `{areas:[{orden, nombre, para, reqs, etapa?}]}`), `interno/diseno.json` y `interno/seguimiento.json` con `STRApi.docs` del mismo commit de main que el encabezado; la etapa se calcula (`_lqvEtapaDe`, M-547: REQ todos aceptados → el área sale; lote en cola o construido → en construcción; algún REQ definido/entregado → definido; si no, idea; `etapa` escrita solo sin REQ); muestra por área orden, nombre, etapa, para qué sirve y REQ; si falla diseño o seguimiento, avisa y sigue. 404 → «todavía no hay nada publicado»; error → «Reintentar». Funciones puras `[LQV]` en `tests/menu-sh2.test.js`. No escribe. |

**LM-79 fase 5.3 (L-177) — el grupo Proyecto sale del STR.** Sus ocho páginas se ven ahora en los sitios de la fábrica, con la sesión de Google de un administrador: Seg. Proyecto → proyectos. (Lo que te toca, Resumen, Alcance, Decisiones, Construcción y Buzón); Línea base → proyectos. › Línea base; Marco de Trabajo, Instrucciones, Cobit, Elementos, Base de conocimiento y Nomenclatura → herramienta-fabrica. (Modelo de trabajo, Gobierno y Conocimiento). En el menú del STR queda el grupo «Proyecto» (solo admin) con una sola entrada, «Proyectos (fábrica) ↗», que abre https://proyectos.apartamentosbucaramanga.com/ en pestaña nueva (`window.open(…, '_blank', 'noopener')`, sin `data-fav-url`). Un favorito guardado de una página retirada queda huérfano y el shell ya lo atenúa con «✕ quitar». `STRApi.docs` (REQ-TB-3, bloque `[TB3]` de `str-api.js`) se queda: lo usa Lo que viene. Retirados con ellas: sus tests (`plan-trabajo`, `tablero`, `tablero-metrica`, `tablero-items`, `diseno`, `nomenclatura`, `nomenclatura-ancho`, `base-conocimiento-diagrama`, `linea-base-pagina`) y sus guiones (`L-151`, `REQ-TB-3`, `REQ-TB-4`, `REQ-TB-5`, `LM-82`).


## Datos (localStorage)

- `str-guias-v1` (REQ-K2): biblioteca de guías por cuenta. Item: `{id:'g-…', titulo, categoria:'limpieza'|'alistamiento'|'mantenimiento'|'protocolo'|'general', texto (markdown ligero), adjuntos:[{id, tipo:'imagen'|'enlace', url, titulo, orden}], etiquetas[], ambito:'cuenta', version, creadoEn, actualizadoEn, actualizadoPor}` — `ambito:'plataforma'` (catálogo compartido por plan) está previsto en el modelo pero no se usa todavía. Las guías migradas automáticamente desde un `manual` de texto llevan además `_migradoDeManual:true` (lo usa `_migrarManualAGuias()` para el dedup por texto exacto; no es parte del modelo hacia afuera). Las tareas/actividades **referencian** por id (`tarea.guias`/`actividad.guias`) — nunca copian el texto; un clon comparte el mismo id de guía que su plantilla salvo que la hubiera editado antes de la migración. `adjuntos[].url` apunta a `/api/archivo/...` (nunca base64). **Servidor primero**: colección `guias` en `/api/col`, `pull` reemplaza (como `flujos`) — admin/operador escriben, colaborador solo lee.
```

**P1 · índice: las ocho filas del grupo Proyecto** (`CLAUDE.md`). Busca:
```md
`proyecto.md` (biblioteca de guías del negocio) |
| `str-seg-proyecto.html` | `proyecto.md` |
| `str-marco-trabajo.html` | `proyecto.md` |
| `str-instrucciones.html` | `proyecto.md` |
| `str-cobit.html` | `proyecto.md` |
| `str-elementos.html` | `proyecto.md` |
| `str-base-conocimiento.html` | `proyecto.md` |
| `str-nomenclatura.html` | `proyecto.md` |
| `str-lo-que-viene.html` | `proyecto.md`
```
Pon:
```md
`proyecto.md` (biblioteca de guías del negocio) |
| `str-lo-que-viene.html` | `proyecto.md`
```

**P2 · índice: las ocho filas del grupo Proyecto** (`CLAUDE.md`). Busca:
```md
`interno/lo-que-viene.json`, REQ-SH-2) |
| `str-linea-base.html` | `proyecto.md` (explorador de la línea base del STR al día; lee `interno/linea-base/linea-base.html`, LM-82) |
| `str-tablero.html` | `operacion.md` (tablero
```
Pon:
```md
`interno/lo-que-viene.json`, REQ-SH-2) |
| `str-tablero.html` | `operacion.md` (tablero
```

**P3 · el menú y STRApi.docs** (`docs/claude/shell-y-api.md`). Busca:
```md
con los roles vigentes: grupo Proyecto y sus siete ítems `admin`; Dashboard `admin` (decisión de Carlos,
```
Pon:
```md
con los roles vigentes: grupo Proyecto y su entrada `admin` (L-177); Dashboard `admin` (decisión de Carlos,
```

**P4 · el menú y STRApi.docs** (`docs/claude/shell-y-api.md`). Busca:
```md
`#nav-group-proyecto`, `data-roles="admin"`, Proyecto plegado al cargar y ya no anidado). Sin Dashboard, Portafolio, maquetas `type-soon`,
```
Pon:
```md
`#nav-group-proyecto`, `data-roles="admin"`, Proyecto ya no anidado). **LM-79 fase 5.3 (L-177)** — `#nav-group-proyecto` queda con una sola entrada, `#nav-proyectos-fabrica` «Proyectos (fábrica) ↗» (`data-externo` con la URL, `onclick="window.open('https://proyectos.apartamentosbucaramanga.com/', '_blank', 'noopener')"`, sin `data-fav-url`: el favorito reutiliza su clic), y ningún grupo arranca plegado; las ocho páginas del grupo salieron del STR (ver `proyecto.md`). Sin Dashboard, Portafolio, maquetas `type-soon`,
```

**P5 · el menú y STRApi.docs** (`docs/claude/shell-y-api.md`). Busca:
```md
portal la usa con `?modo=colaborador`); las páginas de Proyecto conservan su gate propio (`superadmin|admin`). **INC-79**: `STRApi.fechas.ymdLocal(d?)`
```
Pon:
```md
portal la usa con `?modo=colaborador`); Lo que viene conserva su gate propio (`superadmin|admin`; las páginas de Proyecto salieron del STR en L-177). **INC-79**: `STRApi.fechas.ymdLocal(d?)`
```

**P6 · el menú y STRApi.docs** (`docs/claude/shell-y-api.md`). Busca:
```md
`thcure/str-manager-docs` del último commit de `main` para las páginas del grupo Proyecto. `commit()` hace **un** `fetch` anónimo
```
Pon:
```md
`thcure/str-manager-docs` del último commit de `main` (hoy para Lo que viene; las páginas del grupo Proyecto salieron en L-177). `commit()` hace **un** `fetch` anónimo
```

**P7 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
`api/col` del PHP real y exige que sean iguales. `diseno.test.js` (instr-57) extrae `[DIS-inicio]…[DIS-fin]` REAL de `str-seg-proyecto.html` (`_disClasificar`, con arreglos vacíos y una prioridad fuera de `reqs[]`). `tablero.test.js` (REQ-TB1) extrae `[TB1-inicio]…[TB1-fin]`
```
Pon:
```md
`api/col` del PHP real y exige que sean iguales. (retirado en L-177) `diseno.test.js` (instr-57) extraía `[DIS-inicio]…[DIS-fin]` REAL de `str-seg-proyecto.html` (`_disClasificar`, con arreglos vacíos y una prioridad fuera de `reqs[]`). (retirado en L-177) `tablero.test.js` (REQ-TB1) extrae `[TB1-inicio]…[TB1-fin]`
```

**P8 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
REQ-INV2-4a: en definición, DA-30, lo tiene Carlos). `tablero-items.test.js` (REQ-TB-4, L-82)
```
Pon:
```md
REQ-INV2-4a: en definición, DA-30, lo tiene Carlos). (retirado en L-177) `tablero-items.test.js` (REQ-TB-4, L-82)
```

**P9 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
hora de Bogotá con cambio de día/año) y lee las 6 páginas del grupo Proyecto (sin `raw/main` a mano, llaman a `STRApi.docs.commit`, `data-docs-encabezado`/`data-docs-actualizar`, sin token); su guion N2 es `tests/e2e/REQ-TB-3.spec.js` (L-136: el caso g espera `networkidle` antes de contar consultas a la API). `tablero-metrica.test.js` (REQ-TB-5 + INC-118,
```
Pon:
```md
hora de Bogotá con cambio de día/año) y lee `str-lo-que-viene.html` (desde L-177; antes las 6 páginas del grupo Proyecto) (sin `raw/main` a mano, llaman a `STRApi.docs.commit`, `data-docs-encabezado`/`data-docs-actualizar`, sin token); su guion N2 es `tests/e2e/REQ-TB-3.spec.js` (L-136: el caso g espera `networkidle` antes de contar consultas a la API). (retirado en L-177) `tablero-metrica.test.js` (REQ-TB-5 + INC-118,
```

**P10 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
guion N2 es `tests/e2e/REQ-TB-5.spec.js`. `nomenclatura-ancho.test.js` (REQ-SP-3 criterio 7, L-94) lee el CSS REAL de `str-nomenclatura.html` (mismo método que `inventario-ancho.test.js`): ningún width/min-width fijo > 360 px, toda `<table>` dentro de un contenedor con `overflow-x: auto` y ningún p/li/td/th con `nowrap`. `base-conocimiento-diagrama.test.js` (REQ-BC1) extrae `[BC1-inicio]…[BC1-fin]` REAL de `str-base-conocimiento.html` (franjas 6/4/1/5 del mapa de hoy, +1 nodo/+1 flujo, flujo roto omitido, flujos de chat-desarrollo y que ninguna flecha cruce un recuadro). `nomenclatura.test.js` (REQ-SP-3) exige
```
Pon:
```md
guion N2 es `tests/e2e/REQ-TB-5.spec.js`. (retirado en L-177) `nomenclatura-ancho.test.js` (REQ-SP-3 criterio 7, L-94) lee el CSS REAL de `str-nomenclatura.html` (mismo método que `inventario-ancho.test.js`): ningún width/min-width fijo > 360 px, toda `<table>` dentro de un contenedor con `overflow-x: auto` y ningún p/li/td/th con `nowrap`. (retirado en L-177) `base-conocimiento-diagrama.test.js` (REQ-BC1) extrae `[BC1-inicio]…[BC1-fin]` REAL de `str-base-conocimiento.html` (franjas 6/4/1/5 del mapa de hoy, +1 nodo/+1 flujo, flujo roto omitido, flujos de chat-desarrollo y que ninguna flecha cruce un recuadro). (retirado en L-177) `nomenclatura.test.js` (REQ-SP-3) exige
```

**P11 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
sus `data-roles` reales (admin ve Proyecto; operador ni Proyecto ni Dashboard; sin
```
Pon:
```md
sus `data-roles` reales (admin ve Proyecto, con su entrada externa desde L-177; operador ni Proyecto ni Dashboard; sin
```

**P12 · tests y guiones retirados** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
`thcure/fabrica-servicio` en L-170).
- **`tests/linea-base-pagina.test.js`** (LM-82, L-165): texto real de `str-linea-base.html` (guarda de admin, encabezado y ⟳ Actualizar con `STRApi.docs`, explorador del mismo commit, iframe con `sandbox="allow-scripts allow-popups"` sin `allow-same-origin`, `srcdoc` por `_lbSrcdoc` en un vm, `str-api.js?v=` vigente, no escribe) y la entrada «Línea base» del grupo Proyecto en `str-app-shell.html` (octava, solo admin). `menu-sh2.test.js`, `roles.test.js` y el guion `REQ-SH-2.spec.js` cuentan ocho páginas en Proyecto (19 ítems con `data-roles`).
- **`tests/col-log-errores.test.js`** (DT-36,
```
Pon:
```md
`thcure/fabrica-servicio` en L-170).
- **LM-79 fase 5.3 (L-177):** salieron con las páginas del grupo Proyecto `linea-base-pagina`, `nomenclatura`, `nomenclatura-ancho`, `base-conocimiento-diagrama`, `diseno`, `tablero`, `tablero-items`, `tablero-metrica` y `plan-trabajo` (84 archivos de tests) y los guiones `L-151`, `REQ-TB-3`, `REQ-TB-4`, `REQ-TB-5` y `LM-82` (56 guiones con `LM-79-str`). `menu-sh2.test.js`, `roles.test.js` y el guion `REQ-SH-2.spec.js` cuentan una sola entrada en Proyecto, la externa a proyectos. (12 ítems con `data-roles`, 11 entradas del admin); `tablero-al-dia.test.js` lee `str-lo-que-viene.html`.
- **`tests/col-log-errores.test.js`** (DT-36,
```

**P13 · el grupo Proyecto con una sola entrada** (`str-app-shell.html`). Busca:
```html
</div>

    <!-- ── Proyecto (solo admin, plegado al final hasta D4; REQ-SP2: páginas internas de solo lectura, JSON de str-manager-docs/interno) ── -->
    <div class="nav-group" id="nav-group-proyecto"
```
Pon:
```html
</div>

    <!-- ── Proyecto (solo admin; LM-79 fase 5.3, L-177): las ocho páginas internas del grupo pasaron a los sitios de la fábrica
         (proyectos. y herramienta-fabrica.); queda una sola entrada que abre proyectos. en pestaña nueva ── -->
    <div class="nav-group" id="nav-group-proyecto"
```

**P14 · el grupo Proyecto con una sola entrada** (`str-app-shell.html`). Busca:
```html
      <div class="nav-item type-active" data-fav-url="str-seg-proyecto.html" data-roles="admin" onclick="openModule(this,'seg-proyecto','str-seg-proyecto.html')"><div class="ni-icon">📋</div><div class="ni-label">Seg. Proyecto</div></div>
        <div class="nav-item type-active" data-fav-url="str-marco-trabajo.html" data-roles="admin" onclick="openModule(this,'marco-trabajo','str-marco-trabajo.html')"><div class="ni-icon">🧩</div><div class="ni-label">Marco de Trabajo</div></div>
        <div class="nav-item type-active" data-fav-url="str-instrucciones.html" data-roles="admin" onclick="openModule(this,'instrucciones','str-instrucciones.html')"><div class="ni-icon">📎</div><div class="ni-label">Instrucciones</div></div>
        <div class="nav-item type-active" data-fav-url="str-cobit.html" data-roles="admin" onclick="openModule(this,'cobit','str-cobit.html')"><div class="ni-icon">🗂</div><div class="ni-label">Cobit</div></div>
        <div class="nav-item type-active" data-fav-url="str-elementos.html" data-roles="admin" onclick="openModule(this,'elementos','str-elementos.html')"><div class="ni-icon">🗃</div><div class="ni-label">Elementos</div></div>
        <div class="nav-item type-active" data-fav-url="str-base-conocimiento.html" data-roles="admin" onclick="openModule(this,'base-conocimiento','str-base-conocimiento.html')"><div class="ni-icon">🧭</div><div class="ni-label">Base de conocimiento</div></div>
        <div class="nav-item type-active" data-fav-url="str-nomenclatura.html" data-roles="admin" onclick="openModule(this,'nomenclatura','str-nomenclatura.html')"><div class="ni-icon">📘</div><div class="ni-label">Nomenclatura</div></div>
        <div class="nav-item type-active" data-fav-url="str-linea-base.html" data-roles="admin" onclick="openModule(this,'linea-base','str-linea-base.html')"><div class="ni-icon">📐</div><div class="ni-label">Línea base</div></div>
      </div>
    </div>
  </nav>
```
Pon:
```html
      <div class="nav-item type-active" id="nav-proyectos-fabrica" data-roles="admin" data-externo="https://proyectos.apartamentosbucaramanga.com/" onclick="window.open('https://proyectos.apartamentosbucaramanga.com/', '_blank', 'noopener')"><div class="ni-icon">🏭</div><div class="ni-label">Proyectos (fábrica) ↗</div></div>
      </div>
    </div>
  </nav>
```

**P15 · el grupo Proyecto con una sola entrada** (`str-app-shell.html`). Busca:
```html
Init: Favoritos y estrellas (_favRepintar); REQ-SH-2: solo Proyecto arranca plegado (los demás grupos, abiertos)
document.addEventListener('DOMContentLoaded', function() {
  _favRepintar();
  document.querySelectorAll('#nav-group-proyecto > .nav-group-hdr').forEach(hdr => {
    hdr.classList.add('collapsed');
    hdr.nextElementSibling.classList.add('collapsed');
  });
  renderApiSession();
});

// Sesión del
```
Pon:
```html
Init: Favoritos y estrellas (_favRepintar); todos los grupos arrancan abiertos (L-177: Proyecto ya es una sola entrada)
document.addEventListener('DOMContentLoaded', function() {
  _favRepintar();
  renderApiSession();
});

// Sesión del
```

**P16 · entrada de nomenclatura.test.js** (`tests/README.md`). Busca:
```md
prueba: Node no trae XSalsa20. REQ-K3 · K3a.
- `nomenclatura.test.js` — `str-nomenclatura.html` (REQ-SP-3): sin el bloque `[STR-inicio]…[STR-fin]` ni el `data-acceso`, el archivo es la fuente de `str-manager-docs` byte a byte (huella SHA-256); 7 `<h2>`, 7 `<section>`, 41 `<tr>`; acceso solo admin sin otra llamada a la API; entrada del menú con `data-roles="admin"` y enlace en Seg. Proyecto. Si la fuente cambia, se vuelve a traer y se actualizan las huellas.
- `inv-traslado-403.test.js` — REQ-INV2-3a
```
Pon:
```md
prueba: Node no trae XSalsa20. REQ-K3 · K3a.
- `inv-traslado-403.test.js` — REQ-INV2-3a
```

**P17 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
que viene (admin)
// · Proyecto (admin, plegado al final). Sin Dashboard ni maquetas; desde OP-1b
```
Pon:
```js
que viene (admin)
// · Proyecto (admin, al final; desde L-177 una sola entrada que abre proyectos. en pestaña nueva). Sin Dashboard ni maquetas; desde OP-1b
```

**P18 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
base» (LM-82, L-165) el menú del admin tiene 18 entradas (4 + 5 + 1 + 8).
const base = (h) => h.BASE || new URL(h.page.url()).origin;
```
Pon:
```js
base» (LM-82, L-165) el menú del admin tenía 18 entradas (4 + 5 + 1 + 8).
// LM-79 fase 5.3 (L-177): las ocho páginas de Proyecto pasaron a los sitios de la fábrica: 11 entradas (4 + 5 + 1 + 1).
const EXTERNA = 'https://proyectos.apartamentosbucaramanga.com/';
const base = (h) => h.BASE || new URL(h.page.url()).origin;
```

**P19 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
viene', ['Lo que viene']],
  ['Proyecto', ['Seg. Proyecto', 'Marco de Trabajo', 'Instrucciones', 'Cobit', 'Elementos', 'Base de conocimiento', 'Nomenclatura', 'Línea base']],
];
const OPER = ['Tablero', 'Calendario',
```
Pon:
```js
viene', ['Lo que viene']],
  ['Proyecto', ['Proyectos (fábrica) ↗']],
];
const OPER = ['Tablero', 'Calendario',
```

**P20 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
'str-usuarios.html', 'str-lo-que-viene.html', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html',
  'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
const PANELES = ['workflows', 'config',
```
Pon:
```js
'str-usuarios.html', 'str-lo-que-viene.html'];
const PANELES = ['workflows', 'config',
```

**P21 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
n.getAttribute('data-inicio'),
            accion: /^(openModule|nav|navSub)\(this/.test(oc) };
        }),
      };
    });
```
Pon:
```js
n.getAttribute('data-inicio'),
            externo: n.getAttribute('data-externo'), favUrl: n.getAttribute('data-fav-url'), onclick: oc,
            accion: /^(openModule|nav|navSub)\(this/.test(oc) || /^window\.open\('https:\/\//.test(oc) };
        }),
      };
    });
```

**P22 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
/type-(soon|dash|bottom)/.test(i.clase) || (i.url ? !PAGINAS.includes(i.url) : !PANELES.includes(i.panel)));
        h.espera(todos.length === 18 && !raros.length, 'entradas: ' + todos.length
```
Pon:
```js
/type-(soon|dash|bottom)/.test(i.clase) || (i.externo ? i.externo !== EXTERNA : (i.url ? !PAGINAS.includes(i.url) : !PANELES.includes(i.panel))));
        h.espera(todos.length === 11 && !raros.length, 'entradas: ' + todos.length
```

**P23 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
'/str-app-shell.html',
      que: 'Criterio 6: Proyecto va al final, cerrado al entrar, solo admin; sus 8 páginas abren igual (LM-82: + Línea base)',
      async prueba(h) {
        const p = h.page;
        const gs = await menu(h);
      
```
Pon:
```js
'/str-app-shell.html',
      que: 'Criterio 6 (L-177): Proyecto va al final, solo admin, con una sola entrada que abre proyectos. en pestaña nueva (no se pulsa: solo se lee)',
      async prueba(h) {
        const gs = await menu(h);
      
```

**P24 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
= gs[gs.length - 1] || {};
        const otrosPleg = gs.filter((g) => g.id !== 'nav-group-proyecto' && g.plegado).map((g) => g.label);
        h.espera(pr.id === 'nav-group-proyecto' && pr.plegado && !otrosPleg.length, 'último grupo: ' + pr.label + ' · cerrado: ' + pr.plegado + ' · otros plegados: ' + (otrosPleg.join(', ') || 'ninguno'));
        const cuerpo = await p.locator('#nav-group-proyecto > .nav-group-body').isVisible().catch(() => true);
        h.espera(!cuerpo, 'entradas de Proyecto ocultas hasta abrirlo: ' + (!cuerpo ? 'sí' : 'no'));
        await p.click('#nav-group-proyecto > .nav-group-hdr');
        for (const it of pr.items || []) await abrirEntrada(h, it);
      },
    },
    {
      c: 'g', perfil:
```
Pon:
```js
= gs[gs.length - 1] || {};
        const pleg = gs.filter((g) => g.plegado).map((g) => g.label);
        h.espera(pr.id === 'nav-group-proyecto' && !pleg.length, 'último grupo: ' + pr.label + ' · plegados al entrar: ' + (pleg.join(', ') || 'ninguno'));
        const it = (pr.items || [])[0] || {};
        h.espera((pr.items || []).length === 1 && it.externo === EXTERNA && it.onclick === "window.open('" + EXTERNA + "', '_blank', 'noopener')" && !it.favUrl && !it.url,
          'entrada de Proyecto: ' + JSON.stringify({ n: (pr.items || []).length, label: it.label, externo: it.externo, onclick: it.onclick, favUrl: it.favUrl }));
      },
    },
    {
      c: 'g', perfil:
```

**P25 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
operador que abre a mano «Lo que viene» o Seg. Proyecto vuelve al STR sin ver nada',
      async prueba(h) {
        const
```
Pon:
```js
operador que abre a mano «Lo que viene» vuelve al STR sin ver nada (Seg. Proyecto se fue en L-177)',
      async prueba(h) {
        const
```

**P26 · guion del menú** (`tests/e2e/REQ-SH-2.spec.js`). Busca:
```js
for (const pg of ['str-lo-que-viene.html', 'str-seg-proyecto.html']) {
          await p.goto(base(h) + '/'
```
Pon:
```js
for (const pg of ['str-lo-que-viene.html']) {
          await p.goto(base(h) + '/'
```

**P27 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
str-app-shell.html REAL y str-lo-que-viene.html). LM-82 (L-165): Proyecto con ocho páginas (+ Línea base).
// 1) Grupos y entradas en orden, sin
```
Pon:
```js
str-app-shell.html REAL y str-lo-que-viene.html). LM-79 fase 5.3 (L-177): Proyecto queda con
// una sola entrada externa, «Proyectos (fábrica) ↗», que abre proyectos. en pestaña nueva (sus ocho páginas pasaron a los sitios de la fábrica).
// 1) Grupos y entradas en orden, sin
```

**P28 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
   una página real que existe en el repo.
// 2) Quién ve qué (bloque [ROL-inicio]…[ROL-fin]
```
Pon:
```js
   una página real que existe en el repo (salvo la entrada externa de Proyecto, que abre proyectos. en pestaña nueva).
// 2) Quién ve qué (bloque [ROL-inicio]…[ROL-fin]
```

**P29 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
viene', ['Lo que viene']],
  ['Proyecto', ['Seg. Proyecto', 'Marco de Trabajo', 'Instrucciones', 'Cobit', 'Elementos', 'Base de conocimiento', 'Nomenclatura', 'Línea base']],
];
const real = grupos.map((g) => [g.label,
```
Pon:
```js
viene', ['Lo que viene']],
  ['Proyecto', ['Proyectos (fábrica) ↗']], // L-177: una sola entrada externa
];
const real = grupos.map((g) => [g.label,
```

**P30 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
((i.attrs.match(/openModule\(this,\s*'[^']*',\s*'([^']+)'\)/) || [])[1]) || ('panel:' + ((i.attrs.match(/data-panel="([^"]+)"/)
```
Pon:
```js
((i.attrs.match(/openModule\(this,\s*'[^']*',\s*'([^']+)'\)/) || [])[1]) || ((i.attrs.match(/data-externo="([^"]+)"/) || [])[1]) || ('panel:' + ((i.attrs.match(/data-panel="([^"]+)"/)
```

**P31 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
'str-usuarios.html', 'str-lo-que-viene.html', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html',
  'str-cobit.html', 'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
const PANELES_REALES = ['workflows', 'config'];
```
Pon:
```js
'str-usuarios.html', 'str-lo-que-viene.html'];
const EXTERNAS = ['https://proyectos.apartamentosbucaramanga.com/']; // L-177: la entrada de Proyecto
const PANELES_REALES = ['workflows', 'config'];
```

**P32 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
fuera) {
  const d = destino(i);
  const accion = /onclick="(openModule|nav|navSub)\(this/.test(i.attrs);
  const real = d.startsWith('panel:') ? PANELES_REALES.includes(d.slice(6)) : PAGINAS_REALES.includes(d);
  check('entrada «' + i.label + '» abre
```
Pon:
```js
fuera) {
  const d = destino(i);
  const externa = EXTERNAS.includes(d);
  const accion = externa ? i.attrs.includes("onclick=\"window.open('" + d + "', '_blank', 'noopener')\"") : /onclick="(openModule|nav|navSub)\(this/.test(i.attrs);
  const real = externa || (d.startsWith('panel:') ? PANELES_REALES.includes(d.slice(6)) : PAGINAS_REALES.includes(d));
  check('entrada «' + i.label + '» abre
```

**P33 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
grupos[grupos.length - 1].label === 'Proyecto');
check('Lo que viene: grupo solo admin y su
```
Pon:
```js
grupos[grupos.length - 1].label === 'Proyecto');
const ext = (fuera.find((i) => i.label === 'Proyectos (fábrica) ↗') || {}).attrs || '';
check('L-177: la entrada de Proyecto abre proyectos. en pestaña nueva con noopener, solo admin y sin data-fav-url (el favorito reutiliza su clic, no un iframe)',
  /id="nav-proyectos-fabrica"/.test(ext) && /data-roles="admin"/.test(ext) && ext.includes("window.open('https://proyectos.apartamentosbucaramanga.com/', '_blank', 'noopener')") && !/data-fav-url=|openModule\(/.test(ext), ext);
check('L-177: ninguna de las ocho páginas del grupo Proyecto sigue en el repo ni en el shell', ['str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html', 'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'].every((p) => !fs.existsSync(path.join(raiz, p)) && !shell.includes(p)));
check('Lo que viene: grupo solo admin y su
```

**P34 · test del menú** (`tests/menu-sh2.test.js`). Busca:
```js
_favRepintar\(\);[\s\S]*?\n\}\);/) || [''])[0];
check('al cargar: solo Proyecto arranca plegado (cerrado por defecto)', init.includes("document.querySelectorAll('#nav-group-proyecto > .nav-group-hdr')") && !init.includes(".nav-group-hdr:not(.fav-hdr)"), init.slice(0, 200));

// ── 2. Quién ve
```
Pon:
```js
_favRepintar\(\);[\s\S]*?\n\}\);/) || [''])[0];
check('al cargar: ningún grupo arranca plegado (L-177: Proyecto es una sola entrada)', !!init && !init.includes('collapsed'), init.slice(0, 200));

// ── 2. Quién ve
```

**P35 · test de roles** (`tests/roles.test.js`). Busca:
```js
i.id === id) || {}).roles;
check('shell: 19 ítems con data-roles (REQ-SH-2 + Tablero de REQ-OP-1 + Línea base de LM-82)', items.length === 19, items.length);
check('shell: sin superadmin/limpieza/porteria/mantenimiento
```
Pon:
```js
i.id === id) || {}).roles;
check('shell: 12 ítems con data-roles (REQ-SH-2 + Tablero de REQ-OP-1; L-177: el grupo Proyecto con una sola entrada)', items.length === 12, items.length);
check('shell: sin superadmin/limpieza/porteria/mantenimiento
```

**P36 · test de roles** (`tests/roles.test.js`). Busca:
```js
const proyecto = ['nav-group-proyecto', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html', 'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
check('admin ve el grupo Proyecto y sus ocho páginas', proyecto.every(id => roles(id) && ve(roles(id),
```
Pon:
```js
const proyecto = ['nav-group-proyecto', 'nav-proyectos-fabrica'];
check('admin ve el grupo Proyecto y su entrada a proyectos. (L-177)', proyecto.every(id => roles(id) && ve(roles(id),
```

**P37 · test de roles** (`tests/roles.test.js`). Busca:
```js
data-roles (salvo config)', abren.length > 15 && sinRoles.length === 0, sinRoles);
check('INC-109: los type-soon no tienen
```
Pon:
```js
data-roles (salvo config)', abren.length === 10 && sinRoles.length === 0, [abren.length, sinRoles]);
check('L-177: la entrada externa de Proyecto también lleva data-roles="admin"', navItems.filter(t => /data-externo="/.test(t)).length === 1 && navItems.filter(t => /data-externo="/.test(t)).every(t => /data-roles="admin"/.test(t)));
check('INC-109: los type-soon no tienen
```

**P38 · test de STRApi.docs** (`tests/tablero-al-dia.test.js`). Busca:
```js
// REQ-TB-3 (L-83) — las páginas del grupo Proyecto leen los JSON del último commit de str-manager-docs.
// Se extrae el bloque REAL [TB3-inicio]…[TB3-fin] de str-api.js a un vm (sin red) y se leen los 6 HTML.
const { leerTexto } = require('./lib/leer-texto.js');
```
Pon:
```js
// REQ-TB-3 (L-83) — las páginas que leen los JSON del último commit de str-manager-docs (hoy Lo que viene; las seis del grupo Proyecto
// se fueron a los sitios de la fábrica en L-177). Se extrae el bloque REAL [TB3-inicio]…[TB3-fin] de str-api.js a un vm (sin red).
const { leerTexto } = require('./lib/leer-texto.js');
```

**P39 · test de STRApi.docs** (`tests/tablero-al-dia.test.js`). Busca:
```js
/token|Authorization/i.test(bloque), false);

// Los 6 HTML del grupo Proyecto
const PAGINAS = ['str-seg-proyecto.html', 'str-cobit.html', 'str-instrucciones.html', 'str-marco-trabajo.html', 'str-base-conocimiento.html', 'str-elementos.html'];
for (const p of PAGINAS) {
  const
```
Pon:
```js
/token|Authorization/i.test(bloque), false);

// L-177: las seis páginas del grupo Proyecto se fueron a los sitios de la fábrica; el bloque lo sigue usando Lo que viene
const PAGINAS = ['str-lo-que-viene.html'];
for (const p of PAGINAS) {
  const
```

## 3. Guion nuevo
Copia el bloque de *Guion N2* a `tests/e2e/LM-79-str.spec.js` sin cambiar nada; no lo corras. Después: `node tests/run.js` → **84/84** (eran 93: salen nueve tests; `e2e-esquema` carga el guion nuevo y los que quedan).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 3 módulos · 14 relaciones · 17 reglas · corren 24 guiones (111 casos) · no corren 32 · huecos: 3 relaciones, 3 reglas
- Módulos: **K3** (archivo str-app-shell.html) · **PRJ** (línea «Mapa:») · **SH** (archivo str-app-shell.html; página /str-app-shell.html; línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-16 HK→K3, REL-17 K3→HK, REL-18 K3→SH, REL-19 K3→INC1, REL-23 *→google-drive, REL-24 PRJ→github, REL-26 *→SRV, REL-37 API→SH, REL-38 API→PRJ, REL-99 SRV→SH, REL-102 U→SH, REL-112 U→PRJ
- Reglas que cruza: RT-3, RT-7, RT-8, RT-9, RT-10, RT-11, RT-13, RT-16, RT-25 (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-12, RT-18, RT-20, RT-22, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-134 (2/2), INC-146-purga (3/5), LM-82 (5/5), REQ-INV2-3-4-hk (9/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (10/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (7/7), REQ-K3b (5/5), REQ-K3c-vista (6/6), REQ-K3c (3/3), REQ-OP-1 (2/8), REQ-OP-1b (3/7), REQ-SH-2 (11/11), REQ-TB-3 (8/8), REQ-TB-4 (7/7), REQ-TB-5 (7/7), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-37 (API→SH), REL-38 (API→PRJ), REL-99 (SRV→SH); reglas RT-10 Evidencia de incidentes, RT-11 Fotos de tarea, RT-25 Sobre de capacidad v1 — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): REL-19
```

Deuda de cobertura de la ruta (no la ejerce este lote; la ruta se calculó sobre el STR de antes, por eso aún lista LM-82 y REQ-TB-3/4/5, que salen con el lote):
- REL-37 (API→SH), REL-38 (API→PRJ) y REL-99 (SRV→SH): el lote no toca el cliente de la API ni el servidor.
- RT-10 (evidencia de incidentes), RT-11 (fotos de tarea) y RT-25 (sobre de capacidad): un cambio de menú no las ejerce.
- REL-19 (K3→INC1, a declarar): el lote no pasa por el aviso de corte ni por incidentes.
- El retiro del módulo del grupo Proyecto y de sus casos de uso lo hace el Arquitecto en el mapa al aceptarse (M-1230).

## Pruebas derivadas (juez; verificador crítico)
```
- a. El admin ve sus entradas de antes salvo las ocho de Proyecto y, en su lugar, «Proyectos (fábrica) ↗», que abre proyectos. en pestaña nueva sin acceso a la ventana del STR · nivel: N2 · perfil: zz-verif-admin · página: /str-app-shell.html · precondición: commit desplegado en app. · tec: escenario · espera: caso a del guion en verde (11 entradas en orden; pestaña nueva con proyectos., sin opener; el STR sigue en su pestaña) · **Revertir**
- b. El operador conserva sus 9 entradas y no ve el grupo Proyecto ni la entrada (RT-14) · nivel: N2 · perfil: zz-verif-oper · página: /str-app-shell.html · precondición: commit desplegado · tec: decisión · espera: caso b del guion en verde · **Revertir**
- c. El colaborador sigue en su portal y no ve la entrada (RT-14) · nivel: N2 · perfil: zz-verif-colab · página: /portal.html · precondición: commit desplegado · tec: decisión · espera: caso c del guion en verde · **Revertir**
- d. Tras la limpieza manual de Carlos, las ocho rutas viejas dan 404 en app., pruebas. y fabrica. (o fabrica. ya no resuelve) · nivel: N2 · perfil: zz-verif-admin · página: /str-app-shell.html · precondición: el paso de Carlos hecho en los tres sitios · tec: decisión · espera: caso d del guion en verde; si sigue en 200 en algún sitio, es que falta la limpieza: Detener y avisar, no Revertir (el lote no se acepta hasta que d pase) · **Detener**
- e. Humo del shell: el admin entra y el STR abre en el Tablero · nivel: N2 · perfil: zz-verif-admin · página: /str-app-shell.html · precondición: commit desplegado · tec: escenario · espera: caso e del guion en verde · **Revertir**
- f. str-manager queda en verde con los contadores al día · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84 (menu-sh2, roles y tablero-al-dia con lo nuevo); `aplicar.js` K1 en verde (D1 y P1–P39); la cola compara el guion; los 22 archivos borrados no están en el commit · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Regresión: la del menú (REQ-SH-2 ajustado en § 2) y la de la ruta. Si a–c y e fallan todos a la vez justo después del push, puede faltar el despliegue: Detener y avisar, no Revertir.
```

### Guion N2 → `tests/e2e/LM-79-str.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// LM-79 fase 5.3 (L-177): el STR suelta el grupo Proyecto. Sus ocho páginas internas pasaron a los sitios de la fábrica; en el
// menú queda el grupo «Proyecto» (solo admin) con una sola entrada, «Proyectos (fábrica) ↗», que abre proyectos. en pestaña
// nueva (noopener). Nadie pierde otra entrada (conteo por rol), el operador y el colaborador no la ven, y tras la limpieza
// manual de Carlos las ocho rutas viejas dan 404 en cada sitio que publica el STR. Solo lectura: navega y lee el DOM.
const EXTERNA = 'https://proyectos.apartamentosbucaramanga.com/';
const VIEJAS = ['str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html', 'str-elementos.html',
  'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
// Los tres sitios que publican el STR (M-1230): fabrica. lo sirve entero hasta la fase 6; si Carlos lo retira antes, «no resuelve» vale
const SITIOS = ['https://app.apartamentosbucaramanga.com', 'https://pruebas.apartamentosbucaramanga.com', 'https://fabrica.apartamentosbucaramanga.com'];
const PUEDE_NO_RESOLVER = ['https://fabrica.apartamentosbucaramanga.com']; // si se retira: DNS, certificado o conexión (la fase 6 lo quita de SITIOS)
// Entradas de cada rol después del lote (antes: admin 18 = estas 10 + las 8 de Proyecto; operador 9, sin cambio)
const ADMIN = ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario', 'Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración',
  'Lo que viene', 'Proyectos (fábrica) ↗'];
const OPER = ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario', 'Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración'];

// Entradas visibles del menú (fuera de Favoritos), en orden; solo lee el DOM
async function entradas(h) {
  const p = h.page;
  await p.waitForSelector('.sidebar .nav-group', { timeout: 20000 });
  await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  return p.evaluate(() => {
    const oculto = (el) => { for (let e = el; e && !e.classList.contains('sidebar'); e = e.parentElement) if (e.style && e.style.display === 'none') return true; return false; };
    return Array.from(document.querySelectorAll('.sidebar > .nav-group:not(#nav-group-favoritos) > .nav-group-body > .nav-item'))
      .filter((n) => !oculto(n)).map((n) => ((n.querySelector('.ni-label') || {}).textContent || '').trim());
  }).catch(() => null);
}

module.exports = {
  req: 'LM-79',
  zona: ['SH'],
  casos: [
    {
      c: 'a', perfil: 'admin', tec: 'escenario', cubre: ['SH', 'RT-14'], pagina: '/str-app-shell.html',
      que: 'El admin ve las mismas entradas de antes salvo las ocho de Proyecto, y en su lugar «Proyectos (fábrica) ↗», que abre proyectos. en pestaña nueva sin acceso a la ventana del STR',
      async prueba(h) {
        const p = h.page;
        const v = await entradas(h);
        h.espera(!!v && JSON.stringify(v) === JSON.stringify(ADMIN), 'entradas del admin (' + (v ? v.length : '?') + '): ' + JSON.stringify(v));
        const at = await p.evaluate(() => {
          const n = document.getElementById('nav-proyectos-fabrica');
          return n ? { externo: n.getAttribute('data-externo'), roles: n.getAttribute('data-roles'), fav: n.getAttribute('data-fav-url'), onclick: n.getAttribute('onclick') } : null;
        }).catch(() => null);
        h.espera(!!at && at.externo === EXTERNA && at.roles === 'admin' && !at.fav && at.onclick === "window.open('" + EXTERNA + "', '_blank', 'noopener')", 'entrada: ' + JSON.stringify(at));
        const [pop] = await Promise.all([
          p.waitForEvent('popup', { timeout: 15000 }).catch(() => null),
          p.click('#nav-proyectos-fabrica', { timeout: 10000 }).catch(() => null),
        ]);
        let url = '', sinOpener = null;
        if (pop) {
          await pop.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
          url = pop.url();
          sinOpener = await pop.evaluate(() => window.opener === null).catch(() => null);
          await pop.close().catch(() => {});
        }
        h.espera(!!pop && url.startsWith(EXTERNA) && sinOpener === true, 'pestaña nueva: ' + (pop ? url : 'no se abrió') + ' · sin opener: ' + sinOpener);
        const sigue = /\/str-app-shell\.html/.test(p.url());
        h.espera(sigue, 'el STR sigue en su pestaña: ' + p.url());
      },
    },
    {
      c: 'b', perfil: 'oper', tec: 'decisión', cubre: ['SH', 'RT-14'], pagina: '/str-app-shell.html',
      que: 'El operador no ve el grupo Proyecto ni su entrada, y conserva sus 9 entradas de siempre',
      async prueba(h) {
        const v = await entradas(h);
        h.espera(!!v && JSON.stringify(v) === JSON.stringify(OPER), 'entradas del operador (' + (v ? v.length : '?') + '): ' + JSON.stringify(v));
        const vis = await h.page.locator('#nav-proyectos-fabrica').isVisible().catch(() => false);
        h.espera(!vis, 'entrada «Proyectos (fábrica) ↗» visible para el operador: ' + vis);
      },
    },
    {
      c: 'c', perfil: 'colab', tec: 'decisión', cubre: ['SH', 'RT-14'], pagina: '/portal.html',
      que: 'El colaborador sigue en su portal: si abre el shell vuelve al portal y no ve la entrada',
      async prueba(h) {
        const p = h.page;
        await p.goto((h.BASE || new URL(p.url()).origin) + '/str-app-shell.html', { waitUntil: 'load' }).catch(() => null);
        const t0 = Date.now(); while (Date.now() - t0 < 10000 && !/\/portal\.html/.test(p.url())) await p.waitForTimeout(300);
        const vis = await p.locator('#nav-proyectos-fabrica').isVisible().catch(() => false);
        h.espera(/\/portal\.html/.test(p.url()) && !vis, 'colaborador → ' + p.url().replace(/^https:\/\/[^/]+/, '') + ' · entrada visible: ' + vis);
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['SH'], pagina: '/str-app-shell.html',
      que: 'Tras la limpieza manual de Carlos, las ocho rutas viejas del grupo Proyecto dan 404 en app., pruebas. y fabrica. (o fabrica. ya no resuelve); no quedan páginas huérfanas',
      async prueba(h) {
        for (const sitio of SITIOS) {
          for (const r of VIEJAS) {
            let error = '';
            const x = await h.page.request.get(sitio + '/' + r, { maxRedirects: 0 }).catch((e) => { error = String(e && e.message || e).slice(0, 80); return null; });
            const retirado = !x && PUEDE_NO_RESOLVER.includes(sitio) && /ENOTFOUND|getaddrinfo|ERR_NAME_NOT_RESOLVED|CERT|certificate|SSL|TLS|ECONNREFUSED|ECONNRESET/i.test(error);
            h.espera((!!x && x.status() === 404) || retirado, sitio.replace('https://', '') + '/' + r + ' → ' + (x ? x.status() : (retirado ? 'host retirado' : 'sin respuesta: ' + error)));
          }
        }
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['SH'], pagina: '/str-app-shell.html',
      que: 'Humo del shell: el admin entra y el STR abre en el Tablero como siempre',
      async prueba(h) {
        const p = h.page;
        await entradas(h);
        const t0 = Date.now(); let vis = false;
        while (Date.now() - t0 < 20000 && !(vis = await p.locator('#panel-mod-tablero.show').isVisible().catch(() => false))) await p.waitForTimeout(300);
        h.espera(vis, 'Tablero abierto al entrar: ' + vis);
      },
    },
  ],
};
```

## Paso de Carlos (fuera de la cola, después del commit desplegado)
Git de Hostinger no borra en el servidor lo que el commit borra (INC-210). En **cada uno de los tres sitios** que publican el STR — `app.apartamentosbucaramanga.com`, `pruebas.apartamentosbucaramanga.com` y `fabrica.apartamentosbucaramanga.com` — abre hPanel › Administrador de archivos › `public_html` y borra estas ocho páginas (nada más):
`str-seg-proyecto.html`, `str-marco-trabajo.html`, `str-instrucciones.html`, `str-cobit.html`, `str-elementos.html`, `str-base-conocimiento.html`, `str-nomenclatura.html`, `str-linea-base.html`.
Comprobación: abre `https://app.apartamentosbucaramanga.com/str-seg-proyecto.html` (y lo mismo en los otros dos sitios): debe decir «404». Los tests y guiones retirados que queden en `public_html/tests/` no hacen daño (no tienen datos); bórralos solo si quieres. Avisa a Desarrollo al terminar: el caso d sale rojo en la primera corrida (antes de la limpieza, como está previsto, Detener) y Desarrollo pide la reprueba (`reprobar\\L-177.txt`, como en INC-210).

## 4. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por paso, declarados vs tocados —los 22 borrados, los 9 cambiados, `docs/claude/proyecto.md` reemplazado y el guion nuevo—) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-177 · LM-79 · Casos de uso: CU-KN-6.1, CU-OP-4.1, CU-PRJ-1.1, CU-PRJ-2.1, CU-PRJ-2.2, CU-PRJ-2.3, CU-PRJ-3.1, CU-PRJ-3.5, CU-PRJ-3.6, CU-PRJ-9.1, CU-PRJ-10.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.2, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-U-2.5
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (§ 1–4) · `git status --short` de § 1 (22 «D») · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: 84/84 · «mapa del área / CLAUDE.md actualizado: sí (proyecto.md, shell-y-api.md, tests-y-despliegue.md)» · «Paso de Carlos pendiente: borrar las ocho páginas en app., pruebas. y fabrica.» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
