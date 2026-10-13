# instr — REQ-MOD-6 / B7-4: lectura y exportación del servicio del modelo (GET)
Categoría: **normal** (solo lectura; lote del modelo LM-21, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45; sin cambio de esquema ni escritura en la base)
Alcance: `modelo/api/index.php` (solo: rutas GET nuevas `estado`, `export` y `<tabla>`) · `modelo/api/config/lectura.php` (nuevo) · `tests/modelo-lectura.test.js` (nuevo) · `tests/lib/port-export.js` (nuevo) · `tests/fixtures/modelo/filas-export.json` (nuevo) · `tests/e2e/REQ-MOD-6-lectura.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · `CLAUDE.md` (regla de ports: el port de la exportación vive en `tests/lib/port-export.js`) · **sin cambio de `?v=`** · `schema_version` igual (1) · la base del STR no se toca
Impacto: el servicio del modelo deja leer sus tablas, un resumen de estado y una exportación que rehace las listas de los JSON de `str-manager-docs` tal como se cargaron. Nada del STR cambia; nada se escribe en la base.
Riesgo: bajo (R-2 acceso: hasta B7-5 todo pide el token del Arquitecto). Mitigación: solo `SELECT`; lista blanca de tablas; `credencial` y `schema_version` nunca se leen por estas rutas.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-21; solo archivos de `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>` (no hay datos que deshacer).
Origen: ADR-006 §6 fila 4; `interno/lotes-modelo/LM-21.md`. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-21.
Depende de: L-87 (LM-20) aceptado: `carga.php` con la lista blanca y filas cargadas con el paquete v2 (`extra` = `{f, i, o}` u `{f, i, derivado:true}`).
Precondiciones para verificar: `/modelo/api/salud` con `db:true` y `schema_version` 1; la carga de L-87 hecha; el verificador no conoce el token.
¿Quién más depende de lo que cambia?: B8 (REQ-TB-6, Seg. Proyecto leerá `estado` y las tablas por el proxy de `str-api`), B9b (conocimiento generado) y el espejo de la cola (`pw\modelo-llamar.js exportar`, del Arquitecto) dependen de la forma exacta de las respuestas. Dentro del modelo: `tests/modelo-router.test.js` (ninguna línea empieza por `require`: el de `lectura.php` va en una línea `if`, como `database.php` y `carga.php`) y los guiones `REQ-MOD-6.spec.js` y `REQ-MOD-6-carga.spec.js` como regresión de la zona `modelo`.

## 1. `modelo/api/config/lectura.php` (nuevo)
Usa la lista blanca de `carga.php` (las 14 tablas; nunca `credencial` ni `schema_version`). Todo con sentencias preparadas y solo `SELECT`.
- `leerFila($fila)`: decodifica `extra` y las columnas JSON (`json_decode(..., true)`); quita `proyecto`; deja `creado_en`/`actualizado_en` como texto.
- `listar($db, $tabla, $q)`: filtros opcionales `estado` (igualdad), `since` (milisegundos, DT-20: `actualizado_en >= FROM_UNIXTIME(since/1000)`), `proyecto` (por defecto `str`; patrón `^[a-z0-9-]{1,16}$`, si no → 422), `limite` (por defecto 500, máximo 2000), `desde` (desplazamiento, ≥ 0); en `evento`, además `id` (filtra por el lote). Orden: `evento` por `n`; el resto por `id`. Devuelve `{"ok":true,"tabla","total","filas":[…],"server_time"}` (`total` = filas que cumplen los filtros, sin límite).
- `uno($db, $tabla, $id)`: una fila por `id` (en `evento`, por `n`); si no existe → 404 `{"error":"No encontrado"}`.
- `estado($db)`: `{"ok":true,"server_time","schema_version","conteos":{tabla:n},"lotesPorEstado":{estado:n},"enCurso":[{id,req,estado}],"ultimosVeredictos":[{lote,resultado,hora}],"metrica":{"construidoAceptado":{"n","medianaMin","p90Min"}}}`. `enCurso` = lotes con estado `redactado`, `encolado`, `construyendo`, `construido` o `verificando`. `ultimosVeredictos` = los 5 de `veredicto` con `hora` más reciente. La métrica sale de `evento`: por cada `id` con `construido` y `aceptado`, minutos entre los dos (el último de cada uno); mediana y percentil 90 redondeados a entero.
- `exportar($db)`: rehace las listas desde `extra`, sin mirar las columnas: toma las filas de las 14 tablas con `extra.f` y sin `extra.derivado`, agrupa por `f` (`archivo.lista`), ordena por `extra.i` y devuelve `extra.o` tal cual. Mapa de `archivo` a ruta: `diseno` → `interno/diseno.json`, `seguimiento` → `interno/seguimiento.json`, `mensajes` → `interno/mensajes.json`, `reqs-historial` → `interno/archivo/reqs-historial.json`, `situaciones/<x>` → `interno/situaciones/<x>.json`. Respuesta: `{"ok":true,"server_time","parcial":true,"archivos":{"interno/diseno.json":{"reqs":[…],"das":[…],…},…},"cubre":["diseno.reqs",…],"sinOrigen":n}`. `parcial:true` porque las claves de primer nivel que no son tablas (versión, esquema, bolsa…) llegan en B7-5; `sinOrigen` cuenta filas sin `extra.f` (hoy 0). Para `extra.o` usa `json_decode($x)` **sin** `true` (objetos de PHP), así un `{}` vacío no sale como `[]`; sácalo con `JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION`.

## 2. Rutas en `modelo/api/index.php`
Las tres exigen `X-Modelo-Token` igual a `MODELO_TOKEN_ARQ` (`hash_equals`), comprobado **antes** de tocar la base; sin ella o distinta → 403 `{"error":"Token requerido"}` (mismo cuerpo que `migrar` y `cargar`). Solo `GET`; otro método → 405 (como `salud`).
- `GET estado` → `estado($db)`.
- `GET export` → `exportar($db)`.
- `GET <tabla>` y `GET <tabla>/<id>` (`<id>` con `rawurldecode`) para las tablas de la lista blanca → `listar` / `uno`. `credencial`, `schema_version` o cualquier otro nombre siguen en el `default` (404 `Endpoint no encontrado`), **sin** pedir token antes (el 404 no revela nada).
- `eco`, `salud`, `migrar` y `cargar` quedan igual.

## 3. Tests y mapa
- `tests/lib/port-export.js`: réplica en JS de `exportar` sobre una lista de filas (`{tabla, extra}`) → `{archivos, cubre, sinOrigen}`.
- `tests/fixtures/modelo/filas-export.json`: unas 12 filas a mano (dos archivos, orden `i` desordenado, una fila `derivado`, una sin `extra.f`, un objeto vacío `{}` dentro de `o`).
- `tests/modelo-lectura.test.js`: el port sobre el fixture da el orden por `i`, ignora `derivado`, cuenta `sinOrigen` y conserva `{}`; la lista de tablas que acepta `lectura.php` sale de `carga.php` (lectura del texto) y no incluye `credencial` ni `schema_version`; el texto de `index.php` comprueba el token antes de conectar en `estado`, `export` y `<tabla>`; `lectura.php` no contiene `INSERT`, `UPDATE`, `DELETE`, `DROP` ni `TRUNCATE`; `proyecto` fuera del patrón → 422 (en el port de filtros o por lectura del texto); `limite` > 2000 se recorta.
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: rutas de lectura, filtros, `estado`, `export` (parcial hasta B7-5) y que todas piden el token del Arquitecto hasta B7-5.

## Pruebas derivadas (juez local; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-lectura.test.js` · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: cubierto por tests/modelo-lectura.test.js · **Detener**
- b. Ida y vuelta: la cola pide `export` con el token (`modelo-cargas\EXPORTAR`) y deja los archivos en `log\espejo\`; el Arquitecto pasa `validar.py` sobre ellos (montados en una copia del repo de docs) → 0 errores · nivel: N2 fuera del guion (null → «parcial»; lo cierra el Arquitecto con `log\modelo-exportar-*.json`) · perfil: Arquitecto · página: — · precondición: L-87 cargado · espera: 0 errores · **Seguir**
- c. Igualdad: cada lista de `cubre` es igual a la del commit cargado (`sha` del paquete), comparando con claves ordenadas · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: b hecho · espera: todas iguales · **Detener**
- d. Sin token: `GET /modelo/api/requisito`, `/modelo/api/estado` y `/modelo/api/export` → 403 `{"error":"Token requerido"}`; `GET /modelo/api/credencial` → 404 · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: 403, 403, 403 y 404 · **Detener**
- e. `/modelo/api/salud` sigue `db:true` y `schema_version` 1; `/api/health` del STR 200 · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: como dice · **Detener**
- f. `git show --name-only`: solo archivos del Alcance; ningún secreto · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo leyendo el cierre) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno (solo lectura; los datos son del modelo, no del negocio).

### Guion N2 → `tests/e2e/REQ-MOD-6-lectura.spec.js`
```js
// L-n (LM-21, B7-4): las rutas de lectura piden token, credencial no existe y el servicio sigue sano. Solo lectura.
module.exports = {
  req: 'REQ-MOD-6',
  zona: 'modelo',
  casos: [
    {
      c: 'd', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'requisito, estado y export sin token → 403 «Token requerido»; credencial → 404',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const out = {};
          for (const ruta of ['requisito', 'estado', 'export', 'credencial']) {
            const x = await fetch('/modelo/api/' + ruta);
            let j = null; try { j = await x.json(); } catch (e) { }
            out[ruta] = { s: x.status, e: j && j.error };
          }
          return out;
        });
        for (const ruta of ['requisito', 'estado', 'export']) {
          h.espera(r[ruta].s === 403 && r[ruta].e === 'Token requerido', ruta + ' ' + JSON.stringify(r[ruta]));
        }
        h.espera(r.credencial.s === 404, 'credencial ' + JSON.stringify(r.credencial));
      },
    },
    {
      c: 'e', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'salud del modelo con base y esquema 1; health del STR responde',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const a = await (await fetch('/modelo/api/salud')).json();
          const b = await fetch('/api/health');
          return { a, hs: b.status };
        });
        h.espera(r.a && r.a.db === true, 'modelo db ' + (r.a && r.a.db));
        h.espera(r.a && r.a.schema_version >= 1, 'modelo schema_version ' + (r.a && r.a.schema_version));
        h.espera(r.hs === 200, '/api/health ' + r.hs);
      },
    },
  ],
};
```

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
