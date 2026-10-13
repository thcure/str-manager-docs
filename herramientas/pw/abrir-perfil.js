// abrir-perfil.js - Carlos inicia sesion UNA vez por usuario de prueba; la sesion queda en pw\perfiles\<usuario>.
// Uso: node abrir-perfil.js admin | oper | colab | colab2
'use strict';
const { abrir, BASE, PERFILES } = require('./comun');
(async () => {
  const u = process.argv[2];
  if (!PERFILES[u]) { console.log('Uso: node abrir-perfil.js ' + Object.keys(PERFILES).join(' | ')); process.exit(1); }
  const { ctx } = await abrir(u, { headless: false, guardia: false });
  const p = ctx.pages()[0] || await ctx.newPage();
  await p.goto(BASE + '/login.html');
  console.log('Inicia sesion como ' + PERFILES[u] + ' en la ventana que se abrio; cuando veas el STR, cierra la ventana.');
  await new Promise(r => ctx.on('close', r));
  console.log('Sesion de ' + PERFILES[u] + ' guardada.');
})();
