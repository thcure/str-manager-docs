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
// v2: un caso por colección (el log corta cada caso a 900 caracteres) y formato compacto: «L100 9» (el prefijo siempre es
// zz-verif-L-<n>-) y los nombres fijos completos.
function caso(col, i) {
  return {
    c: 'l' + (i + 1), perfil: 'admin', pagina: '/str-inventario.html', cubre: ['INV'],
    que: 'Solo lectura: ' + col + ' · filas zz-verif- acumuladas por lote (L<n>) y fijas (semilla)',
    async prueba(h) {
      const p = h.page, filas = new Map(), lecturas = []; let vista = false;
      p.on('response', (r) => {
        try {
          const u = new URL(r.url());
          if (!u.pathname.endsWith('/api/col/' + col) || r.request().method() !== 'GET' || r.status() !== 200) return;
          vista = true;
          lecturas.push(r.json().then((j) => { (Array.isArray(j && j.items) ? j.items : (Array.isArray(j) ? j : [])).forEach((x) => x && x.id != null && filas.set(String(x.id), x)); }).catch(() => { }));
        } catch (e) { }
      });
      const base = h.BASE || new URL(p.url()).origin;
      await p.goto(base + '/str-inventario.html', { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
      await p.waitForTimeout(3000);
      await Promise.race([Promise.all(lecturas), new Promise((r) => setTimeout(r, 15000))]);
      if (!vista) { h.espera(true, col + ': la página no la pidió'); return; }
      const vivos = [...filas.values()].filter((x) => x && !x.deleted && x.data);
      const g = agrupar(vivos);
      const tot = Object.values(g.lotes).reduce((a, b) => a + b.n, 0);
      const det = Object.keys(g.lotes).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))).map((k) => k + ' ' + g.lotes[k].n).join(', ');
      h.espera(true, col + ': vivos ' + vivos.length + ' · por lote ' + tot + ' · fijos ' + g.fijos.length + ' · zz sin nombre zz ' + g.sinNombre.length + ' · reales ' + g.reales + ' || ' + (det || '-') + ' || fijos: ' + (g.fijos.map((n) => n.replace(/^zz-verif-/, '')).join(' | ') || '-'));
    },
  };
}
module.exports = {
  req: 'LISTAR-ZZ',
  zona: ['INV'],
  agrupar, RE_LOTE,
  casos: COLS.map(caso),
};
