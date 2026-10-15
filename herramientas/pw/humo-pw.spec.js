// humo-pw.spec.js - humo de una versión nueva de pw antes de que la cola juzgue lotes con ella (M-435, Diseño).
// Lo mantiene el Arquitecto. Tras instalar pw en LENOVO se corre con correr\humo-pw.txt -> log\HUMO-PW-guion.json; si algo
// sale rojo, se vuelve a pw\anterior\ y no se reencola ningún lote. Comprueba: (s1-s3) los tres perfiles tienen sesión
// (/api/me 200, con la guardia dejando pasar POST /api/login si la sesión venció); (w) una escritura zz-verif- de ida y
// vuelta (crea y borra un estado inactivo zz-verif-humo-pw en inv-estados por STRApi.col.push, la misma vía que la app).
// No toca datos reales: el único dato que crea lo borra en el mismo caso.
function sesion(c, perfil) {
  return {
    c, perfil, pagina: '/str-app-shell.html',
    que: 'el perfil ' + perfil + ' tiene sesión (/api/me 200)',
    async prueba(h) {
      const r = await h.respuesta('/api/me', () => h.page.reload({ waitUntil: 'domcontentloaded' })).catch(() => null);
      let us = {};
      if (r) { try { const j = await r.json(); us = j.user || j; } catch (e) { } }
      h.espera(!!r && r.status() === 200, '/api/me ' + (r ? r.status() : 'sin respuesta') + (us.rol ? ' · rol ' + us.rol : ''));
    },
  };
}
const ID = 'zz-verif-humo-pw';
module.exports = {
  req: 'HUMO-PW',
  zona: 'sesiones',
  casos: [
    sesion('s1', 'admin'), sesion('s2', 'oper'), sesion('s3', 'colab'),
    {
      c: 'w', perfil: 'admin', pagina: '/str-inventario.html',
      que: 'una escritura zz-verif- pasa la guardia y su borrado también (inv-estados, ida y vuelta)',
      async prueba(h) {
        const p = h.page;
        await p.waitForFunction(() => window.STRApi && STRApi.col && typeof STRApi.col.push === 'function', null, { timeout: 30000 });
        const alta = await h.respuesta('/api/col/inv-estados', () => p.evaluate((id) => STRApi.col.push('inv-estados', [{ id, data: { nombre: id, pendiente: 'nada', activo: false } }], []).catch((e) => ({ error: String(e && e.message || e) })), ID)).catch(() => null);
        h.espera(!!alta && alta.status() === 200, 'alta de ' + ID + ': ' + (alta ? alta.status() : 'sin respuesta'));
        const baja = await h.respuesta('/api/col/inv-estados', () => p.evaluate((id) => STRApi.col.push('inv-estados', [], [id]).catch((e) => ({ error: String(e && e.message || e) })), ID)).catch(() => null);
        h.espera(!!baja && baja.status() === 200, 'baja de ' + ID + ': ' + (baja ? baja.status() : 'sin respuesta'));
      },
    },
  ],
  // Si la baja no llegó a salir, que no quede el estado de humo.
  async limpiar(h) {
    try { await h.page.goto(h.BASE + '/str-inventario.html', { waitUntil: 'domcontentloaded' }); await h.page.waitForFunction(() => window.STRApi && STRApi.col, null, { timeout: 20000 }); await h.page.evaluate((id) => STRApi.col.push('inv-estados', [], [id]), ID); } catch (e) { }
  },
};
