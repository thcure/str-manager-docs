// uid-admin.spec.js - LM-79 fase 5.1 (L-171): escribe el UID de Firebase del perfil zz-verif-admin en
// claves\uid-zz-verif-admin.txt de LENOVO, para que Carlos arme MODELO_ADMIN_UIDS sin buscar el correo de la cuenta.
// El UID no va al log, al buzón ni al chat: el resultado solo dice si se escribió. Solo lectura del STR.
// Uso: correr\uid-admin.txt -> log\UID-ADMIN-guion.json. Lo mantiene el Arquitecto.
'use strict';
const fs = require('fs');
const path = require('path');
const { configFirebase } = require('./guion');
const DESTINO = path.join(path.resolve(__dirname, '..'), 'claves', 'uid-zz-verif-admin.txt');
module.exports = {
  req: 'UID-ADMIN', zona: 'sesiones',
  casos: [{
    c: 'a', perfil: 'admin', pagina: '/terminos.html', que: 'el UID de zz-verif-admin queda en claves\\ de LENOVO',
    async prueba(h) {
      const r = await h.page.request.get(h.BASE + '/str-app-shell.html', { timeout: 30000 });
      const fb = configFirebase(await r.text());
      if (!h.espera(!!fb, 'configuración pública de Firebase en el shell: ' + (fb ? 'sí' : 'no'))) return;
      const uid = await h.page.evaluate(async (fb) => {
        const A = await import('https://www.gstatic.com/firebasejs/' + fb.version + '/firebase-app.js');
        const U = await import('https://www.gstatic.com/firebasejs/' + fb.version + '/firebase-auth.js');
        const app = A.getApps().find(a => a.name === '[DEFAULT]') || A.initializeApp(fb.config);
        const au = U.getAuth(app); await au.authStateReady();
        return au.currentUser ? au.currentUser.uid : null;
      }, fb);
      if (!h.espera(typeof uid === 'string' && /^[A-Za-z0-9]{20,40}$/.test(uid), 'sesión de Google de zz-verif-admin: ' + (uid ? 'sí' : 'no'))) return;
      fs.writeFileSync(DESTINO, uid);
      h.espera(fs.readFileSync(DESTINO, 'utf8') === uid, 'UID escrito en claves\\uid-zz-verif-admin.txt (' + uid.length + ' caracteres)');
    },
  }],
  async limpiar() { },
};
