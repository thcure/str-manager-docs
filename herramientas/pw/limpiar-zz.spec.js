// limpiar-zz.spec.js - borra la basura de prueba que un limpiar() no alcanzó (M-437): en UNA colección, las filas cuyo
// nombre empieza por un prefijo zz-verif- dado. Lo mantiene el Arquitecto. Qué y dónde lo dice pw\limpiar-zz.json:
//   { "col": "inv-depositos", "prefijo": "zz-verif-L-111-r-" }
// La cola lo corre con correr\limpiar-zz.txt -> log\LIMPIAR-ZZ-guion.json. Cómo pasa la guardia sin aflojarla: primero
// vuelve a subir esas mismas filas tal cual (filas con zz-verif-: la guardia las deja pasar y anota sus ids como de la
// corrida) y después las borra (solo se borran ids anotados). Una fila sin zz-verif- en el nombre nunca entra.
const fs = require('fs');
const path = require('path');
function config() {
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'limpiar-zz.json'), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(String(c.col || ''))) throw new Error('limpiar-zz.json: col inválida');
  if (!/^zz-verif-/.test(String(c.prefijo || ''))) throw new Error('limpiar-zz.json: el prefijo debe empezar por zz-verif-');
  return c;
}
const filas = (j) => (j && Array.isArray(j.items) ? j.items : []).filter((x) => x && !x.deleted && x.data && typeof x.data === 'object');
module.exports = {
  req: 'LIMPIAR-ZZ',
  zona: 'sesiones',
  casos: [{
    c: 'z', perfil: 'admin', pagina: '/str-inventario.html',
    que: 'no queda ninguna fila cuyo nombre empiece por el prefijo zz-verif- de limpiar-zz.json en su colección',
    async prueba(h) {
      const p = h.page;
      const { col, prefijo } = config();
      // Dos fuentes, por si la página pide la colección por diferencias: la respuesta del servidor al recargar y la copia
      // local de la app (str-<col sin inv->-v1 o str-<col>-v1), unidas por id.
      const leer = async (soloServidor) => {
        const r = await h.respuesta('/api/col/' + col, () => p.reload({ waitUntil: 'domcontentloaded' })).catch(() => null);
        let j = null; try { j = r ? await r.json() : null; } catch (e) { }
        const porId = new Map();
        filas(j).forEach((x) => porId.set(String(x.id), { id: x.id, data: x.data }));
        await p.waitForLoadState('networkidle').catch(() => {});
        const loc = (soloServidor && j) ? [] : await p.evaluate((c) => {
          const claves = ['str-' + c + '-v1', 'str-' + c.replace(/^inv-/, 'inv-') + '-v1', 'str-inv-' + c.replace(/^inv-/, '') + '-v1'];
          for (const k of claves) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (Array.isArray(v)) return v; } catch (e) { } }
          return [];
        }, col);
        loc.forEach((x) => { if (x && x.id != null && !x.deleted && !porId.has(String(x.id))) { const d = Object.assign({}, x); delete d.id; porId.set(String(x.id), { id: x.id, data: d }); } });
        return [...porId.values()].filter((x) => String((x.data || {}).nombre || '').startsWith(prefijo));
      };
      const antes = await leer();
      h.espera(true, col + ' · con prefijo ' + prefijo + ': ' + antes.length + ' fila(s)' + (antes.length ? ' (' + antes.map((x) => x.id).join(', ') + ')' : ''));
      if (!antes.length) return;
      await p.waitForFunction(() => window.STRApi && STRApi.col && typeof STRApi.col.push === 'function', null, { timeout: 30000 });
      const ids = antes.map((x) => String(x.id));
      const items = antes.map((x) => ({ id: x.id, data: x.data }));
      const re = await h.respuesta('/api/col/' + col, () => p.evaluate(([c, it]) => STRApi.col.push(c, it, []).catch((e) => ({ error: String(e && e.message || e) })), [col, items])).catch(() => null);
      h.espera(!!re && re.status() === 200, 'resubida tal cual (para que la guardia anote los ids): ' + (re ? re.status() : 'sin respuesta'));
      const borra = await h.respuesta('/api/col/' + col, () => p.evaluate(([c, id]) => STRApi.col.push(c, [], id).catch((e) => ({ error: String(e && e.message || e) })), [col, ids])).catch(() => null);
      h.espera(!!borra && borra.status() === 200, 'borrado de ' + ids.length + ' id(s): ' + (borra ? borra.status() : 'sin respuesta'));
      const despues = await leer(true);   // tras borrar manda el servidor; la copia local puede tardar en enterarse
      h.espera(despues.length === 0, 'quedan con el prefijo tras recargar (según el servidor): ' + despues.length + (despues.length ? ' (' + despues.map((x) => x.id).join(', ') + ')' : ''));
    },
  }],
};
