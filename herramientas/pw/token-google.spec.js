// token-google.spec.js - comprobación de pw 0.14.1 (LM-79 fase 5, M-1162): h.leerModelo obtiene el token de Google
// de cada perfil de prueba (admin, oper y colab) y llama al servicio del modelo. Solo lectura: GET salud, que hoy
// responde sin token; un status 200 prueba que el ayudante sacó el token (sin token devuelve status 0 con error).
// Uso: correr\token-google.txt -> log\TOKEN-GOOGLE-guion.json. Lo mantiene el Arquitecto. El token no se registra.
'use strict';
const caso = (c, perfil, pagina) => ({
  c, perfil, pagina, que: 'el ayudante saca el token de Google de ' + perfil + ' y lee salud del servicio',
  async prueba(h) {
    const r = await h.leerModelo('salud');
    h.espera(r.status === 200 && r.cuerpo && r.cuerpo.ok === true, 'salud con token de ' + perfil + ': ' + r.status + (r.error ? ' · ' + r.error : ''));
  },
});
module.exports = {
  req: 'TOKEN-GOOGLE', zona: 'sesiones',
  casos: [caso('a', 'admin', '/str-tablero.html'), caso('b', 'oper', '/str-tablero.html'), caso('c', 'colab', '/portal.html')],
  async limpiar() { },
};
