// Sesiones de los perfiles de prueba (M8 de la migración, tras rotar JWT_SECRET). Solo lectura: abre la app con
// cada perfil y mira la respuesta de /api/me que pide la propia página. Lo corre la cola con correr\sesiones.txt.
// Sin correos ni teléfonos en el log: solo estado, nombre y rol.
function caso(c, perfil) {
  return {
    c, perfil, pagina: '/str-app-shell.html',
    que: 'el perfil ' + perfil + ' tiene sesión (/api/me 200)',
    async prueba(h) {
      const r = await h.respuesta('/api/me', () => h.page.reload({ waitUntil: 'domcontentloaded' })).catch(() => null);
      let us = {};
      if (r) { try { const j = await r.json(); us = j.user || j; } catch (e) { } }
      h.espera(!!r && r.status() === 200, '/api/me ' + (r ? r.status() : 'sin respuesta') + (us.rol ? ' · rol ' + us.rol : ''));
    },
  };
}
module.exports = {
  req: 'SESIONES',
  zona: 'sesiones',
  casos: [caso('s1', 'admin'), caso('s2', 'oper'), caso('s3', 'colab')],
};
