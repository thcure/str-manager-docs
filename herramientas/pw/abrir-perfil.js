// abrir-perfil.js - Carlos inicia sesion UNA vez por usuario de prueba, en Chrome normal (sin automatizacion,
// porque Google rechaza el inicio de sesion en un navegador controlado por Playwright). La sesion queda en
// pw\perfiles-chrome\<usuario> y Playwright la reutiliza despues.
// Uso: node abrir-perfil.js admin | oper | colab | colab2   [--forzar]
// v3 (LM-51, 17-oct): la comprobación ya intenta sola la recuperación con el Chrome normal del perfil (recuperarConChrome);
// solo si eso también falla se abre la ventana. Uso igual.
// v2 (LM-46, M-576, 16-oct): antes de abrir la ventana comprueba la sesión sin ventana (la misma puerta de la cola, dos
// intentos). Si ya hay sesión, lo dice y NO abre nada; con --forzar abre igual. Si la puerta no puede usar el perfil
// (p. ej. la cola lo está usando), lo dice y abre como antes.
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

async function yaTieneSesion() {
  if (process.argv.includes('--forzar')) return null;
  try {
    const { sesionViva } = require('./probar-lote');
    console.log('Comprobando si ' + PERFILES[u] + ' ya tiene sesión (sin ventana, hasta ~40 s)...');
    return await sesionViva(u);
  } catch (e) { return { ok: false, caso: 'error', observado: String(e && e.message || e) }; }
}

(async () => {
  const s = await yaTieneSesion();
  if (s && s.ok) { console.log('Ya tenías sesión: ' + s.observado + '. No hace falta abrir la ventana (si igual la quieres: node abrir-perfil.js ' + u + ' --forzar).'); process.exit(0); }
  if (s && s.caso === 'api-me') { console.log(s.observado); console.log('Abrir el perfil no lo arregla; no se abre la ventana. Si igual la quieres: node abrir-perfil.js ' + u + ' --forzar.'); process.exit(3); }
  if (s) console.log('La comprobación dice: ' + s.observado + '. Se abre la ventana para iniciar sesión.');
  abrirVentana();
})();

function abrirVentana() {
const p = spawn(chrome, ['--user-data-dir=' + dirPerfil(u), '--no-first-run', '--no-default-browser-check', '--new-window', BASE + '/login.html'], { stdio: 'ignore' });
console.log('Se abrio una ventana de Chrome aparte (perfil de prueba ' + PERFILES[u] + '). Inicia sesion con ese usuario; cuando veas el STR, CIERRA esa ventana: mientras siga abierta, las pruebas de la cola no pueden usar el perfil.');
p.on('exit', () => console.log('Sesion de ' + PERFILES[u] + ' guardada en pw\\perfiles-chrome\\' + u + '.'));
}
