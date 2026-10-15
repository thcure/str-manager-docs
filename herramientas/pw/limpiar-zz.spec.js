// limpiar-zz.spec.js - borra la basura de prueba que un limpiar() no alcanzó (M-437): en UNA colección, las filas cuyo
// campo (por defecto `nombre`) empieza por un prefijo zz-verif- dado. Lo mantiene el Arquitecto. Qué y dónde lo dice pw\limpiar-zz.json:
//   { "col": "inv-depositos", "prefijo": "zz-verif-L-111-r-" }  o  { "col": "inv-proveedores", "prefijos": ["zz-verif-L-103-r-", "zz-verif-L-111-r-"] }
//   v3 (M-485): { "col": "turnos", "campo": "propName", "prefijo": "zz-verif-Propiedad", "hoy": true }  → turnos zz de hoy en zz-verif-Propiedad
//   "campo": qué campo de data se compara (nombre, propName…); "hoy": solo filas cuyo data contiene la fecha de hoy (Bogotá, AAAA-MM-DD);
//   "pagina": desde qué página se hace (por defecto /str-inventario.html; cualquier página con STRApi sirve).
// La cola lo corre con correr\limpiar-zz.txt -> log\LIMPIAR-ZZ-guion.json. Cómo pasa la guardia sin aflojarla: primero
// vuelve a subir esas mismas filas tal cual (filas con zz-verif-: la guardia las deja pasar y anota sus ids como de la
// corrida) y después las borra (solo se borran ids anotados). Una fila sin zz-verif- en el campo nunca entra.
const fs = require('fs');
const path = require('path');
// v2 (M-458): acepta "prefijo" (uno) o "prefijos" (lista); todos deben empezar por zz-verif-.
function config() {
  const c = JSON.parse(fs.readFileSync(path.join(__dirname, 'limpiar-zz.json'), 'utf8'));
  if (!/^[a-z0-9-]+$/.test(String(c.col || ''))) throw new Error('limpiar-zz.json: col inválida');
  const prefijos = (Array.isArray(c.prefijos) ? c.prefijos : [c.prefijo]).map((x) => String(x || ''));
  if (!prefijos.length || prefijos.some((x) => !/^zz-verif-/.test(x))) throw new Error('limpiar-zz.json: cada prefijo debe empezar por zz-verif-');
  const campo = String(c.campo || 'nombre');
  if (!/^[A-Za-z0-9_]+$/.test(campo)) throw new Error('limpiar-zz.json: campo inválido');
  const pagina = String(c.pagina || '/str-inventario.html');
  if (!/^\/[a-z0-9-]+\.html$/.test(pagina)) throw new Error('limpiar-zz.json: pagina inválida');
  return { col: c.col, prefijos, campo, hoy: c.hoy === true, pagina };
}
function hoyBogota() {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return f;   // AAAA-MM-DD
}
const filas = (j) => (Array.isArray(j) ? j : (j && Array.isArray(j.items) ? j.items : [])).filter((x) => x && !x.deleted && x.data && typeof x.data === 'object');
let CFG = null; try { CFG = config(); } catch (e) { CFG = null; }
module.exports = {
  req: 'LIMPIAR-ZZ',
  zona: 'sesiones',
  casos: [{
    c: 'z', perfil: 'admin', pagina: (CFG && CFG.pagina) || '/str-inventario.html',
    que: 'no queda ninguna fila cuyo campo empiece por alguno de los prefijos zz-verif- de limpiar-zz.json en su colección',
    async prueba(h) {
      const p = h.page;
      const { col, prefijos, campo, hoy } = config();
      const fecha = hoyBogota();
      const conPrefijo = (x) => prefijos.some((pf) => String((x.data || {})[campo] || '').startsWith(pf)) && (!hoy || JSON.stringify(x.data || {}).indexOf(fecha) >= 0);
      // Tres fuentes, por si la página pide la colección por diferencias o no la pide: STRApi.get (lo que el servidor tiene
      // ahora), la respuesta del servidor al recargar y la copia local de la app (str-<col>-v1), unidas por id.
      const leer = async (soloServidor) => {
        const porId = new Map();
        const anotar = (j) => filas(j).forEach((x) => porId.set(String(x.id), { id: x.id, data: x.data }));
        await p.waitForFunction(() => window.STRApi, null, { timeout: 30000 }).catch(() => {});
        const api = await p.evaluate(async (c) => { try { if (window.STRApi && typeof STRApi.get === 'function') return await STRApi.get('/col/' + c); } catch (e) { } return null; }, col).catch(() => null);
        if (api && filas(api).length) anotar(api);
        else {   // la página no pide la colección o STRApi.get no la trae: se recarga y se captura la respuesta (30 s máx.)
          const r = await h.respuesta('/api/col/' + col, () => p.reload({ waitUntil: 'domcontentloaded' })).catch(() => null);
          let j = null; try { j = r ? await r.json() : null; } catch (e) { }
          anotar(j);
          await p.waitForLoadState('networkidle').catch(() => {});
        }
        const loc = soloServidor ? [] : await p.evaluate((c) => {
          const claves = ['str-' + c + '-v1', 'str-inv-' + c.replace(/^inv-/, '') + '-v1'];
          for (const k of claves) { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); if (Array.isArray(v)) return v; } catch (e) { } }
          return [];
        }, col).catch(() => []);
        loc.forEach((x) => { if (x && x.id != null && !x.deleted && !porId.has(String(x.id))) { const d = Object.assign({}, x); delete d.id; porId.set(String(x.id), { id: x.id, data: d }); } });
        return [...porId.values()].filter(conPrefijo);
      };
      const antes = await leer();
      h.espera(true, col + ' · ' + campo + ' con prefijo ' + prefijos.join(' | ') + (hoy ? ' · solo de hoy ' + fecha : '') + ': ' + antes.length + ' fila(s)' + (antes.length ? ' (' + antes.map((x) => x.id).join(', ') + ')' : ''));
      if (!antes.length) return;
      await p.waitForFunction(() => window.STRApi && STRApi.col && typeof STRApi.col.push === 'function', null, { timeout: 30000 });
      const ids = antes.map((x) => String(x.id));
      const items = antes.map((x) => ({ id: x.id, data: x.data }));
      const re = await h.respuesta('/api/col/' + col, () => p.evaluate(([c, it]) => STRApi.col.push(c, it, []).catch((e) => ({ error: String(e && e.message || e) })), [col, items])).catch(() => null);
      h.espera(!!re && re.status() === 200, 'resubida tal cual (para que la guardia anote los ids): ' + (re ? re.status() : 'sin respuesta'));
      const borra = await h.respuesta('/api/col/' + col, () => p.evaluate(([c, id]) => STRApi.col.push(c, [], id).catch((e) => ({ error: String(e && e.message || e) })), [col, ids])).catch(() => null);
      h.espera(!!borra && borra.status() === 200, 'borrado de ' + ids.length + ' id(s): ' + (borra ? borra.status() : 'sin respuesta'));
      const despues = await leer(true);   // tras borrar manda el servidor; la copia local puede tardar en enterarse
      h.espera(despues.length === 0, 'quedan con el prefijo tras releer (según el servidor): ' + despues.length + (despues.length ? ' (' + despues.map((x) => x.id).join(', ') + ')' : ''));
    },
  }],
};
