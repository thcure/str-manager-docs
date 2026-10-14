// guardia.test.js - prueba la guardia de red sin abrir navegador: node guardia.test.js
'use strict';
const assert = require('assert');
const { decidir, destinoModelo, conDesvio, BASE, BASE_MODELO } = require('./comun');
const B = 'https://app.apartamentosbucaramanga.com';
const F = 'https://fabrica.apartamentosbucaramanga.com';   // v0.5.3: servicio del modelo (M8)
// lecturas simuladas de la semilla fija (lo que haría ctx.on('response') con GET /api/col/...)
require('./comun').registrarLeidos(JSON.stringify({ items: [{ id: 'art-zz-1', data: { nombre: 'zz-verif-Toalla' } }, { id: 'dep-zz-1', data: { nombre: 'zz-verif-Principal' } }, { id: 'art-real-7', data: { nombre: 'Toalla' } }] }));
const casos = [
  [B + '/str-app-shell.html', 'GET', '', true],
  [B + '/api/col', 'POST', '{"items":[{"id":"real-1"}]}', false],
  [B + '/api/col', 'POST', '{"items":[{"id":"zz-verif-Flujo"}]}', true],
  [B + '/modelo/api/eco', 'POST', '{"prueba":1}', true],
  [B + '/api/usuarios/5', 'PUT', '{"rol":"admin"}', false],
  ['https://evil.example.com/x', 'GET', '', false],
  ['https://securetoken.googleapis.com/v1/token', 'POST', 'grant_type=refresh_token', true],
  ['https://www.google-analytics.com/collect', 'POST', '', false],
  ['https://raw.githubusercontent.com/thcure/str-manager-docs/main/interno/seguimiento.json', 'GET', '', true],
  ['https://api.github.com/repos/thcure/str-manager-docs/commits/main', 'GET', '', true],
  ['https://api.github.com/repos/thcure/str-manager-docs/contents/x', 'PUT', '{}', false],
  [B + '/modelo/api/cargar', 'POST', '{}', true],
  [B + '/modelo/api/cargar', 'POST', '{"proyecto":"str","tablas":{}}', false],
  [B + '/modelo/api/credenciales', 'POST', '{}', true],
  [B + '/modelo/api/credenciales', 'POST', '{"credenciales":[]}', false],
  [B + '/api/col/propiedades', 'PUT', '{"items":[{"id":"a","data":{"nombre":"zz-verif-Propiedad-2"}}],"deleted":[]}', true],
  [B + '/api/col/propiedades', 'PUT', '{"items":[{"id":"a","data":{"nombre":"zz-verif-Propiedad-2"}},{"id":"b","data":{"nombre":"Real"}}],"deleted":[]}', false],
  [B + '/api/col/propiedades', 'PUT', '{"items":[{"id":"a","data":{"nombre":"zz-verif-P"}}],"deleted":["b"]}', false],
  [B + '/api/col/propiedades', 'PUT', '{"items":[],"deleted":["a"]}', true],
  [B + '/api/col/propiedades', 'PUT', '{"items":[],"deleted":["real-9"]}', false],
  [B + '/api/col/prop-tipos', 'PUT', '{"items":[{"id":"t","data":{"nombre":"Apto"}}]}', false],
  [B + '/api/col/flujos', 'PUT', 'no-json zz-verif-', false],
  [F + '/modelo/api/salud', 'GET', '', true],
  // v0.5.6 (LM-35): turno zz-verif- creado en esta corrida -> sus movimientos y fotos pasan; los de otro turno no
  [B + '/api/col/turnos', 'PUT', '{"items":[{"id":"sh-m-zz1","data":{"propName":"zz-verif-Propiedad"}}],"deleted":[]}', true],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-1","data":{"turnoId":"sh-m-zz1","cantidad":3}}],"deleted":[]}', true],
  // ajuste de Diseño (M-359): el artículo y la zona del movimiento también deben ser zz-verif- (subidos o leídos)
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-5","data":{"turnoId":"sh-m-zz1","articuloId":"art-real-7","cantidad":1}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-6","data":{"turnoId":"sh-m-zz1","articuloId":"art-zz-1","depositoId":"dep-zz-1","cantidad":1}}],"deleted":[]}', true],
  // v0.5.10 (M-384): pendiente zz de la corrida -> su recepción pasa; con proveedor real, no
  [B + '/api/col/inv-pendientes', 'PUT', '{"items":[{"id":"pd-zz1","data":{"turnoId":"sh-m-zz1","nota":"zz-verif-pendiente"}}],"deleted":[]}', true],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-10","data":{"pendienteId":"pd-zz1","tipo":"recepcion","articuloId":"art-zz-1"}}],"deleted":[]}', true],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-11","data":{"pendienteId":"pd-zz1","tipo":"lavanderia","proveedorId":"prov-real-1"}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-12","data":{"pendienteId":"pd-real-9","tipo":"recepcion"}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-8","data":{"turnoId":"sh-m-zz1","origen":{"depositoId":"dep-real-2"},"articuloId":"art-zz-1"}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-7","data":{"turnoId":"sh-m-zz1","articuloId":"art-zz-1","depositoId":"dep-real-2","cantidad":1}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-2","data":{"turnoId":"sh-m-real","cantidad":3}}],"deleted":[]}', false],
  [B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-3","data":{"turnoId":"sh-m-zz1"}},{"id":"mv-4","data":{"turnoId":"sh-m-real"}}],"deleted":[]}', false],
  [B + '/api/upload', 'POST', '------b\r\nContent-Disposition: form-data; name="ref"\r\n\r\nsh-m-zz1\r\n------b\r\nContent-Disposition: form-data; name="file"; filename="foto.jpg"\r\n\r\n\xff\xd8\r\n------b--', true],
  [B + '/api/upload', 'POST', '------b\r\nContent-Disposition: form-data; name="ref"\r\n\r\nsh-m-real\r\n------b--', false],
  [B + '/api/upload', 'POST', '', false],
  [B + '/api/upload', 'POST', 'zz-verif- sin ref', false],
  [F + '/modelo/api/eco', 'POST', '{"prueba":1}', true],
  [F + '/modelo/api/cargar', 'POST', '{}', true],
  [F + '/modelo/api/credenciales', 'POST', '{}', true],
  [F + '/modelo/api/cargar', 'POST', '{"proyecto":"str","tablas":{}}', false],
  [F + '/api/col/propiedades', 'PUT', '{"items":[{"id":"a","data":{"nombre":"zz-verif-P"}}],"deleted":[]}', false],
  ['https://pruebas.apartamentosbucaramanga.com/api/health', 'GET', '', false],
];
require('./comun').GUARDIA.v5 = true;   // v0.5.12: la tabla es la de la ampliación v5
let n = 0;
for (const [url, m, body, esperado] of casos) { assert.strictEqual(decidir(url, m, body).ok, esperado, m + ' ' + url); n++; }
assert.strictEqual(destinoModelo(B + '/modelo/api/salud'), F + '/modelo/api/salud'); assert.strictEqual(destinoModelo(B + '/modelo/api/estado?x=1'), F + '/modelo/api/estado?x=1'); assert.strictEqual(destinoModelo(B + '/api/health'), null); assert.strictEqual(destinoModelo(B + '/modelos.html'), null); assert.strictEqual(destinoModelo(F + '/modelo/api/salud'), null);
assert.strictEqual(BASE, B); assert.strictEqual(BASE_MODELO, F); n += 7;
// conDesvio: page.request.get/post a app./modelo van a la fábrica; lo demás igual y con su this
{
  const vistos = [];
  const req = { get(u) { vistos.push(['get', u, this === req]); return 1; }, post(u, o) { vistos.push(['post', u, o]); return 2; }, otro: 5 };
  const page = { request: req, url() { return B + '/x'; }, nombre: 'p' };
  const p = conDesvio(page);
  assert.strictEqual(p.request.get(B + '/modelo/api/salud'), 1);
  assert.strictEqual(p.request.post(B + '/api/health', { a: 1 }), 2);
  assert.deepStrictEqual(vistos, [['get', F + '/modelo/api/salud', true], ['post', B + '/api/health', { a: 1 }]]);
  assert.strictEqual(p.url(), B + '/x'); assert.strictEqual(p.nombre, 'p'); assert.strictEqual(p.request.otro, 5);
  n += 6;
}
console.log('guardia.test.js: ' + n + ' pruebas OK');

