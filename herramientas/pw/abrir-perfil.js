// abrir-perfil.js - Carlos inicia sesion UNA vez por usuario de prueba, en Chrome normal (sin automatizacion,
// porque Google rechaza el inicio de sesion en un navegador controlado por Playwright). La sesion queda en
// pw\perfiles-chrome\<usuario> y Playwright la reutiliza despues.
// Uso: node abrir-perfil.js admin | oper | colab | colab2
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { BASE, PERFILES, dirPerfil } = require('./comun');

function rutaChrome() {
  const c = [
    path.join(process.env['ProgramFiles'] || 'C:\\Program Files', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(process.env['LOCALAPPDATA'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  ];
  return c.find(p => p && fs.existsSync(p));
}

const u = process.argv[2];
if (!PERFILES[u]) { console.log('Uso: node abrir-perfil.js ' + Object.keys(PERFILES).join(' | ')); process.exit(1); }
const chrome = rutaChrome();
if (!chrome) { console.log('No encontre chrome.exe en las rutas habituales.'); process.exit(1); }
fs.mkdirSync(dirPerfil(u), { recursive: true });
const p = spawn(chrome, ['--user-data-dir=' + dirPerfil(u), '--no-first-run', '--no-default-browser-check', '--new-window', BASE + '/login.html'], { stdio: 'ignore' });
console.log('Se abrio una ventana de Chrome aparte (perfil de prueba ' + PERFILES[u] + '). Inicia sesion con ese usuario; cuando veas el STR, cierra esa ventana.');
p.on('exit', () => console.log('Sesion de ' + PERFILES[u] + ' guardada en pw\\perfiles-chrome\\' + u + '.'));
