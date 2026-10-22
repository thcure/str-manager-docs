// .claude/hooks/ctx.js — hook SessionStart (startup|compact) de la CLI del STR (A7, 11-oct-2026; v6 LM-77 21-oct-2026; lo mantiene el Arquitecto).
// Reinyecta las reglas fijas (docs/claude/reglas-fijas.md) y, si hay lote (env STR_INSTR), la cabecera de la instrucción
// (Alcance, Casos de uso, Mapa, Decisión, Riesgo) y los mapas del área (docs/claude/<área>.md) que cita, para que nada de eso
// se pierda a mitad de un lote. Tras una compactación añade el aviso de releer la instrucción y mirar git status antes de
// repetir pasos. Salida por stdout = contexto adicional. Fuente única: str-manager-docs/herramientas/hooks-cli/ctx.js.
'use strict';
const fs = require('fs');
const path = require('path');

const LINEAS = ['Alcance', 'Casos de uso', 'Mapa', 'Decisión', 'Riesgo'];
const TOPE_LINEA = 600;

// Pura: de la instrucción del lote saca las líneas de cabecera que importan y los docs/claude/*.md que cita.
function cabecera(textoInstr) {
  const cab = String(textoInstr || '').slice(0, 6000).split(/\r?\n/);
  const lineas = [];
  for (const n of LINEAS) {
    const re = new RegExp('^' + n.replace('ó', '[oó]') + '\\s*:', 'i');
    const l = cab.find(x => re.test(x));
    if (l) lineas.push(l.length > TOPE_LINEA ? l.slice(0, TOPE_LINEA) + ' …' : l);
  }
  const mapas = [];
  const re = /docs\/claude\/[A-Za-z0-9._-]+\.md/g;
  let m;
  while ((m = re.exec(String(textoInstr || ''))) && mapas.length < 4) if (!mapas.includes(m[0])) mapas.push(m[0]);
  return { lineas, mapas };
}

function texto(raiz, instr, fuente) {
  const partes = [];
  const reglas = path.join(raiz, 'docs', 'claude', 'reglas-fijas.md');
  if (fs.existsSync(reglas)) partes.push(fs.readFileSync(reglas, 'utf8').trim());
  else partes.push('Reglas fijas: lee docs/claude/reglas-fijas.md (si no existe, CLAUDE.md § 0 y § 1) antes de tocar nada.');
  if (instr) {
    let cuerpo = '';
    try { cuerpo = fs.readFileSync(instr, 'utf8'); } catch (e) { cuerpo = ''; }
    const c = cabecera(cuerpo);
    const l = ['Instrucción del lote en curso: ' + instr + ' (reléela si te compactaste; ejecútala completa y sin salir de su Alcance).'];
    if (c.lineas.length) l.push('Cabecera del lote (manda sobre cualquier resumen):\n' + c.lineas.join('\n'));
    if (c.mapas.length) l.push('Mapa del área: lee ' + c.mapas.join(', ') + ' antes de editar y actualízalo si cambia lo que describe (regla 10).');
    partes.push(l.join('\n'));
  }
  if (fuente === 'compact') partes.push('Te compactaste: relee la instrucción completa antes de seguir; mira `git status` y `git diff --stat` para no repetir pasos ya hechos ni dar por hechos los que faltan; el cierre sigue siendo el de la instrucción.');
  return partes.join('\n\n');
}

if (require.main === module) {
  let raw = '';
  process.stdin.on('data', d => (raw += d));
  process.stdin.on('end', () => {
    let entrada = {};
    try { entrada = JSON.parse(raw || '{}'); } catch (e) { entrada = {}; }
    const raiz = process.env.CLAUDE_PROJECT_DIR || entrada.cwd || process.cwd();
    process.stdout.write(texto(raiz, process.env.STR_INSTR || '', entrada.source || ''));
    process.exit(0);
  });
}

module.exports = { cabecera, texto, LINEAS };
