// semilla.js - comprueba la semilla fija zz-verif- (PRUEBAS-v1, LM-18, BAI07.04). Lo mantiene el Arquitecto.
// Solo lectura: abre cada pagina con zz-verif-admin y lee las respuestas que la propia app pide (no toca tokens
// ni ejecuta JavaScript sobre la sesion). Guarda solo nombres zz-verif- y conteos: nada de datos reales.
// v1 comprueba; reponer lo que falte se hace con un guion de semilla del Chat Desarrollo (paso siguiente).
// v2 (pw 0.4.6, M-263, L-86): 'relaciones' de semilla.json (colaborador base, zona principal activa, operador sin un
// permiso). Se evaluan en memoria sobre las respuestas; al log solo van nombres zz-verif- y conteos.
// Uso: node semilla.js   (escribe log\pw-semilla.json; sale 0 si esta completa, 1 si falta algo, 2 si no concluye)
'use strict';
const fs = require('fs');
const path = require('path');
const { abrir, BASE, COLA } = require('./comun');

const CONF = JSON.parse(fs.readFileSync(path.join(__dirname, 'semilla.json'), 'utf8'));

// Puro: todas las cadenas que empiezan por zz-verif- dentro de un JSON (items borrados fuera).
function nombresZz(j) {
  const out = new Set();
  const items = j && Array.isArray(j.items) ? j.items.filter(x => !x.deleted) : j;
  (function rec(o) {
    if (typeof o === 'string') { if (o.startsWith('zz-verif-')) out.add(o); return; }
    if (Array.isArray(o)) { o.forEach(rec); return; }
    if (o && typeof o === 'object') Object.values(o).forEach(rec);
  })(items);
  return out;
}

// Puro: evalua un grupo contra lo observado. parcial = la respuesta traia ?since= (solo cambios recientes).
function evaluar(grupo, vistos, visto, parcial) {
  if (!visto) return { id: grupo.id, estado: 'no concluyente', observado: 'la pagina no pidio ' + grupo.fuente };
  const faltan = (grupo.nombres || []).filter(n => !vistos.has(n));
  const total = [...vistos].length;
  const faltaMinimo = grupo.minimo && total < grupo.minimo;
  const opc = (grupo.opcionales || []).filter(n => !vistos.has(n));
  if (!faltan.length && !faltaMinimo) return { id: grupo.id, estado: 'ok', observado: total + ' nombre(s) zz-verif-' + (opc.length ? ' · opcionales sin crear: ' + opc.join(', ') : '') };
  if (parcial) return { id: grupo.id, estado: 'no concluyente', observado: 'respuesta incremental (?since=); faltaria: ' + (faltan.join(', ') || 'minimo ' + grupo.minimo) };
  return { id: grupo.id, estado: 'falta', observado: 'faltan: ' + (faltan.join(', ') || ('minimo ' + grupo.minimo + ', hay ' + total)) };
}

// Puro: registros planos ({id, ...data}) de las respuestas; fuera los borrados.
function registros(cuerpos) {
  const out = [];
  const rec = (o) => {
    if (Array.isArray(o)) { o.forEach(rec); return; }
    if (!o || typeof o !== 'object' || o.deleted) return;
    if ('id' in o) out.push(Object.assign({}, (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) ? o.data : {}, o));
    Object.values(o).forEach(v => { if (v && typeof v === 'object') rec(v); });
  };
  (cuerpos || []).forEach(rec);
  return out;
}
const porNombre = (regs, nombre) => regs.find(r => Object.values(r).some(v => v === nombre)) || null;
const lista = (v) => Array.isArray(v) ? v.map(String) : [];
function permisosDe(u) {
  let p = u.permisos;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = undefined; } }
  return p && typeof p === 'object' ? p : undefined;
}

