# instr — L-170 · LM-79 fase 4.4: el STR deja `modelo/` (sus tests y ports van a `thcure/fabrica-servicio`) y la 308 de `fabrica.` pasa al `.htaccess` de la raíz
Categoría: **crítico** (despliegue: el servicio del modelo sale del STR; borra código y la redirección de `fabrica.` cambia de sitio; DA: LM-79 · cruce previo con Carlos: delegado en el Arquitecto, 28-oct 23:56 (M-1150))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-28 23:54 · ok Jefe de proyecto M-1151
Alcance: en str-manager, `.htaccess` (raíz) · `CLAUDE.md` · `docs/claude/modelo.md` · `docs/claude/tests-y-despliegue.md` · `tests/docs-partidos.test.js` · `tests/sitios-redireccion.test.js` (nuevo) · `tests/e2e/LM-79.spec.js` · borra `modelo/` entera, `tests/modelo-acceso.test.js`, `tests/modelo-cargar.test.js`, `tests/modelo-lectura.test.js`, `tests/modelo-router.test.js`, `tests/modelo-sql.test.js`, `tests/lib/port-acceso.js`, `tests/lib/port-carga.js`, `tests/lib/port-export.js`, `tests/fixtures/modelo/filas-export.json` · en la carpeta hermana C:\Users\ktcol\fabrica-servicio-l170 (clon de fabrica-servicio, **no** es str-manager): esos cinco tests, tres ports y `tests/fixtures/modelo/filas-export.json`, `tests/run.js`, `tests/lib/leer-texto.js` y el `.htaccess` de su raíz · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques nada más de str-manager
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Impacto: el STR deja de traer el servicio del modelo, que ya vive y se publica desde `thcure/fabrica-servicio` (4.2 y 4.3); sus tests van con él. `fabrica./modelo/*` sigue redirigiendo 308 a `herramienta-fabrica.` (ahora desde la raíz); `app./modelo/*`, que respondía 503 sin base, pasa a 404 si Hostinger borra los archivos que salieron del repo (si no, ver Riesgo; nadie lo usa: pw lo desvía). Nada cambia para el usuario del STR.
Reglas transversales que toca: RT-18 (secretos solo en el servidor: no se copia ni se crea ningún `secrets.php`; `.gitignore` del STR conserva la línea)
Mapa: módulos y relaciones que cambia: MOD (sale del STR: su código y sus tests viven en fabrica-servicio); ninguna relación
Casos de uso: CU-MOD-1.1
Riesgo: medio (R-1 del lote; MOD tiene riesgo 1, no hace falta R-n). Puede salir mal: que `fabrica.` deje de redirigir (R1 la pone en la raíz antes de servir archivos, y el guion la comprueba con salud y con `config/`); que los tests del servicio se pierdan (A los sube a fabrica-servicio y los corren allí antes de borrar nada aquí); que el repo nuevo sirva `tests/` (su `.htaccess` lo niega y el guion lo comprueba). Conexiones a MySQL: 0 nuevas. Si A falla, no se borra nada en str-manager. Despliegue de str-manager en `app.` y `fabrica.`: si Git de Hostinger no borra lo que salió del repo, `modelo/api/*` viejo sigue sirviendo en `app.` (y con `secrets.php`, con base), y en `fabrica.` `config/` y `logs/` dan 403 en vez de 308; eso no se arregla con `git revert`: Carlos borra a mano `public_html/modelo/api` y `public_html/modelo/sql`. `public_html/modelo/secrets.php` de los dos sitios queda huérfano con credenciales vivas: Carlos lo borra después de b en verde (es un secreto: vuelve a Carlos, M-1144). El despliegue de A3 en `herramienta-fabrica.` puede tardar: hasta que llegue, `/tests/run.js` da 404 y b falla.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce de Carlos)
Reversión: str-manager: `git revert <hash>` (vuelven `modelo/`, sus tests y la 308 en `modelo/api/.htaccess`). fabrica-servicio: `git revert` del commit de § 3 (solo añade tests y cambia una línea del `.htaccess`).
Origen: M-1149 (Arquitecto: 4.3 en verde y arranque de 4.4), M-1141 y M-1142 (diseño de la fase 4). Requerimiento: `interno/lotes-modelo/LM-79.md` y `claude/marco/plan-sitios-2026-10.md` (fase 4, D3). Decisión: ADR-009 (v5, § 4c, aceptada; el servicio sale del STR; borra `modelo/api/config/database.php` y `credenciales.php` del STR con el resto de la carpeta, sin tocar secretos ni la base)
Depende de: L-169 aceptado (056f521; juez parcial 23:51, a y b cerrados por el Arquitecto en la respuesta de M-1149, 23:37) y 4.3 en verde (herramienta-fabrica. publica fabrica-servicio 0566083) · Precondiciones para verificar: perfil zz-verif-admin con sesión; el commit de § 3 desplegado en herramienta-fabrica. (automático)
¿Quién más depende de lo que cambia?: pw (desvía `app./modelo/*` al host nuevo; no cambia), guiones `REQ-MOD-6*` (se quedan y corren contra `herramienta-fabrica.`), el mapa del Arquitecto (`interno/mapa-modulos.json` ancla `modelo/` a MOD: lo ajusta él en la fase 6), cambios futuros del servicio (van a fabrica-servicio; la cola de un repo por lote es tarea de la fase 6, ADR-008); `herramientas/modelo/README.md` (dice que `secrets.php` está en `public_html` de `fabrica.`; lo ajusta el Arquitecto).

