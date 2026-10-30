// aplicar.test.js — v0.15.1: K1 se lee del commit del lote (ref), no de HEAD. node --test aplicar.test.js
'use strict';
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path'), { execSync } = require('child_process');
const APL = require('./aplicar');
function repoTemporal() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'pw-aplicar-'));
  const g = (c) => execSync('git ' + c, { cwd: d, encoding: 'utf8', env: Object.assign({}, process.env, { GIT_AUTHOR_NAME: 'pw', GIT_AUTHOR_EMAIL: 'pw@local', GIT_COMMITTER_NAME: 'pw', GIT_COMMITTER_EMAIL: 'pw@local' }) });
  g('init -q'); fs.writeFileSync(path.join(d, 'a.md'), 'uno\n'); g('add -A'); g('commit -q -m base');
  fs.writeFileSync(path.join(d, 'a.md'), 'uno\nDOS de L-1\n'); g('add -A'); g('commit -q -m "lote uno" -m "Lote: L-1 · REQ-1 · Casos de uso: CU-1"');
  const c1 = g('rev-parse HEAD').trim();
  fs.writeFileSync(path.join(d, 'a.md'), 'uno\nDOS de L-2 (pisa a L-1)\n'); g('add -A'); g('commit -q -m "lote dos" -m "Lote: L-2 · REQ-2 · Casos de uso: CU-1"');
  const c2 = g('rev-parse HEAD').trim();
  return { d, c1, c2 };
}
test('commitDeLote encuentra el commit por su línea «Lote: L-n ·»', () => {
  const { d, c1, c2 } = repoTemporal();
  assert.strictEqual(APL.commitDeLote(d, 'L-1'), c1);
  assert.strictEqual(APL.commitDeLote(d, 'L-2'), c2);
  assert.strictEqual(APL.commitDeLote(d, 'L-9'), null);
});
test('leerCommit con ref lee los archivos del commit del lote, no de HEAD', () => {
  const { d, c1 } = repoTemporal();
  const head = APL.leerCommit(d, ['a.md']);
  const viejo = APL.leerCommit(d, ['a.md'], c1);
  assert.match(head.archivos['a.md'], /L-2/); assert.strictEqual(head.ref, 'HEAD');
  assert.match(viejo.archivos['a.md'], /DOS de L-1/); assert.strictEqual(viejo.ref, c1);
  assert.match(viejo.mensaje, /Lote: L-1/); assert.strictEqual(viejo.numstat.length, 1);
});
test('revisarCommit con ref da K1 en verde para la instrucción del lote pisado', () => {
  const { d, c1 } = repoTemporal();
  const instr = '# instr — L-1\nAlcance: `a.md`\n\n## 1. Cambio\n**D1 ·** en `a.md`. Busca:\n```\nuno\n```\nPon:\n```\nuno\nDOS de L-1\n```\n';
  const sobreHead = APL.revisarCommit(instr, d, {});
  const sobreLote = APL.revisarCommit(instr, d, { ref: c1 });
  assert.strictEqual(sobreHead.aplicacion.ok, false, 'HEAD ya no trae el Pon de L-1');
  assert.strictEqual(sobreLote.aplicacion.ok, true, 'el commit del lote sí lo trae');
  assert.strictEqual(sobreLote.ref, c1);
});
