// probar-lote.js - pasos P4 (puerta de entrada) y P5 (N1 + N2 + regresion) de PRUEBAS-v1 (LM-18). Lo lanza la cola v6
// despues del commit y push de un lote; tambien se puede correr a mano. Lo mantiene el Arquitecto.
// No juzga N3 ni escribe el veredicto: deja log\<lote>-pruebas.json para el verificador (que juzga) y el Chat Desarrollo.
// Uso: node probar-lote.js --instr <hechas\L-n-instr-x.md> [--repo C:\Users\ktcol\str-manager] [--sin-espera]
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { BASE, COLA, abrir, explicarError } = require('./comun');
const { extraerGuion, igual, loteDe, correrGuion, cargar } = require('./guion');
const { comprobarSemilla } = require('./semilla');

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const dormir = ms => new Promise(r => setTimeout(r, ms));

// Puro: version ?v= nueva que declara la cabecera (null si el lote no la cambia).
function versionNueva(texto) {
  const cab = String(texto).replace(/\r\n/g, '\n').split('\n').slice(0, 15).join('\n');
  const al = (cab.match(/^Alcance:.*$/m) || [''])[0];
  const m = al.match(/\?v=[^`]*`\s*(?:→|->)\s*`(?:\?v=)?([A-Za-z0-9._-]+)`/);
  return m ? m[1] : null;
}

// Puro: zona del lote para la regresion (la del guion; si no hay guion, null).
function guionesDeZona(dirE2e, zona, excluir) {
  if (!zona || !fs.existsSync(dirE2e)) return [];
  return fs.readdirSync(dirE2e).filter(f => f.endsWith('.spec.js') && f !== excluir).map(f => path.join(dirE2e, f))
    .filter(f => { try { return cargar(f).zona === zona; } catch (e) { return false; } });
}

// Puro (v0.5.27, M-463): zonas cuya regresion corre el lote, y por que.
//  1. Si la cabecera trae «Regresión: a, b» (o «Regresion:»), esas; «Regresión: todas» = todas las zonas de tests/e2e;
//     «Regresión: ninguna» = ninguna (lo declara Desarrollo y lo ve el juez).
//  2. Si no, la zona del guion del lote y, ademas, «inventario» cuando el Alcance toca servidor o capa comun
//     (api/, database.php, str-api.js, str-app-shell, portal.html, str-cola-subida, secrets): es la regresion mas completa.
//  3. Sin guion y sin nada de eso: ninguna, con el motivo escrito en el informe.
const TOCA_COMUN = /(^|[\s`(,])(api\/|database\.php|str-api\.js|str-app-shell|portal\.html|str-cola-subida|secrets\.php|\.htaccess)/i;
function zonasRegresion(texto, zonaGuion, zonasDisponibles = []) {
  const cab = String(texto).replace(/\r\n/g, '\n').split('\n').slice(0, 20).join('\n');
  const dec = cab.match(/^Regresi[oó]n:\s*(.+)$/mi);
  if (dec) {
    const v = dec[1].trim();
    if (/^ninguna\b/i.test(v)) return { zonas: [], motivo: 'la instruccion declara «Regresión: ninguna»' };
    if (/^todas\b/i.test(v)) return { zonas: [...zonasDisponibles], motivo: 'la instruccion declara «Regresión: todas»' };
    const zs = v.split(/[,;]| y /).map(x => x.trim().replace(/^zonas?\s+/i, '').replace(/[.`]+$/, '')).filter(Boolean);
    return { zonas: [...new Set(zs)], motivo: 'la instruccion declara «Regresión: ' + v + '»' };
  }
  const zonas = []; const por = [];
  if (zonaGuion) { zonas.push(zonaGuion); por.push('zona del guion del lote (' + zonaGuion + ')'); }
  const al = (cab.match(/^Alcance:.*$/m) || [''])[0];
  if (TOCA_COMUN.test(al) && !zonas.includes('inventario')) { zonas.push('inventario'); por.push('el Alcance toca servidor o capa comun: regresion de inventario'); }
  return { zonas, motivo: zonas.length ? por.join(' + ') : 'sin guion y el Alcance no toca servidor ni capa comun; la instruccion puede declarar «Regresión: <zonas>»' };
}
function zonasDisponibles(dirE2e) {
  if (!fs.existsSync(dirE2e)) return [];
  const z = new Set();
  fs.readdirSync(dirE2e).filter(f => f.endsWith('.spec.js')).forEach(f => { try { const s = cargar(path.join(dirE2e, f)); if (s && s.zona) z.add(s.zona); } catch (e) { } });
  return [...z];
}

