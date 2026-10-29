// guardia.test.js - prueba la guardia de red sin abrir navegador: node guardia.test.js
'use strict';
const assert = require('assert');
const { decidir, destinoModelo, conDesvio, BASE, BASE_MODELO } = require('./comun');
const B = 'https://app.apartamentosbucaramanga.com';
const F = 'https://herramienta-fabrica.apartamentosbucaramanga.com';   // v0.13.0 (LM-79): servicio del modelo en herramienta-fabrica.
const FV = 'https://fabrica.apartamentosbucaramanga.com';  // fabrica.: redirige mientras dure la mudanza; mismas reglas
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
  // v0.6.2 (LM-43, DA-44): ensayo de restauración (DT-42). Solo las dos rutas, solo POST y solo con la marca del cuerpo.
  [B + '/api/restauracion/ensayo', 'POST', '{"archivo":"2026-10-15","confirmo":"zz-verif-restauracion"}', true],
  [B + '/api/restauracion/ensayo', 'POST', '{"archivo":"2026-10-15"}', false],
  [B + '/api/restauracion/ensayo', 'POST', '{"archivo":"2026-10-15","confirmo":"negocio"}', false],
  [B + '/api/restauracion/ensayo', 'POST', 'no-json', false],
  [B + '/api/restauracion/borrar', 'POST', '{"cuenta":7,"nombre":"zz-verif-restauracion-negocio-2026-10-15-203000"}', true],
  [B + '/api/restauracion/borrar', 'POST', '{"cuenta":1,"nombre":"negocio"}', false],
  [B + '/api/restauracion/borrar', 'POST', '{"cuenta":1,"nombre":"zz-verif-Propiedad"}', false],
  [B + '/api/restauracion/borrar', 'POST', '{"cuenta":1}', false],
  [B + '/api/restauracion/constancia?cuenta=7', 'GET', '', true],
  [B + '/api/restauracion/otra', 'POST', '{"confirmo":"zz-verif-restauracion"}', false],
];
require('./comun').GUARDIA.v5 = true;   // v0.5.12: la tabla es la de la ampliación v5
let n = 0;
for (const [url, m, body, esperado] of casos) { assert.strictEqual(decidir(url, m, body).ok, esperado, m + ' ' + url); n++; }
assert.strictEqual(destinoModelo(B + '/modelo/api/salud'), F + '/modelo/api/salud'); assert.strictEqual(destinoModelo(B + '/modelo/api/estado?x=1'), F + '/modelo/api/estado?x=1'); assert.strictEqual(destinoModelo(B + '/api/health'), null); assert.strictEqual(destinoModelo(B + '/modelos.html'), null); assert.strictEqual(destinoModelo(F + '/modelo/api/salud'), null);
assert.strictEqual(BASE, B); assert.strictEqual(BASE_MODELO, F); n += 7;
// v0.13.0: el host viejo sigue en la lista con las reglas del modelo (lectura sí, login y escrituras no)
assert.strictEqual(decidir(FV + '/modelo/api/salud', 'GET', '').ok, true, 'GET al host viejo del modelo sí');
assert.strictEqual(decidir(FV + '/api/login', 'POST', '{}').ok, false, 'POST /api/login al host viejo del modelo no'); n += 2;
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

// v0.5.14 (M-396/M-397): pendiente creado por el servidor con turnoOrigenId de un turno zz de la corrida (v51)
{
  const c = require('./comun'); const dec = c.decidir;
  const ids = new Set(['sh-m-zz1', 'art-zz-1']), leid = new Set();
  const lectura = JSON.stringify({ items: [{ id: 'pd-30', data: { turnoOrigenId: 'sh-m-zz1', juegoId: 'jg-zz-1' } }, { id: 'pd-31', data: { turnoOrigenId: 'sh-m-real' } }] });
  const mov = id => '{"items":[{"id":"mv-3' + id + '","data":{"pendienteId":"pd-3' + id + '","tipo":"recepcion","articuloId":"art-zz-1"}}],"deleted":[]}';
  const col = B + '/api/col/inv-movimientos';
  c.GUARDIA.v5 = true; c.GUARDIA.v51 = false;
  assert.strictEqual(c.registrarDescendientes(lectura, ids), 0, 'v51 apagada: no registra');
  assert.strictEqual(dec(col, 'PUT', mov(0), ids, leid).ok, false, 'v51 apagada: movimiento de un pendiente del servidor se corta');
  c.GUARDIA.v51 = true;
  assert.strictEqual(c.registrarDescendientes(lectura, ids), 1, 'v51: registra solo el pendiente del turno zz');
  assert.strictEqual(dec(col, 'PUT', mov(0), ids, leid).ok, true, 'v51: su movimiento pasa');
  assert.strictEqual(dec(col, 'PUT', mov(1), ids, leid).ok, false, 'pendiente de un turno real: 409');
  assert.strictEqual(dec(col, 'PUT', '{"items":[{"id":"mv-32","data":{"pendienteId":"pd-30","proveedorId":"prov-real-1"}}],"deleted":[]}', ids, leid).ok, false, 'proveedor real: 409');
  assert.strictEqual(c.registrarDescendientes(JSON.stringify({ id: 'pd-40', turnoOrigenId: 'sh-m-zz1' }), ids), 1, 'respuesta suelta (PUT del turno) también');
  c.GUARDIA.v51 = false;
  console.log('guardia.test.js: v51 (pendientes del servidor con turnoOrigenId): 7 OK');
}

