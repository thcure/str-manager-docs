// metricas.spec.js — envoltorio para la cola (LM-39c): correr\metricas.txt → node pw\guion.js metricas.spec.js --lote METRICAS.
// No abre navegador ni escribe en el STR: al cargarse calcula las métricas de log\ con metricas.js y deja log\METRICAS.json.
// guion.js escribe además log\METRICAS-guion.json (sin casos) y la cola pone en _resumen.txt las dos últimas líneas de consola.
'use strict';
const path = require('path');
const { generar, resumenTexto } = require('./metricas');
const COLA = path.resolve(__dirname, '..');
let resumen = 'sin métricas';
try { const r = generar(COLA); resumen = resumenTexto(r); console.log('METRICAS ' + resumen); console.log('log\\METRICAS.json escrito'); }
catch (e) { resumen = 'error: ' + e.message; console.log('METRICAS ' + resumen); }
module.exports = { req: 'LM-39c', zona: 'herramientas', casos: [], resumen };
