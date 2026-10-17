// cache-perfiles.spec.js - mide y vacía la copia local (localStorage) de la app en los perfiles de PRUEBA admin y oper
// (M-650, 17-oct: QuotaExceededError al guardar str-col-lastpush-v1 tumbó 21 casos de la regresión de L-145).
// Lo mantiene el Arquitecto. Se corre con correr\cache-perfiles.txt -> log\CACHE-PERFILES-guion.json, con la cola sin lote.
// Abre /api/health (JSON: no corre ningún script de la app, así nada vuelve a llenar la copia mientras se mide), lista el
// tamaño de cada clave del origen y borra solo las copias de colecciones «str-col-*». No borra la sesión, ni las colas de
// subida pendiente (claves con pend/cola/outbox/subida), ni nada fuera del origen de la app. Nunca toca el servidor ni
// los perfiles de Carlos: solo pw\perfiles-chrome\admin y \oper. La próxima carga de la app vuelve a bajar lo que necesita.
const GUARDAR = /pend|cola|outbox|subida/i;
function caso(c, perfil) {
  return {
    c, perfil, pagina: '/api/health',
    que: 'perfil de prueba ' + perfil + ': tamaño de la copia local y vaciado de str-col-*',
    async prueba(h) {
      const r = await h.page.evaluate((patron) => {
        const guardar = new RegExp(patron, 'i');
        const medir = () => { const out = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); out.push({ k, n: (k.length + (localStorage.getItem(k) || '').length) * 2 }); } return out.sort((a, b) => b.n - a.n); };
        const antes = medir();
        const borrar = antes.filter((x) => x.k.startsWith('str-col-') && !guardar.test(x.k)).map((x) => x.k);
        borrar.forEach((k) => { try { localStorage.removeItem(k); } catch (e) { } });
        const despues = medir();
        const kb = (l) => Math.round(l.reduce((a, x) => a + x.n, 0) / 1024);
        return { kbAntes: kb(antes), kbDespues: kb(despues), claves: antes.length, borradas: borrar.length, mayores: antes.slice(0, 8).map((x) => x.k + ' ' + Math.round(x.n / 1024) + ' KB'), quedan: despues.slice(0, 6).map((x) => x.k + ' ' + Math.round(x.n / 1024) + ' KB') };
      }, GUARDAR.source);
      h.espera(r.kbDespues < r.kbAntes || r.borradas === 0, perfil + ': antes ' + r.kbAntes + ' KB en ' + r.claves + ' claves · borradas ' + r.borradas + ' (str-col-*) · después ' + r.kbDespues + ' KB || mayores: ' + r.mayores.join(' | ') + ' || quedan: ' + (r.quedan.join(' | ') || '-'));
    },
  };
}
module.exports = {
  req: 'CACHE-PERFILES',
  zona: 'sesiones',
  casos: [caso('c1', 'admin'), caso('c2', 'oper')],
};
