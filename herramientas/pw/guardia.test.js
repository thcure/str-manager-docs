// guardia.test.js - prueba la guardia de red sin abrir navegador: node guardia.test.js
'use strict';
const assert = require('assert');
const { decidir } = require('./comun');
const B = 'https://app.apartamentosbucaramanga.com';
const casos = [
  [B + '/str-app-shell.html', 'GET', '', true],
  [B + '/api/col', 'POST', '{"items":[{"id":"real-1"}]}', false],
  [B + '/api/col', 'POST', '{"items":[{"id":"zz-verif-Flujo"}]}', true],
  [B + '/modelo/api/eco', 'POST', '{"prueba":1}', true],
  [B + '/api/usuarios/5', 'PUT', '{"rol":"admin"}', false],
  ['https://evil.example.com/x', 'GET', '', false],
  ['https://securetoken.googleapis.com/v1/token', 'POST', 'grant_type=refresh_token', true],
  ['https://www.google-analytics.com/collect', 'POST', '', false],
];
let n = 0;
for (const [url, m, body, esperado] of casos) { assert.strictEqual(decidir(url, m, body).ok, esperado, m + ' ' + url); n++; }
console.log('guardia.test.js: ' + n + ' pruebas OK');
