// Limpia la cola local del perfil de prueba zz-verif-colab (INC-128, M-423): los conteos de corridas fallidas que
// quedaron sin subir (at '__server__') de turnos que ya no existen, y lo que str-api no pudo subir de inv-movimientos.
// Solo toca localStorage del perfil de prueba en LENOVO; no escribe nada en el servidor (la pagina queda sin sincronizar
// hasta la siguiente carga, y lo que suba despues lo filtra la guardia). La cola lo corre con correr\limpiar-cola-colab.txt.
// Claves (Desarrollo, M-423): 'str-inv-movimientos-v1' (no subidos: at '__server__'), 'str-col-pending-v1' (por coleccion),
// 'str-turnos-v1' (turnos que el colaborador ve; si el turnoId del movimiento no esta ahi, es de una corrida borrada).
module.exports = {
  req: 'LIMPIAR-COLA-COLAB',
  zona: 'sesiones',
  casos: [
    {
      c: 'l1', perfil: 'colab', pagina: '/str-app-shell.html',
      que: 'el perfil colab queda sin conteos huérfanos ni pendientes de inv-movimientos en su cola local',
      async prueba(h) {
        const p = h.page;
        await p.waitForLoadState('networkidle').catch(() => {});
        const r = await p.evaluate(() => {
          const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
          const turnos = new Set((leer('str-turnos-v1', '[]') || []).map((t) => t && String(t.id)));
          const movs = leer('str-inv-movimientos-v1', '[]') || [];
          const huerfanos = movs.filter((m) => m && m.at === '__server__' && !turnos.has(String(m.turnoId)));
          const quedan = movs.filter((m) => !(m && m.at === '__server__' && !turnos.has(String(m.turnoId))));
          if (huerfanos.length) localStorage.setItem('str-inv-movimientos-v1', JSON.stringify(quedan));
          const pend = leer('str-col-pending-v1', '{}') || {};
          let pendMov = 0;
          if (Array.isArray(pend)) { pendMov = pend.filter((x) => x && (x.col === 'inv-movimientos' || x.coleccion === 'inv-movimientos')).length; if (pendMov) localStorage.setItem('str-col-pending-v1', JSON.stringify(pend.filter((x) => !(x && (x.col === 'inv-movimientos' || x.coleccion === 'inv-movimientos'))))); }
          else if (pend && typeof pend === 'object' && pend['inv-movimientos'] != null) { pendMov = Array.isArray(pend['inv-movimientos']) ? pend['inv-movimientos'].length : 1; delete pend['inv-movimientos']; localStorage.setItem('str-col-pending-v1', JSON.stringify(pend)); }
          return { turnos: turnos.size, movs: movs.length, huerfanos: huerfanos.length, pendMov, forma: Array.isArray(pend) ? 'lista' : typeof pend };
        });
        h.espera(true, 'turnos visibles ' + r.turnos + ' · movimientos locales ' + r.movs + ' · huérfanos quitados ' + r.huerfanos + ' · pendientes de inv-movimientos quitados ' + r.pendMov + ' (str-col-pending-v1: ' + r.forma + ')');
        await p.reload({ waitUntil: 'domcontentloaded' });
        await p.waitForLoadState('networkidle').catch(() => {});
        const d = await p.evaluate(() => {
          const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
          const turnos = new Set((leer('str-turnos-v1', '[]') || []).map((t) => t && String(t.id)));
          return (leer('str-inv-movimientos-v1', '[]') || []).filter((m) => m && m.at === '__server__' && !turnos.has(String(m.turnoId))).length;
        });
        h.espera(d === 0, 'huérfanos tras recargar: ' + d);
      },
    },
  ],
};
