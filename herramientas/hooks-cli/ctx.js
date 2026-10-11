// .claude/hooks/ctx.js — hook SessionStart (startup|compact) de la CLI del STR (A7, 11-oct-2026; lo mantiene el Arquitecto).
// Reinyecta las reglas fijas (docs/claude/reglas-fijas.md) y la ruta de la instrucción del lote después de cada
// compactación, para que no se pierdan a mitad de un lote. Salida por stdout = contexto adicional.
'use strict';
const fs = require('fs');
const path = require('path');

function texto(raiz, instr) {
  const partes = [];
  const reglas = path.join(raiz, 'docs', 'claude', 'reglas-fijas.md');
  if (fs.existsSync(reglas)) partes.push(fs.readFileSync(reglas, 'utf8').trim());
  else partes.push('Reglas fijas: lee CLAUDE.md antes de tocar nada.');
  if (instr) partes.push('Instrucción del lote en curso: ' + instr + ' (reléela si te compactaste; ejecútala completa y sin salir de su Alcance).');
  return partes.join('\n\n');
}

let raw = '';
process.stdin.on('data', d => (raw += d));
process.stdin.on('end', () => {
  let entrada = {};
  try { entrada = JSON.parse(raw || '{}'); } catch (e) { entrada = {}; }
  const raiz = process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
  process.stdout.write(texto(raiz, process.env.STR_INSTR || ''));
  process.exit(0);
});