## 0. Contexto y reglas de este lote
- Dos partes, en este orden: **A** (§ 1–§ 3) en una carpeta hermana, clon de `thcure/fabrica-servicio`: le añades los tests y ports del servicio, los corres y los subes. **B** (§ 4–§ 6) en str-manager: borras `modelo/` y esos tests y ports, mueves la 308 de `fabrica.` al `.htaccess` de la raíz y dejas `modelo.md` como puntero. **Si A no termina en verde, no hagas B.**
- **La consola no guarda variables entre llamadas.** Cada bloque de A empieza con `H=/c/Users/ktcol/fabrica-servicio-l170` y su guardia: córrelo entero en una sola llamada. No hagas `cd` a la carpeta hermana: quédate en str-manager y usa `git -C "$H"` y rutas con `$H`.
- Nunca `push --force` ni reescribir historia, en ningún repo. No borres carpetas fuera de str-manager.
- Si el modo automático bloquea el `git rm` de B1: no lo rodees (ni `rm`, ni mover), deja str-manager sin cambios (`git restore --staged` y `git restore` de lo que hubiera) y di «No hecho: borrado bloqueado». Plan B: Carlos corre B1 a mano y el lote se repite desde B2.
- La cola marcará «LOTE GRANDE» (K3, aviso): son los ~1 300 líneas de código y ~900 de pruebas que **salen**; el lote no añade código más allá de 4 líneas del `.htaccess`.
- No abras `modelo/api/config/database.php` ni `credenciales.php`: se copian tests, no esos archivos, y en B se borran con `git rm` sin leerlos.

## A1. Clonar fabrica-servicio a la carpeta hermana
```bash
H=/c/Users/ktcol/fabrica-servicio-l170
test ! -e "$H" || { echo "ya existe $H: para"; exit 1; }
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || { echo "str-manager no está en main limpio: para"; exit 1; }
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || { echo "main local distinto de origin/main: para"; exit 1; }
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git clone --no-tags --single-branch --branch main https://github.com/thcure/fabrica-servicio.git "$H"
test "$(git -C "$H" rev-parse HEAD)" = 056608379392a16d23d5db922f45b3fe18bafa62 || { echo "fabrica-servicio no está en 0566083: para"; exit 1; }
test "$(git -C "$H" rev-parse HEAD:modelo)" = "$(git rev-parse HEAD:modelo)" || { echo "modelo/ distinto en los dos repos: para"; exit 1; }
```

