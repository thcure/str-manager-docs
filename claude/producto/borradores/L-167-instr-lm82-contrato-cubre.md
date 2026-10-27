# instr — L-167 · LM-82: el contrato de «cubre» de los guiones en `tests/e2e-esquema.test.js` (REL y RT de 1 a 3 cifras, CU-<MOD>-n.m) y el guion LM-82 con los CU y REL que ejerce
Categoría: **estándar** (solo pruebas: `tests/e2e-esquema.test.js` y `tests/e2e/LM-82.spec.js`; no toca producto; contrato del Arquitecto M-1121; JP M-1128, tanda T-4)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-26 20:20
Alcance: `tests/e2e-esquema.test.js` (ID_CUBRE y sus checks) · `tests/e2e/LM-82.spec.js` (solo `cubre` y un comentario) · `?v=` igual · `schema_version` igual · sin cambios de base de datos
Versión: `?v=` igual · `schema_version` igual
Impacto: los guiones pueden anclar cada caso a la línea base con su caso de uso (CU-<MOD>-n.m) y citar relaciones o reglas de tres cifras (REL-102), como ya cuenta linea-base.py; el guion de la página «Línea base» (L-165) declara su caso de uso CU-PRJ-10.1, CU-PRJ-1.1, 2.1 y 2.2 y REL-102 y REL-112, que hoy quedaban como deuda. Nada cambia para el usuario del STR.
Reglas transversales que toca: ninguna (solo pruebas; no toca datos, permisos, archivos, retención ni conexiones)
Mapa: módulos y relaciones que cambia: ninguna (pruebas; REL-102 y REL-112 ganan un caso que las declara)
Casos de uso: CU-PRJ-1.1, CU-PRJ-2.1, CU-PRJ-2.2, CU-PRJ-10.1
Riesgo: bajo (R-1 del lote; no cambia código del STR). Mitigación: la cola corre el guion LM-82 entero y `e2e-esquema` carga todos los guiones.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-82; contrato del Arquitecto M-1121)
Reversión: `git revert <hash>` (vuelven la forma vieja de ID_CUBRE y el «cubre» corto del guion).
Origen: M-1119 (hallazgo de L-165), M-1121 (contrato del Arquitecto), M-1128 (JP). Requerimiento: `interno/lotes-modelo/LM-82.md` (hallazgo del contrato de «cubre») y `herramientas/plantillas/instruccion.md` (línea del guion). Decisión: ninguna (solo pruebas; no toca áreas de A6)
Depende de: L-165 aceptado (ed99503; evidencia cruzada M-1127, 20:13) y L-166 aceptado (5b18fad) · Precondiciones para verificar: perfiles zz-verif-admin, zz-verif-oper y zz-verif-colab con sesión; sin datos que crear
¿Quién más depende de lo que cambia?: todo guion de tests/e2e/ (la forma solo se amplía: lo que pasaba sigue pasando); `linea-base.py` C2 (ya cuenta los CU de «cubre»); `mapa.py --ruta` (lee «cubre» para la cobertura); el registro de cobertura del Arquitecto (las REL de tres cifras dejan de ser deuda).

## 0. Contexto
- No toques ningún otro archivo. Los dos van completos abajo: cópialos tal cual.
- `ID_CUBRE` solo se **amplía**: REL-n y RT-n de 1 a 3 cifras y `CU-<MOD>-n.m`. La forma que ya valía sigue valiendo (módulo, REQ/INC/DT/R/L). Los checks P1 lo prueban por los bordes; el P2 exige que algún guion ancle casos con CU-n (falla en `HEAD`, donde ningún guion puede).

