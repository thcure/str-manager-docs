// .claude/hooks/stop-check.js — hook Stop de la CLI del STR (A7, 11-oct-2026; lo mantiene el Arquitecto).
// Antes de que la CLI termine comprueba: (1) tests en verde; (2) sin cambios pendientes de commit (o sin cambios
// en absoluto, que es el fin correcto cuando la instrucción no se podía ejecutar). Si algo falla, exit 2 con el
// motivo y la CLI sigue trabajando. Si stop_hook_active es true (ya bloqueó una vez) deja terminar para no entrar
// en bucle; el log del lote dirá lo que quedó.
'use strict';
const { execSync } = require('child_process');

function estadoRepo(cwd) {
  let sucio = [];
  try { sucio = execSync('git status --porcelain', { cwd, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean); } catch (e) { sucio = []; }
  let testsOk = true, detalle = '';
  try { execSync('node tests/run.js', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 }); }
  catch (e) { testsOk = false; detalle = String((e.stdout || '') + (e.stderr || '')).split(/\r?\n/).filter(Boolean).slice(-8).join(' | '); }
  return { sucio, testsOk, detalle };
}

// Función pura, con test en tests/hooks.test.js.
function evaluar(stopHookActive, estado) {
  if (stopHookActive) return { ok: true };
  if (!estado.testsOk) return { ok: false, motivo: 'No termines con tests en rojo: node tests/run.js falla (' + (estado.detalle || 'sin detalle') + '). Corrige o, si no puedes, revierte tus cambios y declara No hecho.' };
  if (estado.sucio.length) return { ok: false, motivo: 'Hay cambios sin commit: ' + estado.sucio.slice(0, 10).join(', ') + '. Termina el commit y el push, o descarta lo que no deba quedar (git stash) y explícalo en el informe.' };
  return { ok: true };
}

function main() {
  let raw = '';
  process.stdin.on('data', d => (raw += d));
  process.stdin.on('end', () => {
    let entrada = {};
    try { entrada = JSON.parse(raw || '{}'); } catch (e) { entrada = {}; }
    const cwd = entrada.cwd || process.cwd();
    const r = evaluar(!!entrada.stop_hook_active, estadoRepo(cwd));
    if (!r.ok) { process.stderr.write(r.motivo); process.exit(2); }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { evaluar };
