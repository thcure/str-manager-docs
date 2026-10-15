// Limpia la cola local del perfil de prueba zz-verif-colab (INC-128, M-423): los conteos de corridas fallidas que
// quedaron sin subir (at '__server__') de turnos que ya no existen, y lo que str-api no pudo subir de inv-movimientos.
// Solo toca localStorage del perfil de prueba en LENOVO; no escribe nada en el servidor (la pagina queda sin sincronizar
// hasta la siguiente carga, y lo que suba despues lo filtra la guardia). La cola lo corre con correr\limpiar-cola-colab.txt.
// v2 (M-498): caso l2 limpia ademas la IndexedDB str-cola-subida (fotos/evidencias/videos de prueba sin subir).
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
    // v2 (M-498, INC-132/L-127): la cola local de SUBIDA (IndexedDB str-cola-subida, store items; fotos, evidencias y
    // videos que no llegaron al servidor). Quita solo lo de prueba: ítems con ref o turnoId zz-verif-, o cuyo turno ya no
    // existe en str-turnos-v1 (corrida borrada). Nunca los de un turno real vigente. Si la base no existe, no la crea
    // (abrirla sin version la crearia vacia y rompería el onupgradeneeded de la app).
    {
      c: 'l2', perfil: 'colab', pagina: '/str-app-shell.html',
      que: 'la cola local de subida del perfil colab queda sin fotos ni videos de prueba (zz-verif- o de turnos borrados)',
      async prueba(h) {
        const p = h.page;
        await p.waitForLoadState('networkidle').catch(() => {});
        const limpiar = () => p.evaluate(async () => {
          const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || d); } catch (e) { return JSON.parse(d); } };
          const turnos = new Set((leer('str-turnos-v1', '[]') || []).map((t) => t && String(t.id)));
          const hay = indexedDB.databases ? (await indexedDB.databases()).some((b) => b && b.name === 'str-cola-subida') : true;
          if (!hay) return { existe: false, total: 0, quitados: 0, quedanPrueba: 0 };
          const db = await new Promise((ok, no) => { const q = indexedDB.open('str-cola-subida'); q.onsuccess = () => ok(q.result); q.onerror = () => no(q.error); q.onblocked = () => no(new Error('bloqueada')); });
          try {
            if (!db.objectStoreNames.contains('items')) return { existe: true, sinStore: true, total: 0, quitados: 0, quedanPrueba: 0 };
            const todos = await new Promise((ok, no) => { const r = db.transaction('items', 'readonly').objectStore('items').getAll(); r.onsuccess = () => ok(r.result || []); r.onerror = () => no(r.error); });
            const esZz = (v) => typeof v === 'string' && v.indexOf('zz-verif-') >= 0;
            const dePrueba = (it) => it && (esZz(it.ref) || esZz(it.turnoId) || esZz(it.nombre) || (it.turnoId != null && !turnos.has(String(it.turnoId))));
            const quitar = todos.filter(dePrueba);
            if (quitar.length) await new Promise((ok, no) => { const tx = db.transaction('items', 'readwrite'); const st = tx.objectStore('items'); quitar.forEach((it) => st.delete(it.id)); tx.oncomplete = () => ok(); tx.onerror = () => no(tx.error); });
            const despues = await new Promise((ok, no) => { const r = db.transaction('items', 'readonly').objectStore('items').getAll(); r.onsuccess = () => ok(r.result || []); r.onerror = () => no(r.error); });
            return { existe: true, total: todos.length, quitados: quitar.length, estados: quitar.map((it) => it.estado), quedanPrueba: despues.filter(dePrueba).length, quedanTotal: despues.length };
          } finally { db.close(); }
        });
        const r = await limpiar().catch((e) => ({ error: String(e && e.message || e) }));
        h.espera(!r.error, 'cola de subida: ' + (r.error ? 'error ' + r.error : (!r.existe ? 'no existe (nada que limpiar)' : r.sinStore ? 'sin store items' : r.total + ' ítem(s), ' + r.quitados + ' de prueba quitado(s) [' + (r.estados || []).join(',') + '], quedan ' + r.quedanTotal + ' (de turnos reales)')));
        h.espera(!r.error && !r.quedanPrueba, 'ítems de prueba que quedan en la cola de subida: ' + (r.quedanPrueba || 0));
      },
    },
  ],
};