// Puro: evalua una relacion. cuerpos = {idGrupo: [json, ...]}; vistos = {idGrupo: bool}.
function evaluarRelacion(rel, cuerpos, vistos) {
  const r = (estado, observado) => ({ id: rel.id, estado, observado });
  const necesita = { colaboradorBase: ['propiedades', 'usuarios'], zonaPrincipalActiva: ['propiedades', 'zonas'], sinPermiso: ['usuarios'] }[rel.tipo];
  if (!necesita) return r('no concluyente', 'tipo desconocido: ' + rel.tipo);
  const noVisto = necesita.filter(g => !vistos[g]);
  if (noVisto.length) return r('no concluyente', 'sin respuesta de: ' + noVisto.join(', '));
  const props = registros(cuerpos.propiedades), usuarios = registros(cuerpos.usuarios);
  if (rel.tipo === 'colaboradorBase') {
    const p = porNombre(props, rel.propiedad), u = porNombre(usuarios, rel.usuario);
    if (!p || !u) return r('falta', 'no está ' + (!p ? rel.propiedad : rel.usuario));
    return String(p.colaboradorBaseId) === String(u.id) ? r('ok', rel.usuario + ' es colaborador base de ' + rel.propiedad) : r('falta', rel.usuario + ' no es colaborador base de ' + rel.propiedad);
  }
  if (rel.tipo === 'zonaPrincipalActiva') {
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const n = registros(cuerpos.zonas).filter(z => (z.rol === 'principal' || (!z.rol && z.tipo === 'principal')) && z.activo !== false && z.privada !== true
      && (lista(z.propIds).includes(String(p.id)) || String(z.propId) === String(p.id))).length;
    return n >= (rel.minimo || 1) ? r('ok', n + ' zona(s) principal(es) activa(s) en ' + rel.propiedad) : r('falta', rel.propiedad + ' tiene ' + n + ' zona(s) principal(es) activa(s); mínimo ' + (rel.minimo || 1));
  }
  const u = porNombre(usuarios, rel.usuario);
  if (!u) return r('falta', 'no está ' + rel.usuario);
  const p = permisosDe(u);
  if (p === undefined) return r('no concluyente', 'la respuesta no trae los permisos de ' + rel.usuario);
  return (u.rol === 'operador' && p.todo === false && p[rel.permiso] !== true) ? r('ok', rel.usuario + ' sin ' + rel.permiso)
    : r('falta', rel.usuario + ' tiene ' + rel.permiso + (p.todo !== false ? ' (todo)' : '') + (u.rol !== 'operador' ? ' · rol ' + u.rol : ''));
}

async function comprobarSemilla(opciones = {}) {
  const grupos = [], cuerpos = {}, vistosG = {};
  let ctx;
  try {
    const a = await abrir('admin', { headless: opciones.headless }); ctx = a.ctx;
    for (const g of CONF.grupos) {
      const page = await ctx.newPage();
      const vistos = new Set(); let visto = false, parcial = true;
      page.on('response', async (r) => {
        const u = r.url();
        if (!u.includes(g.fuente) || r.request().method() !== 'GET' || r.status() !== 200) return;
        visto = true; if (!/[?&]since=/.test(u)) parcial = false;
        try { const j = await r.json(); nombresZz(j).forEach(n => vistos.add(n)); (cuerpos[g.id] = cuerpos[g.id] || []).push(j); } catch (e) { }
      });
      try {
        await page.goto(BASE + g.pagina, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1500);
      } catch (e) { }
      grupos.push(evaluar(g, vistos, visto, parcial)); vistosG[g.id] = visto && !parcial;
      await page.close().catch(() => { });
    }
  } catch (e) {
    return { ok: false, estado: 'no concluyente', grupos, error: 'no se pudo abrir zz-verif-admin: ' + e.message };
  } finally { if (ctx) await ctx.close().catch(() => { }); }
  for (const rel of (CONF.relaciones || [])) grupos.push(evaluarRelacion(rel, cuerpos, vistosG));
  const estado = grupos.some(g => g.estado === 'falta') ? 'incompleta' : grupos.some(g => g.estado !== 'ok') ? 'no concluyente' : 'completa';
  return { ok: estado === 'completa', estado, grupos };
}

module.exports = { comprobarSemilla, nombresZz, evaluar, evaluarRelacion, registros, CONF };

if (require.main === module) {
  (async () => {
    const r = await comprobarSemilla();
    r.fecha = new Date().toISOString();
    r.grupos.forEach(g => console.log(g.estado.padEnd(15) + g.id + ' · ' + g.observado));
    if (r.error) console.log(r.error);
    console.log('Semilla: ' + r.estado + ' · log\\pw-semilla.json');
    fs.writeFileSync(path.join(COLA, 'log', 'pw-semilla.json'), JSON.stringify(r, null, 1));
    process.exit(r.estado === 'completa' ? 0 : r.estado === 'incompleta' ? 1 : 2);
  })();
}
