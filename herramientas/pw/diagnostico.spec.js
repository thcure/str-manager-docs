// diagnostico.spec.js - lee GET /api/diagnostico (DT-41 = L-119, solo admin y solo lectura) varias veces seguidas y deja
// los valores en log\DIAGNOSTICO-guion.json, para la medición de DT-40 (conexiones persistentes < 75). Lo mantiene el
// Arquitecto; la cola lo corre con correr\diagnostico.txt. No escribe nada. Campos: persistente, conexiones, dormidas,
// maxUsuario, hora (sin consultas, máquinas ni ids).
const MUESTRAS = 6, CADA_MS = 5000, UMBRAL = 60;
module.exports = {
  req: 'DIAGNOSTICO',
  zona: 'sesiones',
  casos: [{
    c: 'd', perfil: 'admin', pagina: '/str-app-shell.html',
    que: 'conexiones de la app a MySQL (persistentes) muy por debajo de ' + UMBRAL + ' en ' + MUESTRAS + ' muestras',
    async prueba(h) {
      const p = h.page;
      await p.waitForLoadState('networkidle').catch(() => {});
      const leer = () => p.evaluate(async () => {
        try {
          if (window.STRApi && typeof STRApi.get === 'function') { try { const j = await STRApi.get('/diagnostico'); if (j && typeof j === 'object') return { via: 'STRApi.get', j }; } catch (e) { } }
          const r = await fetch('/api/diagnostico', { credentials: 'include' });
          let j = null; try { j = await r.json(); } catch (e) { }
          return { via: 'fetch', status: r.status, j };
        } catch (e) { return { error: String(e && e.message || e) }; }
      });
      const m = [];
      for (let i = 0; i < MUESTRAS; i++) {
        const r = await leer();
        const j = (r && r.j) || {};
        m.push({ t: new Date().toISOString().slice(11, 19), via: r.via, status: r.status, persistente: j.persistente, conexiones: j.conexiones, dormidas: j.dormidas, maxUsuario: j.maxUsuario, hora: j.hora, error: r.error || (j && j.error) });
        if (i < MUESTRAS - 1) await p.waitForTimeout(CADA_MS);
      }
      const ok = m.filter((x) => typeof x.conexiones === 'number');
      const max = ok.length ? Math.max(...ok.map((x) => x.conexiones)) : null;
      h.espera(ok.length === MUESTRAS, 'lecturas válidas: ' + ok.length + '/' + MUESTRAS + (ok.length ? '' : ' · ' + JSON.stringify(m[0]).slice(0, 300)));
      h.espera(ok.every((x) => x.persistente === true), 'persistente: ' + [...new Set(m.map((x) => String(x.persistente)))].join(','));
      h.espera(max != null && max < UMBRAL, 'conexiones (máx. de las muestras): ' + max + ' · dormidas: ' + ok.map((x) => x.dormidas).join(',') + ' · maxUsuario: ' + (ok[0] && ok[0].maxUsuario) + ' · serie: ' + ok.map((x) => x.t + '=' + x.conexiones).join(' '));
    },
  }],
};
