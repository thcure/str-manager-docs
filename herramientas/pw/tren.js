// tren.js - fase 2 de LM-49 (pruebas por fases, cruce de Carlos 17-oct-2026). Lo mantiene el Arquitecto.
// Corre UNA vez la regresión que la fase 1 de varios lotes dejó diferida en log\tren-pendiente.json: une los guiones de
// todos los lotes, comprueba las sesiones de los perfiles que van a correr, corre cada guion una sola vez (sin N3) y deja
// log\TREN-<AAAAMMDD-HHMM>.json con cada caso y los lotes que lo pidieron. No juzga ni acepta: un rojo es un INC que se
// atribuye por la ruta (los lotes de la columna `lotes` del caso) y lo abre Desarrollo; el Arquitecto revisa el tren.
// Si una sesión falla, no corre nada y la fila queda como estaba (bloqueado). Con todo corrido (verde o rojo), la fila
// pasa a log\tren-historial.json y queda vacía.
// Uso: node tren.js [--repo C:\Users\ktcol\str-manager]
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { COLA } = require('./comun');
const { correrGuion, cargar, horaBogota } = require('./guion');
const { cargarGuiones, sesionViva } = require('./probar-lote');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const leer = (r, d) => { try { return JSON.parse(fs.readFileSync(r, 'utf8')); } catch (e) { return d; } };

// Pura: une los diferidos de la fila → [{archivo, lotes:[...]}] en orden de primera aparición.
function unirTren(pendiente) {
  const porArchivo = new Map();
  for (const e of Array.isArray(pendiente) ? pendiente : []) for (const a of e.diferidos || []) {
    if (!porArchivo.has(a)) porArchivo.set(a, []);
    if (!porArchivo.get(a).includes(e.lote)) porArchivo.get(a).push(e.lote);
  }
  return [...porArchivo.entries()].map(([archivo, lotes]) => ({ archivo, lotes }));
}

async function main() {
  const repo = arg('--repo', path.join(require('os').homedir(), 'str-manager'));
  const dirLog = path.join(COLA, 'log');
  const rutaPend = path.join(dirLog, 'tren-pendiente.json');
  const pendiente = leer(rutaPend, []);
  const union = unirTren(pendiente);
  if (!union.length) { console.log('Tren: nada pendiente'); process.exit(0); }
  const d = new Date(); const pad = (n) => String(n).padStart(2, '0');
  const id = 'TREN-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + horaBogota().slice(0, 5).replace(':', '');
  const commit = (spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout || '').trim() || null;
  const out = { tren: id, proceso: 'LM-49 fase 2', commit, inicio: new Date().toISOString(), lotes: pendiente.map((e) => e.lote), guiones: union, entrada: [], regresion: [], limpieza: [], resultado: null, causa: null };
  const fin = (resultado, causa, vaciar) => {
    out.resultado = resultado; out.causa = causa || null; out.fin = new Date().toISOString();
    fs.writeFileSync(path.join(dirLog, id + '.json'), JSON.stringify(out, null, 1));
    if (vaciar) {
      const hist = leer(path.join(dirLog, 'tren-historial.json'), []);
      hist.push({ tren: id, resultado, lotes: out.lotes, hora: horaBogota() });
      fs.writeFileSync(path.join(dirLog, 'tren-historial.json'), JSON.stringify(hist.slice(-50), null, 1));
      fs.writeFileSync(rutaPend, '[]');
    }
    console.log('Tren ' + id + ': ' + resultado + (causa ? ' - ' + causa : '') + ' - log\\' + id + '.json');
    process.exit(resultado === 'verde' ? 0 : 1);
  };
  const guiones = cargarGuiones(path.join(repo, 'tests', 'e2e'), null);
  const lista = union.map((u) => Object.assign({}, u, { g: guiones.find((g) => g.archivo === u.archivo) }));
  const faltan = lista.filter((x) => !x.g).map((x) => x.archivo);
  if (faltan.length) out.entrada.push({ c: 'guiones', ok: true, observado: 'ya no existen en tests/e2e (se omiten): ' + faltan.join(', ') });
  const perfiles = new Set();
  lista.filter((x) => x.g).forEach((x) => (x.g.spec.casos || []).forEach((k) => { if (k.nivel !== 'N3' && k.perfil) perfiles.add(k.perfil); }));
  for (const p of perfiles) {
    const s = await sesionViva(p); out.entrada.push({ c: 'sesion ' + p, ok: s.ok, observado: s.observado });
    if (!s.ok) return fin('bloqueado', s.observado, false);
  }
  for (const x of lista.filter((y) => y.g)) {
    try {
      const sp = cargar(x.g.ruta); sp.casos = (sp.casos || []).filter((c) => c.nivel !== 'N3');
      const rr = await correrGuion(sp, { lote: id, prefijo: 'zz-verif-' + id + '-r-', dirGuion: path.dirname(x.g.ruta), nombreGuion: x.archivo.replace(/\.spec\.js$/, '') });
      rr.casos.forEach((c) => out.regresion.push(Object.assign({ guion: x.archivo, lotes: x.lotes }, c)));
      out.limpieza.push({ guion: x.archivo, limpieza: rr.limpieza });
    } catch (e) { out.regresion.push({ guion: x.archivo, lotes: x.lotes, ok: false, observado: e.message }); }
  }
  const rojos = out.regresion.filter((c) => c.ok === false);
  return fin(rojos.length ? 'rojo' : 'verde', rojos.length ? 'fallan: ' + rojos.map((c) => c.guion + ' ' + (c.c || '') + ' (' + c.lotes.join(',') + ')').join(', ') : null, true);
}

if (require.main === module) main().catch((e) => { console.log('error: ' + e.message); process.exit(1); });
module.exports = { unirTren };
