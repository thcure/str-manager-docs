// Conteo de SOLO LECTURA de la semilla y de los datos reales de «negocio» (M-569, 16-oct). No escribe nada ni toca tokens:
// abre str-inventario.html con zz-verif-admin y lee las respuestas GET /api/col/<colección> que pide la propia página.
// Al log solo van conteos y formas de la respuesta (claves, ?since=, tamaño), nunca nombres reales.
const COLS = ['inv-depositos', 'inv-articulos', 'inv-estados', 'inv-sububicaciones', 'inv-grupos'];
const esZz = (o) => { let s = false; (function rec(v) { if (s) return; if (typeof v === 'string') { if (v.startsWith('zz-verif-')) s = true; return; } if (v && typeof v === 'object') Object.values(v).forEach(rec); })(o); return s; };
module.exports = {
  req: 'CONTEO-SEMILLA',
  zona: ['INV'],
  casos: [
    {
      c: 'k1', perfil: 'admin', pagina: '/str-inventario.html', cubre: ['INV'],
      que: 'Conteo de solo lectura por colección: respuestas, ?since=, claves, items, borrados, zz-verif- y reales (M-569)',
      async prueba(h) {
        const p = h.page, resp = [];
        p.on('response', async (r) => {
          try {
            const u = new URL(r.url()); const col = COLS.find((c) => u.pathname.endsWith('/api/col/' + c));
            if (!col || r.request().method() !== 'GET') return;
            const fila = { col, status: r.status(), since: u.searchParams.has('since'), qs: [...u.searchParams.keys()].join(',') };
            try { const t = await r.text(); fila.bytes = t.length; const j = JSON.parse(t); fila.claves = Object.keys(j || {}).join(',');
              const it = Array.isArray(j && j.items) ? j.items : (Array.isArray(j) ? j : []);
              fila.items = it.length; fila.borrados = it.filter((x) => x && x.deleted).length;
              const vivos = it.filter((x) => x && !x.deleted); fila.zz = vivos.filter(esZz).length; fila.reales = vivos.length - fila.zz;
            } catch (e) { fila.error = String(e && e.message || e).slice(0, 120); }
            resp.push(fila);
          } catch (e) { }
        });
        const base = h.BASE || new URL(p.url()).origin;
        await p.goto(base + '/str-inventario.html', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
        await p.waitForTimeout(3000);
        for (const c of COLS) {
          const fs = resp.filter((x) => x.col === c);
          h.espera(true, c + ': ' + (fs.length ? fs.map((x) => 'HTTP ' + x.status + (x.since ? ' ?since' : '') + (x.qs ? ' [' + x.qs + ']' : '') + ' · ' + (x.error ? 'error ' + x.error : (x.bytes + ' B · claves ' + x.claves + ' · items ' + x.items + ' · borrados ' + x.borrados + ' · zz ' + x.zz + ' · reales ' + x.reales))).join(' | ') : 'la página no la pidió'));
        }
      },
    },
  ],
};
