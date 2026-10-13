# instr — REQ-MOD-6 / B7-5b: acceso por rol y `POST credenciales`
Categoría: **crítico** (credenciales; lote del modelo LM-27b, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · revisión previa del Chat Desarrollo: 13-oct 17:00 (M-289), corregida aquí · cruce con Carlos: PENDIENTE · ok de Diseño: PENDIENTE). Partido de LM-27: esquema y exportación van en LM-27a.
Alcance: `modelo/api/config/acceso.php` (nuevo) · `modelo/api/config/credenciales.php` (nuevo) · `modelo/api/index.php` (solo: acceso por rol en las rutas con token; ruta nueva `POST credenciales`) · `tests/lib/port-acceso.js` (nuevo) · `tests/modelo-acceso.test.js` (nuevo) · `tests/e2e/REQ-MOD-6-credenciales.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · `CLAUDE.md` · **sin cambio de `?v=`** · `schema_version` igual (la tabla `credencial` existe desde 001) · la base del STR no se toca
Impacto: el servicio deja de depender de un solo token. `tablero`, `desarrollo` y `diseno` tienen token propio, guardado como SHA-256 con vencimiento, **solo para leer**. El del Arquitecto sigue en `secrets.php`.
Riesgo: medio (R-2 acceso: credenciales). Mitigación: en la base solo hay hashes; los tokens nacen y viven en LENOVO (`claves\`), nunca en el repo, el chat ni los logs; ningún rol nuevo escribe; `cargar`, `migrar` y `credenciales` siguen siendo solo del Arquitecto; `credencial` nunca se lee por la API; un token desconocido recibe el mismo 403 que la falta de token.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-27b; solo `str-manager/modelo/` y `tests/`)
Reversión: `git revert <hash>`; las filas de `credencial` dejan de usarse (o se anulan con `vence` de ayer).
Origen: ADR-006 §6 fila 5; `interno/lotes-modelo/LM-27.md`. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-27.
Depende de: LM-27a aceptado (mismo `index.php`). **Antes de encolar**: la guardia de `pw` publicada en LENOVO deja pasar sin token el sondeo `POST /modelo/api/credenciales` con cuerpo `{}` (si no, el caso f falla como incidente falso). Para b–c: cola v7.9 (`CREDENCIALES`, `ROLES`) y `pw\modelo-llamar.js` con esas acciones (Arquitecto).
Precondiciones para verificar: `/modelo/api/salud` con `db:true`; el verificador no conoce ningún token.
¿Quién más depende de lo que cambia?: B8 (el proxy de `str-api` leerá con el token `tablero`), el espejo de la cola. Dentro del modelo: `tests/modelo-router.test.js` (los `require` en una línea `if`) y los guiones `REQ-MOD-6*.spec.js` como regresión de la zona `modelo` (siguen pasando si se respeta el orden del §3).

## 1. `acceso.php` (nuevo)
- `exigir(callable $conectar, array $permitidos)`:
  1. Sin cabecera `X-Modelo-Token` (o vacía) → 403 `{"error":"Token requerido"}` **sin llamar a `$conectar`**.
  2. Igual a `MODELO_TOKEN_ARQ` (`hash_equals`) → rol `arquitecto`, sin base.
  3. Si no: `$db = $conectar()`; si es `null` → el mismo 503 de base caída que ya usa `index.php`. Lee las filas vigentes de `credencial` (`proyecto='str'` y (`vence` IS NULL o `vence` ≥ `CURDATE()`); como mucho 3) y compara `hash('sha256', $token)` con cada `hash` usando `hash_equals` (nunca `WHERE hash = ?`). Sin coincidencia → 403 `{"error":"Token requerido"}` (mismo cuerpo: no revela si el token existe).
  4. Rol válido fuera de `$permitidos` → 403 `{"error":"Sin permiso"}`.
  Devuelve `[$rol, $db]` (`$db` puede ser `null` si fue el Arquitecto; quien lo necesite conecta después, como hoy).
- Permisos (constante en el código, sin tabla): `arquitecto` → todo; `tablero`, `desarrollo`, `diseno` → solo `GET <tabla>`, `GET estado`, `GET export`.
- `vence` se compara con `CURDATE()` en UTC (DT-36): un token vence a las 19:00 hora de Colombia del día `vence`. Aceptado; se anota en la guía.

## 2. `credenciales.php` (nuevo) y ruta `POST credenciales`
- Solo `arquitecto`; `exigir()` va **antes** de leer el cuerpo. Cuerpo `{"credenciales":[{"rol","hash","vence"}]}`: `rol` ∈ `tablero`, `desarrollo`, `diseno` (nunca `arquitecto`); `hash` = 64 caracteres hexadecimales en minúscula; `vence` = `AAAA-MM-DD` o `null`. Cualquier error → 422 `{"error":"credenciales inválidas","detalle":[…]}` sin tocar nada.
- En una transacción: por cada rol enviado, `DELETE … WHERE proyecto='str' AND rol=?` e `INSERT`. Lista vacía → no cambia nada (para anular un rol se manda con `vence` de ayer).
- Respuesta `{"ok":true,"roles":["tablero",…],"vence":{"tablero":"AAAA-MM-DD",…}}`. **Nunca** devuelve hashes; nunca escribe el cuerpo ni el hash en un log.

## 3. `index.php`
- Orden (el de L-88, sin cambios): nombre fuera de la lista blanca (incluida `credencial`) → 404 antes de `exigir()`; otro método → 405; después `exigir()`; después, si hace falta, leer el cuerpo.
- `GET <tabla>`, `GET estado`, `GET export` → `exigir($conectar, ['arquitecto','tablero','desarrollo','diseno'])`.
- `POST cargar`, `GET migrar`, `POST credenciales` → `exigir($conectar, ['arquitecto'])`.
- `salud` y `eco` sin cambios (sin token).

## 4. Tests y mapa
- `tests/lib/port-acceso.js` (nuevo): port en JS de `exigir` sobre credenciales en memoria y un `conectar` espía.
- `tests/modelo-acceso.test.js`: sin cabecera → 403 y `conectar` no se llama; token del Arquitecto → `arquitecto` y `conectar` no se llama; hash de `tablero` vigente → `tablero`; vencido → 403 «Token requerido»; desconocido → 403 «Token requerido»; `tablero` en `cargar` → 403 «Sin permiso»; `conectar` devuelve `null` → 503. Por lectura del texto: `acceso.php` usa `hash_equals` y no `WHERE hash`; `credenciales.php` rechaza rol `arquitecto`, hash corto o en mayúscula, fecha mal formada; ni `acceso.php` ni `credenciales.php` contienen `error_log`, `echo` del cuerpo ni del hash; en `index.php`, `POST cargar` y `POST credenciales` llaman a `exigir` antes de leer `php://input`.
- `docs/claude/tests-y-despliegue.md` › «Servicio del modelo»: roles y permisos, `POST credenciales` (solo hashes; los tokens viven en LENOVO), vencimiento en UTC. `CLAUDE.md`: filas del mapa de los archivos nuevos.

