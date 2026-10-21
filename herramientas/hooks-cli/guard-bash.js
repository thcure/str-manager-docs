// .claude/hooks/guard-bash.js — hook PreToolUse (Bash) de la CLI del STR (A7, 11-oct-2026; v2 LM-22 13-oct-2026; v3 M-467 15-oct-2026; v4 LM-42: el Alcance se corta en «no toques»; v5 LM-64 (K5, CONSTRUCCIÓN-v1): el commit lleva la línea de trazabilidad «Lote: L-n · REQ/INC · DA · Casos de uso: …» copiada de la cabecera; lo mantiene el Arquitecto, lo instala Carlos).
// Bloquea (exit 2 + motivo en stderr) tres cosas, de forma determinista:
//  1. Comandos destructivos de git (reset --hard, push --force, checkout -- <archivo>, clean -f, branch -D).
//  2. `git commit` con archivos fuera del Alcance de la instrucción del lote (env STR_INSTR), salvo que el mensaje
//     del commit los declare con la línea «Fuera de alcance: <archivo> - <causa>».
//  3. `git commit` sin CLAUDE.md ni docs/claude/*.md en el índice cuando se tocó código, o con tests en rojo.
//  4. (v5, K5) `git commit` sin la línea «Lote: L-n · <REQ-X-n | INC-n | DT-n | LM-n> [· DA-n] · Casos de uso: <CU-… | técnico, sin caso de uso>»
//     que coincida con la cabecera de la instrucción (solo con STR_INSTR; el mensaje se lee de -m/-F; sin mensaje legible se bloquea).
// Si no hay STR_INSTR (corrida fuera de la cola) no se comprueba el Alcance; siguen aplicando destructivos, mapa y tests.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SIEMPRE = [/^CLAUDE\.md$/, /^docs\/claude\//, /^tests\//, /^\.claude\//];
const EXT = '(html|js|php|json|md|css|htaccess|txt|sql|yml|yaml)';

function leerAlcance(rutaInstr) {
  if (!rutaInstr || !fs.existsSync(rutaInstr)) return null;
  const lineas = fs.readFileSync(rutaInstr, 'utf8').split(/\r?\n/).slice(0, 15);
  const l = lineas.find(x => /^alcance\s*:/i.test(x));
  if (!l) return null;
  return cortarNoToques(l.replace(/^alcance\s*:/i, ''));
}

// v4 (LM-42, M-522): lo que va después de «no toques / no tocar / sin tocar / no cambies» en la línea de Alcance NO habilita
// archivos para el commit (igual que ruta.js de str-manager-docs): «… ; no toques api/ ni modelo/» dejaba abiertas esas carpetas.
function cortarNoToques(texto) {
  return String(texto || '').split(/\b(?:no toques|no tocar|sin tocar|no cambies)\b/i)[0];
}

