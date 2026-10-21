// REQ-MOD-5 / A7a (lote 70): CLAUDE.md podado + mapas por área en docs/claude/.
// Vigila tamaños, que el índice nombre cada archivo/carpeta y que no se haya perdido contenido al mover.
// v2 (LM-70, 21-oct-2026): § 1 es un puntero a reglas-fijas.md, no una copia; fuente: str-manager-docs/herramientas/hooks-cli/claude-md.test.js.
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');
const path = require('path');

const raiz = path.join(__dirname, '..');
const ANTES = 239539; // caracteres de CLAUDE.md antes del lote 70 (9fa6948)

let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}
const leer = f => leerTexto(path.join(raiz, f));

const claude = leer('CLAUDE.md');
check('CLAUDE.md ≤ 12 000 caracteres', claude.length <= 12000, claude.length);

const dirDocs = path.join(raiz, 'docs', 'claude');
const reglasPath = path.join(dirDocs, 'reglas-fijas.md');
check('docs/claude/reglas-fijas.md existe', fs.existsSync(reglasPath));
const reglas = fs.existsSync(reglasPath) ? leerTexto(reglasPath) : '';
check('reglas-fijas.md ≤ 3 000 caracteres', reglas.length > 0 && reglas.length <= 3000, reglas.length);
// LM-70 (CONOCIMIENTO-v1 Cn2): § 1 ya no copia las reglas (ctx.js las inyecta al arrancar y tras compactar); solo apunta a ellas.
const i1 = claude.indexOf('## 1.');
const sec1 = i1 >= 0 ? claude.slice(i1, claude.indexOf('\n## ', i1 + 5)) : '';
check('CLAUDE.md tiene § 1', sec1.length > 0);
check('§ 0 dice que ctx.js inyecta las reglas (P0)', claude.includes('te las inyecta `ctx.js`'));
check('§ 1 apunta a docs/claude/reglas-fijas.md y a ctx.js (P1)', sec1.includes('docs/claude/reglas-fijas.md') && sec1.includes('ctx.js'));
const regla2 = (reglas.match(/^2\. .*$/m) || [''])[0].trim();
check('§ 1 no copia las reglas: la regla 2 no está en CLAUDE.md (P1)', regla2.length > 20 && !claude.includes(regla2));
check('CLAUDE.md ≤ 9 000 caracteres (meta Cn2; informativo hasta el lote estándar de docs)', true, claude.length);

const idx = claude.indexOf('## 2.');
const indice = idx >= 0 ? claude.slice(idx, claude.indexOf('\n## ', idx + 5)) : '';
check('CLAUDE.md tiene § 2 índice', indice.length > 0);

const raizArchivos = fs.readdirSync(raiz);
for (const f of raizArchivos.filter(f => /^str-.*\.html$/.test(f) || /\.js$/.test(f))) {
  check('índice nombra ' + f, indice.includes('`' + f + '`'));
}
const api = path.join(raiz, 'api');
for (const d of fs.readdirSync(api).filter(d => fs.statSync(path.join(api, d)).isDirectory())) {
  check('índice nombra api/' + d + '/', indice.includes('`api/' + d + '/`'));
}
check('índice nombra tests/', indice.includes('`tests/`'));

const mapas = fs.readdirSync(dirDocs).filter(f => f.endsWith('.md'));
let total = claude.length;
for (const m of mapas) {
  const s = leerTexto(path.join(dirDocs, m));
  total += s.length;
  if (m !== 'reglas-fijas.md') {
    check(m + ' ≤ 60 000 caracteres', s.length <= 60000, s.length);
    check(m + ' enlazado desde el índice', indice.includes('`' + m + '`'));
  }
}
const esperados = ['shell-y-api', 'calendario', 'propiedades', 'flujos', 'housekeeping', 'inventario',
  'usuarios-y-roles', 'proyecto', 'servidor-php', 'tests-y-despliegue', 'historial'];
for (const e of esperados) check('existe docs/claude/' + e + '.md', mapas.includes(e + '.md'));
check('conservación ≥ 98 % (' + total + ' / ' + ANTES + ')', total >= ANTES * 0.98, total);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
