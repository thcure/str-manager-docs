// pendientes-zz.spec.js - cuenta de SOLO LECTURA de los pendientes de inventario de prueba (DA-47, ventana del barrido;
// M-731/M-732). Lo mantiene el Arquitecto. correr\pendientes-zz.txt -> log\PENDIENTES-ZZ-guion.json. Un pendiente es de
// prueba si algún valor de su data es el id de una fila de prueba (propiedad, turno, zona, artículo, lugar con «zz-verif-»
// en su nombre, name o propName; también las ya borradas si el servidor las devuelve) o si su data contiene «zz-verif-».
// Solo cuentas, estados, tipos e ids de pendiente; nunca datos. No escribe nada.
const COLS_ZZ = ['propiedades', 'turnos', 'inv-depositos', 'inv-articulos', 'inv-sububicaciones'];
const CERRADOS = /^(hecho|cerrado|resuelto|anulado)$/i;
// Pura: ids de filas de prueba. filas [{id, data}]
function idsZz(filas, reales) {
  const s = new Set();
  for (const x of filas || []) {
    const d = (x && x.data) || {};
    if (['nombre', 'name', 'propName'].some((k) => typeof d[k] === 'string' && d[k].startsWith('zz-verif-'))) s.add(String(x.id));
    else if (reales && x && x.id != null) reales.add(String(x.id));
  }
  return s;
}
// Pura: clasifica pendientes. → {total, abiertos, zz, zzAbiertos, porEstado, porTipoZzAbiertos, idsZzAbiertos}
function clasificar(pend, zz, reales) {
  reales = reales || new Set();
  const vivos = (pend || []).filter((x) => x && !x.deleted && x.data);
  const r = { total: vivos.length, abiertos: 0, zz: 0, zzAbiertos: 0, porEstado: {}, porTipoZzAbiertos: {}, idsZzAbiertos: [], mixtosAbiertos: 0, idsMixtosAbiertos: [] };
  for (const x of vivos) {
    const d = x.data; const est = String(d.estado || '(sin estado)'); const abierto = !CERRADOS.test(est);
    r.porEstado[est] = (r.porEstado[est] || 0) + 1;
    if (abierto) r.abiertos++;
    const esZz = JSON.stringify(d).includes('zz-verif-') || Object.values(d).some((v) => (typeof v === 'string' || typeof v === 'number') && zz.has(String(v)));
    if (!esZz) continue;
    r.zz++;
    // Diseño (M-733): solo se cierra si el turno y la propiedad también son de prueba; si apunta a un turno o una propiedad
    // real es «mixto» y decide Carlos
    const mixto = Object.entries(d).some(([k, v]) => /turno|prop/i.test(k) && (typeof v === 'string' || typeof v === 'number') && reales.has(String(v)));
    if (abierto && mixto) { r.mixtosAbiertos++; r.idsMixtosAbiertos.push(String(x.id)); }
    else if (abierto) { r.zzAbiertos++; const t = String(d.tipo || '(sin tipo)'); r.porTipoZzAbiertos[t] = (r.porTipoZzAbiertos[t] || 0) + 1; r.idsZzAbiertos.push(String(x.id)); }
  }
  return r;
}
module.exports = {
  req: 'PENDIENTES-ZZ', zona: 'sesiones', idsZz, clasificar,
  casos: [{
    c: 'p', perfil: 'admin', pagina: '/str-inventario.html', que: 'Solo lectura: pendientes de inventario de prueba, abiertos y cerrados',
    async prueba(h) {
      const p = h.page;
      await p.waitForFunction(() => window.STRApi && typeof STRApi.get === 'function', null, { timeout: 30000 }).catch(() => {});
      const leer = (c) => p.evaluate(async (col) => { try { const j = await STRApi.get('/col/' + col); return Array.isArray(j) ? j : (j && j.items) || []; } catch (e) { return { error: String(e && e.message || e) }; } }, c);
      const zz = new Set(); const reales = new Set(); const err = [];
      for (const c of COLS_ZZ) { const f = await leer(c); if (f && f.error) err.push(c); else idsZz(f, reales).forEach((i) => zz.add(i)); }
      const pend = await leer('inv-pendientes');
      if (pend && pend.error) { h.espera(false, 'inv-pendientes no se pudo leer: ' + pend.error.slice(0, 120)); return; }
      const r = clasificar(pend, zz, reales);
      h.espera(!err.length, 'filas de prueba de referencia: ' + zz.size + (err.length ? ' · sin leer: ' + err.join(',') : ''));
      h.espera(true, 'pendientes vivos ' + r.total + ' · abiertos ' + r.abiertos + ' · de prueba ' + r.zz + ' · de prueba abiertos (todo de prueba) ' + r.zzAbiertos + ' · abiertos mixtos (turno o propiedad real) ' + r.mixtosAbiertos + ' ' + JSON.stringify(r.idsMixtosAbiertos.slice(0, 40)) + ' || por estado ' + JSON.stringify(r.porEstado) + ' || de prueba abiertos por tipo ' + JSON.stringify(r.porTipoZzAbiertos) + ' || ids ' + r.idsZzAbiertos.slice(0, 60).join(','));
    },
  }],
};