## Tests en `tests/`
**T1 · `tests/e2e-esquema.test.js`** (archivo completo; N1 de P1 y P2; P2 falla en `HEAD`: «0 casos»). Contenido completo:
```js
// L-121 — guiones de tests/e2e/: la salud no compara schema_version con un número exacto (el esquema sube por diseño,
// 12 desde L-116/L-117) y ningún guion dispara la copia a Drive (M-454).
const fs = require('fs');
const path = require('path');
const { leerTexto } = require('./lib/leer-texto.js');

let ok = 0, fail = 0;
function check(nombre, pasa, detalle) {
  pasa ? ok++ : fail++;
  console.log((pasa ? 'OK   ' : 'FAIL ') + nombre + (pasa || !detalle ? '' : ' → ' + detalle));
}

const DIR = path.join(__dirname, 'e2e');
const guiones = fs.readdirSync(DIR).filter((f) => /\.spec\.js$/.test(f)).sort();
check('hay guiones en tests/e2e/', guiones.length > 0, 'ninguno');

const EXACTA = [/schema_version\s*===\s*\d/, /\d\s*===\s*[\w.]*schema_version/];
const exactas = [], cron = [], corte = [];
guiones.forEach((f) => {
  leerTexto(path.join(DIR, f)).split('\n').forEach((l, i) => {
    if (EXACTA.some((re) => re.test(l))) exactas.push(f + ':' + (i + 1));
    if (/\/api\/drive\/cron|X-Cron-Key/.test(l)) cron.push(f + ':' + (i + 1));
    if (/\/drive\/corte(?!-prueba)/.test(l)) corte.push(f + ':' + (i + 1));
  });
});
check('ningún guion compara schema_version con === y un número', exactas.length === 0, exactas.join(', '));
check('ningún guion llama a /api/drive/cron ni usa X-Cron-Key', cron.length === 0, cron.join(', '));
// L-124 (REQ-K3c): los guiones solo usan el corte de prueba, nunca la pasada programada del corte.
check('ningún guion llama a /drive/corte (solo /drive/corte-prueba)', corte.length === 0, corte.join(', '));
check('la regla del corte no atrapa /drive/corte-prueba', !/\/drive\/corte(?!-prueba)/.test("'/drive/corte-prueba'"));

// REQ-MOD-6.spec.js compara `=== null` a propósito: no es una comparación exacta con un número.
check('la regla no atrapa schema_version === null', !EXACTA.some((re) => re.test('c.schema_version === null')));
check('la regla atrapa j.schema_version === 10', EXACTA[0].test('j.schema_version === 10'));
check('la regla atrapa 10 === j.schema_version', EXACTA[1].test('10 === j.schema_version'));

// L-122 — guion de K3b: la foto es la general de la recepción de zona (L-107), subida después de iniciar el turno.
const K3B = path.join(DIR, 'REQ-K3b-aviso.spec.js');
if (!fs.existsSync(K3B)) {
  check('falta tests/e2e/REQ-K3b-aviso.spec.js', false, 'falta tests/e2e/REQ-K3b-aviso.spec.js');
} else {
  const k = leerTexto(K3B);
  const iIni = k.indexOf('await iniciar(h)'), iFoto = k.indexOf("await foto(h, 'recepcion')");
  check('K3b: no nombra la tarea zz-verif-Conteo de cierre', k.indexOf('zz-verif-Conteo de cierre') < 0);
  check("K3b: arma la clave con 'inv::@' + tipo + '::'", k.indexOf("'inv::@' + tipo + '::'") >= 0);
  check("K3b: contiene await iniciar(h) y await foto(h, 'recepcion')", iIni >= 0 && iFoto >= 0, 'iniciar ' + iIni + ' · foto ' + iFoto);
  check('K3b: inicia el turno antes de subir la foto de la recepción', iIni >= 0 && iFoto >= 0 && iIni < iFoto, 'iniciar ' + iIni + ' · foto ' + iFoto);
  check('K3b: d y g (miran la foto que sube c) no son de admin, que la cola corre antes que colab', /c: 'd', perfil: 'oper'/.test(k) && /c: 'g', nivel: 'N3', perfil: 'oper'/.test(k));
}

// L-128 (INC-133) — REQ-INV2-4-2: si una foto de cierre no responde, el guion anota cómo quedó en la cola local, solo leyendo.
const E42 = path.join(DIR, 'REQ-INV2-4-2.spec.js');
if (!fs.existsSync(E42)) {
  check('falta tests/e2e/REQ-INV2-4-2.spec.js', false, 'falta tests/e2e/REQ-INV2-4-2.spec.js');
} else {
  const g = leerTexto(E42);
  const i = g.indexOf('async function enCola(');
  const cuerpo = i >= 0 ? g.slice(i, g.indexOf('\n}\n', i)) : '';
  check('REQ-INV2-4-2: enCola lee STRColaSubida.listar con estado, intentos, ultimoError y proximoIntento',
    /STRColaSubida\.listar\(/.test(cuerpo) && ['estado', 'intentos', 'ultimoError', 'proximoIntento'].every((k) => cuerpo.includes(k + ':')), i < 0 ? 'sin enCola' : 'faltan campos');
  check('REQ-INV2-4-2: enCola no cambia la cola (sin quitar, reintentar, agregar, procesar ni subirConDatos)', i >= 0 && !/\.(quitar|reintentar|agregar|procesar|subirConDatos)\(/.test(cuerpo));
  check('REQ-INV2-4-2: fotosFaltantes anota la cola cuando la foto no tuvo respuesta', g.indexOf("'— · cola: ' + await enCola(h, clave)") >= 0);
}

// L-129 (LM-41): cada caso declara en `cubre` los nodos del mapa del STR que prueba (módulo, REL-n, RT-n, REQ/INC/DT del guion).
// L-167 (contrato del Arquitecto, M-1121, LM-82): REL-n y RT-n de 1 a 3 cifras (el mapa ya tiene REL-102) y CU-<MOD>-n.m, que ancla
// el caso a la línea base (lo cuenta linea-base.py C2). Puntos P1 y P2 de la instrucción de L-167.
const ID_CUBRE = /^(REL-\d{1,3}|RT-\d{1,3}|CU-[A-Z][A-Z0-9]{0,4}-\d+\.\d+|(REQ|INC|DT|R|L)-[A-Z0-9][A-Za-z0-9.-]*|[A-Z][A-Z0-9]{0,4})$/;
const sinCubre = [], idsMalos = [], noCargan = [];
guiones.forEach((f) => {
  let g;
  try { g = require(path.join(DIR, f)); } catch (e) { noCargan.push(f + ': ' + e.message); return; }
  (g.casos || []).forEach((c) => {
    if (!Array.isArray(c.cubre) || !c.cubre.length) sinCubre.push(f + ' ' + c.c);
    else c.cubre.forEach((x) => { if (typeof x !== 'string' || !ID_CUBRE.test(x)) idsMalos.push(f + ' ' + c.c + ' ' + x); });
  });
});
check('todos los guiones cargan con require', noCargan.length === 0, noCargan.join(' · '));
check('todo caso trae cubre con al menos un id', sinCubre.length === 0, sinCubre.join(', '));
check('los ids de cubre tienen forma de módulo, REL-n, RT-n, CU-<MOD>-n.m o REQ/INC/DT', idsMalos.length === 0, idsMalos.join(', '));
check('P1 · (límite) la forma de cubre acepta HK, INC1, REL-1, REL-16, REL-102, RT-8, RT-25, REQ-INV2-4-2, INC-132, R-3, CU-PRJ-2.1 y CU-INC1-10.12',
  ['HK', 'INC1', 'REL-1', 'REL-16', 'REL-102', 'RT-8', 'RT-25', 'REQ-INV2-4-2', 'INC-132', 'R-3', 'CU-PRJ-2.1', 'CU-INC1-10.12'].every((x) => ID_CUBRE.test(x)));
check('P1 · (límite) y rechaza hk, REL-, REL-1234, RT-1000, CU-PRJ-2, cu-prj-2.1, CU-prj-2.1 y CU-PRJ-2.1.3',
  !['hk', 'REL-', 'REL-1234', 'RT-1000', 'CU-PRJ-2', 'cu-prj-2.1', 'CU-prj-2.1', 'CU-PRJ-2.1.3'].some((x) => ID_CUBRE.test(x)));
const cuEnGuiones = guiones.reduce((n, f) => { try { return n + (require(path.join(DIR, f)).casos || []).filter((c) => (c.cubre || []).some((x) => /^CU-/.test(x))).length; } catch (e) { return n; } }, 0);
check('P2 · (escenario) algún guion ancla casos a la línea base con CU-<MOD>-n.m (LM-82: ' + cuEnGuiones + ' casos)', cuEnGuiones > 0);

// L-161 (V4 de PRUEBAS-v2, LM-62): un caso puede declarar su técnica en `tec`: 'límite' (valor límite), 'escenario'
// (camino principal, un alterno y un negativo) o 'decisión' (tabla rol × acción del REQ). Es opcional: los guiones de
// antes no lo traen; si está, es una de las tres palabras, escrita así.
const TEC = ['límite', 'escenario', 'decisión'];
const tecOk = (t) => t === undefined || TEC.includes(t);
const tecMalos = [];
guiones.forEach((f) => {
  let g;
  try { g = require(path.join(DIR, f)); } catch (e) { return; }
  (g.casos || []).forEach((c) => { if (!tecOk(c.tec)) tecMalos.push(f + ' ' + c.c + ' ' + JSON.stringify(c.tec)); });
});
check('E1 · (decisión) tec, si está, es límite, escenario o decisión', tecMalos.length === 0, tecMalos.join(', '));
check('E2 · (límite) la regla de tec acepta límite, escenario, decisión y ausente', ['límite', 'escenario', 'decisión', undefined].every(tecOk));
check("E3 · (límite) la regla de tec rechaza limite, Escenario, '' y ['límite']", ![ 'limite', 'Escenario', '', ['límite']].some(tecOk));
console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

`node tests/run.js` en verde.

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos
- Lote de solo guiones o herramientas: corren herramientas/pw/humo-pw; nada más.
```

