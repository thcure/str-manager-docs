# instr — L-168 · LM-79 fase 2: `fabrica.` redirige 308 el servicio del modelo a `herramienta-fabrica.`
Categoría: **crítico** (despliegue y dominios del servicio del modelo; DA: LM-79 · cruce previo con Carlos: 28-oct 21:41, chat del Arquitecto (M-1136))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-28 21:50 · ok Jefe de proyecto M-OKJP
Alcance: `modelo/api/.htaccess` (regla de redirección) · `tests/modelo-router.test.js` · `tests/e2e/LM-79.spec.js` (nuevo) · `docs/claude/modelo.md` (cabecera y sección nueva al final) · nada más · `?v=` igual · `schema_version` igual · sin cambios de base de datos
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Impacto: lo que aún llame al servicio en `fabrica.` recibe 308 a `herramienta-fabrica.` con la misma ruta y consulta. Los clientes de la fábrica ya usan el host nuevo (pw 0.13.0). Nada cambia para el usuario del STR.
Reglas transversales que toca: ninguna (no toca datos, permisos, archivos, retención ni conexiones del STR; solo la dirección de un servicio de la fábrica)
Mapa: módulos y relaciones que cambia: MOD (el sitio del servicio pasa a herramienta-fabrica.; `fabrica.` solo redirige); ninguna relación
Casos de uso: CU-MOD-1.1
Riesgo: medio (R-1 del lote; MOD tiene riesgo 1 en el mapa, no hace falta R-n). Conexiones a MySQL: 0 nuevas (el 308 lo da el servidor web antes de PHP). LiteSpeed: si no reconoce R=308 y responde 302 o 500, el caso b falla → Revertir y lote correctivo con R=307 (conserva método y cuerpo). Mitigación: la regla va después de los bloqueos y solo para el host viejo; el guion comprueba 308 exacto, Location, 403 de config/ y logs/ y la salud en el host nuevo; reversión con un revert.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce de Carlos)
Reversión: `git revert <hash>` (fabrica. vuelve a servir el servicio directo, como hasta hoy).
Origen: M-1134 y M-1135 (Arquitecto). Requerimiento: `interno/lotes-modelo/LM-79.md` y `claude/marco/plan-sitios-2026-10.md` (fase 2). Decisión: ADR-009 (v5, § 4c, aceptada; el servicio cambia de sitio y fabrica. solo redirige; no toca áreas de A6: ni api/config/, ni secretos, ni auth)
Depende de: fase 1 de LM-79 en verde (M-1135: herramienta-fabrica./modelo/api/salud con db:true) y pw 0.13.0 en LENOVO · Precondiciones para verificar: perfil zz-verif-admin con sesión; sin datos que crear
¿Quién más depende de lo que cambia?: pw (`comun.js` HOST_MODELO_VIEJO con las mismas reglas), `sync.py` y `espejo.js` (ya en el host nuevo), modelo-sync y modelo-espejo de GitHub Actions (default nuevo), panel (config nuevo), conocimiento (Arquitecto).

## 0. Contexto
- Lote crítico de la fábrica (LM-79, plan de sitios). El servicio ya responde en `herramienta-fabrica.` (mismo repo, publicado por Git); aquí solo se añade la redirección del host viejo.
- La regla va en `modelo/api/.htaccess`, **no** en el `.htaccess` de la raíz: esa carpeta tiene su propio `RewriteEngine On`, que anula las reglas de la raíz dentro de ella.
- No toques el router del servicio (CORS sigue solo para `app.`; lo amplía la fase 5), la API del STR, el `.htaccess` de la raíz ni ningún otro archivo fuera del Alcance.

## 1. `modelo/api/.htaccess` — redirección del host viejo

**H1 · antes del enrutado, después de los cuatro bloqueos** (`modelo/api/.htaccess`). Busca:
```md
# Enrutar todo por el router, salvo index.php mismo
```
Pon:
```md
# LM-79 fase 2 (L-168): el servicio se mudó a herramienta-fabrica.; 308 conserva método, cuerpo, ruta y consulta.
# Solo el host fabrica. (app./modelo y herramienta-fabrica. no se desvían); va después de los bloqueos. Se quita en la fase 6.
RewriteCond %{HTTP_HOST} ^fabrica\.apartamentosbucaramanga\.com$ [NC]
RewriteRule ^ https://herramienta-fabrica.apartamentosbucaramanga.com%{REQUEST_URI} [R=308,L]

# Enrutar todo por el router, salvo index.php mismo
```

