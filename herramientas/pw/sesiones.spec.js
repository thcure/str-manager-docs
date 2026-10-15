// Sesiones de los perfiles de prueba (M8 de la migración, tras rotar JWT_SECRET). Solo lectura: abre la app con
// cada perfil y mira la respuesta de /api/me que pide la propia página. Lo corre la cola con correr\sesiones.txt.
// Sin correos ni teléfonos en el log: solo estado, nombre y rol. v0.5.32: si un perfil cayó en login.html, intenta
// recuperar la sesión con «Continuar con Google» (sin credenciales) antes de darlo por rojo.
function caso(c, perfil) {
  return {
    c, perfil, pagina: '/str-app-shell.html',
    que: 'el perfil ' + perfil + ' tiene sesión (/api/me 200)',
    async prueba(h) {
      let r = await h.respuesta('/api/me', () => h.page.reload({ waitUntil: 'domcontentloaded' })).catch(() => null);
      await h.page.waitForTimeout(1500);
      let nota = '';
      // v0.5.32: si el shell cayó en login.html (sesión de Firebase perdida), la recupera con «Continuar con Google»
      // como lo hace Carlos: sin escribir correo ni contraseña. Si Google los pide, lo dice y queda en rojo.
      if (/\/login\.html/.test(h.page.url())) {
        const { recuperarSesion } = require('./comun');
        const rec = await recuperarSesion(h.page.context(), h.page, perfil);
        nota = ' · ' + rec.observado;
        if (rec.ok) r = await h.respuesta('/api/me', () => h.page.goto(h.BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' })).catch(() => null);
      }
      let us = {};
      if (r) { try { const j = await r.json(); us = j.user || j; } catch (e) { } }
      const enLogin = /\/login\.html/.test(h.page.url());
      h.espera(!!r && r.status() === 200 && !enLogin, '/api/me ' + (r ? r.status() : 'sin respuesta') + (us.rol ? ' · rol ' + us.rol : '') + (enLogin ? ' · en login.html' : '') + nota);
    },
  };
}
module.exports = {
  req: 'SESIONES',
  zona: 'sesiones',
  casos: [caso('s1', 'admin'), caso('s2', 'oper'), caso('s3', 'colab'), caso('s4', 'colab2')],   // s4 desde 0.5.20 (M-407: colab2 con sesión, 200)
};
