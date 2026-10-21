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
// V9 (LM-62, PRUEBAS-v2; Carlos 20-oct: umbral 3 s en LENOVO): tiempos de /api/health y de las tres páginas más usadas con zz-verif-oper.
// No bloquea la cola ni rechaza lotes: deja los milisegundos en `observado` y el caso en rojo solo si alguno pasa el umbral; con
// rojo, Desarrollo abre un INC de severidad «medio» (contra: producto o entorno, según la causa).
const UMBRAL_MS = 3000;
const PAGINAS = ['/str-tablero.html', '/str-calendario.html', '/str-inventario.html'];
function tiempos(c) {
  return {
    c, perfil: 'oper', pagina: '/str-app-shell.html', tec: 'límite',
    que: 'tiempos: /api/health (en caliente; el frío se anota) y ' + PAGINAS.join(', ') + ' cargan en menos de ' + UMBRAL_MS / 1000 + ' s cada una (V9)',
    async prueba(h) {
      const p = h.page, medidas = [];
      // M-955 (Desarrollo, 20-oct): la primera petición tras horas quietas paga el arranque en frío del hosting (INC-205: 5,7 s).
      // Se registra como «frío» sin juzgarla (solo cuenta si no responde) y el umbral se aplica a la segunda, que es la respuesta normal.
      const tf = Date.now(); const rf = await p.request.get(h.BASE + '/api/health').catch(() => null); const frio = { que: '/api/health (frío)', ms: Date.now() - tf, status: rf ? rf.status() : 0, informativo: true };
      const t0 = Date.now(); const r = await p.request.get(h.BASE + '/api/health').catch(() => null); medidas.push({ que: '/api/health', ms: Date.now() - t0, status: r ? r.status() : 0 });
      for (const pg of PAGINAS) {
        const t1 = Date.now();
        try { await p.goto(h.BASE + pg, { waitUntil: 'load', timeout: 30000 }); medidas.push({ que: pg, ms: Date.now() - t1, status: 200 }); }
        catch (e) { medidas.push({ que: pg, ms: Date.now() - t1, status: 0, error: String(e && e.message || e).slice(0, 80) }); }
      }
      const lentas = medidas.filter((m) => m.ms > UMBRAL_MS || !m.status).concat(frio.status ? [] : [frio]);
      h.espera(lentas.length === 0, 'frío ' + frio.ms + ' ms' + (frio.status ? '' : ' (sin respuesta)') + ' · ' + medidas.map((m) => m.que + ' ' + m.ms + ' ms' + (m.status ? '' : ' (sin respuesta)')).join(' · ') + (lentas.length ? ' · fuera del umbral de ' + UMBRAL_MS + ' ms: ' + lentas.map((m) => m.que).join(', ') : ' · todas bajo ' + UMBRAL_MS + ' ms (el frío solo se anota)'));
    },
  };
}
module.exports = {
  req: 'HUMO-PW',
  zona: 'sesiones',
  casos: [
    sesion('s1', 'admin'), sesion('s2', 'oper'), sesion('s3', 'colab'), tiempos('t'),
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
