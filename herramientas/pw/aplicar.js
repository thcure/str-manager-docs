// aplicar.js — CONSTRUCCIÓN-v1 (LM-63, ISO/IEC 12207 7.1.5 y 7.2.6): evidencia de que el commit aplicó la instrucción tal cual.
// K1 aplicación literal: por cada par «Busca: / Pon:» de la instrucción, algún archivo del Alcance contiene el bloque «Pon:» y ya no
//    contiene el «Busca:» (salvo que «Pon:» lo incluya); un archivo nuevo con «Contenido completo» se compara entero; un punto
//    «Versión:» se comprueba con grep (el valor viejo no queda; el nuevo está donde carga str-api.js y en CLAUDE.md); lo que queda en
//    prosa se lista y no se juzga. Un punto declarado «No hecho» en el mensaje del commit se salta y se anota.
// K2 N1 literal: cada «archivo nuevo tests/x.test.js … Contenido completo» de la sección «Tests en tests/» es igual byte a byte al
//    del commit (como el guion N2); cada caso del N1 nombra el punto que cubre (los puntos sin prueba se listan, aviso).
// v0.13.1 (LM-79, M-1137): las rutas aceptan un archivo que empieza por punto (`modelo/api/.htaccess`); antes K1 lo perdía.
// K3 tamaño del lote: líneas y archivos del commit en tres columnas (código, pruebas, versión).
// Puras salvo las que dicen «lee». Lo mantiene el Arquitecto. Pruebas: pruebas-v1.test.js.
'use strict';
const fs = require('fs'), path = require('path');
const { execSync } = require('child_process');

function norm(s) { return String(s || '').replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/\s+$/, '')).join('\n').replace(/\n+$/, ''); }

