# instr — REQ-MOD-6 / B7-2: servicio del modelo, base de datos propia y esquema inicial
Categoría: **crítico** (credenciales de una base nueva; lote del modelo LM-16, lo redacta el Arquitecto; ADR-006 aceptado por Carlos 12-oct-2026 12:45 · cruce previo con Carlos: 12-oct-2026 23:12, chat del Arquitecto («ok» al alcance, riesgo y reversión) · `modelo/secrets.php` puesto por Carlos: <fecha hora>)
Alcance: `modelo/api/config/database.php` · `modelo/api/config/secrets.example.php` · `modelo/api/config/.htaccess` · `modelo/sql/001_inicial.sql` · `modelo/sql/.htaccess` · `modelo/api/index.php` (solo: `salud` añade `db` y `schema_version` reales; ruta nueva `GET migrar` solo con cabecera `X-Modelo-Token` igual a la constante `MODELO_TOKEN_ARQ` de secrets) · `tests/modelo-sql.test.js` · `docs/claude/tests-y-despliegue.md` · `CLAUDE.md` · **sin cambio de `?v=`** · `schema_version` del STR igual · base nueva `modelo` (no se toca la base del STR)
Impacto: el servicio pasa de eco a base real: tablas del modelo creadas por migración, vacías. Nada del STR cambia; `app/` y `api/` no se tocan.
Riesgo: medio (R-1 datos: ninguno real todavía; R-2 acceso: credenciales). Mitigación: secretos fuera del repo; la migración solo corre con el token del Arquitecto; vuelta atrás = `git revert` + `DROP DATABASE` por Carlos en hPanel.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-16, ADR-006 y cruce de Carlos; solo toca archivos de `str-manager/modelo/`)
Reversión: `git revert <hash>`; la base queda vacía y Carlos la borra en hPanel si hace falta
Origen: ADR-006 §4 y §6 lote B7-2. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-6. Decisión: LM-11 (ADR) + LM-16 en `interno/lotes-modelo/LM-16.md` + cruce de Carlos.
Depende de: LM-13 (B7-1) **aceptado** · Carlos creó la base y el usuario en hPanel y dejó `modelo/secrets.php` en el servidor (fuera del repo) con `MODELO_DB_HOST`, `MODELO_DB_NAME`, `MODELO_DB_USER`, `MODELO_DB_PASS`, `MODELO_TOKEN_ARQ`.
Precondiciones para verificar: `GET /modelo/api/salud` devuelve `db:true` tras la migración; el verificador no necesita perfiles.
¿Quién más depende de lo que cambia?: nadie en el STR. `api/config/database.php` del STR es la referencia de estilo (PDO, `tryConnect`, migración perezosa): se copia el patrón, no el archivo.

## 1. Configuración (`modelo/api/config/`)
- `secrets.example.php`: las cinco constantes con valores de ejemplo (`'…'`), comentario «copiar a `modelo/secrets.php` en el servidor; nunca al repo». `modelo/secrets.php` está en `.gitignore` (añade la línea si no está; `.gitignore` entra al Alcance por esa línea).
- `database.php`: clase `ModeloDb` con `tryConnect()` (PDO MySQL, `utf8mb4`, excepciones → `null`), `connect()` y `migrar()`; lee `../../secrets.php` si existe (`__DIR__ . '/../../secrets.php'`), si no, `db:false` sin fatal. `.htaccess` con `Deny from all` (como `api/config/`).

