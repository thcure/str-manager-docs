// v2.js — PRUEBAS-v2 (LM-62, ISO/IEC/IEEE 29119): cuarentena con umbral (V1), reintento del guion contado por caso (V2),
// riesgo manda la profundidad (V7) y suspensión/reanudación por entorno (V10). Funciones puras salvo las que dicen «lee/escribe».
// Las usa probar-lote.js (fase 1 y completa) y tren.js (fase 2). Lo mantiene el Arquitecto. Pruebas: pruebas-v1.test.js.
'use strict';
const fs = require('fs'), path = require('path');

// ---------- V7: el riesgo del mapa manda la profundidad ----------
// riesgo = probabilidad × impacto (1–3 cada uno) del módulo con más exposición en la ruta: alto ≥ 6, medio 3–5, bajo ≤ 2.
function riesgoDeRuta(mapa, modulos) {
  if (!mapa || !Array.isArray(mapa.modulos) || !modulos || !modulos.length) return { nivel: null, modulo: null, valor: null };
  let mejor = { nivel: null, modulo: null, valor: null };
  for (const id of modulos) {
    const m = mapa.modulos.find((x) => x.id === id); const r = m && m.riesgo;
    if (!r || !r.probabilidad || !r.impacto) continue;
    const v = r.probabilidad * r.impacto;
    if (mejor.valor === null || v > mejor.valor) mejor = { modulo: id, valor: v, nivel: v >= 6 ? 'alto' : v >= 3 ? 'medio' : 'bajo', detalle: r.probabilidad + '×' + r.impacto };
  }
  return mejor;
}
// Ajusta la fase de LM-49 con el riesgo. Lo que ya era «completa» (crítico, capa común, migración, declarada, forzada) sigue igual.
function faseConRiesgo(fase, riesgo) {
  if (!riesgo || !riesgo.nivel || fase.fase === 'completa') return Object.assign({}, fase, { riesgo: riesgo && riesgo.nivel ? riesgo : null });
  if (riesgo.nivel === 'alto') return { fase: 'completa', motivo: 'riesgo alto del módulo ' + riesgo.modulo + ' (' + riesgo.detalle + '): la ruta completa corre en fase 1 (V7)', riesgo };
  if (riesgo.nivel === 'bajo') return { fase: '1', minima: true, motivo: 'riesgo bajo (' + riesgo.modulo + ' ' + riesgo.detalle + '): humo y guion propio; toda la regresión al tren (V7)', riesgo };
  return { fase: '1', motivo: fase.motivo + ' · riesgo medio (' + riesgo.modulo + ' ' + riesgo.detalle + '): centinelas ahora, ruta en el tren (V7)', riesgo };
}

