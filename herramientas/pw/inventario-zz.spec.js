// inventario-zz.spec.js - inventario de SOLO LECTURA de los datos de prueba (zz-verif-) en la cuenta de los perfiles de
// prueba, colección por colección (DA-47, 18-oct: antes de mover los usuarios zz-verif- a su propia cuenta hay que barrer
// «negocio»). Lo mantiene el Arquitecto. correr\inventario-zz.txt -> log\INVENTARIO-ZZ-guion.json. Un caso por colección
// (el log corta cada caso a 900 caracteres). Por colección: filas vivas, filas con «zz-verif-» en algún campo de primer
// nivel de data (y cuáles campos lo llevan al inicio, con su cuenta) y filas con «zz-verif-» solo dentro de un valor anidado.
// Nunca nombra filas reales ni copia datos: solo cuentas y nombres de campo. No escribe nada.
const COLS = ['propiedades', 'prop-tipos', 'flujos', 'flujo-categorias', 'prop-workflows', 'reservas', 'turnos', 'tickets', 'hk-config', 'guias',
  'ubicaciones', 'ubic-tipos', 'inv-articulos', 'inv-depositos', 'inv-movimientos', 'inv-grupos', 'inv-estados', 'inv-sububicaciones', 'inv-pendientes', 'inv-proveedores'];
// Pura: cuenta por campos. filas: [{id, data, deleted}]
function contar(filas) {
  const vivas = (Array.isArray(filas) ? filas : []).filter((x) => x && !x.deleted && x.data && typeof x.data === 'object');
  const campos = {}; let conZz = 0, anidado = 0, idZz = 0;
  for (const x of vivas) {
    let alguno = false;
    for (const [k, v] of Object.entries(x.data)) {
      if (typeof v === 'string' && v.startsWith('zz-verif-')) { campos[k] = (campos[k] || 0) + 1; alguno = true; }
    }
    if (String(x.id).startsWith('zz-verif-')) idZz++;
    if (alguno) conZz++;
    else if (JSON.stringify(x.data).includes('zz-verif-')) anidado++;
  }
  return { vivas: vivas.length, conZz, anidado, idZz, campos };
}
function caso(col, i) {
  return {
    c: 'i' + (i + 1), perfil: 'admin', pagina: '/str-inventario.html',
    que: 'Solo lectura: ' + col + ' · filas vivas y filas de prueba (zz-verif-) por campo',
    async prueba(h) {
      const p = h.page;
      await p.waitForFunction(() => window.STRApi && typeof STRApi.get === 'function', null, { timeout: 30000 }).catch(() => {});
      const j = await p.evaluate(async (c) => { try { return await STRApi.get('/col/' + c); } catch (e) { return { error: String(e && e.message || e) }; } }, col).catch((e) => ({ error: String(e) }));
      if (j && j.error) { h.espera(false, col + ': no se pudo leer (' + j.error.slice(0, 120) + ')'); return; }
      const r = contar(Array.isArray(j) ? j : (j && j.items) || []);
      h.espera(true, col + ': vivas ' + r.vivas + ' · con zz-verif- en un campo ' + r.conZz + ' · solo anidado ' + r.anidado + ' · id zz-verif- ' + r.idZz + ' || campos: ' + (Object.entries(r.campos).map(([k, n]) => k + ' ' + n).join(', ') || '-'));
    },
  };
}
module.exports = { req: 'INVENTARIO-ZZ', zona: 'sesiones', contar, casos: COLS.map(caso) };