## A2. Tests y ports al repo nuevo, y su `.htaccess` niega también `tests/`
`modelo-router.test.js` va sin las dos comprobaciones del `.htaccess` del STR (el repo nuevo no lo tiene); el resto, byte a byte. El `.htaccess` de la raíz del repo nuevo se reescribe igual que en L-169 más `tests/`.
```bash
H=/c/Users/ktcol/fabrica-servicio-l170
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
mkdir -p "$H/tests/lib"
cp tests/run.js "$H/tests/run.js"
cp tests/lib/leer-texto.js tests/lib/port-acceso.js tests/lib/port-carga.js tests/lib/port-export.js "$H/tests/lib/"
mkdir -p "$H/tests/fixtures/modelo" && cp tests/fixtures/modelo/filas-export.json "$H/tests/fixtures/modelo/"
cp tests/modelo-acceso.test.js tests/modelo-cargar.test.js tests/modelo-lectura.test.js tests/modelo-router.test.js tests/modelo-sql.test.js "$H/tests/"
sed -i '/La regla de la raíz va anclada al inicio/,/no captura modelo\/api\/salud/d' "$H/tests/modelo-router.test.js"
grep -c 'raíz' "$H/tests/modelo-router.test.js"      # 0
printf '%s\n' '# fabrica-servicio (LM-79 fase 4.2 y 4.4): nada fuera de modelo/ se sirve; modelo/api/ tiene su propio RewriteEngine' 'RewriteEngine On' 'RewriteRule \.md$ - [F,L]' 'RewriteRule ^(docs/|tests/|\.git) - [F,L]' > "$H/.htaccess"
cat "$H/.htaccess"
node "$H/tests/run.js"                                  # 5/5 archivos OK
```
Para (§ 0) si `grep -c` no da 0 o si `run.js` no da 5/5.

## A3. Commit y push del repo nuevo
```bash
H=/c/Users/ktcol/fabrica-servicio-l170
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
git -C "$H" add tests .htaccess
git -C "$H" status --short
git -C "$H" commit -m "fabrica-servicio: tests y ports del servicio desde str-manager; el .htaccess de la raíz niega también tests/" -m "Lote: L-170 · LM-79 · Casos de uso: CU-MOD-1.1
Co-Authored-By: <como siempre>"
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push falla: **para** sin B y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre `git -C /c/Users/ktcol/fabrica-servicio-l170 push origin main` y el lote se repite solo desde B.

## B1. Borrar el servicio del STR
```bash
git rm -r -q modelo
git rm -q tests/modelo-acceso.test.js tests/modelo-cargar.test.js tests/modelo-lectura.test.js tests/modelo-router.test.js tests/modelo-sql.test.js tests/lib/port-acceso.js tests/lib/port-carga.js tests/lib/port-export.js tests/fixtures/modelo/filas-export.json
test ! -e modelo/api && test ! -e modelo/sql && echo "modelo/ fuera"
```
Si `modelo/secrets.php` existiera en tu copia local (no está en git), déjalo: no lo borres ni lo leas, y dilo.

## B2. `.htaccess` de la raíz: la 308 de `fabrica.`
**R1 · la 308 de fabrica., después de los bloqueos y antes de servir archivos reales** (`.htaccess`). Busca:
```md
RewriteRule ^api/uploads/ - [F,L]
```
Pon:
```md
RewriteRule ^api/uploads/ - [F,L]

# LM-79 fase 4.4 (L-170): el servicio del modelo vive en herramienta-fabrica. (repo fabrica-servicio); fabrica. redirige 308
# todo /modelo/* con ruta y consulta. Solo ese host: en app. /modelo/* ya no existe. Se quita en la fase 6.
RewriteCond %{HTTP_HOST} ^fabrica\.apartamentosbucaramanga\.com$ [NC]
RewriteRule ^modelo(/|$) https://herramienta-fabrica.apartamentosbucaramanga.com%{REQUEST_URI} [R=308,L]
```

## B3. Documentos
**P1 · `docs/claude/modelo.md`** (pasa a puntero). Contenido completo:
```md
# Mapa — Servicio del modelo (`modelo/api`)
Al día hasta L-170 · dueño: MOD

> **Desde L-170 (LM-79 fase 4.4) el servicio del modelo ya no está en este repo.** Su código, su historia, sus tests (`tests/modelo-*.test.js`, los ports `port-acceso`, `port-carga`, `port-export` y el fixture `tests/fixtures/modelo/filas-export.json`) y este mapa completo viven en `thcure/fabrica-servicio` (`docs/claude/modelo.md` de ese repo), que `herramienta-fabrica.apartamentosbucaramanga.com` publica en `/modelo/api/`. Los cambios al servicio se hacen allí, no aquí.

