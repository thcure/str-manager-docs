// tests/hooks.test.js — pruebas de los hooks (A7): funciones puras + dos de proceso con los fixtures de tests/fixtures/hooks/.
// Fuente única: str-manager-docs/herramientas/hooks-cli/hooks.test.js (lo mantiene el Arquitecto; L-130 lo copia a tests/).
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
// LM-22 (M-253): con el patrón perezoso de v1, «modelo/api/config/database.php» abría la carpeta «modelo/» entera.
t('un Alcance con modelo/api/config/database.php no cubre modelo/secrets.php', () => {
  const alcModelo = ' `modelo/api/config/database.php` · `tests/` · `CLAUDE.md`';
  const r = g.evaluar('git commit -m "x"', ['modelo/secrets.php', 'CLAUDE.md'], alcModelo, true);
  assert.equal(r.ok, false); assert.ok(/modelo\/secrets\.php/.test(r.motivo));
  assert.equal(g.evaluar('git commit -m "x"', ['modelo/api/config/database.php', 'CLAUDE.md'], alcModelo, true).ok, true);
});
// v4 (LM-42, M-522): lo escrito tras «no toques» en el Alcance no habilita archivos para el commit (como ruta.js).
t('v4: «no toques api/» no habilita api/ (LM-42)', () => { const a = g.cortarNoToques(' `str-cola-subida.js` · `?v=p5c95` → `p5c96`; no toques `api/` ni `modelo/`'); assert.equal(g.evaluar('git commit -m "x"', ['api/index.php', 'CLAUDE.md'], a, true).ok, false); assert.equal(g.evaluar('git commit -m "x"', ['str-cola-subida.js', 'CLAUDE.md'], a, true).ok, true); });
t('sin alcance (fuera de la cola) no bloquea por archivos', () => assert.equal(g.evaluar('git commit -m "x"', ['loquesea.html', 'CLAUDE.md'], null, true).ok, true));

// v3 (M-467): restaurar un archivo propio sin commit
t('checkout -- sigue bloqueado y apunta a git restore', () => { const r = g.evaluar('git checkout -- str-api.js', [], alcance, null); assert.equal(r.ok, false); assert.ok(/git restore/.test(r.motivo)); });
t('git show HEAD:x > x bloqueado (rodeo)', () => assert.equal(g.evaluar('git show HEAD:tests/e2e/K3b.spec.js > tests/e2e/K3b.spec.js', [], alcance, null).ok, false));
t('git show HEAD:x | tee x bloqueado (rodeo)', () => assert.equal(g.evaluar('git show HEAD:str-api.js | tee str-api.js', [], alcance, null).ok, false));
t('git show HEAD:x sin redirigir pasa (solo mirar)', () => assert.equal(g.evaluar('git show HEAD:str-api.js | head -20', [], alcance, null).ok, true));
t('git restore <archivo del Alcance> pasa', () => assert.equal(g.evaluar('git restore str-api.js', [], alcance, null).ok, true));
t('git restore tests/… (SIEMPRE) pasa', () => assert.equal(g.evaluar('git restore tests/e2e/K3b.spec.js', [], alcance, null).ok, true));
t('git restore fuera del Alcance bloqueado', () => { const r = g.evaluar('git restore str-calendario.html', [], alcance, null); assert.equal(r.ok, false); assert.ok(/fuera del Alcance/.test(r.motivo)); });
t('git restore . bloqueado', () => assert.equal(g.evaluar('git restore .', [], alcance, null).ok, false));
t('git restore con comodín bloqueado', () => assert.equal(g.evaluar('git restore *.html', [], alcance, null).ok, false));
t('git restore --source bloqueado', () => assert.equal(g.evaluar('git restore --source HEAD~1 str-api.js', [], alcance, null).ok, false));
t('git restore --staged archivo pasa', () => assert.equal(g.evaluar('git restore --staged str-api.js', [], alcance, null).ok, true));
t('sin alcance: git restore archivo suelto pasa, «.» no', () => { assert.equal(g.evaluar('git restore loquesea.html', [], null, null).ok, true); assert.equal(g.evaluar('git restore .', [], null, null).ok, false); });
t('stop: tests rojos bloquea', () => assert.equal(s.evaluar(false, { sucio: [], testsOk: false, detalle: '' }).ok, false));
t('stop: cambios sin commit bloquea', () => assert.equal(s.evaluar(false, { sucio: [' M str-api.js'], testsOk: true }).ok, false));
t('stop: limpio y verde pasa', () => assert.equal(s.evaluar(false, { sucio: [], testsOk: true }).ok, true));
t('stop: segunda vez deja terminar', () => assert.equal(s.evaluar(true, { sucio: ['x'], testsOk: false }).ok, true));
// Integración (A7b): los hooks como procesos, con los fixtures de tests/fixtures/hooks/.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const raiz = path.join(__dirname, '..');
const fx = f => fs.readFileSync(path.join(__dirname, 'fixtures', 'hooks', f));
const env = Object.assign({}, process.env, { CLAUDE_PROJECT_DIR: raiz, STR_INSTR: '' });
t('proceso guard-bash: reset --hard sale con 2 y motivo', () => {
  const r = spawnSync(process.execPath, [path.join(raiz, '.claude', 'hooks', 'guard-bash.js')], { input: fx('reset-hard.json'), encoding: 'utf8', env });
  assert.equal(r.status, 2); assert.ok(r.stderr.trim().length > 0);
});
t('proceso ctx: vacío sale con 0 e inyecta las reglas fijas', () => {
  const r = spawnSync(process.execPath, [path.join(raiz, '.claude', 'hooks', 'ctx.js')], { input: fx('vacio.json'), encoding: 'utf8', env });
  assert.equal(r.status, 0); assert.ok(r.stdout.includes(fs.readFileSync(path.join(raiz, 'docs', 'claude', 'reglas-fijas.md'), 'utf8').trim()));
});
console.log('hooks.test.js: ' + n + ' pruebas OK');