## Pruebas derivadas (juez; verificador estándar)
```
- a. La forma de «cubre» acepta REL y RT de 1 a 3 cifras y CU-<MOD>-n.m y rechaza lo mal escrito; todos los guiones la cumplen · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: límite · espera: `e2e-esquema.test.js` n OK, 0 FAIL (P1, P2) · **Detener**
- c. El admin ve el explorador de la línea base en la página y su encabezado (CU-PRJ-10.1, CU-PRJ-1.1, CU-PRJ-2.1) · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: ninguna · tec: escenario · espera: caso c del guion en verde · **Detener**
- d. El operador no ve «Línea base» ni entra (CU-PRJ-1.1, REL-102, REL-112) · nivel: N2 · perfil: zz-verif-oper · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · tec: decisión · espera: caso d del guion en verde · **Detener**
- e. ⟳ Actualizar deja el explorador cargado (CU-PRJ-2.2) · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: c en verde · tec: escenario · espera: caso e del guion en verde · **Detener**
- f. El explorador sigue ocupando el área bajo el encabezado · nivel: N3 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: c en verde · espera: capturas f-escritorio y f-movil como en L-165 · **Seguir**
- g. El colaborador no entra (CU-PRJ-1.1, REL-112) · nivel: N2 · perfil: zz-verif-colab · página: https://app.apartamentosbucaramanga.com/portal.html (desde ahí abre str-linea-base.html) · precondición: ninguna · tec: decisión · espera: caso g del guion en verde · **Detener**
- h. El guion del commit es igual al de la instrucción y el test es igual byte a byte · nivel: N1 · perfil: tests/ · precondición: a en verde · tec: escenario · espera: la cola compara el guion (igual) y `aplicar.js` K2 `tests/e2e-esquema.test.js` igual · **Detener**
- Datos de prueba: ninguno (solo lectura)
```

