# instr — REQ-MOD-6 / B7-1: servicio del modelo, prueba técnica (`modelo/api` con `salud` y `eco`)
Categoría: **normal** (carpeta nueva sin datos, sin base, sin credenciales; nada del STR cambia; lote del modelo LM-13, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45)
Alcance: `modelo/api/.htaccess` · `modelo/api/index.php` · `tests/modelo-router.test.js` · `docs/claude/tests-y-despliegue.md` (sección nueva «Servicio del modelo») · `CLAUDE.md` (una fila en el mapa de áreas) · **sin cambio de `?v=`** · `schema_version` igual · sin cambios de base de datos ni de datos
Impacto: aparece `https://app.apartamentosbucaramanga.com/modelo/api/salud` (GET) y `/modelo/api/eco` (POST). Sirve para medir qué agente puede hablar con el servicio por HTTPS (B7-1 del ADR-006). Ningún usuario del STR lo ve.
Riesgo: bajo (R-3 hosting). `eco` no guarda nada, acepta ≤ 4 KB y devuelve solo tamaño y hora. Mitigación: carpeta aislada; `git revert` la quita entera.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-13, ADR-006 aceptado y cruce de Carlos 12-oct 12:45; solo toca archivos de `str-manager`)
Reversión: `git revert <hash>` (desaparece `modelo/` del despliegue)
Origen: ADR-006 §6 lote B7-1 (`str-manager-docs/decisiones/ADR-006-servicio-del-modelo.md`). Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR aceptado) + LM-13 en `interno/lotes-modelo/LM-13.md`.
Depende de: ninguno (no toca `api/` ni los HTML).
Precondiciones para verificar: ninguna en el navegador con perfiles; dos peticiones HTTPS y los tests.
¿Quién más depende de lo que cambia?: nadie en el STR. El `.htaccess` de la raíz sirve archivos y carpetas reales tal cual («RewriteCond -f/-d → L»), así que `modelo/api/` se alcanza sin tocar la raíz; comprueba que la regla `^api(/.*)?$ → api/index.php` **no** captura `modelo/api` (empieza por `modelo`). El deploy sube la carpeta con el push como todo lo demás.

## 1. `modelo/api/.htaccess`
Copia el patrón de `api/.htaccess`: `DirectorySlash Off`, `RewriteEngine On`, bloquea `^config/`, `^sql/` y `^cache/` con `[F,L]`, y enruta todo a `index.php` salvo `index.php` mismo (`RewriteCond %{REQUEST_URI} !/modelo/api/index\.php$` + `RewriteRule ^ index.php [QSA,L]`).

## 2. `modelo/api/index.php` (sin `require` de `api/`: el servicio es independiente del STR)
- Cabeceras: `Content-Type: application/json; charset=utf-8`; CORS igual que `api/config/cors.php` en lo esencial (origen `https://app.apartamentosbucaramanga.com`, métodos GET, POST, OPTIONS; cabeceras `Content-Type, X-Modelo-Token`; `OPTIONS` responde 204 y termina). No incluyas ese archivo: copia las líneas que apliquen.
- Manejo de fatales como `api/index.php` (`ob_start`, `set_exception_handler`, `register_shutdown_function` → JSON 500 con tipo, archivo y línea; sin mensaje). Log en `modelo/api/logs/error.log` con la misma rotación de 1 MB; crea la carpeta si no existe (y `modelo/api/logs/.htaccess` con `Deny from all` si en `api/logs/` existe uno igual; si no, bloquea `^logs/` en el `.htaccess` del punto 1).
- Router: toma la ruta tras `/modelo/api/`; recurso = primer segmento.
  - `salud` (GET): `{"ok":true,"servicio":"modelo","version":"0.1","proyecto":"str","server_time":<ms epoch>,"db":false,"php":PHP_VERSION}`. Otro método → 405 `{"error":"Método no permitido"}`.
  - `eco` (POST): lee el cuerpo; si pasa de 4096 bytes → 413 `{"error":"Cuerpo mayor de 4 KB"}`; si no, `{"ok":true,"recibidoBytes":<n>,"contentType":<cabecera o "">,"tieneToken":<bool: llegó X-Modelo-Token no vacío>,"server_time":<ms>}`. **No** guarda ni registra el cuerpo ni el token (el log solo recibe fatales). GET → 405.
  - cualquier otro → 404 `{"error":"Endpoint no encontrado","uri":"<ruta>"}`.
- `server_time` en milisegundos (lección DT-20).

## 3. `tests/modelo-router.test.js`
Réplica JS de la función que separa la ruta (`/modelo/api/salud` → `salud`; `/modelo/api/eco/` → `eco`; `/modelo/api/` → `''`; con prefijo `/app/modelo/api/x` → `x`) y de la regla del tamaño (4096 pasa, 4097 no). Patrón de los demás tests (Node puro, `assert`, sin dependencias). `node tests/run.js` en verde.

## 4. Mapa
`docs/claude/tests-y-despliegue.md`: sección «Servicio del modelo (`modelo/api`)»: qué es (ADR-006 en `str-manager-docs/decisiones/`), que es independiente de `api/`, las dos rutas, que no hay base todavía, y la regla «un lote toca `app`/`api` o `modelo/`, nunca los dos». `CLAUDE.md`: una fila en el mapa de áreas apuntando a esa sección.

## Pruebas derivadas (verificador estándar; sin perfiles; perfil: `tests/` y HTTPS desde el propio verificador)
```
- a. `node tests/run.js` en verde con `modelo-router.test.js` incluido · perfil: tests/ · página: no aplica · precondición: commit del lote · espera: «n/n archivos OK» con el nuevo · **Detener**
- b. GET https://app.apartamentosbucaramanga.com/modelo/api/salud · perfil: petición directa desde el verificador (sin sesión) · precondición: despliegue hecho · espera: 200 JSON con ok:true, servicio "modelo", server_time numérico de 13 cifras · **Detener**
- c. POST https://app.apartamentosbucaramanga.com/modelo/api/eco con cuerpo {"prueba":1} y cabecera X-Modelo-Token: prueba · perfil: igual que b · espera: 200 JSON con ok:true, recibidoBytes 11, tieneToken true · **Detener**
- d. GET https://app.apartamentosbucaramanga.com/modelo/api/eco · espera: 405 · **Seguir**
- e. GET https://app.apartamentosbucaramanga.com/api/health · espera: igual que antes del lote (el router del STR no cambió) · **Detener**
- f. El commit toca solo los archivos del Alcance (git show --name-only) · perfil: tests/ · **Detener**
```
Anota en notas del veredicto el resultado de b y c **desde la tarea** (es el primer dato de la prueba técnica: ¿la tarea puede hacer POST?).

## Cierre (en español; no abras `log\NN-*.txt`)
Hecho / No hecho por apartado · archivos declarados vs tocados · sin `?v=` · hash del commit · tests n/n · «mapa del área / CLAUDE.md actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea del hook).