## 2. Esquema (`modelo/sql/001_inicial.sql`)
Tablas (todas `InnoDB`, `utf8mb4`, con `proyecto VARCHAR(16) NOT NULL DEFAULT 'str'`, `creado_en DATETIME(3)`, `actualizado_en DATETIME(3)`, `actualizado_por VARCHAR(32)`, `extra JSON NULL` (campos del JSON de hoy que no tienen columna; la carga de B7-3 y la exportación de B7-4 los conservan, LM-20); ids como texto, clave primaria `(proyecto, id)`):
`requisito` (id, titulo, estado, modulo, categoria, documento, entregado_en, antes, detalle, nota, plan_trabajo) · `decision` (id, titulo, estado, decidida_en, texto, reqs JSON) · `pedido` (id, texto, origen, estado, reqs JSON) · `plan_trabajo` (id, nombre, objetivo, carril, estado) · `lote` (id, req, categoria, estado, resumen, orden, desde, nota, superado_por) · `cambio` (id, tipo, lote, req, categoria, estado, resumen, motivo, aprobacion, hash, version, costo JSON) · `veredicto` (id, lote, pasada, resultado, hora, archivo, criterios JSON, incs JSON, notas) · `incidente` (id, titulo, modulo, severidad, estado, causa, origen, cierre) · `deuda` (id, titulo, estado, origen) · `riesgo` (id, nombre, escenario, tolerancia, respuesta, estado) · `mensaje` (id, fecha, hora, de, para, estado, asunto, texto, respuesta JSON) · `evento` (n AUTO_INCREMENT, entidad, id, de_estado, a_estado, rol, en DATETIME(3); solo INSERT) · `leccion` (id, texto, destino, estado) · `situacion` (id, rol, grupo, que_paso, en) · `credencial` (rol PRIMARY KEY con proyecto, hash CHAR(64), vence DATE, proyectos JSON) · `schema_version` (version INT).
Estados: los mismos textos de `str-manager-docs/herramientas/modelo/esquema.json` (no se validan aún en la base; eso es B7-5). Sin claves foráneas duras (los ids históricos no siempre existen); índices por `estado` y por `req`/`lote`.

## 3. Rutas en `modelo/api/index.php`
- `salud`: añade `db` (`tryConnect() !== null`) y `schema_version` (MAX de la tabla, `null` si no existe), manteniendo lo demás.
- `migrar` (GET): exige cabecera `X-Modelo-Token` igual a `MODELO_TOKEN_ARQ` (comparación `hash_equals`); sin ella → 403. Aplica `001_inicial.sql` si `schema_version` < 1 (ejecuta sentencia a sentencia; registra 1); responde `{"ok":true,"schema_version":1,"aplicadas":n}`. Nunca borra tablas.
- `eco` queda igual. Ninguna ruta devuelve valores de secretos.

## 4. Tests y mapa
- `tests/modelo-sql.test.js`: lee `modelo/sql/001_inicial.sql` y comprueba que cada tabla de la lista del punto 2 tiene su `CREATE TABLE`, que ninguna sentencia es `DROP`, que todas llevan `proyecto` y `extra` (salvo `schema_version`) y que `schema_version` existe. Patrón de los demás tests.
- `docs/claude/tests-y-despliegue.md` › sección «Servicio del modelo»: cómo se migra (ruta `migrar` con el token del Arquitecto), dónde viven los secretos, que la base del STR no se toca. `CLAUDE.md`: fila del mapa si cambia.

## Pruebas derivadas (verificador crítico; sin perfiles)
```
- a. `node tests/run.js` en verde con `modelo-sql.test.js` · perfil: tests/ · **Detener**
- b. GET https://app.apartamentosbucaramanga.com/modelo/api/salud antes de migrar · espera: 200, `db:true` (secrets presentes), `schema_version:null` · **Seguir**
- c. GET …/modelo/api/migrar sin cabecera · espera: 403 · **Detener**
- d. GET …/modelo/api/migrar con `X-Modelo-Token` (el Arquitecto la ejecuta desde su chat y anota la hora; el verificador no conoce el token) · espera: `ok:true, schema_version:1` · perfil: Arquitecto · **Detener**
- e. GET …/modelo/api/salud después · espera: `schema_version:1` · **Detener**
- f. `git show --name-only`: solo archivos del Alcance; `modelo/secrets.php` no está en el commit · **Detener**
- g. GET https://app.apartamentosbucaramanga.com/api/health · espera: igual que antes · **Detener**
```

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
