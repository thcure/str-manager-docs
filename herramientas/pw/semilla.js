// semilla.js - comprueba la semilla fija zz-verif- (PRUEBAS-v1, LM-18, BAI07.04). Lo mantiene el Arquitecto.
// Solo lectura: abre cada pagina con zz-verif-admin y lee las respuestas que la propia app pide (no toca tokens
// ni ejecuta JavaScript sobre la sesion). Guarda solo nombres zz-verif- y conteos: nada de datos reales.
// v1 comprueba; reponer lo que falte se hace con un guion de semilla del Chat Desarrollo (paso siguiente).
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

async function comprobarSemilla(opciones = {}) {
  const grupos = [];
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
        try { nombresZz(await r.json()).forEach(n => vistos.add(n)); } catch (e) { }
      });
      try {
        await page.goto(BASE + g.pagina, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1500);
      } catch (e) { }
      grupos.push(evaluar(g, vistos, visto, parcial));
      await page.close().catch(() => { });
    }
  } catch (e) {
    return { ok: false, estado: 'no concluyente', grupos, error: 'no se pudo abrir zz-verif-admin: ' + e.message };
  } finally { if (ctx) await ctx.close().catch(() => { }); }
  const estado = grupos.some(g => g.estado === 'falta') ? 'incompleta' : grupos.some(g => g.estado !== 'ok') ? 'no concluyente' : 'completa';
  return { ok: estado === 'completa', estado, grupos };
}

module.exports = { comprobarSemilla, nombresZz, evaluar, CONF };

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
