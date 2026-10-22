// Pruebas de las funciones puras de rafaga.spec.js (LM-68). Correr: node herramientas/pw/rafaga.test.js
const assert = require('assert');
const { _puras: P } = require('./rafaga.spec.js');
// ventana 22:30–05:30
assert.strictEqual(P.enVentana(22 * 60 + 30), true);
assert.strictEqual(P.enVentana(23 * 60 + 59), true);
assert.strictEqual(P.enVentana(0), true);
assert.strictEqual(P.enVentana(5 * 60 + 29), true);
assert.strictEqual(P.enVentana(5 * 60 + 30), false);
assert.strictEqual(P.enVentana(22 * 60 + 29), false);
assert.strictEqual(P.enVentana(12 * 60), false);
// rojo
assert.strictEqual(P.esRojo(null), true);
assert.strictEqual(P.esRojo({ error: 'Failed to fetch' }), true);
assert.strictEqual(P.esRojo({ status: 200, texto: '[]' }), false);
assert.strictEqual(P.esRojo({ status: 403, texto: '{"error":"sin permiso"}' }), false);
assert.strictEqual(P.esRojo({ status: 500, texto: '{"error":"Base de datos no disponible"}' }), true);
assert.strictEqual(P.esRojo({ status: 500, texto: 'otra cosa' }), true);
assert.strictEqual(P.esRojo({ status: 200, texto: 'SQLSTATE 1040 Too many connections' }), true);
assert.strictEqual(P.esRojo({ status: 200, texto: 'error 1203 User already has more than max_user_connections' }), true);
assert.strictEqual(P.esRojo({ status: 200, texto: 'id 11040' }), false);
// 12 colecciones distintas, sin escrituras
assert.strictEqual(P.COLECCIONES.length, P.PARALELAS);
assert.strictEqual(new Set(P.COLECCIONES).size, P.PARALELAS);
assert.strictEqual(P.UMBRAL, 60);
console.log('rafaga.test.js: 20 comprobaciones OK');
