// humo.js - prueba de humo del verificador local (B10-1) y dato de la prueba tecnica del servicio (B7-1).
// Escribe str-instr-cola\log\pw-humo.json. No crea ni borra datos. Uso: node humo.js
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { abrir, BASE, BASE_MODELO, COLA } = require('./comun');

(async () => {
  const out = { fecha: new Date().toISOString(), equipo: os.hostname(), herramienta: 'playwright', pruebas: [] };
  const add = (c, ok, obs) => { out.pruebas.push({ c, ok, observado: obs }); console.log((ok ? 'OK  ' : 'NO  ') + c + ' · ' + obs); };

  // 1. Servicio del modelo desde el entorno de la cola (Node en LENOVO, sin navegador)
  try { const r = await fetch(BASE_MODELO + '/modelo/api/salud'); const j = await r.json(); add('salud GET (cola)', r.status === 200 && j.ok === true, r.status + ' ' + JSON.stringify(j).slice(0, 160)); }
  catch (e) { add('salud GET (cola)', false, e.message); }
  try {
    const r = await fetch(BASE_MODELO + '/modelo/api/eco', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Modelo-Token': 'prueba' }, body: JSON.stringify({ prueba: 1 }) });
    const j = await r.json(); add('eco POST (cola)', r.status === 200 && j.recibidoBytes === 12 && j.tieneToken === true, r.status + ' ' + JSON.stringify(j).slice(0, 160));
  } catch (e) { add('eco POST (cola)', false, e.message); }

  // 2. Navegador propio con cada perfil de prueba (sesion leida de la respuesta de /api/me que pide la app)
  for (const u of ['admin', 'oper', 'colab']) {
    let ctx;
    try {
      const a = await abrir(u); ctx = a.ctx;
      const p = ctx.pages()[0] || await ctx.newPage();
      const me = p.waitForResponse(r => new URL(r.url()).pathname.endsWith('/api/me'), { timeout: 30000 }).catch(() => null);
      await p.goto(BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' });
      const r = await me;
      let resumen = 'sin respuesta de /api/me: el perfil no tiene sesion (correr node abrir-perfil.js ' + u + ')';
      if (r) { let j = {}; try { j = await r.json(); } catch (e) { } const us = j.user || j; resumen = r.status() + ' nombre=' + (us.nombre || '') + ' rol=' + (us.rol || ''); }  // sin correos ni telefonos: el log puede citarse en el repo publico
      add('sesion ' + u, !!r && r.status() === 200, resumen);
      if (u === 'admin') {
        const res = await p.evaluate(async (base) => {
          const x = await fetch(base + '/modelo/api/eco', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Modelo-Token': 'prueba' }, body: JSON.stringify({ prueba: 1 }) });
          return { s: x.status, j: await x.json() };
        }, BASE);
        add('eco POST (navegador)', res.s === 200 && res.j.recibidoBytes === 12, res.s + ' ' + JSON.stringify(res.j).slice(0, 160));
        await p.setViewportSize({ width: 390, height: 844 });
        await p.waitForTimeout(800);
        const w = await p.evaluate(() => document.documentElement.scrollWidth);
        add('ventana de 390 px', true, 'scrollWidth=' + w + ' (capacidad que la extension no tenia)');
      }
      out['bitacora_' + u] = a.bitacora;
    } catch (e) { add('sesion ' + u, false, e.message); }
    finally { if (ctx) await ctx.close(); }
  }
  out.resultado = out.pruebas.every(x => x.ok) ? 'aceptado' : 'parcial';
  fs.writeFileSync(path.join(COLA, 'log', 'pw-humo.json'), JSON.stringify(out, null, 1));
  console.log('Resultado: ' + out.resultado + ' · log\\pw-humo.json');
})();