## 2. `docs/claude/modelo.md`

**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-164 · dueño: MOD
```
Pon:
```md
Al día hasta L-168 · dueño: MOD
```

**D2 · sección nueva al final (no cambies la sección «Servicio del modelo»: `docs-partidos.test.js` compara su md5)** (`docs/claude/modelo.md`). Busca:
```md
- **Regla:** un lote toca `app`/`api` **o** `modelo/`, nunca los dos. Quitarlo: `git revert` del lote (desaparece `modelo/`).
```
Pon:
```md
- **Regla:** un lote toca `app`/`api` **o** `modelo/`, nunca los dos. Quitarlo: `git revert` del lote (desaparece `modelo/`).

## Sitio y redirección (LM-79 fase 2, L-168)
- **Dónde vive:** desde la fase 1 de LM-79 el servicio responde en `https://herramienta-fabrica.apartamentosbucaramanga.com/modelo/api/` (Git de Hostinger publica este mismo repo en su `public_html/`; su propio `modelo/secrets.php`, misma base `u…_modelo`). Los clientes de la fábrica (pw 0.13.0, `sync.py`, `espejo.js`, el panel) usan esa dirección.
- **Redirección:** `modelo/api/.htaccess`, después de los cuatro bloqueos y antes del enrutado: si el host es `fabrica.apartamentosbucaramanga.com` (`RewriteCond %{HTTP_HOST}` anclado, `[NC]`), **308** a `https://herramienta-fabrica.…%{REQUEST_URI}` (misma ruta y consulta; 308 conserva método y cuerpo). En `fabrica.`, `config/`, `sql/`, `cache/` y `logs/` siguen dando 403 antes de redirigir; `app./modelo` y `herramienta-fabrica.` no se desvían. Va en este `.htaccess` y no en el de la raíz porque su `RewriteEngine On` anula las reglas de la raíz dentro de la carpeta.
- **Límites:** `urllib` (`sync.py`) no sigue 307/308 en POST: la redirección es para lecturas rezagadas, no un puente. CORS sigue solo para `app.` (la fase 5 lo amplía). La regla se quita en la fase 6, cuando `fabrica.` se retira.
- Lo vigilan `tests/modelo-router.test.js` (H1: condición, orden, réplica del patrón) y el guion `tests/e2e/LM-79.spec.js` (308 con `Location`, 403 de `config/` en `fabrica.`, salud con base en el host nuevo).
```

## Tests en `tests/`
**T1 · `tests/modelo-router.test.js`** (archivo completo; N1 de H1; los checks H1 fallan en `HEAD`: no hay regla). Contenido completo:
```js
// REQ-MOD-6 / B7-1 (lote L-78): router del servicio del modelo (modelo/api/index.php).
// L-168 (LM-79 fase 2): redirección 308 de fabrica. a herramienta-fabrica. en modelo/api/.htaccess (H1).
// Réplica JS de la separación de la ruta y de la regla de tamaño de eco (no hay PHP local);
// además exige que la expresión y el límite del PHP real sigan siendo los replicados.
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');
const path = require('path');

let ok = 0, fail = 0;
function eq(nombre, real, esperado) {
  const pasa = JSON.stringify(real) === JSON.stringify(esperado);
  pasa ? ok++ : fail++;
  console.log((pasa ? 'OK   ' : 'FAIL ') + nombre + ' → ' + JSON.stringify(real) + (pasa ? '' : ' (esperado ' + JSON.stringify(esperado) + ')'));
}