async function sesionViva(perfil) {
  let ctx;
  try {
    const a = await abrir(perfil); ctx = a.ctx;
    const p = await ctx.newPage();
    const me = p.waitForResponse(r => new URL(r.url()).pathname.endsWith('/api/me'), { timeout: 30000 }).catch(() => null);
    await p.goto(BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' });
    const r = await me;
    return r && r.status() === 200 ? { ok: true, observado: perfil + ': /api/me 200' } : { ok: false, observado: perfil + ': sin sesion (Carlos: node abrir-perfil.js ' + perfil + ')' };
  } catch (e) { return { ok: false, observado: perfil + ': ' + explicarError(e, perfil) }; }
  finally { if (ctx) await ctx.close().catch(() => { }); }
}

async function main() {
  const instr = arg('--instr'); const repo = arg('--repo', path.join(require('os').homedir(), 'str-manager'));
  if (!instr || !fs.existsSync(instr)) { console.log('Uso: node probar-lote.js --instr <archivo de la instruccion>'); process.exit(2); }
  const texto = fs.readFileSync(instr, 'utf8');
  const lote = loteDe(instr) || 'L-0';
  const out = { lote, instruccion: path.basename(instr), proceso: 'PRUEBAS-v1', inicio: new Date().toISOString(), entrada: [], n1: null, n2: [], regresion: [], limpiezaRegresion: [], resultado: null, causa: null };
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo, encoding: 'utf8' });
  out.commit = (git.stdout || '').trim() || null;
  const entra = (c, ok, observado) => { out.entrada.push({ c, ok, observado }); console.log((ok ? 'OK  ' : 'NO  ') + 'P4 ' + c + ' · ' + observado); return ok; };
  const fin = (resultado, causa) => {
    out.resultado = resultado; out.causa = causa || null; out.fin = new Date().toISOString();
    fs.writeFileSync(path.join(COLA, 'log', lote + '-pruebas.json'), JSON.stringify(out, null, 1));
    console.log('Pruebas ' + lote + ': ' + resultado + (causa ? ' - ' + causa : '') + ' - log\\' + lote + '-pruebas.json');
    process.exit(resultado === 'verde' ? 0 : 1);
  };

  // P4.a despliegue: /api/health y, si el lote cambia ?v=, la version en el HTML (espera hasta 10 min al despliegue)
  const v = versionNueva(texto);
  let desplegado = false, obs = '';
  for (let i = 0; i < (process.argv.includes('--sin-espera') ? 1 : 20); i++) {
    try {
      const h = await fetch(BASE + '/api/health'); const j = await h.json();
      if (h.status === 200 && j.ok) {
        if (!v) { desplegado = true; obs = '/api/health 200; el lote no cambia ?v='; break; }
        const html = await (await fetch(BASE + '/str-app-shell.html?nc=' + Date.now())).text();
        if (html.includes('v=' + v)) { desplegado = true; obs = '/api/health 200 y ?v=' + v + ' en str-app-shell.html'; break; }
        obs = 'aun sin ?v=' + v + ' en str-app-shell.html';
      } else obs = '/api/health ' + h.status;
    } catch (e) { obs = e.message; }
    await dormir(30000);
  }
  if (!entra('despliegue', desplegado, obs)) return fin('bloqueado', 'despliegue: ' + obs);

  // P4.b tests/ en verde (N1) en el commit del lote
  const t = spawnSync(process.execPath, ['tests/run.js'], { cwd: repo, encoding: 'utf8', timeout: 300000 });
  const resumen = ((t.stdout || '').match(/\d+\/\d+ archivos OK/) || ['sin resumen'])[0];
  out.n1 = { ok: t.status === 0, observado: 'node tests/run.js: ' + resumen };
  if (!entra('tests/ en verde', t.status === 0, resumen)) return fin('bloqueado', 'tests/ en rojo en el commit del lote: ' + resumen);

  // P4.c guion N2 igual al de la instruccion
  const g = extraerGuion(texto);
  let spec = null, rutaSpec = null;
  if (!g) entra('guion N2', true, 'la instruccion no trae guion N2 (solo N1/N3)');
  else {
    rutaSpec = path.join(repo, ...g.ruta.split('/'));
    if (!g.codigo) return entra('guion N2', false, g.error), fin('bloqueado', 'guion N2 mal escrito en la instruccion: ' + g.error);
    if (!fs.existsSync(rutaSpec)) return entra('guion N2', false, g.ruta + ' no esta en el commit'), fin('bloqueado', 'la CLI no copio el guion a ' + g.ruta);
    if (!igual(fs.readFileSync(rutaSpec, 'utf8'), g.codigo)) return entra('guion N2', false, g.ruta + ' distinto del bloque de la instruccion'), fin('bloqueado', 'el guion del commit no es igual al de la instruccion (independencia)');
    try { spec = cargar(rutaSpec); } catch (e) { return entra('guion N2', false, 'no carga: ' + e.message), fin('bloqueado', 'el guion no carga: ' + e.message); }
    entra('guion N2', true, g.ruta + ' igual a la instruccion · ' + (spec.casos || []).length + ' caso(s)');
  }

  // P4.d semilla zz-verif- y P4.e sesiones de los perfiles que usa el guion
  const sem = await comprobarSemilla({ lote });
  out.semilla = sem;
  // Sin guion N2 la cola no usa la semilla: queda como aviso y no bloquea (v0.3.1)
  if (!spec && sem.estado === 'incompleta') entra('semilla zz-verif- (aviso, el lote no trae guion)', true, sem.grupos.filter(x => x.estado === 'falta').map(x => x.id + ': ' + x.observado).join('; '));
  else if (!entra('semilla zz-verif-', sem.estado !== 'incompleta', sem.estado + (sem.error ? ' · ' + sem.error : '') + ' · ' + sem.grupos.map(x => x.id + ' ' + x.estado).join(', '))) return fin('bloqueado', 'semilla incompleta: ' + sem.grupos.filter(x => x.estado === 'falta').map(x => x.observado).join('; '));
  const perfiles = [...new Set(((spec && spec.casos) || []).map(c => c.perfil))];
  for (const p of perfiles) { const s = await sesionViva(p); if (!entra('sesion ' + p, s.ok, s.observado)) return fin('bloqueado', s.observado); }

  // P5 guion del lote + regresion (sin Claude). v0.5.27 (M-463): las zonas de la regresion salen de zonasRegresion()
  // (declaradas en la cabecera, o la del guion + inventario si el lote toca servidor o capa comun) y corre aunque el lote
  // no traiga guion propio.
  const dirE2e = rutaSpec ? path.dirname(rutaSpec) : path.join(repo, 'tests', 'e2e');
  const zr = zonasRegresion(texto, spec ? spec.zona : null, zonasDisponibles(dirE2e));
  out.zonasRegresion = { zonas: zr.zonas, motivo: zr.motivo };
  console.log('regresion: zonas ' + (zr.zonas.length ? zr.zonas.join(', ') : '(ninguna)') + ' · ' + zr.motivo);
  if (spec) {
    const r = await correrGuion(spec, { lote, dirGuion: path.dirname(rutaSpec) }); out.n2 = r.casos; out.limpieza = r.limpieza;
    r.casos.forEach(x => console.log((x.ok ? 'OK  ' : x.ok === null ? 'N3  ' : 'NO  ') + x.nivel + ' ' + x.c + ' · ' + x.observado));
  }
  {
    const vistos = new Set();
    const lista = [];
    for (const z of zr.zonas) for (const f of guionesDeZona(dirE2e, z, rutaSpec ? path.basename(rutaSpec) : null)) { if (!vistos.has(f)) { vistos.add(f); lista.push(f); } }
    for (const f of lista) {
      try { const sp = cargar(f); sp.casos = (sp.casos || []).filter(c => c.nivel !== 'N3'); const rr = await correrGuion(sp, { lote, prefijo: 'zz-verif-' + lote + '-r-', dirGuion: path.dirname(f), nombreGuion: path.basename(f).replace(/\.spec\.js$/, '') });   /* v0.5.25: capturas <guion>-<letra>-error.png */ /* la regresion no repite los N3 */ rr.casos.forEach(x => out.regresion.push(Object.assign({ guion: path.basename(f) }, x))); out.limpiezaRegresion.push({ guion: path.basename(f), limpieza: rr.limpieza }); /* v0.5.12 (M-390) */ }
      catch (e) { out.regresion.push({ guion: path.basename(f), ok: false, observado: e.message }); }
    }
    out.regresion.forEach(x => console.log((x.ok ? 'OK  ' : 'NO  ') + 'regresion ' + x.guion + ' ' + (x.c || '') + ' · ' + x.observado));
    out.limpiezaRegresion.forEach(x => console.log('limpieza regresion ' + x.guion + ' · ' + x.limpieza));
  }
  const rojo = out.n2.some(x => x.ok === false) || out.regresion.some(x => x.ok === false);
  out.n3Preparados = out.n2.filter(x => x.nivel === 'N3' && x.ok === null).map(x => x.c);
  return fin(rojo ? 'rojo' : 'verde', rojo ? 'fallan: ' + out.n2.concat(out.regresion).filter(x => x.ok === false).map(x => (x.guion ? x.guion + ' ' : '') + x.c).join(', ') : null);
}

module.exports = { versionNueva, guionesDeZona, zonasRegresion, TOCA_COMUN };
if (require.main === module) main().catch(e => { console.log('error: ' + e.message); process.exit(1); });
