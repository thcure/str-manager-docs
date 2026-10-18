// reingreso-zz.spec.js - reingreso de los 4 perfiles de prueba después de moverlos a la cuenta «zz-verif-pruebas» (DA-47,
// paso 4 de LM-54). Lo mantiene el Arquitecto. Se corre una vez, después de correr\cuenta-pruebas.txt y antes de
// REPONER-SEMILLA: correr\reingreso-zz.txt -> log\REINGRESO-ZZ-guion.json, con la cola sin lote.
// Por qué: el JWT lleva la cuenta y dura 24 h sin mirar la base; tras mover, cada perfil sigue en «negocio» hasta volver a
// entrar. Y su navegador guarda copias locales de «negocio» (propiedades, reservas, turnos, pendientes sin subir, la cola
// de fotos): si la app entrara a la cuenta nueva con ellas, podría subirlas allí (una cuenta vacía no las pisa, INC-38).
// Por eso, por perfil: (1) abre un archivo estático del STR (/str-api.js: el origen de la app sin que corra la app);
// (2) previo con el token que tenga: si la sesión ya está en la cuenta de pruebas no toca nada; si el usuario sigue en
// «negocio» (no se movió) se detiene sin tocar nada; (3) borra del origen del STR el almacenamiento local de la app
// (localStorage salvo las claves firebase:, sessionStorage y las bases IndexedDB que no son de Firebase: str-cola-subida);
// la sesión de Google (Firebase) se queda; (4) abre el shell, que sin str-token pide uno nuevo con la sesión de Google
// (POST /api/login, que la guardia deja pasar); si cae en login.html, «Continuar con Google» como sesiones.spec.js;
// (5) comprueba /api/me: cuenta de la sesión = cuenta del usuario = «zz-verif-pruebas», nombre zz-verif-<perfil>.
// El log lleva nombre, rol, nombre de cuenta, conteos y nombres de claves; nunca correos, tokens ni datos.
const NOMBRES = { admin: 'zz-verif-admin', oper: 'zz-verif-oper', colab: 'zz-verif-colab', colab2: 'zz-verif-colab2' };
const CUENTA = 'zz-verif-pruebas';

// Pura: ¿qué hacer según /api/me con el token viejo? me = {status, user:{cuenta_id, nombre}, cuenta:{id, nombre}}
// → 'listo' (ya en la cuenta de pruebas) · 'no-movido' (el usuario sigue en la cuenta de la sesión, que no es la de
// pruebas) · 'reingresar' (movido con la sesión vieja, o sin sesión válida: 401/sin token)
function decidirPrevio(me) {
  if (!me || me.status !== 200 || !me.user || !me.cuenta) return 'reingresar';
  if (me.cuenta.nombre === CUENTA && Number(me.user.cuenta_id) === Number(me.cuenta.id)) return 'listo';
  if (Number(me.user.cuenta_id) === Number(me.cuenta.id)) return 'no-movido';
  return 'reingresar';
}
// Pura: claves de localStorage a borrar (todas salvo las de Firebase)
function clavesABorrar(claves) { return (claves || []).filter((k) => typeof k === 'string' && !/^firebase[:-]/i.test(k)); }
// Pura: bases IndexedDB a borrar (todas salvo las de Firebase)
function basesABorrar(nombres) { return (nombres || []).filter((n) => typeof n === 'string' && n && !/^firebase/i.test(n)); }
// Pura: ¿quedó bien? → { ok, motivo }
function revisarReingreso(me, perfil) {
  if (!me || me.status !== 200 || !me.user || !me.cuenta) return { ok: false, motivo: '/api/me ' + (me && me.status) };
  if (me.cuenta.nombre !== CUENTA) return { ok: false, motivo: 'la sesión está en la cuenta ' + me.cuenta.nombre };
  if (Number(me.user.cuenta_id) !== Number(me.cuenta.id)) return { ok: false, motivo: 'el usuario es de otra cuenta que la sesión' };
  if (String(me.user.nombre).toLowerCase() !== NOMBRES[perfil]) return { ok: false, motivo: 'usuario inesperado: ' + me.user.nombre };
  return { ok: true };
}

// /api/me con el token que haya en el origen; solo nombre, rol, cuenta_id y cuenta (sin correo)
async function leerMe(page) {
  return page.evaluate(async () => {
    let tok = null; try { tok = localStorage.getItem('str-token'); } catch (e) { }
    if (!tok) return { status: 0, sinToken: true };
    try {
      const r = await fetch('/api/me', { headers: { Authorization: 'Bearer ' + tok } });
      if (!r.ok) return { status: r.status };
      const j = await r.json(); const u = j.user || {};
      return { status: 200, user: { cuenta_id: u.cuenta_id, nombre: u.nombre, rol: u.rol }, cuenta: j.cuenta ? { id: j.cuenta.id, nombre: j.cuenta.nombre } : null };
    } catch (e) { return { status: 0, error: String(e && e.message || e).slice(0, 120) }; }
  }).catch((e) => ({ status: 0, error: String(e && e.message || e).slice(0, 120) }));
}
const verMe = (m) => (m.status === 200 ? (m.user.nombre + ' · rol ' + m.user.rol + ' · cuenta de la sesión ' + (m.cuenta && m.cuenta.nombre) + ' · usuario ' + (m.cuenta && Number(m.user.cuenta_id) === Number(m.cuenta.id) ? 'en esa cuenta' : 'en OTRA cuenta')) : ('/api/me ' + m.status + (m.sinToken ? ' (sin token)' : '') + (m.error ? ' ' + m.error : '')));