## Lo que queda en el STR
- **Redirección:** el `.htaccess` de la raíz manda con **308** `fabrica.apartamentosbucaramanga.com/modelo/*` a `https://herramienta-fabrica.…` con la misma ruta y consulta (`RewriteCond %{HTTP_HOST}` anclado, `[NC]`; regla `^modelo(/|$)`); se quita en la fase 6, cuando `fabrica.` se retira. En `app.` y en cualquier otro host, `/modelo/*` ya no existe (404). Lo vigila `tests/sitios-redireccion.test.js`.
- **Guiones:** `tests/e2e/REQ-MOD-6*.spec.js` se quedan aquí hasta D2: pw los corre en `app.` y desvía `app./modelo/*` a `herramienta-fabrica.`. `tests/e2e/LM-79.spec.js` comprueba la redirección y lo que `herramienta-fabrica.` sirve y niega.
- `.gitignore` conserva `modelo/secrets.php` por si alguien recrea la carpeta en local.
```

**C1 · índice, § 2: las tres filas de modelo/ pasan a una** (`CLAUDE.md`). Busca:
```md
| `modelo/` (servicio del modelo, `modelo/api`) | `modelo.md` |
| `modelo/api/config/acceso.php` · `modelo/api/config/credenciales.php` | `modelo.md` (roles, `POST credenciales`) |
| `modelo/sql/003_carga.sql` | `modelo.md` (rol `carga`, última carga, esquema 3) |
```
Pon:
```md
| Servicio del modelo (salió del STR en L-170: repo `thcure/fabrica-servicio`) · redirección 308 de `fabrica.` en el `.htaccess` de la raíz | `modelo.md` (puntero) |
```

**T1 · cabecera** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
Al día hasta L-165 · dueño: tests/
```
Pon:
```md
Al día hasta L-170 · dueño: tests/
```

**T2 · dónde quedó «Servicio del modelo»** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
> Partido en L-164 (CONOCIMIENTO-v1 Cn2): «Servicio del modelo» está en `modelo.md`, entera y literal (`tests/docs-partidos.test.js`).
```
Pon:
```md
> Partido en L-164 (CONOCIMIENTO-v1 Cn2): «Servicio del modelo» pasó a `modelo.md` y, desde L-170 (LM-79 fase 4.4), con el servicio, sus tests y sus ports, a `thcure/fabrica-servicio`; aquí queda `modelo.md` como puntero y `tests/sitios-redireccion.test.js` vigila la redirección de `fabrica.`.
```

**T3 · ports de PHP** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
; el de la carga del modelo (`validarPaquete` de `modelo/api/config/carga.php`) en `tests/lib/port-carga.js`; el de la exportación del modelo (`exportar` de `modelo/api/config/lectura.php`) en `tests/lib/port-export.js`; el del acceso por rol del modelo (`exigir` de `modelo/api/config/acceso.php`) en `tests/lib/port-acceso.js`.
```
Pon:
```md
 (los del servicio del modelo, `port-carga`, `port-export` y `port-acceso`, se fueron con él a `thcure/fabrica-servicio` en L-170).
```

