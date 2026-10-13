# instr — REQ-MOD-6 / B7-5: credenciales por rol, tabla `complemento` y exportación completa (esquema 2)
Categoría: **crítico** (credenciales y cambio de esquema; lote del modelo LM-27, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · cruce previo con Carlos: PENDIENTE · revisión previa del Chat Desarrollo: PENDIENTE)
Alcance: `modelo/sql/002_complemento.sql` (nuevo) · `modelo/api/config/database.php` (solo: `SET time_zone = '+00:00'` al conectar, DT-36) · `modelo/api/config/acceso.php` (nuevo) · `modelo/api/config/credenciales.php` (nuevo) · `modelo/api/config/carga.php` (solo: tabla `complemento` en la lista blanca) · `modelo/api/config/lectura.php` (solo: `exportar` con `complemento`; quitar su propio `SET time_zone` si queda duplicado) · `modelo/api/index.php` (solo: `migrar` aplica 002; acceso por rol; ruta nueva `POST credenciales`) · `tests/modelo-acceso.test.js` (nuevo) · `tests/modelo-sql.test.js` · `tests/modelo-cargar.test.js` · `tests/modelo-lectura.test.js` · `tests/lib/port-export.js` · `tests/fixtures/modelo/filas-export.json` · `tests/e2e/REQ-MOD-6-credenciales.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · `CLAUDE.md` · **sin cambio de `?v=`** · `schema_version` del modelo 1 → 2 · la base del STR no se toca
Impacto: el servicio deja de depender de un solo token. Cada rol (tablero, desarrollo, diseño) tiene el suyo, guardado como hash; el del Arquitecto sigue en `secrets.php`. La exportación pasa de parcial a completa: rehace los archivos enteros (claves de primer nivel y su orden), condición para B7-6 (el servicio pasa a ser el registro oficial). El filtro `since` deja de correrse si el servidor no está en UTC (DT-36).
Riesgo: medio (R-2 acceso: credenciales). Mitigación: en la base solo hay hashes SHA-256; los tokens nacen y viven en LENOVO (`claves\`), nunca en el repo, el chat ni los logs; ningún rol nuevo escribe (lectura); `cargar`, `migrar` y `credenciales` siguen siendo solo del Arquitecto; `credencial` nunca se lee por la API.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-27; solo `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>`; la tabla `complemento` queda sin uso (no se borra); las credenciales se anulan con `POST credenciales` vacío o dejan de valer al revertir.
Origen: ADR-006 §6 fila 5; `interno/lotes-modelo/LM-27.md`; DT-36 (M-285). Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-27.
Depende de: L-88 (LM-21) aceptado: `lectura.php` con `listar`, `estado` y `exportar` (parcial).
Precondiciones para verificar: `/modelo/api/salud` con `db:true`; el verificador no conoce ningún token; la migración a 2, las credenciales y la carga v3 las hace el Arquitecto por la cola.
¿Quién más depende de lo que cambia?: B8 (REQ-TB-6: el proxy de `str-api` leerá con el token `tablero`), B7-6 (corte: exige `parcial:false`), el espejo de la cola (`pw\modelo-llamar.js exportar`) y `paquete.py` v3 (Arquitecto, manda `complemento`). Dentro del modelo: `tests/modelo-router.test.js` (los `require` nuevos van en una línea `if`, como los demás) y los guiones `REQ-MOD-6*.spec.js` como regresión de la zona `modelo`.

## 1. `modelo/sql/002_complemento.sql` (nuevo)
- `CREATE TABLE IF NOT EXISTS complemento` (`proyecto` VARCHAR(16), `archivo` VARCHAR(64), `clave` VARCHAR(64), `orden` INT, `es_lista` TINYINT(1) DEFAULT 0, `valor` JSON NULL, `creado_en`, `actualizado_en`, `actualizado_por`, `extra` JSON; clave primaria (`proyecto`, `archivo`, `clave`)). Mismo motor, juego de caracteres y columnas comunes que 001.
- `INSERT INTO schema_version (version) VALUES (2)`.
- La tabla `credencial` ya existe (001): no se toca. Ningún `DROP` ni `ALTER` sobre tablas de 001.

## 2. `database.php`: UTC (DT-36)
Justo después de abrir la conexión del modelo: `SET time_zone = '+00:00'`. Así `actualizado_en` (escritura) y `FROM_UNIXTIME(since/1000)` (lectura) usan la misma hora. Si `lectura.php` fija la zona por su cuenta, se quita allí.

## 3. `acceso.php` (nuevo)
- `rolDelToken($db, $token)`: vacío → `null`. Igual a `MODELO_TOKEN_ARQ` (`hash_equals`) → `'arquitecto'` (sin consultar la base). Si no, `hash('sha256', $token)` y busca en `credencial` con `proyecto='str'` y (`vence` IS NULL o `vence` ≥ `CURDATE()`); compara el hash con `hash_equals` sobre la fila; devuelve su `rol` o `null`.
- Permisos (constante en el código, sin tabla): `arquitecto` → todo; `tablero`, `desarrollo`, `diseno` → solo lectura (`GET <tabla>`, `GET estado`, `GET export`).
- `exigir($db, $permitidos)`: sin cabecera `X-Modelo-Token` → 403 `{"error":"Token requerido"}` **antes de conectar**; token que no corresponde a ningún rol → 403 `{"error":"Token requerido"}` (mismo cuerpo: no se revela si el token existe); rol válido pero fuera de `$permitidos` → 403 `{"error":"Sin permiso"}`. Devuelve el rol.

## 4. `credenciales.php` (nuevo) y ruta `POST credenciales`
- Solo `arquitecto`. Cuerpo `{"credenciales":[{"rol","hash","vence"}]}`: `rol` ∈ `tablero`, `desarrollo`, `diseno` (nunca `arquitecto`); `hash` = 64 caracteres hexadecimales en minúscula; `vence` = `AAAA-MM-DD` o `null`. Cualquier error → 422 `{"error":"credenciales inválidas","detalle":[…]}` sin tocar nada.
- En una transacción: por cada rol enviado, `DELETE … WHERE proyecto='str' AND rol=?` e `INSERT`. Lista vacía → no cambia nada (para anular un rol se manda con `vence` de ayer).
- Respuesta `{"ok":true,"roles":["tablero",…],"vence":{"tablero":"AAAA-MM-DD",…}}`. **Nunca** devuelve hashes; nunca escribe el cuerpo en un log.

## 5. `carga.php`: `complemento`
- Entra en la lista blanca con sus columnas (`archivo`, `clave`, `orden`, `es_lista`, `valor`). Para esta tabla la clave es (`archivo`, `clave`): una repetida → error. `valor` se guarda como JSON tal cual (texto), sin reordenar claves.
- `credencial` y `schema_version` siguen rechazadas. Si `schema_version` < 2 y el paquete trae `complemento` → 422 `{"error":"paquete inválido","detalle":["complemento requiere schema_version 2"]}`.

## 6. `lectura.php`: exportación completa
- `exportar($db)`: si hay filas en `complemento` (`proyecto='str'`), cada archivo se arma recorriendo sus filas por `orden`: `es_lista=1` → la lista rehecha desde `extra` (como hoy, `f` = `archivo.clave`); si no → `valor` decodificado como hoy (`json_decode` sin `true`). Las listas de un archivo que no tengan fila en `complemento` se añaden al final (no deberían existir). Un archivo con filas en `complemento` y sin listas también sale (p. ej. `situaciones/_esquema`).
- Mapa de rutas: el de LM-21 más `situaciones/_<x>` → `interno/situaciones/_<x>.json`.
- `parcial` = `false` si todo archivo que aparece en `extra.f` tiene filas en `complemento`; si no, `true` (como hoy). Añade `"complemento":n` (filas usadas).
- `complemento` se puede leer por `GET complemento` como cualquier tabla; `credencial` → 404 como hoy.

## 7. `index.php`
- `migrar`: aplica `001_inicial.sql` si `schema_version` < 1 y luego `002_complemento.sql` si < 2, en orden; responde `{"ok":true,"schema_version":2,"aplicadas":n}`. Sigue siendo solo del Arquitecto. Nunca borra tablas.
- `GET <tabla>`, `GET estado`, `GET export` → `exigir($db, ['arquitecto','tablero','desarrollo','diseno'])`. `POST cargar`, `GET migrar`, `POST credenciales` → `exigir($db, ['arquitecto'])`.
- `salud` y `eco` sin cambios (siguen sin token).

## 8. Tests y mapa
- `tests/modelo-acceso.test.js` (port en JS de `rolDelToken`/`exigir` sobre una lista de credenciales en memoria): token del Arquitecto → `arquitecto`; hash de `tablero` vigente → `tablero`; vencido → `null`; desconocido → 403 «Token requerido»; `tablero` en `cargar` → 403 «Sin permiso»; sin cabecera → 403 sin conectar (lectura del texto de `index.php`/`acceso.php`); `credenciales.php` rechaza rol `arquitecto`, hash corto o en mayúscula, fecha mal formada; `credenciales.php` y `acceso.php` no contienen `echo`/`error_log` del cuerpo ni del hash.
- `tests/modelo-sql.test.js`: `002_complemento.sql` existe, crea `complemento` con `proyecto` y `extra`, registra 2, sin `DROP` ni `ALTER`.
- `tests/modelo-cargar.test.js`: `complemento` válido pasa; (`archivo`,`clave`) repetidos → error; `credencial` sigue → error.
- `tests/lib/port-export.js` + fixture: filas de `complemento` para dos archivos (uno con lista entre dos claves, otro sin listas); el port arma el archivo en el orden de `orden`, conserva `{}` y da `parcial:false`; sin `complemento` da lo de hoy (`parcial:true`).
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: roles y permisos, `POST credenciales` (solo hashes; los tokens viven en LENOVO), esquema 2, exportación completa, UTC. `CLAUDE.md`: filas del mapa de los archivos nuevos.

## Pruebas derivadas (juez local; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-acceso`, `modelo-sql`, `modelo-cargar` y `modelo-lectura` · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: cubierto por esos tests · **Detener**
- b. Migración a 2: el Arquitecto deja `modelo-cargas\MIGRAR` → `log\modelo-migrar-*.json` con `schema_version:2` · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: commit desplegado · espera: `ok:true, schema_version:2` · **Detener**
- c. Credenciales: `modelo-cargas\CREDENCIALES` → la cola genera en LENOVO los tokens que falten (`claves\modelo-<rol>.txt`) y manda solo sus hashes → `log\modelo-credenciales-*.json` con los tres roles, sin tokens ni hashes en el log · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · precondición: b · espera: `roles` = tablero, desarrollo, diseno · **Detener**
- d. Roles: `modelo-cargas\ROLES` → con el token `tablero`: `GET estado` 200 y `POST cargar {}` 403 «Sin permiso»; con un token inventado: `GET estado` 403 «Token requerido» → `log\modelo-roles-*.json` (solo códigos) · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · precondición: c · espera: 200, 403, 403 · **Detener**
- e. Ida y vuelta completa: el Arquitecto carga el paquete v3 (con `complemento`) y pide `EXPORTAR`; cada archivo de `log\espejo\` es igual, **incluido el orden de las claves**, al del commit cargado; `validar.py` sobre ellos → 0 errores; `parcial:false` · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · precondición: b · espera: todo igual, 0 errores · **Detener**
- f. Sin token: `POST /modelo/api/credenciales` con `{}` → 403 «Token requerido»; `GET /modelo/api/credencial` → 404; `/modelo/api/salud` con `schema_version` ≥ 1 y `db:true`; `/api/health` del STR 200 · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: como dice · **Detener**
- g. `git show --name-only`: solo archivos del Alcance; ningún secreto, token ni hash · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno (los datos son del modelo, no del negocio).

### Guion N2 → `tests/e2e/REQ-MOD-6-credenciales.spec.js`
```js
// L-n (LM-27, B7-5): credenciales sin token se rechaza, credencial no existe y el servicio sigue sano. Solo lectura salvo el sondeo sin token.
module.exports = {
  req: 'REQ-MOD-6',
  zona: 'modelo',
  casos: [
    {
      c: 'f', perfil: 'admin', pagina: '/str-app-shell.html',
      que: 'POST credenciales sin token → 403; credencial → 404; salud y health sanos',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const out = {};
          const a = await fetch('/modelo/api/credenciales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
          let ja = null; try { ja = await a.json(); } catch (e) { }
          out.cred = { s: a.status, e: ja && ja.error };
          out.credencial = (await fetch('/modelo/api/credencial')).status;
          out.salud = await (await fetch('/modelo/api/salud')).json();
          out.health = (await fetch('/api/health')).status;
          return out;
        });
        h.espera(r.cred.s === 403 && r.cred.e === 'Token requerido', 'credenciales ' + JSON.stringify(r.cred));
        h.espera(r.credencial === 404, 'credencial ' + r.credencial);
        h.espera(r.salud && r.salud.db === true && r.salud.schema_version >= 1, 'salud ' + JSON.stringify(r.salud));
        h.espera(r.health === 200, '/api/health ' + r.health);
      },
    },
  ],
};
```
La guardia de `pw` debe dejar pasar sin token el sondeo `POST /modelo/api/credenciales` con cuerpo `{}` (como el de `cargar`); lo ajusta el Arquitecto en `herramientas/pw` antes de encolar.

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
