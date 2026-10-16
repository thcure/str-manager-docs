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
  // v4 (limpieza al sobre RT-25, 16-oct): "lotes": true = todas las filas cuyo campo empieza por zz-verif-L<n>- o
  // zz-verif-L-<n>- (acumuladas por los lotes; la expresión está fija aquí, no se configura). Nunca toca la semilla fija.
  const lotes = c.lotes === true;
  const prefijos = lotes ? ['zz-verif-L<n>-'] : (Array.isArray(c.prefijos) ? c.prefijos : [c.prefijo]).map((x) => String(x || ''));
  if (!prefijos.length || prefijos.some((x) => !/^zz-verif-/.test(x))) throw new Error('limpiar-zz.json: cada prefijo debe empezar por zz-verif-');
  const campo = String(c.campo || 'nombre');
  if (!/^[A-Za-z0-9_]+$/.test(campo)) throw new Error('limpiar-zz.json: campo inválido');
  const pagina = String(c.pagina || '/str-inventario.html');
  if (!/^\/[a-z0-9-]+\.html$/.test(pagina)) throw new Error('limpiar-zz.json: pagina inválida');
  const tope = Math.max(1, Math.min(200, Number(c.tope) || 100));   // filas por petición
  return { col: c.col, prefijos, campo, hoy: c.hoy === true, pagina, lotes, tope };
}
function hoyBogota() {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return f;   // AAAA-MM-DD
}
const RE_LOTE = /^zz-verif-L-?\d+-/;
// Colecciones donde se buscan referencias: una fila de lote cuyo id aparece en los datos de una fila que NO es de lote
// (semilla fija u otra) no se borra (protegida), para no dejar a la semilla apuntando a una fila borrada.
// Solo cuentan las filas que se quedan y no son de lote (la semilla fija, propiedades y flujos); las filas de otros lotes
// y los turnos o movimientos de pruebas viejas no protegen nada (se irían igual en su propia limpieza).
const COLS_REF = ['propiedades', 'flujos', 'inv-depositos', 'inv-articulos', 'inv-estados', 'inv-sububicaciones', 'inv-grupos', 'inv-proveedores'];
function protegidos(candidatos, otras) {   // pura: candidatos [{id}], otras [{id, data}] (filas que no se borran)
  const texto = otras.map((x) => JSON.stringify(x.data || {})).join('\n');
  return new Set(candidatos.map((x) => String(x.id)).filter((id) => id.length >= 4 && (texto.indexOf('"' + id + '"') >= 0)));
}
const filas = (j) => (Array.isArray(j) ? j : (j && Array.isArray(j.items) ? j.items : [])).filter((x) => x && !x.deleted && x.data && typeof x.data === 'object');
let CFG = null; try { CFG = config(); } catch (e) { CFG = null; }
module.exports = {
  req: 'LIMPIAR-ZZ',
  protegidos, RE_LOTE,
  zona: 'sesiones',
  casos: [{
    c: 'z', perfil: 'admin', pagina: (CFG && CFG.pagina) || '/str-inventario.html',
    que: 'no queda ninguna fila cuyo campo empiece por alguno de los prefijos zz-verif- de limpiar-zz.json en su colección',
    async prueba(h) {
      const p = h.page;
      const { col, prefijos, campo, hoy, lotes, tope } = config();
      const fecha = hoyBogota();
      const conPrefijo = (x) => (lotes ? RE_LOTE.test(String((x.data || {})[campo] || '')) : prefijos.some((pf) => String((x.data || {})[campo] || '').startsWith(pf))) && (!hoy || JSON.stringify(x.data || {}).indexOf(fecha) >= 0);
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
      let antes = await leer();
      h.espera(true, col + ' · ' + campo + ' con prefijo ' + prefijos.join(' | ') + (hoy ? ' · solo de hoy ' + fecha : '') + ': ' + antes.length + ' fila(s)' + (antes.length && antes.length <= 30 ? ' (' + antes.map((x) => x.id).join(', ') + ')' : ''));
      if (lotes && antes.length) {   // v4: protege las filas de lote a las que apunta una fila que se queda
        const otras = [];
        for (const c of COLS_REF) {
          const j = await p.evaluate(async (cc) => { try { return await STRApi.get('/col/' + cc); } catch (e) { return null; } }, c).catch(() => null);
          filas(j).forEach((x) => { if (!conPrefijo(x) && !RE_LOTE.test(String((x.data || {}).nombre || ''))) otras.push(x); });
        }
        const prot = protegidos(antes, otras);
        h.espera(true, 'filas de lote a las que apunta una fila que se queda (no se borran): ' + prot.size + (prot.size ? ' (' + [...prot].slice(0, 20).join(', ') + ')' : '') + ' · filas que se quedan revisadas: ' + otras.length);
        antes = antes.filter((x) => !prot.has(String(x.id)));
      }
      if (!antes.length) return;
      await p.waitForFunction(() => window.STRApi && STRApi.col && typeof STRApi.col.push === 'function', null, { timeout: 30000 });
      // v4: por tandas de `tope` filas (100 por defecto), en serie: resubir tal cual y borrar
      let borradas = 0, malas = 0;
      for (let i = 0; i < antes.length; i += tope) {
        const tanda = antes.slice(i, i + tope);
        const ids = tanda.map((x) => String(x.id));
        const items = tanda.map((x) => ({ id: x.id, data: x.data }));
        const re = await h.respuesta('/api/col/' + col, () => p.evaluate(([c, it]) => STRApi.col.push(c, it, []).catch((e) => ({ error: String(e && e.message || e) })), [col, items])).catch(() => null);
        const borra = (re && re.status() === 200) ? await h.respuesta('/api/col/' + col, () => p.evaluate(([c, id]) => STRApi.col.push(c, [], id).catch((e) => ({ error: String(e && e.message || e) })), [col, ids])).catch(() => null) : null;
        if (borra && borra.status() === 200) borradas += ids.length; else malas++;
        if (malas) { h.espera(false, 'tanda ' + (i / tope + 1) + ': resubida ' + (re ? re.status() : 'sin respuesta') + ' · borrado ' + (borra ? borra.status() : 'no se intentó')); break; }
      }
      h.espera(malas === 0, 'borradas ' + borradas + ' de ' + antes.length + ' en tandas de ' + tope);
      const despues = (await leer(true)).filter((x) => antes.some((a) => String(a.id) === String(x.id)));   // tras borrar manda el servidor
      h.espera(despues.length === 0, 'quedan de las que se iban a borrar, tras releer (según el servidor): ' + despues.length + (despues.length && despues.length <= 30 ? ' (' + despues.map((x) => x.id).join(', ') + ')' : ''));
    },
  }],
};