// v0.5.6 (sugerencia de Desarrollo, M-361): otra carga de página = otra corrida sin ids; la cola de reintentos no pasa
{
  const { decidir: dec } = require('./comun');
  const vacio = new Set(), vacioL = new Set();
  const r1 = dec(B + '/api/upload', 'POST', '------b\r\nContent-Disposition: form-data; name="ref"\r\n\r\nsh-m-zz1\r\n------b--', vacio, vacioL);
  const r2 = dec(B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"mv-9","data":{"turnoId":"sh-m-zz1","cantidad":1}}],"deleted":[]}', vacio, vacioL);
  assert.strictEqual(r1.ok, false, 'reintento de foto sin ids de la corrida debe cortarse');
  assert.strictEqual(r2.ok, false, 'reintento de movimiento sin ids de la corrida debe cortarse');
  console.log('guardia.test.js: reintento en otra carga (ids vacíos) → 409 OK');
}

// v0.5.12 (M-390): con v5 apagada decide como la instalada (v0.5.6 + M-359); cada paso lleva nota
{
  const c = require('./comun'); const dec = c.decidir; c.GUARDIA.v5 = false;
  const ids = new Set(['sh-m-zz1', 'pd-zz1', 'art-zz-1']), leid = new Set();
  const col = B + '/api/col/inv-movimientos';
  assert.strictEqual(dec(col, 'PUT', '{"items":[{"id":"mv-20","data":{"pendienteId":"pd-zz1","tipo":"recepcion","articuloId":"art-zz-1"}}],"deleted":[]}', ids, leid).ok, false, 'v5 apagada: pendienteId zz no basta');
  assert.strictEqual(dec(col, 'PUT', '{"items":[{"id":"mv-21","data":{"turnoId":"sh-m-zz1","articuloId":"art-zz-1","proveedorId":"prov-real-1"}}],"deleted":[]}', ids, leid).ok, true, 'v5 apagada: proveedor no se mira (como la instalada)');
  assert.strictEqual(dec(col, 'PUT', '{"items":[{"id":"mv-22","data":{"turnoId":"sh-m-zz1","articuloId":"art-real-7"}}],"deleted":[]}', ids, leid).ok, false, 'artículo real se corta igual');
  const r1 = dec(col, 'PUT', '{"items":[{"id":"mv-23","data":{"turnoId":"sh-m-zz1","articuloId":"art-zz-1"}},{"id":"x","data":{"nombre":"zz-verif-T"}}],"deleted":[]}', ids, leid);
  assert.ok(r1.ok && /1 fila\(s\) con zz-verif-/.test(r1.nota) && /1 fila\(s\) de un turno/.test(r1.nota), 'nota de /api/col: ' + r1.nota);
  const r2 = dec(B + '/api/upload', 'POST', '------b\r\nContent-Disposition: form-data; name="ref"\r\n\r\nsh-m-zz1\r\n------b--', ids, leid);
  assert.ok(r2.ok && /foto/.test(r2.nota), 'nota de upload');
  const r3 = dec(B + '/api/otra', 'POST', '{"nombre":"zz-verif-A"}', ids, leid);
  assert.ok(r3.ok && r3.nota === 'zz-verif- en el cuerpo', 'nota de cuerpo');
  console.log('guardia.test.js: v5 apagada (como la instalada) y notas de paso: 6 OK');
}