// v0.5.16 (M-400): cerrar o reasignar por PUT un pendiente de la corrida (v52)
{
  const c = require('./comun'); const dec = c.decidir;
  const ids = new Set(['sh-m-zz1', 'pd-50', 'mv-50', 'prov-zz-1', 'gr-zz-1']), leid = new Set();
  const col = B + '/api/col/inv-pendientes';
  const fila = data => JSON.stringify({ items: [{ id: data.id || 'pd-50', data: Object.assign({ turnoOrigenId: 'sh-m-zz1' }, data, { id: undefined }) }], deleted: [] });
  c.GUARDIA.v5 = true; c.GUARDIA.v51 = true; c.GUARDIA.v52 = false;
  assert.strictEqual(dec(col, 'PUT', fila({ estado: 'hecho', movimientoId: 'mv-50' }), ids, leid).ok, false, 'v52 apagada: cerrar se corta');
  c.GUARDIA.v52 = true;
  const r = dec(col, 'PUT', fila({ estado: 'hecho', movimientoId: 'mv-50' }), ids, leid);
  assert.ok(r.ok && /turno o pendiente zz/.test(r.nota), 'v52: cerrar pasa');
  assert.strictEqual(dec(col, 'PUT', fila({ proveedorId: 'prov-zz-1', grupoId: 'gr-zz-1' }), ids, leid).ok, true, 'reasignar con proveedor y grupo zz pasa');
  assert.strictEqual(dec(col, 'PUT', fila({ proveedorId: 'prov-real-1' }), ids, leid).ok, false, 'proveedor real: 409');
  assert.strictEqual(dec(col, 'PUT', fila({ grupoId: 'gr-real-1' }), ids, leid).ok, false, 'grupo real: 409');
  assert.strictEqual(dec(col, 'PUT', fila({ id: 'pd-nuevo', estado: 'abierto' }), ids, leid).ok, false, 'crear un pendiente (id que la corrida no tiene): 409');
  assert.strictEqual(dec(col, 'PUT', fila({ turnoOrigenId: 'sh-m-real' }), ids, leid).ok, false, 'cambiar el turno de origen a uno real: 409');
  assert.strictEqual(dec(B + '/api/col/inv-movimientos', 'PUT', fila({ estado: 'hecho' }), ids, leid).ok, false, 'solo en inv-pendientes');
  c.GUARDIA.v52 = false;
  console.log('guardia.test.js: v52 (cerrar o reasignar pendientes de la corrida): 8 OK');
}

// v0.5.19 (M-404, s11): v53, inv-pendientes con texto zz-verif- pero juego real se corta
{
  const c = require('./comun'); const dec = c.decidir;
  const ids = new Set(), leid = new Set(['gr-zz-1', 'prov-zz-1']);
  const col = B + '/api/col/inv-pendientes';
  const cierre = g => JSON.stringify({ items: [{ id: 'pd-viejo', data: { grupoId: g, proveedorId: 'prov-zz-1', turnoOrigenId: 'sh-m-viejo', estado: 'hecho', cerradoNota: 'zz-verif- cierre de semilla' } }], deleted: [] });
  c.GUARDIA.v53 = false;
  assert.strictEqual(dec(col, 'PUT', cierre('gr-real-1'), ids, leid).ok, true, 'sin v53: el texto bastaba (hueco)');
  c.GUARDIA.v53 = true;
  assert.strictEqual(dec(col, 'PUT', cierre('gr-zz-1'), ids, leid).ok, true, 's11: pendiente de un juego zz (leído) se cierra');
  assert.strictEqual(dec(col, 'PUT', cierre('gr-real-1'), ids, leid).ok, false, 'v53: juego real con nota zz-verif-: 409');
  assert.strictEqual(dec(B + '/api/col/inv-movimientos', 'PUT', '{"items":[{"id":"m","data":{"nombre":"zz-verif-x","grupoId":"gr-real-1"}}],"deleted":[]}', ids, leid).ok, true, 'v53 solo mira inv-pendientes');
  console.log('guardia.test.js: v53 (pendientes con texto zz pero juego real): 4 OK');
}

