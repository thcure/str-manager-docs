// guardia.test.js - prueba la guardia de red sin abrir navegador: node guardia.test.js
'use strict';
const assert = require('assert');
const { decidir, destinoModelo, BASE, BASE_MODELO } = require('./comun');
const B = 'https://app.apartamentosbucaramanga.com';
const F = 'https://fabrica.apartamentosbucaramanga.com';   // v0.5.3: servicio del modelo (M8)
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
  [F + '/modelo/api/eco', 'POST', '{"prueba":1}', true],
  [F + '/modelo/api/cargar', 'POST', '{}', true],
  [F + '/modelo/api/credenciales', 'POST', '{}', true],
  [F + '/modelo/api/cargar', 'POST', '{"proyecto":"str","tablas":{}}', false],
  [F + '/api/col/propiedades', 'PUT', '{"items":[{"id":"a","data":{"nombre":"zz-verif-P"}}],"deleted":[]}', false],
  ['https://pruebas.apartamentosbucaramanga.com/api/health', 'GET', '', false],
];
let n = 0;
for (const [url, m, body, esperado] of casos) { assert.strictEqual(decidir(url, m, body).ok, esperado, m + ' ' + url); n++; }
assert.strictEqual(destinoModelo(B + '/modelo/api/salud'), F + '/modelo/api/salud'); assert.strictEqual(destinoModelo(B + '/modelo/api/estado?x=1'), F + '/modelo/api/estado?x=1'); assert.strictEqual(destinoModelo(B + '/api/health'), null); assert.strictEqual(destinoModelo(B + '/modelos.html'), null); assert.strictEqual(destinoModelo(F + '/modelo/api/salud'), null);
assert.strictEqual(BASE, B); assert.strictEqual(BASE_MODELO, F); n += 7;
console.log('guardia.test.js: ' + n + ' pruebas OK');