## Tests en `tests/`
**T4 · archivo nuevo `tests/sitios-redireccion.test.js`** (N1 de B1 y B2: X1 falla en `HEAD`, donde `modelo/` existe; R1 también). Contenido completo:
```js
// L-170 (LM-79 fase 4.4): el STR ya no trae el servicio del modelo (vive en thcure/fabrica-servicio) y el .htaccess de la raíz
// manda con 308 fabrica./modelo/* a herramienta-fabrica. (R1). Lee el .htaccess REAL y el árbol del repo.
const fs = require('fs');
const path = require('path');
const { leerTexto } = require('./lib/leer-texto.js');

const raiz = path.join(__dirname, '..');
let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}

// X1: la carpeta del servicio y sus tests y ports se fueron
const dirModelo = path.join(raiz, 'modelo');
const restos = fs.existsSync(dirModelo) ? fs.readdirSync(dirModelo).filter((n) => n !== 'secrets.php') : [];
check('X1: no queda modelo/ (salvo un modelo/secrets.php local, fuera de git)', restos.length === 0, restos);
const fuera = ['modelo-acceso', 'modelo-cargar', 'modelo-lectura', 'modelo-router', 'modelo-sql'].map((n) => 'tests/' + n + '.test.js')
  .concat(['port-acceso', 'port-carga', 'port-export'].map((n) => 'tests/lib/' + n + '.js')).concat(['tests/fixtures/modelo/filas-export.json']);
check('X1: sin tests, ports ni fixture del servicio', fuera.every((f) => !fs.existsSync(path.join(raiz, f))), fuera.filter((f) => fs.existsSync(path.join(raiz, f))));

// R1: la regla de la raíz
const ht = leerTexto(path.join(raiz, '.htaccess'));
const l = ht.split(/\r?\n/).map((x) => x.trim());
const iCond = l.findIndex((x) => /^RewriteCond %\{HTTP_HOST\} /.test(x));
const iRed = l.indexOf('RewriteRule ^modelo(/|$) https://herramienta-fabrica.apartamentosbucaramanga.com%{REQUEST_URI} [R=308,L]');
const iReal = l.indexOf('RewriteCond %{REQUEST_FILENAME} -f [OR]');
const iApi = l.indexOf('RewriteRule ^api/uploads/ - [F,L]');
check('R1: condición de host fabrica. con [NC]', l[iCond] === String.raw`RewriteCond %{HTTP_HOST} ^fabrica\.apartamentosbucaramanga\.com$ [NC]`, l[iCond]);
check('R1: la regla 308 de ^modelo(/|$) va justo después de la condición', iCond >= 0 && iRed === iCond + 1);
check('R1: después de los bloqueos y antes de servir archivos reales', iApi >= 0 && iApi < iCond && iReal > iRed);
check('R1: una sola redirección en el archivo', (ht.match(/\[R=/g) || []).length === 1);
check('R1: una sola condición de host', (ht.match(/HTTP_HOST/g) || []).length === 1);
// Réplica: el patrón real de la condición ([NC]) y el de la regla
const host = iCond >= 0 ? new RegExp(l[iCond].split(' ')[2], 'i') : /$^/;
check('R1: casa fabrica. y Fabrica.', host.test('fabrica.apartamentosbucaramanga.com') && host.test('Fabrica.apartamentosbucaramanga.com'));
check('R1: no casa herramienta-fabrica., app. ni fabrica.<otro dominio>', !['herramienta-fabrica.apartamentosbucaramanga.com', 'app.apartamentosbucaramanga.com', 'fabrica.apartamentosbucaramanga.com.otro.co'].some((x) => host.test(x)));
const ruta = /^modelo(\/|$)/;
check('R1: la regla toma modelo, modelo/ y modelo/api/salud', ['modelo', 'modelo/', 'modelo/api/salud'].every((x) => ruta.test(x)));
check('R1: y no api/health, str-app-shell.html, modelos/x ni app/modelo/x', !['api/health', 'str-app-shell.html', 'modelos/x', 'app/modelo/x'].some((x) => ruta.test(x)));

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

**T5 · `tests/docs-partidos.test.js`** (archivo completo: la sección «Servicio del modelo» se fue con el servicio y sale de MOVIDAS). Contenido completo:
```js
// L-164 (CONOCIMIENTO-v1 Cn2, LM-69): housekeeping.md, servidor-php.md y tests-y-despliegue.md se partieron moviendo secciones «## …»
// enteras a docs nuevos. Este test comprueba que cada sección llegó byte a byte (md5 tomado de main 4da4ed2, antes de partir),
// que ya no está en el doc de origen y que el doc nuevo abre con «Al día hasta L-n · dueño:» (Cn7). Puntos: E1, D1, D2, D3 aquí; P1, P2, P3, P4, P5 (filas del índice) en claude-md.test.js.
// L-170 (LM-79 fase 4.4): la sección «Servicio del modelo» se fue con el servicio a thcure/fabrica-servicio; modelo.md queda como puntero y sale de MOVIDAS (D2).
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');

const dir = path.join(__dirname, '..', 'docs', 'claude');
const MOVIDAS = [
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Datos (localStorage) y reglas del turno", md5: 'd47573a81dfc1dc0e95370571a3d7ecb' },
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Movimientos de inventario rechazados (REQ-INV2-4-1, lote L-85)", md5: '466fb56a776777afa0684f534be642db' },
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Pendientes del turno (REQ-INV2-3-4 2/2, L-103, DA-33)", md5: 'b3a6ffa02a90fea6183f71011e98a9a8' },
  { origen: "servidor-php.md", destino: "servidor-php-datos.md", titulo: "## Base de datos, migraciones y crons", md5: '183bdff859927cf8e2597591742c7827' },
];

let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}
// Sección = desde su línea de título hasta antes de la siguiente «## » (o el final), sin saltos de línea finales.
function seccion(t, titulo) {
  const l = t.split('\n'); const i = l.indexOf(titulo);
  if (i < 0) return null;
  let j = i + 1;
  while (j < l.length && !l[j].startsWith('## ')) j++;
  return l.slice(i, j).join('\n').replace(/\n+$/, '');
}
const leer = (f) => (fs.existsSync(path.join(dir, f)) ? leerTexto(path.join(dir, f)) : null);