## Pruebas derivadas (juez local; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `modelo-acceso` y la regresión del modelo · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: cubierto por esos tests · **Detener**
- b. Credenciales: el Arquitecto deja `modelo-cargas\CREDENCIALES` → la cola genera en LENOVO los tokens que falten (`claves\modelo-<rol>.txt`) y manda solo sus hashes → `log\modelo-credenciales-*.json` con los tres roles, sin tokens ni hashes · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: commit desplegado · espera: `roles` = tablero, desarrollo, diseno · **Detener**
- c. Roles: `modelo-cargas\ROLES` → con el token `tablero`: `GET estado` 200 y `POST cargar {}` 403 «Sin permiso»; con un token inventado: `GET estado` 403 «Token requerido» → `log\modelo-roles-*.json` (solo códigos) · nivel: N2 fuera del guion (Arquitecto) · perfil: Arquitecto · página: — · precondición: b · espera: 200, 403, 403 · **Detener**
- f. Sin token: `POST /modelo/api/credenciales` con `{}` → 403 «Token requerido»; `GET /modelo/api/credencial` → 404; `/modelo/api/salud` con `db:true` y `schema_version` ≥ 1; `/api/health` del STR 200 · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: guardia de `pw` publicada · espera: como dice · **Detener**
- g. `git show --name-only`: solo archivos del Alcance; ningún secreto, token ni hash · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno.

### Guion N2 → `tests/e2e/REQ-MOD-6-credenciales.spec.js`
```js
// L-n (LM-27b, B7-5b): credenciales sin token se rechaza, credencial no existe y el servicio sigue sano. Solo lectura salvo el sondeo sin token.
// fetch va dentro de page.evaluate a propósito: así pasa por la guardia de pw (que deja pasar este sondeo con {}).
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

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
