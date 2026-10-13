# instr — R-3: conexión del STR configurable desde secrets.php (DB_HOST, DB_NAME, DB_USER)
Categoría: **crítico** (toca la conexión a la base del STR; lote del modelo LM-23, lo redacta el Arquitecto · cruce previo con Carlos: <fecha hora>, chat del Arquitecto)
Alcance: `api/config/database.php` (solo las tres propiedades y el constructor) · `api/config/secrets.example.php` · `api/health/index.php` (solo: campo `dbConfig`) · `tests/db-config.test.js` (nuevo) · `tests/e2e/R-3-db-config.spec.js` (nuevo, copia literal del Guion N2) · `docs/claude/tests-y-despliegue.md` · **sin cambio de `?v=`** · `schema_version` del STR igual · el servicio del modelo (`modelo/`) no se toca
Impacto: el STR puede conectar a una base con otro nombre o usuario poniéndolos en `secrets.php`, sin tocar código. Hoy, sin esas constantes, todo sigue igual.
Riesgo: medio (R-1 datos del negocio: la conexión). Mitigación: si faltan las constantes se usan exactamente los valores de hoy; ninguna consulta cambia; `/api/health` nunca devuelve valores, solo de dónde salen.
¿Datos personales o dinero?: no (no lee ni escribe datos) · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-23 por R-3)
Reversión: `git revert <hash>`.
Origen: R-3 · `claude/marco/migracion-hostinger-2026-10.md` §2 · `interno/lotes-modelo/LM-23.md`. Decisión: LM-23 + cruce de Carlos.
Depende de: nada (puede ir antes o después de L-87).
Precondiciones para verificar: `/api/health` responde 200 con `db:true` antes del lote.
¿Quién más depende de lo que cambia?: todo `api/` usa `Database` (connect y tryConnect); `api/health` lo usa la cola (`pw`, puerta de entrada) y los guiones de regresión; `tests/e2e/REQ-MOD-6*.spec.js` miran `/api/health` 200. Buscar con grep quién más instancia `Database` o lee `db_name`.

## 1. `api/config/database.php`
- Las propiedades `$host`, `$db_name`, `$username` se asignan en el constructor: `defined('DB_HOST') ? DB_HOST : 'localhost'`, `defined('DB_NAME') ? DB_NAME : '<valor de hoy>'`, `defined('DB_USER') ? DB_USER : '<valor de hoy>'` (copia literal de los valores actuales del archivo; no los cambies).
- Método estático `Database::origenConfig()`: `'secrets'` si `DB_NAME` y `DB_USER` están definidas; si no, `'codigo'`.
- `open`, `connect`, `tryConnect` y la migración, sin cambios.

## 2. `api/config/secrets.example.php`
Añade, con comentario de una línea («nombre y usuario de la base del STR; si faltan, database.php usa los de la cuenta actual»): `define('DB_HOST', 'localhost');`, `define('DB_NAME', 'CAMBIAR_NOMBRE_BASE');`, `define('DB_USER', 'CAMBIAR_USUARIO_BASE');`.

## 3. `api/health/index.php`
Añade `'dbConfig' => Database::origenConfig()` a la respuesta (nunca los valores).

## 4. Tests y mapa
- `tests/db-config.test.js` (lectura del texto, con `leerTexto`): el constructor usa `defined('DB_HOST')`, `defined('DB_NAME')`, `defined('DB_USER')` con respaldo; existe `origenConfig`; `health` incluye `dbConfig` y no imprime `DB_NAME`, `DB_USER` ni `DB_PASS`; `secrets.example.php` tiene las tres constantes con `CAMBIAR_`; `open()` sigue usando `$this->host`, `$this->db_name`, `$this->username`.
- `docs/claude/tests-y-despliegue.md` › secretos del servidor: las tres constantes nuevas y para qué (migración de hosting).

## Pruebas derivadas (verificador crítico; niveles PRUEBAS-v1)
- a. `node tests/run.js` en verde con `db-config.test.js` · nivel: N1 · perfil: tests/ · página: — · precondición: ninguna · espera: verde · **Detener**
- b. `/api/health` → 200, `db:true`, `schema_version` igual al de antes del lote, `dbConfig` igual a `"codigo"` o `"secrets"` · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · espera: como dice · **Detener**
- c. `git show --name-only`: solo archivos del Alcance; ningún secreto ni valor nuevo de base · nivel: N1 (cierre de la CLI; lo cierra el Chat Desarrollo) · perfil: tests/ · página: — · precondición: ninguna · espera: declarados = tocados · **Detener**
- Datos de prueba: ninguno.

### Guion N2 → `tests/e2e/R-3-db-config.spec.js`
```js
// L-n (LM-23, R-3): la conexión del STR sigue sana y health dice de dónde sale su configuración. Solo lectura.
module.exports = {
  req: 'R-3',
  zona: 'api',
  casos: [
    {
      c: 'b', perfil: 'admin', pagina: '/str-app-shell.html',
      que: '/api/health 200 con db, schema_version y dbConfig',
      async prueba(h) {
        const r = await h.page.evaluate(async () => {
          const x = await fetch('/api/health');
          let j = null; try { j = await x.json(); } catch (e) { }
          return { s: x.status, j };
        });
        h.espera(r.s === 200, 'status ' + r.s);
        h.espera(r.j && r.j.db === true, 'db ' + (r.j && r.j.db));
        h.espera(r.j && Number.isInteger(r.j.schema_version), 'schema_version ' + (r.j && r.j.schema_version));
        h.espera(r.j && ['codigo', 'secrets'].includes(r.j.dbConfig), 'dbConfig ' + (r.j && r.j.dbConfig));
      },
    },
  ],
};
```

## Cierre (en español; no abras `log\…txt`)
Hecho / No hecho por apartado · declarados vs tocados · sin `?v=` · hash · tests n/n · «mapa actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no».