// ---------- V1: cuarentena con umbral y plazo ----------
// pw\cuarentena.json: [{ guion, caso, inc, causa, dueno, desde, firma?, modulo?, plazoLotes? }]. La escribe solo el Arquitecto
// (a pedido de Desarrollo o por los candidatos de metricas.js). causa: estado compartido | dato de prueba | selector |
// tiempo/fecha | sincronización | entorno. «producto» nunca entra (M-940): es INC normal y el lote se rechaza.
const CAUSAS = ['estado compartido', 'dato de prueba', 'selector', 'tiempo/fecha', 'sincronización', 'entorno'];
function lotesAceptadosDesde(cambios, desde) {
  return (Array.isArray(cambios) ? cambios : []).filter((c) => c && c.tipo !== 'modelo' && /^L-\d+$/.test(String(c.lote || '')) && ['aceptado', 'cerrado'].includes(c.estado) && String(c.fecha || '') >= String(desde || '9999')).length;
}
function validarCuarentena(entradas, ctx = {}) {
  const incs = ctx.incs || [], validas = [], rechazadas = [];
  const porGuion = {};
  const lista = Array.isArray(entradas) ? entradas : [];
  if (lista.length > 5) return { validas: [], rechazadas: lista.map((e) => ({ entrada: e, porQue: 'más de 5 entradas en cuarentena.json: ninguna vale (tope, LM-39a)' })) };
  for (const e of lista) {
    const inc = incs.find((i) => i.id === e.inc);
    let porQue = null;
    if (!e.guion || !e.caso || !e.inc || !e.dueno || !e.desde) porQue = 'entrada incompleta (guion, caso, inc, dueno, desde)';
    else if (!inc) porQue = e.inc + ' no está en seguimiento.json';
    else if (inc.estado !== 'abierto') porQue = e.inc + ' no está abierto (' + inc.estado + ')';
    else if (e.causa === 'producto' || inc.contra === 'producto') porQue = 'causa «producto»: no es cuarentena, es un defecto (M-940)';
    else if (e.causa && !CAUSAS.includes(e.causa)) porQue = 'causa «' + e.causa + '» fuera de la lista ' + CAUSAS.join(' · ');
    else if (porGuion[e.guion]) porQue = 'más de un caso del mismo guion (tope, LM-39a)';
    else if (ctx.guionPropio && e.guion === ctx.guionPropio) porQue = 'es el guion propio del lote: no vale la cuarentena';
    else if (e.modulo && (ctx.modulosLote || []).includes(e.modulo)) porQue = 'el lote toca el módulo ' + e.modulo + ' de la entrada: el caso cuenta como rojo normal';
    if (porQue) { rechazadas.push({ entrada: e, porQue }); continue; }
    porGuion[e.guion] = true;
    const aceptados = typeof ctx.lotesAceptados === 'function' ? ctx.lotesAceptados(e.desde) : 0;
    const plazo = e.plazoLotes || 2;
    validas.push(Object.assign({}, e, { aceptadosDesde: aceptados, vencida: aceptados >= plazo, plazoLotes: plazo }));
  }
  return { validas, rechazadas };
}
function coincideFirma(firma, observado) {
  if (!firma) return true;
  try { return new RegExp(firma, 'i').test(String(observado || '')); } catch (e) { return String(observado || '').toLowerCase().includes(String(firma).toLowerCase()); }
}
// Casos que la cola salta porque su cuarentena venció (M-940: no se borra del guion; lo reactiva el lote que lo arregla).
function casosASaltar(spec, validas, guion) {
  const saltados = [];
  const casos = (spec.casos || []).filter((c) => {
    const e = validas.find((v) => v.guion === guion && v.caso === c.c && v.vencida);
    if (!e) return true;
    saltados.push({ c: c.c, nivel: c.nivel || 'N2', perfil: c.perfil, pagina: c.pagina, que: c.que, ok: null, saltado: true, inc: e.inc, dueno: e.dueno, observado: 'en cuarentena vencida (' + e.inc + ', ' + e.aceptadosDesde + ' lotes aceptados desde ' + e.desde + '): la cola lo salta hasta que lo arregle un lote; el INC queda como deuda de cobertura (V1)' });
    return false;
  });
  return { casos, saltados };
}
// Separa los casos de un guion: los rojos con entrada válida (y firma) van a cuarentena[] y no rechazan; un verde con entrada avisa.
function aplicarCuarentena(casos, validas, guion) {
  const regresion = [], cuarentena = [];
  for (const c of casos || []) {
    const e = validas.find((v) => v.guion === guion && v.caso === c.c && !v.vencida);
    if (!e) { regresion.push(c); continue; }
    if (c.ok === false && coincideFirma(e.firma, c.observado)) cuarentena.push(Object.assign({}, c, { inc: e.inc, dueno: e.dueno, causa: e.causa || null, enCuarentena: true }));
    else if (c.ok === false) regresion.push(Object.assign({}, c, { nota: 'en cuarentena por ' + e.inc + ' pero falló distinto de su firma «' + e.firma + '»: rojo normal' }));
    else { regresion.push(c); if (c.ok === true) cuarentena.push(Object.assign({}, c, { inc: e.inc, dueno: e.dueno, enCuarentena: true, posiblementeResuelto: true, observado: e.inc + ' posiblemente resuelto: el caso pasó en verde' })); }
  }
  return { regresion, cuarentena };
}

