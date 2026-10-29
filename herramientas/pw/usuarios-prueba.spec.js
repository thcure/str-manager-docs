// usuarios-prueba.spec.js - registro de los usuarios de prueba (lo mantiene el Arquitecto, dueño de pw; Carlos, 29-oct).
// Abre cada perfil de prueba y deja su ficha en pw\usuarios-prueba.json de LENOVO: perfil, usuario, rol en el STR,
// correo de Google, UID de Firebase, si es administrador de la fábrica (MODELO_ADMIN_UIDS) y cuándo se comprobó.
// Correos y UID NO salen de LENOVO: no van al log (el resultado solo dice qué campos se llenaron), al repo ni al buzón.
// Uso: correr\usuarios-prueba.txt -> log\USUARIOS-PRUEBA-guion.json. Solo lectura del STR.
'use strict';
const fs = require('fs');
const path = require('path');
const { configFirebase } = require('./guion');
const { PERFILES } = require('./comun');
const REGISTRO = path.join(__dirname, 'usuarios-prueba.json');
const ADMIN_FABRICA = ['admin'];   // contrato de la fase 5 de LM-79: solo zz-verif-admin entre los perfiles de prueba

function leer() { try { return JSON.parse(fs.readFileSync(REGISTRO, 'utf8')); } catch (e) { return { descripcion: 'Usuarios de prueba (pw). Solo en LENOVO; nunca al repo ni al buzón. Lo escribe usuarios-prueba.spec.js.', perfiles: {} }; } }
function horaBogota() { return new Date(Date.now() - 5 * 3600000).toISOString().replace('T', ' ').slice(0, 16); }

const caso = (c, perfil, pagina) => ({
  c, perfil, pagina, que: 'ficha de ' + PERFILES[perfil] + ' en pw\\usuarios-prueba.json',
  async prueba(h) {
    const r = await h.page.request.get(h.BASE + '/str-app-shell.html', { timeout: 30000 });
    const fb = configFirebase(await r.text());
    if (!h.espera(!!fb, 'configuración pública de Firebase en el shell: ' + (fb ? 'sí' : 'no'))) return;
    const g = await h.page.evaluate(async (fb) => {
      const A = await import('https://www.gstatic.com/firebasejs/' + fb.version + '/firebase-app.js');
      const U = await import('https://www.gstatic.com/firebasejs/' + fb.version + '/firebase-auth.js');
      const app = A.getApps().find(a => a.name === '[DEFAULT]') || A.initializeApp(fb.config);
      const au = U.getAuth(app); await au.authStateReady();
      return au.currentUser ? { correo: au.currentUser.email || null, uid: au.currentUser.uid } : null;
    }, fb);
    let rol = null;
    try { rol = await h.page.evaluate(async () => { if (!window.STRApi) return null; const m = await STRApi.get('/api/me'); const u = (m && (m.usuario || m.user || m)) || {}; return u.rol || null; }); } catch (e) { }
    if (!h.espera(!!(g && g.uid), 'sesión de Google de ' + PERFILES[perfil] + ': ' + (g ? 'sí' : 'no'))) return;
    const reg = leer();
    reg.perfiles[perfil] = { usuario: PERFILES[perfil], rolStr: rol, cuentaStr: 'zz-verif-pruebas', correo: g.correo, uid: g.uid, adminFabrica: ADMIN_FABRICA.includes(perfil), comprobado: horaBogota() };
    reg.actualizado = horaBogota();
    fs.writeFileSync(REGISTRO, JSON.stringify(reg, null, 1));
    h.espera(true, 'ficha escrita: correo ' + (g.correo ? 'sí' : 'no') + ' · uid sí · rol ' + (rol || 'sin leer'));
  },
});
module.exports = {
  req: 'USUARIOS-PRUEBA', zona: 'sesiones',
  casos: [caso('a', 'admin', '/str-tablero.html'), caso('b', 'oper', '/str-tablero.html'), caso('c', 'colab', '/portal.html'), caso('d', 'colab2', '/portal.html')],
  async limpiar() { },
};