### Guion N2 → `tests/e2e/LM-82.spec.js` (la CLI lo copia tal cual, sin cambiar un byte)
```js
// LM-82 (L-165): página «Línea base» del grupo Proyecto. El admin ve el encabezado del commit y, dentro del iframe aislado,
// el explorador de la línea base (título «STR Manager» y la tabla «Línea objetivo»); el operador y el colaborador no entran.
// L-167: cubre con CU-PRJ-10.1 (la página, Arquitecto 20:14), los CU-PRJ de las páginas del grupo y REL-102/REL-112 que ejercen sus casos (contrato de cubre, M-1121). Solo lectura: no crea datos. El arnés agrupa por perfil en el orden de primera aparición: admin (c, e, f) → oper (d) → colab (g).
const RAW = 'https://raw.githubusercontent.com/thcure/str-manager-docs/';
const base = (h) => h.BASE || new URL(h.page.url()).origin;
async function hasta(fn, ms) {
  const fin = Date.now() + ms;
  for (;;) { if (await fn()) return true; if (Date.now() > fin) return false; await new Promise((r) => setTimeout(r, 300)); }
}
// Espera el encabezado del commit y el estado final de la página; devuelve {sha, estado, encabezado}.
async function cargada(h) {
  const p = h.page;
  await p.waitForSelector('[data-docs-encabezado]', { timeout: 30000 });
  await p.waitForFunction(() => { const e = document.querySelector('[data-docs-encabezado]'); return e && /Datos de|Datos del/.test(e.textContent); }, null, { timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => { const c = document.querySelector('#lbCuerpo'); return c && c.dataset.lbEstado !== 'cargando'; }, null, { timeout: 60000 }).catch(() => {});
  return p.evaluate(() => {
    const e = document.querySelector('[data-docs-encabezado]'), c = document.querySelector('#lbCuerpo');
    return { sha: e ? (e.dataset.sha || '') : '', encabezado: e ? e.textContent.trim() : '', estado: c ? c.dataset.lbEstado : '', vacio: (document.querySelector('#lbVacio') || {}).textContent || '' };
  });
}
// Texto visible dentro del iframe del explorador (frame hijo de #lbMarco). Solo lee.
async function textoMarco(h, buscar, ms) {
  const fr = h.page.frameLocator('#lbMarco');
  const ok = await fr.locator('text=' + buscar).first().waitFor({ state: 'attached', timeout: ms }).then(() => true, () => false);
  return ok;
}

module.exports = {
  req: 'LM-82',
  zona: ['PRJ'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['PRJ', 'REL-24', 'CU-PRJ-10.1', 'CU-PRJ-1.1', 'CU-PRJ-2.1'], pagina: '/str-linea-base.html',
      que: 'El admin ve el encabezado del commit y, dentro del iframe, el explorador de ese commit: «STR Manager» y la tabla «Línea objetivo»',
      async prueba(h) {
        const p = h.page;
        const e = await cargada(h);
        h.espera(/^Datos de/.test(e.encabezado) && /^[0-9a-f]{40}$/.test(e.sha), 'encabezado: «' + e.encabezado + '» · sha ' + (e.sha || 'ninguno'));
        h.espera(e.estado === 'ok', 'estado de la página: ' + e.estado + (e.vacio ? ' · ' + e.vacio.trim().slice(0, 160) : ''));
        const r = await p.request.get(RAW + (e.sha || 'main') + '/interno/linea-base/linea-base.html');
        h.espera(r.status() === 200, 'explorador publicado en ' + (e.sha || 'main').slice(0, 7) + ': HTTP ' + r.status());
        const sandbox = await p.$eval('#lbMarco', (f) => f.getAttribute('sandbox')).catch(() => null);
        h.espera(sandbox === 'allow-scripts allow-popups', 'sandbox del iframe: «' + sandbox + '»');
        const titulo = await textoMarco(h, 'STR Manager', 30000);
        h.espera(titulo, 'dentro del iframe: «STR Manager» ' + (titulo ? 'visible' : 'NO'));
        const tabla = await textoMarco(h, 'Línea objetivo', 30000);
        h.espera(tabla, 'dentro del iframe: tabla «Línea objetivo» ' + (tabla ? 'visible' : 'NO'));
        // El explorador no ve la sesión del STR: su documento es de origen opaco (sin allow-same-origin).
        const fr = p.frames().find((f) => f.parentFrame() === p.mainFrame() && /^about:srcdoc/.test(f.url()));
        const origen = fr ? await fr.evaluate(() => String(self.origin)).catch(() => 'error') : 'sin frame';
        h.espera(origen === 'null', 'origen del documento del iframe: ' + origen);
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['PRJ', 'REL-24', 'CU-PRJ-10.1', 'CU-PRJ-2.2'], pagina: '/str-linea-base.html',
      que: '⟳ Actualizar vuelve a pedir el commit y deja el explorador cargado, con el encabezado del commit',
      async prueba(h) {
        const p = h.page;
        const e0 = await cargada(h);
        await p.click('#btnDocsAct');
        await hasta(() => p.$eval('#btnDocsAct', (b) => !b.disabled).catch(() => false), 60000);
        const e1 = await cargada(h);
        h.espera(e1.estado === 'ok' && /^[0-9a-f]{40}$/.test(e1.sha), 'tras Actualizar: estado ' + e1.estado + ' · sha ' + (e1.sha || 'ninguno').slice(0, 7) + ' (antes ' + (e0.sha || 'ninguno').slice(0, 7) + ')');
        const tabla = await textoMarco(h, 'Línea objetivo', 30000);
        h.espera(tabla, 'dentro del iframe tras Actualizar: «Línea objetivo» ' + (tabla ? 'visible' : 'NO'));
      },
    },
    {
      c: 'f', nivel: 'N3', perfil: 'admin', cubre: ['PRJ', 'CU-PRJ-10.1'], pagina: '/str-linea-base.html',
      que: 'El explorador ocupa toda el área bajo el encabezado (escritorio y 390 px), sin doble barra de desplazamiento de la página',
      async prueba(h) {
        await cargada(h);
        await textoMarco(h, 'Línea objetivo', 30000);
        await h.captura('escritorio', { completa: false });
        await h.captura('movil', { ancho: 390, completa: false });
      },
    },
    {
      c: 'd', perfil: 'oper', tec: 'decisión', cubre: ['PRJ', 'SH', 'REL-102', 'REL-112', 'CU-PRJ-10.1', 'CU-PRJ-1.1'], pagina: '/str-app-shell.html',
      que: 'El operador no ve «Línea base» en el menú y, si abre la página a mano, vuelve al STR sin ver el explorador',
      async prueba(h) {
        const p = h.page;
        await p.waitForSelector('.sidebar .nav-group', { timeout: 20000 });
        const entrada = await p.$$eval('[data-fav-url="str-linea-base.html"]', (els) => els.filter((e) => e.offsetParent !== null).length).catch(() => -1);
        h.espera(entrada === 0, 'entradas «Línea base» visibles para el operador: ' + entrada);
        await p.goto(base(h) + '/str-linea-base.html', { waitUntil: 'load' }).catch(() => null);
        await hasta(() => !/\/str-linea-base\.html/.test(p.url()), 10000);
        const marco = await p.locator('#lbMarco').count().catch(() => 0);
        h.espera(!/\/str-linea-base\.html/.test(p.url()) && marco === 0, 'str-linea-base.html como operador → ' + p.url().replace(base(h), '') + ' · iframe del explorador: ' + marco);
      },
    },
    {
      c: 'g', perfil: 'colab', tec: 'decisión', cubre: ['PRJ', 'REL-112', 'CU-PRJ-10.1', 'CU-PRJ-1.1'], pagina: '/portal.html',
      que: 'El colaborador que abre la página a mano vuelve a su inicio sin ver el explorador',
      async prueba(h) {
        const p = h.page;
        await p.goto(base(h) + '/str-linea-base.html', { waitUntil: 'load' }).catch(() => null);
        await hasta(() => !/\/str-linea-base\.html/.test(p.url()), 10000);
        const marco = await p.locator('#lbMarco').count().catch(() => 0);
        h.espera(!/\/str-linea-base\.html/.test(p.url()) && marco === 0, 'str-linea-base.html como colaborador → ' + p.url().replace(base(h), '') + ' · iframe del explorador: ' + marco);
      },
    },
  ],
};
```

## 2. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-167 · LM-82 · Casos de uso: CU-PRJ-1.1, CU-PRJ-2.1, CU-PRJ-2.2, CU-PRJ-10.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho (P1, P2, guion) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «Reproduce: e2e-esquema P2 falla en HEAD» · «mapa del área / CLAUDE.md actualizado: no aplica (solo pruebas)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
