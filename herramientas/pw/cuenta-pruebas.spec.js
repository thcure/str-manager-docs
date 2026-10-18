// cuenta-pruebas.spec.js - mueve los 4 usuarios de prueba (zz-verif-) de la cuenta real a la cuenta «zz-verif-pruebas»
// (DA-47, L-150; guardia v8 de LM-54). Lo mantiene el Arquitecto. Se corre una vez con correr\cuenta-pruebas.txt ->
// log\CUENTA-PRUEBAS-guion.json, con la cola sin lote y L-150 aceptado. Pasos: (1) ensayo GET /api/cuenta-pruebas: sigue
// solo si la sesión está en la cuenta real, no hay movimientos sin revertir y los usuarios zz-verif- son EXACTAMENTE los 4
// esperados; (2) POST {confirmo:'zz-verif-pruebas', ids} con esos 4 ids; (3) segundo ensayo: 0 usuarios zz-verif- en la
// cuenta real y 1 movimiento sin revertir. Es el único script que enciende GUARDIA.cuentaPruebas en modo 'mover' y la
// apaga al terminar. El modo revertir vive en cuenta-pruebas-revertir.spec.js. El log lleva ids y nombres zz-verif-,
// nunca correos (el ensayo no los trae).
const { GUARDIA } = require('./comun');
const ESPERADOS = ['zz-verif-admin', 'zz-verif-colab', 'zz-verif-colab2', 'zz-verif-oper'];

async function api(h, metodo, ruta, cuerpo) {
  await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
  return h.page.evaluate(([m, r, c]) => (m === 'GET' ? STRApi.get(r) : STRApi.post(r, c))
    .then((j) => ({ status: 200, j }), (e) => ({ status: (e && e.status) || 0, j: (e && e.datos) || null, msg: e && e.message })), [metodo, ruta, cuerpo]);
}
// Pura: ¿el ensayo permite mover? → { ok, ids, motivo }
function revisarEnsayo(j) {
  if (!j || j.ensayo !== true) return { ok: false, motivo: 'el ensayo no respondió' };
  if (!j.cuentaSesion || j.cuentaSesion.esPruebas !== false) return { ok: false, motivo: 'la sesión no está en la cuenta real' };
  if (j.movimientosSinRevertir !== 0) return { ok: false, motivo: 'hay ' + j.movimientosSinRevertir + ' movimiento(s) sin revertir' };
  const u = Array.isArray(j.usuariosZz) ? j.usuariosZz : [];
  const nombres = u.map((x) => String(x && x.nombre).toLowerCase()).sort();
  if (nombres.join(',') !== ESPERADOS.join(',')) return { ok: false, motivo: 'usuarios zz-verif- distintos de los 4 esperados: ' + JSON.stringify(nombres) };
  if (!u.every((x) => Number.isInteger(x.id) && x.id > 0)) return { ok: false, motivo: 'ids inválidos' };
  return { ok: true, ids: u.map((x) => x.id).sort((a, b) => a - b) };
}
function caso(modo) {
  return {
    c: modo === 'mover' ? 'm' : 'r', perfil: 'admin', pagina: '/str-inventario.html',
    que: modo === 'mover' ? 'ensayo, mover los 4 usuarios zz-verif- a la cuenta de pruebas y segundo ensayo' : 'ensayo, revertir el último movimiento y segundo ensayo',
    async prueba(h) {
      const e1 = await api(h, 'GET', '/cuenta-pruebas');
      const a = e1.j || {};
      const resumen = (x) => 'esPruebas ' + (x.cuentaSesion && x.cuentaSesion.esPruebas) + ' · destino existe ' + (x.destino && x.destino.existe) + ' · zz ' + JSON.stringify((x.usuariosZz || []).map((u) => u.id + ':' + u.nombre)) + ' · sin revertir ' + x.movimientosSinRevertir;
      h.espera(e1.status === 200 && a.ensayo === true, 'ensayo: ' + e1.status + ' · ' + resumen(a));
      if (e1.status !== 200) return;
      let p;
      if (modo === 'mover') {
        const r = revisarEnsayo(a);
        h.espera(r.ok, 'ensayo apto para mover: ' + (r.ok ? 'sí, ids ' + r.ids.join(',') : 'NO · ' + r.motivo));
        if (!r.ok) return;
        GUARDIA.cuentaPruebas = true; GUARDIA.cuentaPruebasModo = 'mover'; GUARDIA.cuentaPruebasIds = new Set(r.ids.map(String));
        try { p = await api(h, 'POST', '/cuenta-pruebas', { confirmo: 'zz-verif-pruebas', ids: r.ids }); }
        finally { GUARDIA.cuentaPruebas = false; GUARDIA.cuentaPruebasModo = null; GUARDIA.cuentaPruebasIds = new Set(); }
        const b = p.j || {};
        h.espera(p.status === 200 && b.movidos === 4, 'mover: ' + p.status + ' · movidos ' + b.movidos + ' · ids ' + JSON.stringify(b.ids || []) + ' · origen ' + b.origen + ' · destino ' + b.destino + ' · movimiento ' + b.movimiento + ' · ' + (b.hora || p.msg || ''));
        const e2 = await api(h, 'GET', '/cuenta-pruebas');
        const c = e2.j || {};
        h.espera(e2.status === 200 && Array.isArray(c.usuariosZz) && c.usuariosZz.length === 0 && c.movimientosSinRevertir === 1 && c.destino && c.destino.existe === true, 'segundo ensayo: ' + resumen(c));
      } else {
        h.espera(a.movimientosSinRevertir >= 1, 'hay un movimiento que revertir: ' + a.movimientosSinRevertir);
        if (!(a.movimientosSinRevertir >= 1)) return;
        GUARDIA.cuentaPruebas = true; GUARDIA.cuentaPruebasModo = 'revertir';
        try { p = await api(h, 'POST', '/cuenta-pruebas', { confirmo: 'zz-verif-pruebas', revertir: true }); }
        finally { GUARDIA.cuentaPruebas = false; GUARDIA.cuentaPruebasModo = null; GUARDIA.cuentaPruebasIds = new Set(); }
        const b = p.j || {};
        h.espera(p.status === 200 && Number.isInteger(b.revertidos) && b.revertidos >= 1, 'revertir: ' + p.status + ' · revertidos ' + b.revertidos + ' · ids ' + JSON.stringify(b.ids || []) + ' · movimiento ' + b.movimiento + ' · ' + (b.hora || p.msg || ''));
        const e2 = await api(h, 'GET', '/cuenta-pruebas');
        const c = e2.j || {};
        h.espera(e2.status === 200 && c.movimientosSinRevertir === 0, 'segundo ensayo: ' + resumen(c));
      }
    },
  };
}
module.exports = { req: 'CUENTA-PRUEBAS', zona: 'sesiones', ESPERADOS, revisarEnsayo, caso, casos: [caso('mover')] };