// Réplica de: trim(preg_replace('/^\/?(.*\/)?modelo\/api\//', '', $uri), '/') + primer segmento
function recurso(ruta) {
  const uri = ruta.replace(/^\/?(.*\/)?modelo\/api\//, '').replace(/^\/+|\/+$/g, '');
  return uri.split('/')[0] || '';
}
// Réplica de: strlen($cuerpo) > MODELO_ECO_MAX → 413
const MAX = 4096;
const cabe = n => !(n > MAX);

eq('/modelo/api/salud → salud', recurso('/modelo/api/salud'), 'salud');
eq('/modelo/api/eco/ → eco', recurso('/modelo/api/eco/'), 'eco');
eq('/modelo/api/ → vacío', recurso('/modelo/api/'), '');
eq('/app/modelo/api/x → x', recurso('/app/modelo/api/x'), 'x');
eq('/modelo/api/eco/extra → eco', recurso('/modelo/api/eco/extra'), 'eco');

eq('4096 bytes pasa', cabe(4096), true);
eq('4097 bytes no pasa', cabe(4097), false);
eq('{"prueba":1} = 12 bytes', Buffer.byteLength('{"prueba":1}'), 12);

// El PHP real usa la misma expresión y el mismo límite
const php = leerTexto(path.join(__dirname, '..', 'modelo', 'api', 'index.php'));
eq('PHP usa la expresión replicada', php.includes(String.raw`preg_replace('/^\/?(.*\/)?modelo\/api\//', '', $uri)`), true);
eq('PHP límite 4096', /const MODELO_ECO_MAX = 4096;/.test(php), true);
eq('PHP sin require/include', /^\s*(require|include)(_once)?\b/m.test(php), false);
eq('PHP: OPTIONS → 204', /http_response_code\(204\)/.test(php), true);

// La regla de la raíz va anclada al inicio: no captura modelo/api
const raiz = leerTexto(path.join(__dirname, '..', '.htaccess'));
const regla = /RewriteRule \^api\(\/\.\*\)\?\$ api\/index\.php/.test(raiz);
eq('raíz: regla ^api(/.*)?$ presente', regla, true);
eq('raíz: ^api(/.*)?$ no captura modelo/api/salud', /^api(\/.*)?$/.test('modelo/api/salud'), false);
const ht = leerTexto(path.join(__dirname, '..', 'modelo', 'api', '.htaccess'));
eq('modelo/api/.htaccess bloquea logs/', ht.includes('RewriteRule ^logs/ - [F,L]'), true);

// L-168 (LM-79 fase 2): fabrica. → 308 a herramienta-fabrica. (H1). Solo ese host, después de los bloqueos, antes del router.
const lineas = ht.split(/\r?\n/).map((l) => l.trim());
const iCond = lineas.findIndex((l) => /^RewriteCond %\{HTTP_HOST\} /.test(l));
const iRed = lineas.indexOf('RewriteRule ^ https://herramienta-fabrica.apartamentosbucaramanga.com%{REQUEST_URI} [R=308,L]');
const iLogs = lineas.indexOf('RewriteRule ^logs/ - [F,L]');
const iRouter = lineas.indexOf('RewriteRule ^ index.php [QSA,L]');
eq('H1: condición de host fabrica. con [NC]', lineas[iCond], String.raw`RewriteCond %{HTTP_HOST} ^fabrica\.apartamentosbucaramanga\.com$ [NC]`);
eq('H1: la regla 308 va justo después de la condición', iCond >= 0 && iRed === iCond + 1, true);
eq('H1: después de los cuatro bloqueos y antes del router', iLogs >= 0 && iLogs < iCond && iRouter > iRed, true);
eq('H1: una sola redirección en el archivo', (ht.match(/\[R=/g) || []).length, 1);
// Réplica: el patrón real de la condición (sin distinguir mayúsculas, [NC]) casa solo el host viejo
const patron = iCond >= 0 ? new RegExp(lineas[iCond].split(' ')[2], 'i') : /$^/;
eq('H1: casa fabrica.', patron.test('fabrica.apartamentosbucaramanga.com'), true);
eq('H1: casa Fabrica. ([NC])', patron.test('Fabrica.apartamentosbucaramanga.com'), true);
eq('H1: no casa herramienta-fabrica.', patron.test('herramienta-fabrica.apartamentosbucaramanga.com'), false);
eq('H1: no casa app.', patron.test('app.apartamentosbucaramanga.com'), false);
eq('H1: no casa fabrica.<otro dominio>', patron.test('fabrica.apartamentosbucaramanga.com.otro.co'), false);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

`node tests/run.js` en verde (sin PHP en LENOVO los que lo llaman salen «OMITIDA», como siempre).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 1 módulos · 5 relaciones · 6 reglas · corren 24 guiones (58 casos) · no corren 32 · huecos: 1 relaciones, 0 reglas
- Módulos: **MOD** (línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-23 *→google-drive, REL-26 *→SRV, REL-29 cola-arquitecto→MOD
- Reglas que cruza: — (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-18, RT-20, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-146-purga (3/5), REQ-INV2-3-4-hk (3/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (9/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (2/7), REQ-K3c-vista (2/6), REQ-K3c (2/3), REQ-MOD-6-carga-rol (1/1), REQ-MOD-6-carga (2/2), REQ-MOD-6-complemento (1/1), REQ-MOD-6-credenciales (1/1), REQ-MOD-6-lectura (2/2), REQ-MOD-6 (3/4), REQ-OP-1 (2/8), REQ-OP-1b (1/7), REQ-SH-2 (1/11), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-29 (cola-arquitecto→MOD); reglas ninguna — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): ninguna
```

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): las llamadas con token de la cola (`modelo-llamar.js`, pw 0.13.0) y la carga de modelo-sync ya van al host nuevo y no pasan por la redirección; las comprobó el Arquitecto en la fase 1 (M-1135). El guion de este lote solo hace GET sin token.

## Pruebas derivadas (juez; verificador crítico)
```
- a. La regla existe solo para el host fabrica., con 308, después de los bloqueos y antes del router · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: límite · espera: `modelo-router.test.js` n OK, 0 FAIL · **Detener**
- b. fabrica. redirige 308 a herramienta-fabrica. con ruta y consulta; config/ y logs/ siguen bloqueados en fabrica.; la salud responde con base en herramienta-fabrica. (CU-MOD-1.1) · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: el commit desplegado en fabrica. y herramienta-fabrica. · tec: escenario · espera: caso b del guion en verde · **Revertir**
- c. Cada punto se aplicó literal y el test y el guion son iguales byte a byte · nivel: N1 · perfil: tests/ · precondición: a en verde y `aplicar.js` con la corrección de rutas con punto (`.htaccess`, M-1137 del Arquitecto) en pw de LENOVO · tec: escenario · espera: `aplicar.js` K1 4/4 (H1 `modelo/api/.htaccess`, D1, D2, T1); K2 `tests/modelo-router.test.js` igual; la cola compara el guion · **Detener**
- Datos de prueba: ninguno (solo lectura, GET sin token)
```

### Guion N2 → `tests/e2e/LM-79.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// LM-79 fase 2 (L-168): fabrica. responde 308 a herramienta-fabrica. con la misma ruta y consulta, después de los bloqueos;
// el servicio del modelo responde en el host nuevo. Solo lectura: GET sin token. maxRedirects: 0 para ver el 308 tal cual.
const VIEJO = 'https://fabrica.apartamentosbucaramanga.com';
const NUEVO = 'https://herramienta-fabrica.apartamentosbucaramanga.com';
const estado = (r) => (r ? r.status() : 'sin respuesta');

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'b', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-1.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'fabrica. redirige 308 a herramienta-fabrica. con ruta y consulta; config/ y logs/ siguen bloqueados en fabrica.; la salud responde en herramienta-fabrica. con base',
      async prueba(h) {
        const p = h.page;
        const r1 = await p.request.get(VIEJO + '/modelo/api/salud?l=168', { maxRedirects: 0 }).catch(() => null);
        const loc = r1 ? (r1.headers()['location'] || '') : '';
        h.espera(!!r1 && r1.status() === 308, 'fabrica./modelo/api/salud → ' + estado(r1));
        h.espera(loc === NUEVO + '/modelo/api/salud?l=168', 'Location: ' + (loc || 'ninguna'));
        const r2 = await p.request.get(VIEJO + '/modelo/api/config/secrets.example.php', { maxRedirects: 0 }).catch(() => null);
        h.espera(!!r2 && r2.status() === 403, 'fabrica./modelo/api/config/ sigue bloqueado (Deny de config/.htaccess) → ' + estado(r2));
        const r2b = await p.request.get(VIEJO + '/modelo/api/logs/zz-verif-l168', { maxRedirects: 0 }).catch(() => null);
        h.espera(!!r2b && r2b.status() === 403, 'fabrica./modelo/api/logs/ da 403 antes de redirigir (orden de la regla) → ' + estado(r2b));
        const r3 = await p.request.get(NUEVO + '/modelo/api/salud', { maxRedirects: 0 }).catch(() => null);
        const j = r3 ? await r3.json().catch(() => ({})) : {};
        h.espera(!!r3 && r3.status() === 200 && j.servicio === 'modelo' && j.db === true, 'herramienta-fabrica./modelo/api/salud → ' + estado(r3) + ' · servicio ' + j.servicio + ' · db ' + j.db + ' · esquema ' + j.schema_version);
      },
    },
  ],
};
```

## 3. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-168 · LM-79 · Casos de uso: CU-MOD-1.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por punto (H1, D1, D2, T1, guion) · archivos declarados vs tocados (toda diferencia explicada) · versión `?v=` igual · hash del commit · tests: n/n · «Reproduce: modelo-router.test.js H1 falla en HEAD» · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
