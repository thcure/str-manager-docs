// hk-admin.spec.js - diagnóstico de solo lectura (M-471): ¿por qué el perfil admin ve la pantalla de login al abrir HK
// (str-m1-housekeeping.html) si en Inventario y en el shell tiene sesión? Anota las respuestas de la API que pide la
// propia página al cargar (ruta y estado), a dónde navega y qué versión de str-api.js queda. No escribe nada.
// La cola lo corre con correr\hk-admin.txt -> log\HK-ADMIN-guion.json. Lo mantiene el Arquitecto.
function caso(c, perfil, pagina) {
  return {
    c, perfil, pagina,
    que: perfil + ' en ' + pagina + ': respuestas de la API al cargar y adónde queda la página',
    async prueba(h) {
      const p = h.page;
      const vistas = [];
      const oir = (r) => { try { const u = new URL(r.url()); if (/apartamentosbucaramanga/.test(u.hostname) && /^\/api\//.test(u.pathname)) vistas.push(r.request().method() + ' ' + u.pathname + ' → ' + r.status()); } catch (e) { } };
      p.on('response', oir);
      await p.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await p.waitForLoadState('networkidle').catch(() => {});
      await p.waitForTimeout(4000);
      const est = await p.evaluate(() => ({
        url: location.pathname + location.search,
        titulo: document.title,
        login: !!document.querySelector('input[type="password"]') || /Continuar con Google/.test(document.body.innerText || ''),
        api: (document.querySelector('script[src*="str-api.js"]') || {}).src || '',
        version: (window.STRApi && STRApi.version) || '',
        frames: [...document.querySelectorAll('iframe')].map((f) => f.id + ':' + (f.getAttribute('src') || '').split('?')[0]),
        token: !!(localStorage.getItem('str-token') || localStorage.getItem('str-jwt') || document.cookie.split(';').some((c) => /str|jwt|sesion|token/i.test(c))),
      })).catch((e) => ({ error: String(e && e.message || e) }));
      p.off('response', oir);
      const me = vistas.filter((v) => /\/api\/me /.test(v));
      const malas = vistas.filter((v) => /→ (401|403|5\d\d)$/.test(v));
      h.espera(!est.login, 'página final: ' + (est.url || est.error) + ' · login visible: ' + est.login + ' · str-api: ' + String(est.api).split('?').pop() + ' · STRApi.version: ' + est.version + ' · iframes: ' + JSON.stringify(est.frames) + ' · token/cookie de sesión presente: ' + est.token);
      h.espera(true, 'respuestas de /api al cargar (' + vistas.length + '): ' + [...new Set(vistas)].slice(0, 25).join(' | '));
      h.espera(malas.length === 0, '/api/me: ' + (me.join(', ') || 'no se pidió') + ' · con 401/403/5xx: ' + (malas.join(', ') || 'ninguna'));
    },
  };
}
module.exports = {
  req: 'HK-ADMIN',
  zona: 'sesiones',
  casos: [
    caso('a', 'admin', '/str-app-shell.html'),
    caso('b', 'admin', '/str-m1-housekeeping.html'),
    caso('c', 'admin', '/str-m1-housekeeping.html?modo=admin'),
    caso('d', 'colab', '/portal.html'),
  ],
};
