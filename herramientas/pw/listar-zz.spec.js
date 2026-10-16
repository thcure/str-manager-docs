// listar-zz.spec.js - inventario de SOLO LECTURA de la basura de prueba (tarea de limpieza al sobre RT-25, 16-oct).
// Lo mantiene el Arquitecto. Abre str-inventario.html con zz-verif-admin, lee las GET /api/col/<colección> que pide la
// página y agrupa las filas vivas por su `nombre`: «L<n>» si empieza por zz-verif-L<n> o zz-verif-L-<n> (acumulado de un
// lote, se puede limpiar) y «fijo» si es cualquier otro zz-verif- (semilla; no se toca). Solo nombres zz-verif- van al log;
// una fila sin zz-verif- solo se cuenta como «reales», nunca se nombra. No escribe nada.
const COLS = ['inv-depositos', 'inv-articulos', 'inv-estados', 'inv-sububicaciones', 'inv-grupos', 'inv-proveedores'];
const RE_LOTE = /^zz-verif-(L-?\d+)/;
const nombreDe = (x) => String(((x && x.data) || {}).nombre || '');
function agrupar(vivos) {
  const lotes = {}, fijos = [], sinNombre = []; let reales = 0;
  for (const x of vivos) {
    const n = nombreDe(x);
    if (!n.startsWith('zz-verif-')) { if (JSON.stringify(x.data || {}).indexOf('zz-verif-') >= 0) sinNombre.push(String(x.id)); else reales++; continue; }
    const m = n.match(RE_LOTE);
    if (m) { const k = m[1].replace('-', ''); (lotes[k] = lotes[k] || { n: 0, prefijos: {}, ej: [] }).n++; const pf = n.slice(0, m[0].length + 1); lotes[k].prefijos[pf] = (lotes[k].prefijos[pf] || 0) + 1; if (lotes[k].ej.length < 2) lotes[k].ej.push(n); }
    else fijos.push(n);
  }
  return { lotes, fijos, sinNombre, reales };
}
module.exports = {
  req: 'LISTAR-ZZ',
  zona: ['INV'],
  agrupar, RE_LOTE,
  casos: [{
    c: 'l1', perfil: 'admin', pagina: '/str-inventario.html', cubre: ['INV'],
    que: 'Solo lectura: filas zz-verif- por colección, separadas en acumuladas por lote (L<n>) y fijas (semilla)',
    async prueba(h) {
      const p = h.page, cuerpos = {}, lecturas = [];
      p.on('response', (r) => {
        try {
          const u = new URL(r.url()); const col = COLS.find((c) => u.pathname.endsWith('/api/col/' + c));
          if (!col || r.request().method() !== 'GET' || r.status() !== 200) return;
          lecturas.push(r.json().then((j) => { const it = Array.isArray(j && j.items) ? j.items : (Array.isArray(j) ? j : []); const prev = cuerpos[col] || new Map(); it.forEach((x) => x && x.id != null && prev.set(String(x.id), x)); cuerpos[col] = prev; }).catch(() => { }));
        } catch (e) { }
      });
      const base = h.BASE || new URL(p.url()).origin;
      await p.goto(base + '/str-inventario.html', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await p.waitForTimeout(3000);
      await Promise.race([Promise.all(lecturas), new Promise((r) => setTimeout(r, 15000))]);
      for (const c of COLS) {
        if (!cuerpos[c]) { h.espera(true, c + ': la página no la pidió'); continue; }
        const vivos = [...cuerpos[c].values()].filter((x) => x && !x.deleted && x.data);
        const g = agrupar(vivos);
        const tot = Object.values(g.lotes).reduce((a, b) => a + b.n, 0);
        const det = Object.keys(g.lotes).sort().map((k) => k + ' ' + g.lotes[k].n + ' [' + Object.entries(g.lotes[k].prefijos).map(([pf, n]) => pf + '×' + n).join(', ') + ']').join('; ');
        h.espera(true, c + ': vivos ' + vivos.length + ' · por lote ' + tot + ' · fijos ' + g.fijos.length + ' · zz sin nombre zz ' + g.sinNombre.length + ' · reales ' + g.reales + ' || lotes: ' + (det || '-') + ' || fijos: ' + (g.fijos.slice(0, 80).join(' | ') || '-'));
      }
    },
  }],
};
