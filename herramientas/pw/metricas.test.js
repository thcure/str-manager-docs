// metricas.test.js — funciones puras de metricas.js (LM-39c). Uso: node --test herramientas/pw/metricas.test.js
const test = require('node:test'), assert = require('node:assert');
const { leerResumen, calcular, semanaDe } = require('./metricas');

const resumen = [
  '﻿2026-10-13 10:00 | OK | L-85-instr-inv2-4-1.md | abc1234 | commit y push',
  '2026-10-13 10:12 | PRUEBAS | L-85-instr-inv2-4-1.md | codigo 1 | Pruebas L-85: rojo - fallan: REQ-INV2-4-2.spec.js c - log\\L-85-pruebas.json',
  '2026-10-13 10:30 | REPROBAR | L-85-instr-inv2-4-1.md | pedido con reprobar\\L-85.txt',
  '2026-10-13 10:41 | PRUEBAS | L-85-instr-inv2-4-1.md | codigo 0 | Pruebas L-85: verde - log\\L-85-pruebas.json',
  '2026-10-13 10:45 | JUEZ | L-85-instr-inv2-4-1.md | sonnet | L-85-veredicto.json',
  '2026-10-14 09:00 | OK | L-90-instr-fix.md | def5678 | commit y push',
  '2026-10-14 09:09 | PRUEBAS | L-90-instr-fix.md | codigo 1 | Pruebas L-90: rojo - fallan: b, REQ-X.spec.js a - log\\L-90-pruebas.json',
  '2026-10-14 09:20 | PRUEBAS | L-91-instr-m.md | codigo 1 | Pruebas L-91: bloqueado - admin: sin sesion - log\\L-91-pruebas.json',
  '2026-10-14 09:30 | GUION | humo-pw | OK  s1',
  '2026-10-06 09:00 | OK | 60-instr-bc1.md | 1111111 | commit y push',
].join('\r\n');

test('leerResumen: tipos, lote, resultado y rojo ajeno', () => {
  const ev = leerResumen(resumen);
  assert.strictEqual(ev.length, 10);
  assert.strictEqual(ev[0].lote, 'L-85'); assert.strictEqual(ev[9].lote, 'L-60');
  assert.strictEqual(ev[1].resultado, 'rojo'); assert.strictEqual(ev[1].ajeno, true);
  assert.strictEqual(ev[6].resultado, 'rojo'); assert.strictEqual(ev[6].ajeno, false);   // falla «b» del lote
  assert.strictEqual(ev[7].resultado, 'bloqueado');
  assert.strictEqual(ev[4].modelo, 'sonnet'); assert.strictEqual(ev[4].veredicto, 'L-85-veredicto.json');
  assert.strictEqual(ev[8].lote, null);
});

test('calcular: corridas, repruebas, rojos ajenos, minutos de cola, aceptados y n.a.', () => {
  const ev = leerResumen(resumen);
  const r = calcular(ev, { 'L-85': { inicio: '2026-10-13T15:30:00Z', fin: '2026-10-13T15:41:00Z', regresion: [] } }, { 'L-85-veredicto.json': { resultado: 'aceptado' } });
  const w = r.semanas.find((s) => s.semana === '2026-10-12');
  assert.strictEqual(w.lotes, 3); assert.strictEqual(w.corridas, 4); assert.strictEqual(w.repruebas, 1);
  assert.strictEqual(w.rojos, 2); assert.strictEqual(w.rojosAjenos, 1); assert.strictEqual(w.pctRojosAjenos, 50); assert.strictEqual(w.bloqueadas, 1);
  assert.strictEqual(w.minColaMedia, 10.7);      // 12, 11 y 9 min
  assert.strictEqual(w.minPwMedia, 11);
  assert.strictEqual(w.aceptados, 1); assert.strictEqual(w.horasConstruidoAceptadoMedia, 0.8);
  assert.strictEqual(w.cuarentena, 'n.a. (LM-39a)'); assert.strictEqual(w.noCorridos, 'n.a. (LM-39b)');
  assert.strictEqual(r.semanas[0].semana, '2026-10-05'); assert.strictEqual(r.semanas[0].lotes, 1);
});

test('calcular: tasa de fallo por caso con alerta a 2 de 5', () => {
  const p = {};
  for (let i = 1; i <= 5; i++) p['L-' + i] = { regresion: [{ guion: 'X.spec.js', c: 'd', ok: i <= 2 ? false : true }, { guion: 'X.spec.js', c: 'e', ok: i === 1 ? false : true }] };
  const r = calcular([], p, {});
  assert.strictEqual(r.casosAlerta.length, 1);
  assert.strictEqual(r.casosAlerta[0].alerta, 'falló 2 de 5 corridas'); assert.deepStrictEqual(r.casosAlerta[0].lotes, ['L-1', 'L-2']);
  assert.strictEqual(r.casos['X.spec.js e'].fallos, 1);
});

test('semanaDe: lunes de la semana', () => {
  assert.strictEqual(semanaDe('2026-10-15'), '2026-10-12'); assert.strictEqual(semanaDe('2026-10-12'), '2026-10-12'); assert.strictEqual(semanaDe('2026-10-18'), '2026-10-12'); assert.strictEqual(semanaDe('2026-10-19'), '2026-10-19');
});
