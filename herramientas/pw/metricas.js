// metricas.js — métricas de calidad de las pruebas (LM-39c, MJ-8). Solo lee log\: no cambia qué se prueba ni qué se acepta.
// Fuentes (RT-4: se calculan, no se copian a mano):
//   log\_resumen.txt           líneas «fecha hora | TIPO | archivo | …»: OK (commit), PRUEBAS (cada corrida: verde/rojo/bloqueado),
//                              REPROBAR (pedido), JUEZ (veredicto), FALLO, GUION…
//   log\L-n-pruebas.json       la ÚLTIMA corrida de cada lote (inicio, fin, resultado, n2[], regresion[] con guion/c/ok)
//   log\L-n-veredicto*.json    resultado del juez (aceptado | parcial | no aceptado…)
// Salida: log\METRICAS.json {generadoEn, semanas:[{semana, lotes, corridas, repruebas, rojos, rojosAjenos, bloqueadas, minPwMedia,
//   minColaMedia, aceptados, horasConstruidoAceptado, casosAlerta[], noCorridos:'n.a.', cuarentena:'n.a.'}], casos:{…}, lineaBase}
// Uso: correr\metricas.txt (la cola) → pw\metricas.spec.js → generar(COLA). A mano: node metricas.js [carpeta de la cola].
'use strict';
const fs = require('fs'), path = require('path');

const RE_LINEA = /^﻿?(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}) \| ([A-Z]+) \| ([^|]*?) \|(.*)$/;
const LOTE_DE = (archivo) => { const m = String(archivo || '').match(/^(?:L-)?(\d+)-instr/); return m ? 'L-' + m[1] : null; };

// Lunes (AAAA-MM-DD) de la semana de una fecha local
function semanaDe(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const dia = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dia);
  return d.toISOString().slice(0, 10);
}
const min = (a, b) => (new Date(b) - new Date(a)) / 60000;

// Puro: eventos por lote a partir de las líneas del resumen.
function leerResumen(texto) {
  const ev = [];
  for (const l of String(texto || '').split(/\r?\n/)) {
    const m = l.match(RE_LINEA); if (!m) continue;
    const [, fecha, hora, tipo, archivo, resto] = m;
    const e = { fecha, hora, t: fecha + 'T' + hora + ':00', tipo, archivo: archivo.trim(), resto: resto.trim(), lote: LOTE_DE(archivo.trim()) };
    if (tipo === 'PRUEBAS') {
      const r = /Pruebas [^:]+: (verde|rojo|bloqueado)(?: - (.*?))? - log\\/.exec(e.resto) || /: (verde|rojo|bloqueado)/.exec(e.resto);
      e.resultado = r ? r[1] : null; e.causa = r && r[2] ? r[2] : '';
      // rojo ajeno: todo lo que falla es de otro guion (lleva .spec.js); los casos del lote van como letra sola
      if (e.resultado === 'rojo') {
        const items = (e.causa.replace(/^fallan:\s*/, '') || '').split(/,\s*/).map((x) => x.trim()).filter(Boolean);
        e.fallan = items; e.ajeno = items.length > 0 && items.every((x) => /\.spec\.js/.test(x));
      }
    }
    if (tipo === 'JUEZ') { const v = e.resto.split('|').map((x) => x.trim()); e.modelo = v[0] || null; e.veredicto = v[1] || null; }
    ev.push(e);
  }
  return ev;
}