for (const m of MOVIDAS) {
  const destino = leer(m.destino), origen = leer(m.origen);
  const corto = m.titulo.slice(3, 50);
  check(m.destino + ' existe', destino !== null);
  const s = destino === null ? null : seccion(destino, m.titulo);
  check(m.destino + ' trae «' + corto + '» (E1)', s !== null);
  check('«' + corto + '» llegó literal (md5)', s !== null && crypto.createHash('md5').update(s, 'utf8').digest('hex') === m.md5, s && crypto.createHash('md5').update(s, 'utf8').digest('hex'));
  check(m.origen + ' ya no trae «' + corto + '» (D)', origen !== null && origen.split('\n').indexOf(m.titulo) < 0);
}
for (const f of [...new Set(MOVIDAS.map((m) => m.destino))]) {
  const t = leer(f) || '';
  check(f + ' abre con título y «Al día hasta L-n · dueño:» (Cn7)', /^# .+\nAl día hasta L-\d+ · dueño: /.test(t));
}
for (const f of [...new Set(MOVIDAS.map((m) => m.origen))]) {
  const t = leer(f) || '';
  check(f + ' dice dónde quedó lo movido (D)', /Partido en L-164/.test(t));
}

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

`node tests/run.js` en verde: 93/93 (sin los cinco tests del servicio y con el nuevo).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 1 módulos · 5 relaciones · 6 reglas · corren 24 guiones (58 casos) · no corren 32 · huecos: 1 relaciones, 0 reglas
- Módulos: **MOD** (archivo modelo/; línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-23 *→google-drive, REL-26 *→SRV, REL-29 cola-arquitecto→MOD
- Reglas que cruza: — (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-18, RT-20, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-146-purga (3/5), REQ-INV2-3-4-hk (3/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (9/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (2/7), REQ-K3c-vista (2/6), REQ-K3c (2/3), REQ-MOD-6-carga-rol (1/1), REQ-MOD-6-carga (2/2), REQ-MOD-6-complemento (1/1), REQ-MOD-6-credenciales (1/1), REQ-MOD-6-lectura (2/2), REQ-MOD-6 (3/4), REQ-OP-1 (2/8), REQ-OP-1b (1/7), REQ-SH-2 (1/11), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-29 (cola-arquitecto→MOD); reglas ninguna — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): ninguna
```

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): las llamadas de la cola y modelo-sync van a `herramienta-fabrica.` y no pasan por el STR.

## Pruebas derivadas (juez; verificador crítico)
```
- a. El STR ya no trae modelo/ ni sus tests y ports, y su .htaccess redirige 308 solo fabrica./modelo/* · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: límite · espera: `sitios-redireccion.test.js` n OK, 0 FAIL · **Detener**
- b. fabrica. redirige 308 /modelo y todo /modelo/* con ruta y consulta; herramienta-fabrica. da la salud con base, niega config/, logs/, docs/ y tests/ y no publica el STR (CU-MOD-1.1) · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: el commit del STR desplegado en fabrica. y el de A3 en herramienta-fabrica. · tec: escenario · espera: caso b del guion en verde; si solo falla config/ en fabrica. con 403 o /tests/run.js con 404, **Detener** y avisar al Arquitecto (limpieza de public_html o despliegue pendiente), no Revertir · **Revertir**
- c. Los docs y la suite siguen en verde sin el servicio · nivel: N1 · perfil: tests/ · precondición: a en verde · tec: escenario · espera: `node tests/run.js` 93/93; `docs-partidos.test.js` y `claude-md.test.js` 0 FAIL · **Detener**
- d. fabrica-servicio tiene los tests y ports del servicio en verde · nivel: N1 · perfil: verificación cruzada del Arquitecto (fuera del juez) · precondición: ninguna · tec: escenario · espera: en el cierre, A2 con «grep -c» 0 y run.js 5/5, y A3 con ls-remote igual al HEAD de la carpeta hermana; el Arquitecto lo comprueba en GitHub · **Detener**
- e. Cada punto se aplicó literal y el test y el guion son iguales byte a byte · nivel: N1 · perfil: tests/ · precondición: a en verde · tec: escenario · espera: `aplicar.js` K1 en verde (R1, P1, C1, T1–T3, T4, T5); K2 `tests/sitios-redireccion.test.js` igual; la cola compara el guion · **Detener**
- f. app. ya no sirve el servicio viejo · nivel: N1 · perfil: verificación cruzada del Arquitecto (curl; page.request lo desvía) · precondición: el commit del STR desplegado en app. · tec: escenario · espera: https://app.apartamentosbucaramanga.com/modelo/api/salud → 404 · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Resultado esperado del juez: «parcial», con d y f en criteriosPendientes (el juez no lee el log de la CLI ni tiene red); los cierra el Arquitecto por evidencia cruzada.
```

### Guion N2 → `tests/e2e/LM-79.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// LM-79 fase 4.4 (L-170; fase 2 en L-168): fabrica. responde 308 a herramienta-fabrica. para todo /modelo/* con ruta y consulta;
// herramienta-fabrica. publica fabrica-servicio: la salud con base, config/ y logs/ negados, docs/ y tests/ negados y nada del STR.
// Solo lectura: GET sin token. maxRedirects: 0 para ver cada respuesta tal cual.
const VIEJO = 'https://fabrica.apartamentosbucaramanga.com';
const NUEVO = 'https://herramienta-fabrica.apartamentosbucaramanga.com';
const estado = (r) => (r ? r.status() : 'sin respuesta');
const pedir = (p, url) => p.request.get(url, { maxRedirects: 0 }).catch(() => null);

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'b', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-1.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'fabrica. redirige 308 todo /modelo/* a herramienta-fabrica. con ruta y consulta; herramienta-fabrica. da la salud con base, niega config/, logs/, docs/ y tests/ y no publica el STR',
      async prueba(h) {
        const p = h.page;
        const r1 = await pedir(p, VIEJO + '/modelo/api/salud?l=170');
        const loc = r1 ? (r1.headers()['location'] || '') : '';
        h.espera(!!r1 && r1.status() === 308, 'fabrica./modelo/api/salud → ' + estado(r1));
        h.espera(loc === NUEVO + '/modelo/api/salud?l=170', 'Location: ' + (loc || 'ninguna'));
        const r2 = await pedir(p, VIEJO + '/modelo/api/config/secrets.example.php');
        const loc2 = r2 ? (r2.headers()['location'] || '') : '';
        h.espera(!!r2 && r2.status() === 308 && loc2 === NUEVO + '/modelo/api/config/secrets.example.php', 'fabrica./modelo/api/config/ (403 = Hostinger dejó el modelo/ viejo en public_html: limpiar, no revertir) → ' + estado(r2) + ' · ' + (loc2 || 'sin Location'));
        const r3 = await pedir(p, NUEVO + '/modelo/api/salud');
        const j = r3 ? await r3.json().catch(() => ({})) : {};
        h.espera(!!r3 && r3.status() === 200 && j.servicio === 'modelo' && j.db === true, 'herramienta-fabrica./modelo/api/salud → ' + estado(r3) + ' · servicio ' + j.servicio + ' · db ' + j.db + ' · esquema ' + j.schema_version);
        for (const ruta of ['/modelo/api/config/secrets.example.php', '/modelo/api/logs/zz-verif-l170', '/docs/claude/modelo.md', '/tests/run.js']) {
          const r = await pedir(p, NUEVO + ruta);
          h.espera(!!r && r.status() === 403, 'herramienta-fabrica.' + ruta + ' → ' + estado(r));
        }
        for (const ruta of ['/str-app-shell.html', '/api/health']) {
          const r = await pedir(p, NUEVO + ruta);
          h.espera(!!r && r.status() === 404, 'herramienta-fabrica.' + ruta + ' (el STR ya no se publica ahí) → ' + estado(r));
        }
      },
    },
  ],
};
```

## B4. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados, el hash de main de fabrica-servicio), una línea `-m` para el `.htaccess` de la raíz (el hook no reconoce nombres con punto inicial) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Fuera de alcance: .htaccess - el hook no reconoce nombres con punto inicial; es el .htaccess de la raíz del Alcance" -m "Lote: L-170 · LM-79 · Casos de uso: CU-MOD-1.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (A1–A3, B1–B4) · salidas de A2 (grep, run.js) y A3 (ls-remote) tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y de main de fabrica-servicio · tests: n/n · «Reproduce: sitios-redireccion.test.js X1 falla en HEAD» · «mapa del área / CLAUDE.md actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
