// tests/hooks.test.js — pruebas de las funciones puras de los hooks (A7).
const assert = require('assert');
const g = require('../.claude/hooks/guard-bash.js');
const s = require('../.claude/hooks/stop-check.js');
const alcance = ' `str-app-shell.html` · `str-api.js` · guardas de `str-propiedades.html` · `api/usuarios/index.php` · `tests/` · `CLAUDE.md` · `?v=p5c65` → `p5c66`';
let n = 0; function t(nombre, f) { f(); n++; }
t('destructivo bloqueado', () => assert.equal(g.evaluar('git reset --hard HEAD~1', [], alcance, true).ok, false));
t('push --force bloqueado', () => assert.equal(g.evaluar('git push origin main --force', [], alcance, true).ok, false));
t('comando normal pasa', () => assert.equal(g.evaluar('node tests/run.js', [], alcance, null).ok, true));
t('commit dentro de alcance con CLAUDE.md pasa', () => assert.equal(g.evaluar('git commit -m "x"', ['str-api.js', 'CLAUDE.md'], alcance, true).ok, true));
t('commit sin CLAUDE.md bloqueado', () => assert.equal(g.evaluar('git commit -m "x"', ['str-api.js'], alcance, true).ok, false));
t('commit con docs/claude en vez de CLAUDE.md pasa', () => assert.equal(g.evaluar('git commit -m "x"', ['str-api.js', 'docs/claude/shell-y-api.md'], alcance, true).ok, true));
t('commit fuera de alcance bloqueado', () => { const r = g.evaluar('git commit -m "x"', ['str-calendario.html', 'CLAUDE.md'], alcance, true); assert.equal(r.ok, false); assert.ok(/str-calendario\.html/.test(r.motivo)); });
t('commit fuera de alcance declarado pasa', () => assert.equal(g.evaluar('git commit -m "x\n\nFuera de alcance: str-calendario.html - comparte la función de fechas"', ['str-calendario.html', 'CLAUDE.md'], alcance, true).ok, true));
t('carpeta api/usuarios/ cubre sus archivos', () => assert.equal(g.evaluar('git commit -m "x"', ['api/usuarios/index.php', 'CLAUDE.md'], alcance, true).ok, true));
t('tests rojos bloquean el commit', () => assert.equal(g.evaluar('git commit -m "x"', ['str-api.js', 'CLAUDE.md'], alcance, false).ok, false));
t('sin alcance (fuera de la cola) no bloquea por archivos', () => assert.equal(g.evaluar('git commit -m "x"', ['loquesea.html', 'CLAUDE.md'], null, true).ok, true));
t('stop: tests rojos bloquea', () => assert.equal(s.evaluar(false, { sucio: [], testsOk: false, detalle: '' }).ok, false));
t('stop: cambios sin commit bloquea', () => assert.equal(s.evaluar(false, { sucio: [' M str-api.js'], testsOk: true }).ok, false));
t('stop: limpio y verde pasa', () => assert.equal(s.evaluar(false, { sucio: [], testsOk: true }).ok, true));
t('stop: segunda vez deja terminar', () => assert.equal(s.evaluar(true, { sucio: ['x'], testsOk: false }).ok, true));
console.log('hooks.test.js: ' + n + ' pruebas OK');