// Puro: métricas por semana y por caso.
function calcular(eventos, pruebas = {}, veredictos = {}, opciones = {}) {
  const umbral = opciones.umbralFallos || 2, umbralTasa = opciones.umbralTasa || 0.3;
  const porSemana = {};
  const S = (f) => (porSemana[semanaDe(f)] = porSemana[semanaDe(f)] || { semana: semanaDe(f), lotes: new Set(), corridas: 0, verdes: 0, rojos: 0, rojosAjenos: 0, bloqueadas: 0, minCola: [], minPw: [], aceptados: 0, noAceptados: 0, horasCA: [], repruebasPorLote: {} });
  const ultimoArranque = {};   // lote → hora del último OK o REPROBAR (inicio de la corrida)
  const commitDe = {};
  for (const e of eventos) {
    if (!e.lote) continue;
    if (e.tipo === 'OK') { S(e.fecha).lotes.add(e.lote); ultimoArranque[e.lote] = e.t; commitDe[e.lote] = commitDe[e.lote] || e.t; }
    if (e.tipo === 'REPROBAR') ultimoArranque[e.lote] = e.t;
    if (e.tipo === 'PRUEBAS') {
      const s = S(e.fecha); s.corridas++; s.lotes.add(e.lote);
      s.repruebasPorLote[e.lote] = (s.repruebasPorLote[e.lote] || 0) + 1;
      if (e.resultado === 'verde') s.verdes++; else if (e.resultado === 'rojo') { s.rojos++; if (e.ajeno) s.rojosAjenos++; } else if (e.resultado === 'bloqueado') s.bloqueadas++;
      if (ultimoArranque[e.lote]) { const mm = min(ultimoArranque[e.lote], e.t); if (mm >= 0 && mm < 240) s.minCola.push(mm); }
    }
    if (e.tipo === 'JUEZ') {
      const v = veredictos[e.veredicto] || veredictos[e.lote];
      if (v && v.resultado) {
        const s = S(e.fecha);
        if (v.resultado === 'aceptado') { s.aceptados++; if (commitDe[e.lote]) s.horasCA.push(min(commitDe[e.lote], e.t) / 60); }
        else if (/no aceptado|rechaz/i.test(v.resultado)) s.noAceptados++;
      }
    }
  }
  for (const [lote, p] of Object.entries(pruebas)) {
    if (p && p.inicio && p.fin) { const s = S(String(p.inicio).slice(0, 10)); const mm = min(p.inicio, p.fin); if (mm >= 0) s.minPw.push(mm); }
  }
  // Tasa de fallo por caso (última corrida de cada lote: regresion[] y n2[])
  const casos = {};
  for (const [lote, p] of Object.entries(pruebas)) {
    for (const r of (p && p.regresion) || []) {
      const k = r.guion + ' ' + r.c; const c = (casos[k] = casos[k] || { guion: r.guion, c: r.c, corridas: 0, fallos: 0, lotes: [] });
      c.corridas++; if (r.ok === false) { c.fallos++; c.lotes.push(lote); }
    }
  }
  const casosAlerta = Object.values(casos).filter((c) => c.fallos >= umbral && c.fallos / c.corridas >= umbralTasa).map((c) => ({ ...c, tasa: +(c.fallos / c.corridas).toFixed(2), alerta: `falló ${c.fallos} de ${c.corridas} corridas` })).sort((a, b) => b.tasa - a.tasa);
  const media = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null);
  const semanas = Object.values(porSemana).sort((a, b) => a.semana.localeCompare(b.semana)).map((s) => {
    const repruebas = Object.values(s.repruebasPorLote).reduce((x, n) => x + Math.max(0, n - 1), 0);
    return { semana: s.semana, lotes: s.lotes.size, corridas: s.corridas, repruebas, verdes: s.verdes, rojos: s.rojos, rojosAjenos: s.rojosAjenos, pctRojosAjenos: s.rojos ? Math.round(100 * s.rojosAjenos / s.rojos) : 0, bloqueadas: s.bloqueadas,
      minColaMedia: media(s.minCola), minPwMedia: media(s.minPw), aceptados: s.aceptados, noAceptados: s.noAceptados, horasConstruidoAceptadoMedia: media(s.horasCA),
      cuarentena: opciones.conCuarentena ? 0 : 'n.a. (LM-39a)', noCorridos: opciones.conSeleccion ? 0 : 'n.a. (LM-39b)' };
  });
  return { semanas, casos, casosAlerta };
}

// Lee la carpeta de la cola y escribe log\METRICAS.json
function generar(COLA, opciones = {}) {
  const log = path.join(COLA, 'log');
  const eventos = leerResumen(fs.existsSync(path.join(log, '_resumen.txt')) ? fs.readFileSync(path.join(log, '_resumen.txt'), 'utf8') : '');
  const pruebas = {}, veredictos = {};
  for (const f of fs.readdirSync(log)) {
    let m;
    if ((m = /^(L-\d+)-pruebas\.json$/.exec(f))) { try { pruebas[m[1]] = JSON.parse(fs.readFileSync(path.join(log, f), 'utf8')); } catch (e) { } }
    else if ((m = /^(L-\d+)-veredicto[^.]*\.json$/.exec(f))) { try { const v = JSON.parse(fs.readFileSync(path.join(log, f), 'utf8')); veredictos[f] = v; if (!veredictos[m[1]] || fs.statSync(path.join(log, f)).mtimeMs > veredictos[m[1]]._mtime) veredictos[m[1]] = Object.assign({ _mtime: fs.statSync(path.join(log, f)).mtimeMs }, v); } catch (e) { } }
  }
  const r = calcular(eventos, pruebas, veredictos, opciones);
  const salida = { generadoEn: new Date().toISOString(), fuente: ['log/_resumen.txt', Object.keys(pruebas).length + ' L-n-pruebas.json (última corrida por lote)', Object.keys(veredictos).filter((k) => k.endsWith('.json')).length + ' veredictos'], ...r, lineaBase: opciones.lineaBase || null };
  fs.writeFileSync(path.join(log, 'METRICAS.json'), JSON.stringify(salida, null, 1));
  return salida;
}

function resumenTexto(r) {
  const s = r.semanas.slice(-2);
  return s.map((w) => `semana ${w.semana}: ${w.lotes} lotes, ${w.corridas} corridas (${w.repruebas} repruebas), ${w.rojos} rojos (${w.pctRojosAjenos}% ajenos), cola ${w.minColaMedia ?? '-'} min, pw ${w.minPwMedia ?? '-'} min, ${w.aceptados} aceptados`).join(' / ') + ` · casos en alerta: ${r.casosAlerta.length}`;
}

module.exports = { leerResumen, calcular, semanaDe, generar, resumenTexto, LOTE_DE };

if (require.main === module) {
  const r = generar(process.argv[2] || path.resolve(__dirname, '..'));
  console.log(resumenTexto(r));
  for (const w of r.semanas) console.log(JSON.stringify(w));
  for (const c of r.casosAlerta) console.log('ALERTA ' + c.guion + ' ' + c.c + ': ' + c.alerta + ' (' + c.lotes.join(', ') + ')');
}
