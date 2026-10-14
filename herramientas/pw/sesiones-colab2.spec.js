// Sesión del perfil de prueba zz-verif-colab2 (apoyo en L-101, M-370). Aparte de sesiones.spec.js para no poner en
// rojo la comprobación diaria mientras colab2 no tenga perfil. Solo lectura. La cola lo corre con correr\\sesiones-colab2.txt.
// Si falla: Carlos abre el perfil una vez con  node abrir-perfil.js colab2  (en pw\\) e inicia sesión con ese usuario.
const base = require('./sesiones.spec.js');
module.exports = { req: 'SESIONES-COLAB2', zona: 'sesiones', casos: [Object.assign({}, base.casos[2], { c: 's4', perfil: 'colab2', que: 'el perfil colab2 tiene sesión (/api/me 200)' })] };