// ---------- V2: un reintento del guion, contado por caso ----------
// Un rojo que no es de sesión ni de red (esos tienen su camino, LM-51/52) repite el guion ENTERO una vez, después de su
// limpiar(); el segundo intento manda; cada caso que pasa en el reintento queda «inestable» (cuenta para la cuarentena).
function fusionarReintento(primera, segunda) {
  const inestables = [];
  const casos = (segunda.casos || []).map((c) => {
    const p = (primera.casos || []).find((x) => x.c === c.c);
    if (!p) return c;
    if (p.ok === false && c.ok !== false) { inestables.push({ c: c.c, primerFallo: p.observado }); return Object.assign({}, c, { inestable: true, intento: 2, primerFallo: p.observado }); }
    if (p.ok === false && c.ok === false) return Object.assign({}, c, { intento: 2, primerFallo: p.observado });
    if (p.ok !== false && c.ok === false) return Object.assign({}, c, { intento: 2, nota: 'pasó en el primer intento y falló en el reintento: inestable y rojo' , inestable: true });
    return Object.assign({}, c, { intento: 2 });
  });
  return { casos, inestables, limpieza: segunda.limpieza, perfiles: segunda.perfiles, reintentado: true, primeraLimpieza: primera.limpieza };
}
function mereceReintento(rr, esSinRed) {
  const rojos = (rr.casos || []).filter((x) => x.ok === false);
  return rojos.length > 0 && !rojos.every((x) => x.sinSesion || (esSinRed && esSinRed(x.observado)));
}
async function correrConReintento(correr, sp, opts, estado, nombre, recargar, esSinRed) {
  const rr = await correr(sp, opts, estado, nombre);
  if (!mereceReintento(rr, esSinRed)) return rr;
  const sp2 = recargar ? recargar() : sp;
  sp2.casos = (sp2.casos || []).filter((c) => (sp.casos || []).some((k) => k.c === c.c));   // los mismos casos (sin N3 ni saltados)
  const rr2 = await correr(sp2, opts, estado, nombre + ' (reintento)');
  return fusionarReintento(rr, rr2);
}

// ---------- V10: suspensión por entorno y reanudación ----------
const ENTORNO = /sin sesi[oó]n|sinSesion|net::ERR_|ECONNRE|ETIMEDOUT|ENOTFOUND|ERR_CONNECTION|sin internet|Timeout \d+ms exceeded|page\.goto|navigation|\/api\/health (?:[45]\d\d|no responde)|50[234] /i;
function esFalloEntorno(observado) { return ENTORNO.test(String(observado || '')); }
// Dos guiones seguidos cuyos rojos son TODOS de entorno → suspender (ya corrieron con reintento o recuperación de sesión).
function detectarSuspension(resultadosGuiones) {
  const u = (resultadosGuiones || []).slice(-2);
  if (u.length < 2) return { suspender: false };
  const soloEntorno = (g) => { const rojos = (g.casos || []).filter((c) => c.ok === false); return rojos.length > 0 && rojos.every((c) => c.sinSesion || esFalloEntorno(c.observado)); };
  if (!u.every(soloEntorno)) return { suspender: false };
  const causa = ((u[1].casos || []).find((c) => c.ok === false) || {}).observado || 'entorno';
  return { suspender: true, causa: 'dos guiones seguidos (' + u.map((g) => g.guion).join(', ') + ') fallan por el entorno: ' + String(causa).slice(0, 120) };
}
function rutaSuspension(COLA) { return path.join(COLA, 'log', 'suspension.json'); }
function leerSuspension(COLA) { try { return JSON.parse(fs.readFileSync(rutaSuspension(COLA), 'utf8')); } catch (e) { return null; } }
// Escribe log\suspension.json; la cola lo traduce a un mensaje M-n para el Jefe de proyecto y Desarrollo (M-948).
function escribirSuspension(COLA, dato) { try { fs.writeFileSync(rutaSuspension(COLA), JSON.stringify(dato, null, 1)); return true; } catch (e) { return false; } }
function esReanudacion(suspension, lote) { return !!(suspension && suspension.estado === 'suspendido' && suspension.lote === lote); }

module.exports = { riesgoDeRuta, faseConRiesgo, CAUSAS, lotesAceptadosDesde, validarCuarentena, coincideFirma, casosASaltar, aplicarCuarentena, fusionarReintento, mereceReintento, correrConReintento, esFalloEntorno, detectarSuspension, leerSuspension, escribirSuspension, esReanudacion, rutaSuspension };
