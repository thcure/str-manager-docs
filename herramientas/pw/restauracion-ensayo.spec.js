// restauracion-ensayo.spec.js — ensayo de restauración del respaldo diario (DT-42, MJ-6; DA-44, cruce de Carlos 15-oct 19:31).
// Lo corre el ARQUITECTO desde la cola con correr\restauracion-ensayo.txt, una sola vez y de corrido:
//   ensayo → constancia → borrar  (condición a de Diseño, M-530: los tres en el mismo correr\)
// Precondiciones: L-131 aceptado (rutas /api/restauracion/*) y pw 0.6.2 con GUARDIA.v6 (LM-43, cruce de Carlos).
// Reglas que lo gobiernan: RT-1 y RT-2 con su excepción DA-44 (lee el export real de «negocio»; escribe y borra solo en la
// cuenta zz-verif-restauracion-…), RT-24 (perfil zz-verif-admin, nunca el de Carlos). Solo base: ningún archivo de api/uploads/.
// La constancia se guarda junto a la del respaldo (claude/marco/procedimiento-respaldo-corte-2026-10.md § ensayo).
// 'AAAA-MM-DD' del respaldo a restaurar. La cola no pasa variables de entorno: si STR_ENSAYO_ARCHIVO no está, se lee de
// pw\restauracion-ensayo.archivo.txt (una línea, la deja el Arquitecto junto con correr\restauracion-ensayo.txt).
const ARCHIVO = (process.env.STR_ENSAYO_ARCHIVO || (() => { try { return require('fs').readFileSync(require('path').join(__dirname, 'restauracion-ensayo.archivo.txt'), 'utf8'); } catch (e) { return ''; } })()).trim();
let CUENTA = null, NOMBRE = null, CONSTANCIA = null;

const api = (h, metodo, ruta, cuerpo) => h.page.evaluate(
  ([m, r, c]) => (m === 'GET' ? STRApi.get(r) : STRApi.post(r, c)).then((j) => ({ status: 200, j })).catch((e) => ({ status: (e && e.status) || 0, j: (e && e.cuerpo) || null })),
  [metodo, ruta, cuerpo || null]);

module.exports = {
  req: 'DT-42',
  zona: ['SRV'],
  casos: [
    {
      c: 'a', perfil: 'admin', cubre: ['DT-42', 'SRV', 'RT-1', 'RT-2'], pagina: '/str-app-shell.html',
      que: 'Ensayo: el export real de «negocio» se restaura en una cuenta zz-verif-restauracion- nueva (solo base)',
      async prueba(h) {
        await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
        h.espera(/^\d{4}-\d{2}-\d{2}$/.test(ARCHIVO), 'archivo del respaldo a restaurar: ' + (ARCHIVO || '(falta STR_ENSAYO_ARCHIVO)'));
        const r = await api(h, 'POST', '/restauracion/ensayo', { archivo: ARCHIVO, confirmo: 'zz-verif-restauracion' });
        const j = r.j || {};
        CUENTA = j.cuenta != null ? j.cuenta : null; NOMBRE = j.nombre || null;
        h.espera(r.status === 200, 'POST /api/restauracion/ensayo: ' + r.status);
        h.espera(!!NOMBRE && NOMBRE.startsWith('zz-verif-restauracion-'), 'cuenta creada: ' + NOMBRE);
        h.espera(CUENTA != null && String(CUENTA) !== '', 'id de la cuenta del ensayo: ' + CUENTA);
      },
    },
    {
      c: 'b', perfil: 'admin', cubre: ['DT-42', 'SRV'], pagina: '/str-app-shell.html',
      que: 'Constancia: conteos por tabla y huellas que cuadran con el export; «negocio» intacta',
      async prueba(h) {
        await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
        h.espera(CUENTA != null, 'la cuenta del ensayo viene del caso a: ' + CUENTA);
        const r = await api(h, 'GET', '/restauracion/constancia?cuenta=' + encodeURIComponent(CUENTA));
        CONSTANCIA = r.j || null;
        const t = (CONSTANCIA && CONSTANCIA.tablas) || {};
        const dif = Object.entries(t).filter(([, v]) => v && v.export != null && v.restaurado != null && v.export !== v.restaurado);
        h.espera(r.status === 200, 'GET /api/restauracion/constancia: ' + r.status);
        h.espera(Object.keys(t).length > 0, 'tablas en la constancia: ' + Object.keys(t).join(', '));
        h.espera(dif.length === 0, dif.length ? 'tablas que no cuadran: ' + dif.map(([k, v]) => k + ' ' + v.export + '≠' + v.restaurado).join('; ') : 'todas las tablas cuadran con el export');
        h.espera(!!(CONSTANCIA && CONSTANCIA.huella), 'huella del export: ' + ((CONSTANCIA && CONSTANCIA.huella) || '—'));
      },
    },
    {
      c: 'c', perfil: 'admin', cubre: ['DT-42', 'SRV', 'RT-2'], pagina: '/str-app-shell.html',
      que: 'Borrado: la cuenta del ensayo desaparece y queda constancia; «negocio» sigue como estaba',
      async prueba(h) {
        await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
        h.espera(!!NOMBRE && NOMBRE.startsWith('zz-verif-restauracion-'), 'cuenta a borrar: ' + NOMBRE);
        const r = await api(h, 'POST', '/restauracion/borrar', { cuenta: CUENTA, nombre: NOMBRE });
        h.espera(r.status === 200, 'POST /api/restauracion/borrar: ' + r.status);
        const c2 = await api(h, 'GET', '/restauracion/constancia?cuenta=' + encodeURIComponent(CUENTA));
        h.espera(c2.status === 404 || (c2.j && c2.j.borrada), 'tras borrar, la constancia dice borrada o 404: ' + c2.status);
        const me = await api(h, 'GET', '/me');
        h.espera(me.status === 200 && me.j && me.j.cuenta && !String(me.j.cuenta.nombre || me.j.cuenta).includes('restauracion'), 'la sesión del verificador sigue en su cuenta de siempre');
      },
    },
  ],
  // El borrado es el caso c. limpiar() es la red: si c no llegó a correr, borra la cuenta igualmente.
  async limpiar(h) {
    if (!NOMBRE || !NOMBRE.startsWith('zz-verif-restauracion-')) return;
    await h.page.waitForFunction(() => window.STRApi && STRApi.online && STRApi.online(), null, { timeout: 30000 }).catch(() => {});
    const r = await api(h, 'POST', '/restauracion/borrar', { cuenta: CUENTA, nombre: NOMBRE });
    console.log('limpiar: borrado de ' + NOMBRE + ': ' + r.status);
  },
};