// v0.5.25 (M-433): el inicio de sesión del STR pasa; nada parecido pasa por arrastre
{
  const dl = decidir(B + '/api/login', 'POST', '{"idToken":"x"}');
  assert.strictEqual(dl.ok, true, 'POST /api/login pasa');
  assert.ok(/inicio de sesión/.test(dl.nota), 'con su nota');
  assert.strictEqual(decidir(B + '/api/login', 'PUT', '{}').ok, false, 'PUT /api/login no');
  assert.strictEqual(decidir(B + '/api/login2', 'POST', '{}').ok, false, 'POST /api/login2 no');
  assert.strictEqual(decidir(B + '/api/logout', 'POST', '{}').ok, false, 'POST /api/logout no (no hace falta)');
  assert.strictEqual(decidir(BASE_MODELO + '/api/login', 'POST', '{}').ok, false, 'POST /api/login al modelo no');
  console.log('guardia.test.js: sesión (POST /api/login): 6 OK');
}

// v0.5.29 (M-475): corte de prueba de Drive
{
  const ids = new Set(['sh-m-zz1']);
  const d = (url, cuerpo) => decidir(B + url, 'POST', cuerpo, ids, new Set());
  assert.strictEqual(d('/api/drive/corte-prueba', '{"ref":"sh-m-zz1","dia":0}').ok, true, 'ref creada como zz en la corrida: pasa');
  assert.strictEqual(d('/api/drive/corte-prueba', '{"ref":"sh-m-real9","dia":0}').ok, false, 'ref ajena: no');
  assert.strictEqual(d('/api/drive/corte-prueba', '{"ref":"sh-m-real9","dia":0,"nota":"zz-verif-x"}').ok, false, 'zz-verif- en el cuerpo no basta');
  assert.strictEqual(d('/api/drive/corte-prueba', '{"ref":"zz-verif-otra"}').ok, false, 'ref con texto zz pero no de la corrida: no');
  assert.strictEqual(d('/api/drive/corte', '{}').ok, false, 'pasada programada del corte: nunca');
  assert.strictEqual(d('/api/drive/cron', '{"zz-verif-":1}').ok, false, 'pasada programada de la copia: nunca');
  console.log('guardia.test.js: corte de prueba de Drive: 6 OK');
}

// v0.5.32 (recuperar sesión con «Continuar con Google»): la ventana de Google solo pasa mientras RECUPERANDO.activo
{
  const { RECUPERANDO } = require('./comun');
  const g = (url, metodo) => decidir(url, metodo || 'GET', null, new Set(), new Set());
  assert.strictEqual(g('https://accounts.google.com/o/oauth2/auth?x=1').ok, false, 'fuera de la recuperación: accounts.google.com no pasa');
  RECUPERANDO.activo = true;
  try {
    assert.strictEqual(g('https://accounts.google.com/o/oauth2/auth?x=1').ok, true, 'durante la recuperación: accounts.google.com pasa');
    assert.strictEqual(g('https://str-hospedaje.firebaseapp.com/__/auth/handler').ok, true, 'durante la recuperación: el manejador de Firebase pasa');
    assert.strictEqual(g('https://accounts.google.com/signin/x', 'POST').ok, true, 'durante la recuperación: POST a Google pasa');
    assert.strictEqual(g(B + '/api/login', 'POST').ok, true, 'durante la recuperación: POST /api/login pasa (como siempre)');
    assert.strictEqual(g(B + '/api/col/turnos', 'PUT').ok, false, 'durante la recuperación: una escritura al STR sin zz sigue cortada');
    assert.strictEqual(g('https://evil.example.com/x').ok, false, 'durante la recuperación: otro host sigue fuera');
  } finally { RECUPERANDO.activo = false; }
  assert.strictEqual(g('https://accounts.google.com/o/oauth2/auth').ok, false, 'después: accounts.google.com vuelve a no pasar');
  console.log('guardia.test.js: recuperación de sesión: 8 OK');
}