// Bloques de código con valla, con el texto que los precede (para saber si son Busca:, Pon: o Contenido completo).
function bloques(texto) {
  const t = String(texto || '').replace(/\r\n/g, '\n');
  const out = []; const re = /```[^\n]*\n([\s\S]*?)\n```/g; let m, prev = 0;
  while ((m = re.exec(t))) { out.push({ antes: t.slice(prev, m.index), codigo: m[1], ini: m.index, fin: re.lastIndex }); prev = re.lastIndex; }
  return out;
}
// Puntos de la instrucción: pares Busca/Pon (con el id del punto que los precede: P1, C3, T4, D1…), archivos completos y «Versión:».
function puntosDe(texto) {
  const t = String(texto || '').replace(/\r\n/g, '\n');
  const bs = bloques(t);
  const puntos = [];
  const idDe = (antes) => { const ids = [...antes.matchAll(/\*\*([A-Z]{1,3}\d{1,2}[a-z]?)\s*[·:.]/g)]; return ids.length ? ids[ids.length - 1][1] : null; };
  const RUTA = /`((?:[\w.-]+\/)*(?:[\w.-]+\.(?:html|js|php|json|md|css|htaccess|txt|sql|yml|yaml)|\.htaccess))`/g;
  const archivoDe = (antes) => { const a = [...antes.matchAll(RUTA)]; return a.length ? a[a.length - 1][1] : null; };
  // M-972 (A): el archivo de un «Contenido completo» es el que sigue a «archivo nuevo» (o «nuevo») en el texto previo, no la última ruta
  // entre comillas invertidas (la prosa suele nombrar otros archivos: «… real y `str-avance.js` … Contenido completo:»).
  const archivoCompletoDe = (antes) => {
    const parr = antes.slice(-1200);
    const nuevo = [...parr.matchAll(/(?:archivo\s+nuevo|nuevo)\s*[`*(]*\s*`((?:[\w.-]+\/)*(?:[\w.-]+\.(?:html|js|php|json|md|css|htaccess|txt|sql|yml|yaml)|\.htaccess))`/gi)];
    if (nuevo.length) return nuevo[nuevo.length - 1][1];
    const enNegrita = [...parr.matchAll(/\*\*[^*\n]*`((?:[\w.-]+\/)*(?:[\w.-]+\.(?:html|js|php|json|md|css|htaccess|txt|sql|yml|yaml)|\.htaccess))`[^*\n]*\*\*/g)];
    if (enNegrita.length) return enNegrita[enNegrita.length - 1][1];
    return archivoDe(antes);
  };
  for (let i = 0; i < bs.length; i++) {
    const b = bs[i], cola = b.antes.slice(-400);
    if (/Busca\s*:\s*$/i.test(cola.trimEnd()) && bs[i + 1] && /^\s*\*{0,2}Pon\s*:?\*{0,2}\s*:?\s*$/i.test(bs[i + 1].antes.trim().split('\n').pop() || '') ) {
      // «el mismo par en A y en B» / «en los dos archivos» (L-160): el Pon debe estar en cada archivo nombrado en esa frase
      const frase = cola.split('\n').slice(-3).join(' ');
      const varios = /mismo par|los dos archivos|en ambos|en cada uno/i.test(frase) ? [...new Set([...frase.matchAll(RUTA)].map((m) => m[1]))] : [];
      puntos.push({ id: idDe(b.antes) || 'punto ' + (puntos.length + 1), tipo: 'par', busca: b.codigo, pon: bs[i + 1].codigo, archivo: archivoDe(b.antes), archivos: varios.length > 1 ? varios : undefined });
      i++;
    } else if (/Contenido completo\s*:?\s*$/i.test(cola.trimEnd()) || /archivo nuevo[^\n]*$/i.test(cola.trimEnd().split('\n').pop() || '')) {
      const arch = archivoCompletoDe(b.antes);
      if (arch) puntos.push({ id: idDe(b.antes) || arch, tipo: 'completo', archivo: arch, codigo: b.codigo });
    }
  }
  const v = t.match(/`\?v=`?\s*`?([A-Za-z0-9._-]+)`\s*(?:→|->)\s*`(?:\?v=)?([A-Za-z0-9._-]+)`/);
  if (v) puntos.push({ id: 'Versión', tipo: 'version', vieja: v[1], nueva: v[2] });
  const sv = t.match(/schema_version[^\n]*?(\d+)\s*(?:→|->)\s*(\d+)/i);
  if (sv) puntos.push({ id: 'schema_version', tipo: 'schema', de: sv[1], a: sv[2] });
  return puntos;
}
// Archivos del Alcance (primeras 15 líneas) y los que nombra la instrucción.
function archivosDe(texto) {
  const t = String(texto || '').replace(/\r\n/g, '\n');
  const cab = t.split('\n').slice(0, 15).join('\n');
  const RE = /`((?:[\w.-]+\/)*(?:[\w.-]+\.(?:html|js|php|json|md|css|htaccess|txt|sql|yml|yaml)|\.htaccess))`/g;
  const partes = (cab.match(/^Alcance:.*$/m) || [''])[0].split(/\b(?:no toques|no tocar|sin tocar|no cambies)\b/i);
  const fuera = new Set([...(partes.slice(1).join(' ')).matchAll(RE)].map((m) => m[1]));   // lo que la cabecera prohíbe tocar
  const set = new Set();
  for (const m of partes[0].matchAll(RE)) set.add(m[1]);
  for (const m of t.matchAll(RE)) if (!fuera.has(m[1])) set.add(m[1]);
  return [...set];
}
// Puntos que el mensaje del commit declara «No hecho».
function noHechos(mensaje) {
  const out = new Set();
  for (const l of String(mensaje || '').split(/\r?\n/)) {
    if (!/no hecho/i.test(l)) continue;
    for (const m of l.matchAll(/\b([A-Z]{1,3}\d{1,2}[a-z]?)\b/g)) out.add(m[1]);
    if (/versi[oó]n/i.test(l)) out.add('Versión');
  }
  return out;
}
// Pura: verifica un punto contra {ruta: contenido}. Devuelve {id, ok, archivo, motivo, saltado}.
function verificarPunto(p, archivos, opciones = {}) {
  const A = Object.entries(archivos || {});
  if (p.tipo === 'par') {
    const pon = norm(p.pon), busca = norm(p.busca);
    if (!pon) return { id: p.id, ok: false, motivo: 'bloque «Pon:» vacío' };
    if (p.archivos && p.archivos.length > 1) {   // el mismo par en varios archivos
      const faltan = p.archivos.filter((r) => archivos[r] == null || !norm(archivos[r]).includes(pon));
      const quedan = p.archivos.filter((r) => busca && !pon.includes(busca) && archivos[r] != null && norm(archivos[r]).includes(busca));
      if (faltan.length) return { id: p.id, ok: false, archivo: faltan.join(', '), motivo: 'el bloque «Pon:» falta en ' + faltan.join(', ') + ' (el par va en ' + p.archivos.join(' y ') + ')' };
      if (quedan.length) return { id: p.id, ok: false, archivo: quedan.join(', '), motivo: 'el bloque «Busca:» sigue en ' + quedan.join(', ') };
      return { id: p.id, ok: true, archivo: p.archivos.join(', ') };
    }
    const candidatos = p.archivo && archivos[p.archivo] != null ? [[p.archivo, archivos[p.archivo]]] : A;
    const con = candidatos.filter(([, c]) => norm(c).includes(pon));
    if (!con.length) return { id: p.id, ok: false, archivo: p.archivo, motivo: 'ningún archivo del Alcance contiene el bloque «Pon:»' + (p.archivo ? ' (' + p.archivo + ')' : '') };
    const [ruta, cont] = con[0];
    if (busca && !pon.includes(busca) && norm(cont).includes(busca)) return { id: p.id, ok: false, archivo: ruta, motivo: 'el bloque «Busca:» sigue en ' + ruta + ' (el cambio quedó duplicado o no reemplazó)' };
    return { id: p.id, ok: true, archivo: ruta };
  }
  if (p.tipo === 'completo') {
    const c = archivos[p.archivo];
    if (c == null) return { id: p.id, ok: false, archivo: p.archivo, motivo: p.archivo + ' no está en el commit' };
    return norm(c) === norm(p.codigo) ? { id: p.id, ok: true, archivo: p.archivo } : { id: p.id, ok: false, archivo: p.archivo, motivo: p.archivo + ' distinto del «Contenido completo» de la instrucción' };
  }
  if (p.tipo === 'version') {
    // M-972 (B): «carga str-api.js» = un <script src="…str-api.js?v=…"> en un .html, o la cadena 'str-api.js?v=' en un .js que no sea el propio
    // str-api.js (su comentario de cabecera la nombra); str-api.js se comprueba aparte por STR_API_VERSION. La versión vieja se busca en html/js/php.
    const esApi = (r) => /(^|\/)str-api\.js$/.test(r);
    const conVieja = A.filter(([r, c]) => /\.(html|js|php)$/.test(r) && String(c).includes(p.vieja)).map(([r]) => r);
    const cargan = A.filter(([r, c]) => !esApi(r) && ((/\.html$/.test(r) && /<script[^>]*src=["']?[^"'\s>]*str-api\.js\?v=/i.test(String(c))) || (/\.js$/.test(r) && /['"`][^'"`\n]*str-api\.js\?v=/.test(String(c)))));
    const sinNueva = cargan.filter(([, c]) => !String(c).includes('str-api.js?v=' + p.nueva)).map(([r]) => r);
    const api = A.find(([r]) => esApi(r));
    const apiOk = api ? String(api[1]).includes(p.nueva) : null;
    const claude = archivos['CLAUDE.md'];
    const claudeOk = claude == null ? null : (String(claude).match(new RegExp(p.nueva.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length >= 2;
    const fallas = [];
    if (conVieja.length) fallas.push('queda «' + p.vieja + '» en ' + conVieja.slice(0, 6).join(', '));
    if (sinNueva.length) fallas.push('cargan str-api.js sin ?v=' + p.nueva + ': ' + sinNueva.slice(0, 6).join(', '));
    if (apiOk === false) fallas.push('str-api.js no trae STR_API_VERSION ' + p.nueva);
    if (claudeOk === false) fallas.push('CLAUDE.md no trae las dos líneas con ' + p.nueva);
    return fallas.length ? { id: 'Versión', ok: false, motivo: fallas.join(' · ') } : { id: 'Versión', ok: true, motivo: p.vieja + ' → ' + p.nueva + ' en ' + cargan.length + ' archivo(s) que cargan str-api.js' };
  }
  if (p.tipo === 'schema') {
    const h = opciones.health;
    if (!h || h.schema_version == null) return { id: 'schema_version', ok: null, motivo: '/api/health no devuelve schema_version' };
    return String(h.schema_version) === String(p.a) ? { id: 'schema_version', ok: true, motivo: 'schema_version ' + p.a } : { id: 'schema_version', ok: false, motivo: '/api/health dice schema_version ' + h.schema_version + ', la cabecera espera ' + p.a };
  }
  return { id: p.id, ok: null, motivo: 'tipo desconocido' };
}
// Pura: aplica todo. archivos = {ruta: contenido} de los archivos del Alcance y los nombrados, leídos del commit.
function aplicar(texto, archivos, mensajeCommit, opciones = {}) {
  const puntos = puntosDe(texto), nh = noHechos(mensajeCommit);
  const res = puntos.map((p) => nh.has(p.id) ? { id: p.id, ok: null, saltado: true, motivo: 'declarado «No hecho» en el commit' } : verificarPunto(p, archivos, opciones));
  const fallan = res.filter((r) => r.ok === false), saltados = res.filter((r) => r.saltado);
  const pares = puntos.filter((p) => p.tipo === 'par').length;
  const resumen = res.length ? ('aplicación literal ' + res.filter((r) => r.ok === true).length + '/' + res.length + (fallan.length ? ' · fallan: ' + fallan.map((r) => r.id + ' (' + r.motivo + ')').join('; ') : '') + (saltados.length ? ' · No hecho: ' + saltados.map((r) => r.id).join(', ') : '')) : 'la instrucción no trae pares Busca/Pon ni archivos completos (puntos en prosa: no se juzgan)';
  return { ok: fallan.length === 0, puntos: res, pares, resumen };
}

// ---------- K2: N1 literal ----------
function n1De(texto) {
  const t = String(texto || '').replace(/\r\n/g, '\n');
  const out = [];
  for (const b of bloques(t)) {
    const cola = b.antes.slice(-600);
    const m = cola.match(/`(tests\/(?!e2e\/)[\w.\/-]+\.test\.js)`[\s\S]*?(?:Contenido completo|archivo nuevo|completo)[^\n]*\n?\s*$/i) || (/Contenido completo\s*:?\s*$/i.test(cola.trimEnd()) ? cola.match(/`(tests\/(?!e2e\/)[\w.\/-]+\.test\.js)`(?![\s\S]*`tests\/)/) : null);
    if (m) out.push({ archivo: m[1], codigo: b.codigo, puntos: [...new Set([...b.codigo.matchAll(/\b([A-Z]{1,3}\d{1,2}[a-z]?)\b/g)].map((x) => x[1]))] });
  }
  return out;
}
function verificarN1(texto, archivos) {
  const lista = n1De(texto);
  if (!lista.length) return { ok: true, aviso: 'la instrucción no trae un N1 completo (K2: desde LM-63 va completo en «Tests en tests/»)', archivos: [] };
  const res = lista.map((n) => { const c = archivos[n.archivo]; return { archivo: n.archivo, ok: c != null && norm(c) === norm(n.codigo), motivo: c == null ? 'no está en el commit' : (norm(c) === norm(n.codigo) ? 'igual byte a byte' : 'distinto del bloque de la instrucción') }; });
  const ids = new Set(puntosDe(texto).filter((p) => (p.tipo === 'par' || p.tipo === 'completo') && !/^tests\//.test(p.archivo || '')).map((p) => p.id));
  const cubiertos = new Set(lista.flatMap((n) => n.puntos));
  const sinPrueba = [...ids].filter((i) => !cubiertos.has(i) && /^[A-Z]{1,3}\d/.test(i));
  return { ok: res.every((r) => r.ok), archivos: res, sinPrueba, resumen: res.map((r) => r.archivo + ' ' + (r.ok ? 'igual' : r.motivo)).join('; ') + (sinPrueba.length ? ' · puntos sin caso N1 que los nombre: ' + sinPrueba.join(', ') : '') };
}

// ---------- K3: tamaño ----------
// Pura: numstat [{archivo, mas, menos}] y las líneas cambiadas por archivo → tres columnas.
function tamano(numstat, lineasPorArchivo = {}, version = null) {
  const col = { codigo: { archivos: 0, lineas: 0 }, pruebas: { archivos: 0, lineas: 0 }, version: { archivos: 0, lineas: 0 }, total: { archivos: 0, lineas: 0 } };
  for (const f of numstat) {
    const n = (f.mas || 0) + (f.menos || 0); col.total.archivos++; col.total.lineas += n;
    const cambios = lineasPorArchivo[f.archivo];
    const soloVersion = version && cambios && cambios.length > 0 && cambios.every((l) => l.includes(version.vieja) || l.includes(version.nueva));
    const k = /^tests\//.test(f.archivo) ? 'pruebas' : soloVersion || f.archivo === 'CLAUDE.md' && cambios && cambios.length <= 4 && cambios.every((l) => l.includes(version && version.nueva || '\u0000') || l.includes(version && version.vieja || '\u0000')) ? 'version' : 'codigo';
    col[k].archivos++; col[k].lineas += n;
  }
  col.grande = col.codigo.lineas > 400 || col.codigo.archivos > 8;
  return col;
}
// Lee del repo (git): archivos del commit, numstat y líneas cambiadas.
function leerCommit(repo, rutas) {
  const archivos = {};
  for (const r of rutas) { try { archivos[r] = fs.readFileSync(path.join(repo, ...r.split('/')), 'utf8'); } catch (e) { } }
  let numstat = [], lineas = {}, mensaje = '';
  try { mensaje = execSync('git log -1 --format=%B', { cwd: repo, encoding: 'utf8' }); } catch (e) { }
  try {
    numstat = execSync('git diff --numstat HEAD~1 HEAD', { cwd: repo, encoding: 'utf8' }).split(/\r?\n/).filter(Boolean).map((l) => { const [a, b, f] = l.split('\t'); return { archivo: f, mas: +a || 0, menos: +b || 0 }; });
    const diff = execSync('git diff -U0 HEAD~1 HEAD', { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    let actual = null;
    for (const l of diff.split(/\r?\n/)) { const m = l.match(/^\+\+\+ b\/(.*)$/); if (m) { actual = m[1]; lineas[actual] = []; continue; } if (actual && /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l)) lineas[actual].push(l.slice(1)); }
  } catch (e) { }
  return { archivos, numstat, lineas, mensaje };
}
// Lee: todo junto para probar-lote (P4.f y K3).
function revisarCommit(texto, repo, opciones = {}) {
  const rutas = archivosDe(texto);
  const c = leerCommit(repo, rutas);
  // la versión toca archivos que no están en el Alcance uno por uno: se leen todos los .html/.js de la raíz
  try { for (const f of fs.readdirSync(repo)) if (/\.(html|js)$/.test(f) && c.archivos[f] == null) c.archivos[f] = fs.readFileSync(path.join(repo, f), 'utf8'); } catch (e) { }
  if (c.archivos['CLAUDE.md'] == null) { try { c.archivos['CLAUDE.md'] = fs.readFileSync(path.join(repo, 'CLAUDE.md'), 'utf8'); } catch (e) { } }
  const ap = aplicar(texto, c.archivos, c.mensaje, opciones);
  const n1 = verificarN1(texto, c.archivos);
  const v = puntosDe(texto).find((p) => p.tipo === 'version');
  const tam = tamano(c.numstat, c.lineas, v ? { vieja: v.vieja, nueva: v.nueva } : null);
  return { aplicacion: ap, n1, tamano: tam, mensajeCommit: c.mensaje.slice(0, 2000) };
}

module.exports = { norm, bloques, puntosDe, archivosDe, noHechos, verificarPunto, aplicar, n1De, verificarN1, tamano, leerCommit, revisarCommit };

// A mano (prueba c de LM-63, M-966: sin desplegar nada): node pw\aplicar.js --instr <instrucción.md> [--repo C:\Users\ktcol\str-manager]
// Revisa la instrucción contra el HEAD del repo tal como está (un lote ya aceptado) e imprime aplicación, N1 y tamaño; rc 1 si K1 o K2 fallan.
if (require.main === module) {
  const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
  const instr = arg('--instr'); const repo = arg('--repo', path.join(require('os').homedir(), 'str-manager'));
  if (!instr || !fs.existsSync(instr)) { console.log('uso: node aplicar.js --instr <instrucción.md> [--repo <repo>]'); process.exit(2); }
  const r = revisarCommit(fs.readFileSync(instr, 'utf8'), repo, {});
  console.log('aplicación (K1): ' + r.aplicacion.resumen);
  for (const p of r.aplicacion.puntos) console.log('  ' + (p.ok === true ? 'OK  ' : p.ok === false ? 'NO  ' : '--  ') + p.id + (p.archivo ? ' · ' + p.archivo : '') + (p.motivo ? ' · ' + p.motivo : ''));
  console.log('N1 literal (K2): ' + (r.n1.resumen || r.n1.aviso));
  console.log('tamaño (K3): ' + JSON.stringify(r.tamano));
  process.exit(r.aplicacion.ok && r.n1.ok ? 0 : 1);
}
