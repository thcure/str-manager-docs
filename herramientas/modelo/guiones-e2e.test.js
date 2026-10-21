// guiones-e2e.test.js — palabras clave y referencia cruzada (V11, LM-62). Uso: node --test herramientas/modelo/guiones-e2e.test.js
const test = require('node:test'), assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const { palabrasDe, foto, BIBLIOTECA } = require('./guiones-e2e');

test('palabrasDe cuenta h.<palabra> por guion', () => {
  assert.deepStrictEqual(palabrasDe("h.espera(a, 'x'); await h.captura('p'); h.espera(b, 'y'); h.dato('n'); h.page.click('#a')"), { espera: 2, captura: 1, dato: 1, page: 1 });
});

test('foto: referencia cruzada, desconocidas, sin uso y tec', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-'));
  fs.writeFileSync(path.join(dir, 'A.spec.js'), "module.exports = { req: 'REQ-A-1', zona: ['CAL'], casos: [{ c: 'a', tec: 'escenario', cubre: ['CAL'], async prueba(h) { h.espera(true, 'ok'); await h.captura('x'); } }] };");
  fs.writeFileSync(path.join(dir, 'B.spec.js'), "module.exports = { req: 'INC-9', zona: ['OP'], casos: [{ c: 'b', async prueba(h) { h.espera(1, 'u'); h.espera(1, 'v'); h.inventada(); } }], async limpiar(h) { h.espera(1, 'l'); } };");
  const r = foto(dir);
  assert.deepStrictEqual(r.guiones['A.spec.js'].palabrasClave, { espera: 1, captura: 1 });
  assert.strictEqual(r.guiones['A.spec.js'].casos[0].tec, 'escenario'); assert.strictEqual('tec' in r.guiones['B.spec.js'].casos[0], false);
  assert.deepStrictEqual(r.referenciaCruzada.espera, { guiones: 2, usos: 4 });
  assert.deepStrictEqual(r.palabrasDesconocidas, ['inventada']);
  assert.ok(r.palabrasSinUso.includes('dato') && r.palabrasSinUso.includes('respuesta') && !r.palabrasSinUso.includes('espera'));
  assert.ok(BIBLIOTECA.captura);
});