// Convierte el texto de Alcance en patrones: archivos exactos y carpetas (terminadas en /).
function patronesAlcance(texto) {
  const pats = [];
  if (!texto) return pats;
  // v2 (LM-22, 13-oct-2026): token entero (no perezoso). Con el patrón perezoso de v1, «modelo/api/config/database.php»
  // casaba primero «modelo/» y abría la carpeta entera (incluido modelo/secrets.php). Ahora una carpeta solo cuenta si
  // el Alcance la escribe terminada en «/» y aislada; un archivo, si termina en una extensión conocida.
  const re = new RegExp('(?:^|[\\s`(·,;])\\.?\\/?([\\w][\\w./-]*?(?:\\.' + EXT + '|/))(?=$|[\\s`),;·])', 'g');
  let m;
  while ((m = re.exec(texto))) {
    let p = m[1].replace(/^\.?\//, '');
    if (p.endsWith('/')) pats.push(new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    else pats.push(new RegExp('^' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
  }
  // «todos los HTML», «str-*.html»
  if (/todos los html|\bstr-\*\.html/i.test(texto)) pats.push(/^[\w-]+\.html$/);
  return pats;
}

function cubierto(archivo, pats) {
  const a = archivo.replace(/\\/g, '/');
  return SIEMPRE.some(r => r.test(a)) || pats.some(r => r.test(a));
}

// v3 (M-467, 15-oct-2026): la única forma permitida de volver un archivo a como está en HEAD es
// `git restore <archivo>` (archivos sueltos, dentro del Alcance cuando hay STR_INSTR; nunca «.», «:/», comodines ni
// carpetas). `git checkout -- …` sigue bloqueado, y también los rodeos conocidos (`git show HEAD:x > x`, `git show … | tee`).
const VIA_RESTAURAR = 'para volver un archivo del Alcance a como está en HEAD usa «git restore <archivo>» (uno o varios archivos sueltos; no «.», comodines ni carpetas); si tampoco sirve, dilo en el cierre y para: no busques otra vía.';
function restaurarPermitido(cmd, alcanceTexto) {
  const m = cmd.match(/git\s+restore\s+(.*)$/m);
  if (!m) return null;
  const args = m[1].split(/\s+/).filter(Boolean);
  if (args.some(a => /^--source\b|^-s$/.test(a))) return { ok: false, motivo: 'git restore --source trae otra versión: ' + VIA_RESTAURAR };
  const archivos = args.filter(a => !a.startsWith('-'));
  if (!archivos.length || archivos.some(a => a === '.' || a === ':/' || /[*?[]/.test(a) || a.endsWith('/'))) return { ok: false, motivo: 'git restore solo con archivos sueltos: ' + VIA_RESTAURAR };
  if (alcanceTexto) {
    const pats = patronesAlcance(alcanceTexto);
    const fuera = archivos.filter(a => !cubierto(a.replace(/^\.?\//, ''), pats));
    if (fuera.length) return { ok: false, motivo: 'git restore de archivos fuera del Alcance (' + fuera.join(', ') + '): ' + VIA_RESTAURAR };
  }
  return { ok: true };
}

// v5 (LM-64, K5): lo que la cabecera de la instrucción manda al commit. Pura.
function leerTrazabilidad(rutaInstr, texto) {
  const lote = (String(rutaInstr || '').split(/[\\/]/).pop().match(/^(?:L-)?(\d+)-instr/) || [])[1];
  const cab = String(texto || '').replace(/\r\n/g, '\n').split('\n').slice(0, 20).join('\n');
  const titulo = (cab.split('\n')[0] || '');
  const ids = [...new Set((titulo + ' ' + ((cab.match(/^(?:Requerimiento|Origen)[^\n]*$/m) || [''])[0])).match(/\b(?:REQ-[A-Z0-9]+-[\w.]+|INC-\d+|DT-\d+|LM-\d+[a-d]?)\b/g) || [])];
  const da = (cab.match(/\bDA-\d+\b/) || [])[0] || null;
  const cu = (cab.match(/^Casos de uso:\s*(.+)$/m) || [])[1] || null;
  const casos = cu ? (/t[ée]cnico/i.test(cu) ? [] : (cu.match(/CU-[A-Z0-9]+-\d+\.\d+/g) || [])) : null;
  return { lote: lote ? 'L-' + lote : null, ids, da, casos, tecnico: !!(cu && /t[ée]cnico/i.test(cu)), tieneLinea: cu !== null };
}
// Pura: el mensaje del commit a partir del comando (-m, varios -m, -F archivo leído por el llamador).
function mensajeDeCommit(cmd, leerArchivo) {
  const partes = [];
  const re = /(?:^|\s)(?:-m|--message)(?:=|\s+)("((?:[^"\\]|\\.)*)"|'([^']*)'|(\S+))/g;
  let m; while ((m = re.exec(cmd))) partes.push((m[2] != null ? m[2].replace(/\\"/g, '"') : m[3] != null ? m[3] : m[4]) || '');
  const f = cmd.match(/(?:^|\s)(?:-F|--file)(?:=|\s+)("([^"]*)"|'([^']*)'|(\S+))/);
  if (f && leerArchivo) { try { partes.push(String(leerArchivo((f[2] || f[3] || f[4] || '').trim()) || '')); } catch (e) { } }
  return partes.join('\n');
}
// Pura: la línea «Lote: …» del mensaje coincide con la cabecera. Devuelve {ok, motivo}.
function trazabilidadOk(mensaje, tr) {
  if (!tr || !tr.lote) return { ok: true };
  const esperado = 'Lote: ' + tr.lote + ' · ' + (tr.ids[0] || '<REQ-X-n | INC-n>') + (tr.da ? ' · ' + tr.da : '') + ' · Casos de uso: ' + (tr.tecnico ? 'técnico, sin caso de uso' : (tr.casos && tr.casos.length ? tr.casos.join(', ') : '<CU-…>'));
  const linea = (String(mensaje || '').split(/\r?\n/).find((l) => /^\s*Lote:\s*L-\d+/.test(l)) || '').trim();
  if (!linea) return { ok: false, motivo: 'El mensaje del commit no trae la línea de trazabilidad (K5, LM-64). Añade, copiada de la cabecera: «' + esperado + '».' };
  const fallas = [];
  if (!new RegExp('^\\s*Lote:\\s*' + tr.lote + '\\b').test(linea)) fallas.push('el lote no es ' + tr.lote);
  if (tr.ids.length && !tr.ids.some((i) => linea.includes(i))) fallas.push('falta ' + tr.ids.join(' o '));
  if (tr.da && !linea.includes(tr.da)) fallas.push('falta ' + tr.da);
  if (!/Casos de uso:/.test(linea)) fallas.push('falta «Casos de uso:»');
  else if (tr.tecnico ? !/t[ée]cnico/i.test(linea) : (tr.casos || []).some((c) => !linea.includes(c))) fallas.push('los casos de uso no son los de la cabecera (' + (tr.tecnico ? 'técnico, sin caso de uso' : (tr.casos || []).join(', ')) + ')');
  return fallas.length ? { ok: false, motivo: 'Línea de trazabilidad incompleta (K5): ' + fallas.join('; ') + '. Esperada: «' + esperado + '».' } : { ok: true };
}

// Función pura, con test en tests/hooks.test.js. `traza` (v5) = { tr: leerTrazabilidad(...), mensaje } o null fuera de la cola.
function evaluar(cmd, staged, alcanceTexto, testsOk, traza) {
  if (/git\s+(reset\s+--hard|push\s+[^\n]*--force|push\s+-f\b|checkout\s+--\s|clean\s+-f|branch\s+-D)/.test(cmd)) {
    return { ok: false, motivo: 'Comando destructivo de git bloqueado por el hook del proyecto: usa git revert, git stash o una rama nueva (ficha APO01.10-k); ' + VIA_RESTAURAR };
  }
  if (/git\s+(show|cat-file)\s+[^\n|>]*:[^\s|>]+[^\n]*(>|\|\s*tee\b)/.test(cmd)) {
    return { ok: false, motivo: 'Escribir un archivo desde «git show <rev>:<ruta>» rodea el hook (M-467): ' + VIA_RESTAURAR };
  }
  const rr = restaurarPermitido(cmd, alcanceTexto);
  if (rr && !rr.ok) return rr;
  if (!/git\s+commit\b/.test(cmd)) return { ok: true };
  if (testsOk === false) return { ok: false, motivo: 'tests en rojo: corre node tests/run.js y corrige antes del commit.' };
  const pats = patronesAlcance(alcanceTexto);
  const codigo = staged.filter(f => !SIEMPRE.some(r => r.test(f.replace(/\\/g, '/'))));
  if (codigo.length && !staged.some(f => /^CLAUDE\.md$|^docs\/claude\//.test(f.replace(/\\/g, '/')))) {
    return { ok: false, motivo: 'El commit toca código pero no actualiza CLAUDE.md ni docs/claude/: anota el cambio en el mapa del área y vuelve a intentar.' };
  }
  if (traza && traza.tr) {
    const tz = trazabilidadOk(traza.mensaje, traza.tr);
    if (!tz.ok) return tz;
  }
  if (alcanceTexto) {
    const fuera = codigo.filter(f => !cubierto(f, pats));
    const noDeclarados = fuera.filter(f => !new RegExp('fuera de alcance:[^\\n]*' + f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(cmd));
    if (noDeclarados.length) {
      return { ok: false, motivo: 'Archivos fuera del Alcance de la instrucción: ' + noDeclarados.join(', ') + '. Si el cambio es necesario, añade al mensaje del commit una línea por archivo: «Fuera de alcance: <archivo> - <causa>»; si no, quítalos del índice (git restore --staged <archivo>).' };
    }
  }
  return { ok: true };
}

function main() {
  let raw = '';
  process.stdin.on('data', d => (raw += d));
  process.stdin.on('end', () => {
    let entrada = {};
    try { entrada = JSON.parse(raw || '{}'); } catch (e) { entrada = {}; }
    const cmd = (entrada.tool_input && entrada.tool_input.command) || '';
    const cwd = entrada.cwd || process.cwd();
    let staged = [];
    let testsOk = null;
    if (/git\s+commit\b/.test(cmd)) {
      try { staged = execSync('git diff --cached --name-only', { cwd, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean); } catch (e) { staged = []; }
      try { execSync('node tests/run.js', { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 90000 }); testsOk = true; } catch (e) { testsOk = false; }
    }
    const alcance = leerAlcance(process.env.STR_INSTR);
    let traza = null;
    if (/git\s+commit\b/.test(cmd) && process.env.STR_INSTR && fs.existsSync(process.env.STR_INSTR)) {
      const tr = leerTrazabilidad(process.env.STR_INSTR, fs.readFileSync(process.env.STR_INSTR, 'utf8'));
      const mensaje = mensajeDeCommit(cmd, (f) => fs.readFileSync(path.isAbsolute(f) ? f : path.join(cwd, f), 'utf8'));
      traza = { tr, mensaje };
    }
    const r = evaluar(cmd, staged, alcance, testsOk, traza);
    if (!r.ok) { process.stderr.write(r.motivo); process.exit(2); }
    process.exit(0);
  });
}

if (require.main === module) main();
module.exports = { cortarNoToques, evaluar, patronesAlcance, leerAlcance, cubierto, restaurarPermitido, leerTrazabilidad, mensajeDeCommit, trazabilidadOk };
