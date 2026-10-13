# instr — REQ-MOD-6 / B7-5a: esquema 2, tabla `complemento`, exportación completa y UTC (DT-36)
Categoría: **crítico** (cambio de esquema del modelo; lote del modelo LM-27a, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · revisión previa del Chat Desarrollo: 13-oct 17:00 (M-289), corregida aquí · cruce con Carlos: PENDIENTE · ok de Diseño: 13-oct 17:50 (M-294)). Partido de LM-27 a pedido de la revisión: la parte de credenciales va en LM-27b.
Alcance: `modelo/sql/002_complemento.sql` (nuevo) · `modelo/api/config/database.php` (solo: `SET time_zone = '+00:00'` al conectar) · `modelo/api/config/carga.php` (tabla `complemento` en la lista blanca con su propia clave única) · `modelo/api/config/lectura.php` (`listar` y `exportar` con `complemento`; quitar su `SET time_zone` propio) · `modelo/api/index.php` (solo: `migrar` aplica 002; `cargar` comprueba el esquema para `complemento` y responde la versión real) · `tests/lib/port-carga.js` · `tests/lib/port-export.js` · `tests/fixtures/modelo/filas-export.json` · `tests/modelo-sql.test.js` · `tests/modelo-cargar.test.js` · `tests/modelo-lectura.test.js` · `tests/e2e/REQ-MOD-6-complemento.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · `CLAUDE.md` · **sin cambio de `?v=`** · `schema_version` del modelo 1 → 2 · la base del STR no se toca
Impacto: la exportación deja de ser parcial: rehace cada archivo entero (claves de primer nivel que no son tablas y su orden). Es la condición de B7-6. El filtro `since` deja de correrse si el servidor no está en UTC.
Riesgo: medio (R-1 datos del modelo, no del negocio: tabla nueva y esquema 2). Mitigación: `002` solo crea (`CREATE TABLE IF NOT EXISTS`) y registra la versión; ningún `DROP` ni `ALTER`; la carga sigue en una transacción; la fuente sigue siendo `str-manager-docs` hasta B7-6.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-27a; solo `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>`; la tabla `complemento` queda sin uso (no se borra) y `schema_version` 2 no estorba al código anterior (`migrar` con `< 1` no hace nada).
Origen: ADR-006 §6 fila 5; `interno/lotes-modelo/LM-27.md`; DT-36 (M-285). Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-27.
Depende de: L-88 (LM-21) aceptado. Para las pruebas b–d: `paquete.py` v3 del Arquitecto (manda `complemento`); la cola ya tiene `MIGRAR` y `EXPORTAR` (v7.4), no necesita versión nueva.
Precondiciones para verificar: `/modelo/api/salud` con `db:true`; el verificador no conoce el token; la migración a 2 y la carga v3 las hace el Arquitecto por la cola.
¿Quién más depende de lo que cambia?: B7-6 (exige `parcial:false`), B8 (lee tablas y `estado`), LM-27b (se apoya en el mismo `index.php`), el espejo de la cola (`pw\modelo-llamar.js exportar`) y `paquete.py` v3. Dentro del modelo: `lectura.php`, `tests/modelo-lectura.test.js` y `tests/lib/port-export.js` toman la lista de tablas de `carga.php` (pasa de 14 a 15: revisar todo conteo fijo); `tests/modelo-router.test.js` (los `require` en una línea `if`); los guiones `REQ-MOD-6*.spec.js` como regresión de la zona `modelo`.

## 1. `modelo/sql/002_complemento.sql` (nuevo)
- `CREATE TABLE IF NOT EXISTS complemento` (`proyecto` VARCHAR(16), `archivo` VARCHAR(64), `clave` VARCHAR(64), `orden` INT, `es_lista` TINYINT(1) NOT NULL DEFAULT 0, `valor` JSON NULL, `creado_en`, `actualizado_en`, `actualizado_por`, `extra` JSON NULL; clave primaria (`proyecto`, `archivo`, `clave`)). Mismo motor, juego de caracteres y columnas comunes que 001. **Sin columna `id`.**
- `INSERT INTO schema_version (version) VALUES (2)`.
- Ningún `DROP` ni `ALTER` sobre tablas de 001.

## 2. `database.php`: UTC (DT-36)
Justo después de abrir la conexión del modelo: `SET time_zone = '+00:00'`. `lectura.php` deja de fijarla por su cuenta. Así `actualizado_en` (escritura) y `FROM_UNIXTIME(since/1000)` (lectura) usan la misma hora.

## 3. `carga.php`: `complemento`
- Entra en la lista blanca con `archivo`, `clave`, `orden`, `es_lista`, `valor` y `extra` (opcional, puede venir `null`).
- Para esta tabla la unicidad es (`archivo`, `clave`), no `id`: un par repetido → error; una fila con `id` → error (columna desconocida). Las demás tablas siguen con `id`.
- `valor` se guarda como texto JSON tal cual llega (sin reordenar claves).
- `credencial` y `schema_version` siguen rechazadas.

## 4. `index.php`
- `migrar`: aplica `001_inicial.sql` si `schema_version` < 1 y luego `002_complemento.sql` si < 2, en ese orden; responde `{"ok":true,"schema_version":2,"aplicadas":n}`. Sigue solo con el token del Arquitecto (como hoy). Nunca borra tablas.
- `cargar`: después de conectar y **antes** de `cargarPaquete`, si el paquete trae `complemento` y `schema_version` < 2 → 422 `{"error":"paquete inválido","detalle":["complemento requiere schema_version 2"]}`. La respuesta de éxito lee `schema_version` de la base (no queda fija en 1).
- El resto del orden de L-88 no cambia: nombre fuera de la lista blanca (incluida `credencial`) → 404 antes de pedir token; otro método → 405.

## 5. `lectura.php`
- `listar('complemento', …)`: ordena por `archivo` y `orden`; filtros `since`, `proyecto`, `limite`, `desde` como las demás; `estado` → 422 (no tiene esa columna). `GET complemento/<id>` → 404 (no tiene `id`).
- `exportar($db)`:
  - El rehacer de listas **excluye siempre `complemento`** (sus filas no llevan `extra.f`).
  - Si hay filas de `complemento` (`proyecto='str'`), cada archivo se arma recorriendo sus filas por `orden`: `es_lista=1` → la lista rehecha desde las filas de las demás tablas cuyo `extra.f` es `archivo.clave`; si no → `valor` decodificado (`json_decode` sin `true`, como hoy).
  - Las listas de un archivo sin fila en `complemento` se añaden al final (no deberían existir). Un archivo con filas en `complemento` y sin listas también sale (p. ej. `situaciones/_esquema`).
  - Mapa de rutas: el de L-88 más `situaciones/_<x>` → `interno/situaciones/_<x>.json`.
  - `parcial` = `false` si todo archivo que aparece en `extra.f` tiene filas en `complemento`; si no, `true`. Añade `"complemento":n` (filas usadas).
  - Sale con `JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION`, como hoy.

## 6. Tests y mapa
- `tests/lib/port-carga.js`: `complemento` con unicidad (`archivo`,`clave`), sin `id`, `extra` opcional.
- `tests/lib/port-export.js` + `tests/fixtures/modelo/filas-export.json`: filas de `complemento` para dos archivos (uno con una lista entre dos claves, otro sin listas) y una fila de `complemento` que el rehacer de listas debe ignorar; el port arma el archivo en el orden de `orden`, conserva `{}` y da `parcial:false`; sin `complemento` da lo de hoy (`parcial:true`).
- `tests/modelo-sql.test.js`: `002_complemento.sql` existe, crea `complemento` con `proyecto` y `extra` y sin `id`, registra 2, sin `DROP` ni `ALTER`.
- `tests/modelo-cargar.test.js`: `complemento` válido pasa; par repetido → error; fila con `id` → error; `credencial` sigue → error; la regla de esquema 2 está en `index.php` entre la conexión y `cargarPaquete` (lectura del texto); la respuesta no lleva `schema_version` fijo.
- `tests/modelo-lectura.test.js`: ajustar los conteos fijos de filas (la fixture crece) y de tablas (14 → 15); la lista no incluye `credencial` ni `schema_version`; DT-36: `database.php` contiene `SET time_zone = '+00:00'` y `lectura.php` no lo repite (lectura del texto); `GET complemento/<id>` → 404, por lectura del texto de `lectura.php` (no hay port de rutas).
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: esquema 2, `complemento`, exportación completa, UTC. `CLAUDE.md`: filas del mapa si cambian.

## Pruebas derivadas (juez local; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-sql`, `modelo-cargar` y `modelo-lectura` · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: cubierto por esos tests · **Detener**
- b. Migración a 2: el Arquitecto deja `modelo-cargas\MIGRAR` → `log\modelo-migrar-*.json` · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: commit desplegado · espera: `ok:true, schema_version:2` · **Detener**
- c. Carga v3: el Arquitecto deja `paquete-<sha>.json` (con `complemento`) → `log\modelo-cargar-*.json` · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: b · espera: 200, 15 conteos, `schema_version:2` · **Detener**
- d. Ida y vuelta completa: `EXPORTAR`; cada archivo de `log\espejo\` es igual, **incluido el orden de las claves**, al del commit cargado; `validar.py` sobre ellos → 0 errores; `parcial:false` · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: c · espera: todo igual, 0 errores · **Detener**
- e. Sin token: `GET /modelo/api/complemento` → 403 «Token requerido»; `GET /modelo/api/credencial` → 404; `/modelo/api/salud` con `db:true` y `schema_version` ≥ 1; `/api/health` del STR 200 · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: como dice · **Detener**
- f. `git show --name-only`: solo archivos del Alcance; ningún secreto · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno (los datos son del modelo, no del negocio).

### Guion N2 → `tests/e2e/REQ-MOD-6-complemento.spec.js`
```js
// L-n (LM-27a, B7-5a): complemento pide token, credencial no existe y el servicio sigue sano. Solo lectura.
// fetch va dentro de page.evaluate a propósito: así pasa por la guardia de pw.
module.exports = {
  req: 'REQ-MOD-6',
  zona: 'modelo',
  casos: [
    {
      c: 'e', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'complemento sin token → 403; credencial → 404; salud y health sanos',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const out = {};
          const a = await fetch('/modelo/api/complemento');
          let ja = null; try { ja = await a.json(); } catch (e) { }
          out.comp = { s: a.status, e: ja && ja.error };
          out.credencial = (await fetch('/modelo/api/credencial')).status;
          out.salud = await (await fetch('/modelo/api/salud')).json();
          out.health = (await fetch('/api/health')).status;
          return out;
        });
        h.espera(r.comp.s === 403 && r.comp.e === 'Token requerido', 'complemento ' + JSON.stringify(r.comp));
        h.espera(r.credencial === 404, 'credencial ' + r.credencial);
        h.espera(r.salud && r.salud.db === true && r.salud.schema_version >= 1, 'salud ' + JSON.stringify(r.salud));
        h.espera(r.health === 200, '/api/health ' + r.health);
      },
    },
  ],
};
```

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
