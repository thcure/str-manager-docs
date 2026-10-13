// Conteo de solo lectura para la condición de Diseño sobre L-86 (M-264). No escribe nada: solo lee las respuestas
// que la propia página pide (/api/col/inv-depositos y /api/col/propiedades). Excluye los registros zz-verif-.
const esPrueba = (o) => Object.values(o || {}).some(v => typeof v === 'string' && v.startsWith('zz-verif-'));
function planos(j) {
  const arr = j && Array.isArray(j.items) ? j.items : (Array.isArray(j) ? j : []);
  return arr.filter(o => o && !o.deleted).map(o => Object.assign({}, (o.data && typeof o.data === 'object') ? o.data : {}, o));
}
async function leer(h, pagina, ruta) {
  const base = h.BASE || new URL(h.page.url()).origin;
  const [r] = await Promise.all([
    h.page.waitForResponse(x => x.url().includes(ruta) && x.request().method() === 'GET', { timeout: 20000 }),
    h.page.goto(base + pagina, { waitUntil: 'load' }),
  ]);
  return planos(await r.json());
}
module.exports = {
  req: 'CONTEO-L86',
  zona: 'inventario',
  casos: [
    {
      c: 'k1', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'Zonas reales activas sin propiedad y propiedades reales sin zona principal propia (solo lectura)',
      async prueba(h) {
        const zonas = (await leer(h, '/str-inventario.html', '/api/col/inv-depositos')).filter(z => !esPrueba(z));
        const props = (await leer(h, '/str-propiedades.html', '/api/col/propiedades')).filter(p => !esPrueba(p));
        const lista = (v) => Array.isArray(v) ? v.map(String) : [];
        const sirve = (z) => lista(z.propIds).concat(z.propId != null && z.propId !== '' ? [String(z.propId)] : []);
        const activas = zonas.filter(z => z.activo !== false);
        const sinProp = activas.filter(z => sirve(z).length === 0);
        const principal = (z) => z.rol === 'principal' || (!z.rol && z.tipo === 'principal');
        const sinPrincipal = props.filter(p => !activas.some(z => principal(z) && z.privada !== true && sirve(z).includes(String(p.id))));
        const nom = (o) => o.nombre || o.name || o.id;
        h.espera(true, 'zonas reales activas: ' + activas.length + ' · sin propiedad: ' + sinProp.length + (sinProp.length ? ' (' + sinProp.map(z => nom(z) + (principal(z) ? ' [principal]' : '')).join(', ') + ')' : '')
          + ' · propiedades reales: ' + props.length + ' · sin principal propia: ' + sinPrincipal.length + (sinPrincipal.length ? ' (' + sinPrincipal.map(nom).join(', ') + ')' : ''));
      },
    },
  ],
};
