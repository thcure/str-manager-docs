// purga-movimientos.spec.js - purga completa de los movimientos de inventario de PRUEBA (INC-146, L-147; LM-53).
// Lo mantiene el Arquitecto. Se corre con correr\purga-movimientos.txt -> log\PURGA-MOVIMIENTOS-guion.json, con la cola
// sin lote y L-147 aceptado. Pasos: (1) ensayo GET /api/purga-prueba/movimientos (cuenta, no toca nada); (2) si hay algo
// que purgar, POST {confirmo:'zz-verif-'} (borrado suave; la regla doble la aplica el servidor: autor zz-verif- y todo lo
// referenciado de prueba); (3) un segundo ensayo debe dar 0. Es el único script que enciende GUARDIA.purgaCompleta, y lo
// apaga al terminar. Nunca manda ids reales ni toca otra ruta. El log lleva cuentas, motivos y hasta 5 ids, nunca datos.
const { GUARDIA } = require('./comun');
async function api(h, metodo, ruta, cuerpo) {
  await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
  return h.page.evaluate(([m, r, c]) => (m === 'GET' ? STRApi.get(r) : STRApi.post(r, c))
    .then((j) => ({ status: 200, j }), (e) => ({ status: (e && e.status) || 0, j: (e && e.datos) || null, msg: e && e.message })), [metodo, ruta, cuerpo]);
}
module.exports = {
  req: 'PURGA-MOVIMIENTOS',
  zona: 'sesiones',
  casos: [{
    c: 'p', perfil: 'admin', pagina: '/str-inventario.html',
    que: 'ensayo, purga completa de los movimientos de prueba y segundo ensayo en 0',
    async prueba(h) {
      const e1 = await api(h, 'GET', '/purga-prueba/movimientos');
      const a = e1.j || {};
      h.espera(e1.status === 200 && a.ensayo === true, 'ensayo: ' + e1.status + ' · movimientos ' + a.movimientos + ' · borraría ' + a.borraria + ' · se quedan con algo de prueba ' + JSON.stringify(a.excluidos || {}) + ' · muestra ' + JSON.stringify(a.muestra || []));
      if (e1.status !== 200 || !a.borraria) return;
      GUARDIA.purgaCompleta = true;
      let p;
      try { p = await api(h, 'POST', '/purga-prueba/movimientos', { confirmo: 'zz-verif-' }); }
      finally { GUARDIA.purgaCompleta = false; }
      const b = p.j || {};
      h.espera(p.status === 200 && b.ensayo === false && b.borrados === a.borraria, 'purga: ' + p.status + ' · borrados ' + b.borrados + ' de ' + a.borraria + ' · horas ' + JSON.stringify(b.horas || []));
      const e2 = await api(h, 'GET', '/purga-prueba/movimientos');
      const c = e2.j || {};
      h.espera(e2.status === 200 && c.borraria === 0, 'segundo ensayo: borraría ' + c.borraria + ' · movimientos activos ' + c.movimientos);
    },
  }],
};