function caso(c, perfil) {
  return {
    c, perfil, pagina: '/str-api.js',
    que: 'el perfil ' + perfil + ' vuelve a entrar en la cuenta ' + CUENTA + ' sin llevar copias locales de «negocio»',
    async prueba(h) {
      const p = h.page;
      const m0 = await leerMe(p);
      const previo = decidirPrevio(m0);
      h.espera(previo !== 'no-movido', 'previo: ' + verMe(m0) + ' → ' + previo);
      if (previo === 'no-movido') return;   // sin mover no se toca nada
      if (previo === 'listo') { h.espera(revisarReingreso(m0, perfil).ok, 'ya estaba en la cuenta de pruebas: no se toca nada'); return; }
      // (3) borrar el almacenamiento local de la app en el origen del STR (no el de Firebase)
      // mismo filtro que clavesABorrar/basesABorrar (aquí sin eval, por si la página tiene CSP)
      const b = await p.evaluate(async () => {
        const claves = []; for (let i = 0; i < localStorage.length; i++) claves.push(localStorage.key(i));
        const fuera = claves.filter((k) => typeof k === 'string' && !/^firebase[:-]/i.test(k));
        fuera.forEach((k) => localStorage.removeItem(k));
        let ses = 0; try { ses = sessionStorage.length; sessionStorage.clear(); } catch (e) { }
        let bases = []; try { bases = (indexedDB.databases ? await indexedDB.databases() : []).map((x) => x && x.name); } catch (e) { }
        if (!indexedDB.databases) bases = ['str-cola-subida'];   // sin lista: la única de la app (borrar una que no existe no falla)
        const fueraB = bases.filter((n) => typeof n === 'string' && n && !/^firebase/i.test(n));
        const res = [];
        for (const n of fueraB) res.push(await new Promise((ok) => { const q = indexedDB.deleteDatabase(n); q.onsuccess = () => ok(n + ':ok'); q.onerror = () => ok(n + ':error'); q.onblocked = () => ok(n + ':bloqueada'); }));
        const quedan = []; for (let i = 0; i < localStorage.length; i++) quedan.push(localStorage.key(i));
        return { borradas: fuera.length, nombres: fuera.slice(0, 40), quedan, ses, bases: res };
      });
      const limpio = !b.quedan.some((k) => !/^firebase[:-]/i.test(k)) && !b.bases.some((x) => !/:ok$/.test(x));
      h.espera(limpio, 'almacenamiento local borrado: ' + b.borradas + ' claves ' + JSON.stringify(b.nombres) + ' · sessionStorage ' + b.ses + ' · IndexedDB ' + JSON.stringify(b.bases) + ' · quedan ' + JSON.stringify(b.quedan));
      if (!limpio) return;
      // (4) el shell pide un token nuevo con la sesión de Google
      await p.goto(h.BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' }).catch(() => { });
      let tok = null;
      for (let i = 0; i < 30 && !tok; i++) {
        await p.waitForTimeout(1000);
        tok = await p.evaluate(() => { try { return !!localStorage.getItem('str-token'); } catch (e) { return false; } }).catch(() => false);
        if (!tok && /\/login\.html/.test(p.url())) break;
      }
      let nota = '';
      if (!tok && /\/login\.html/.test(p.url())) {
        const { recuperarSesion } = require('./comun');
        const rec = await recuperarSesion(p.context(), p, perfil);
        nota = ' · ' + rec.observado;
        tok = rec.ok;
      }
      await p.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => { });
      // (5) comprobar
      const m1 = await leerMe(p);
      const r = revisarReingreso(m1, perfil);
      h.espera(r.ok, 'después: ' + verMe(m1) + (r.ok ? '' : ' · NO: ' + r.motivo) + nota + ' · página ' + p.url().replace(h.BASE, ''));
    },
  };
}
module.exports = {
  req: 'REINGRESO-ZZ', zona: 'sesiones', NOMBRES, CUENTA, decidirPrevio, clavesABorrar, basesABorrar, revisarReingreso,
  casos: [caso('a', 'admin'), caso('o', 'oper'), caso('c', 'colab'), caso('d', 'colab2')],
};
