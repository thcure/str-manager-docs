// ruta.js — la ruta de pruebas de un lote, derivada del mapa del STR (LM-41, MJ-14/MJ-2). Funciones puras, sin red ni disco
// salvo la CLI del final. La misma implementación la usan mapa.py (--ruta y cobertura), la página mapa-str.html y pw
// (LM-39b: probar-lote.js la requiere para elegir la regresión).
//
//   ruta(mapa, guiones, lote) → { modulos[], porQue{}, relaciones[], reglas[], guionesCorren[], casosCorren[], noCorren[], huecos{relaciones[], reglas[]}, resumen }
//     lote = { archivos: [...], mapaLinea: 'HK, INV; REL-10', req: 'REQ-INV2-4-2', regresionLinea: 'ninguna|todas|<zonas o módulos>' }
//   cobertura(mapa, guiones) → { relaciones: {REL-n: [{guion, c}]}, reglas: {RT-n: [...]}, modulos: {HK: [...]} }
//   leerCabecera(texto) → lote (de la cabecera de una instrucción .md)
//
// Un caso cubre un nodo si lo declara en `cubre: ['REL-16', 'RT-8', 'HK', 'REQ-K3-2']` (LM-41). Sin `cubre`, el caso vale por los
// módulos del guion (anclaje por REQ o por página, mapa.py), que es la cobertura gruesa de hoy.
'use strict';

const ID_MOD = /^[A-Z][A-Z0-9]{0,4}$/;

function normaliza(s) { return String(s || '').trim(); }

// Módulos que toca un lote: archivos del Alcance (archivoModulo + páginas), línea «Mapa:» y REQ (anclajeReq).
function modulosDelLote(mapa, lote) {
  const ids = new Set(mapa.modulos.map((m) => m.id));
  const porQue = {};
  const add = (id, motivo) => { if (!ids.has(id)) return; (porQue[id] = porQue[id] || []).push(motivo); };
  const am = (mapa.anclajeGuiones && mapa.anclajeGuiones.archivoModulo && mapa.anclajeGuiones.archivoModulo.mapa) || {};
  const pm = (mapa.anclajeGuiones && mapa.anclajeGuiones.paginaModulo) || {};
  for (const a of lote.archivos || []) {
    const f = normaliza(a).replace(/\\/g, '/').replace(/^\.?\//, '');
    for (const [k, mods] of Object.entries(am)) {
      if (f === k || f.endsWith('/' + k) || (k.endsWith('/') && f.startsWith(k)) || f.startsWith(k + '/')) mods.forEach((m) => add(m, 'archivo ' + f));
      else if (f.endsWith('/') && k.startsWith(f)) mods.forEach((m) => add(m, 'carpeta ' + f + ' (incluye ' + k + ')'));   // «api/ entero»
    }
    const base = '/' + f.split('/').pop();
    if (pm[base]) add(pm[base], 'página ' + base);
    if (/^api\//.test(f) && !Object.keys(am).some((k) => f === k || f.startsWith(k))) add('SRV', 'archivo ' + f + ' (api/)');
    if (/^modelo\//.test(f)) add('MOD', 'archivo ' + f);
  }
  for (const tok of String(lote.mapaLinea || '').split(/[^A-Za-z0-9/-]+/)) {
    const t = tok.replace(/\//g, '');
    if (ID_MOD.test(t) && ids.has(t)) add(t, 'línea «Mapa:»');
  }
  const ancla = mapa.anclajeReq || {}, rm = (mapa.anclajeGuiones && mapa.anclajeGuiones.reqModulo) || {};
  for (const r of (lote.req || '').split(/[\s,;·]+/).filter(Boolean)) {
    for (const m of (rm[r] || ancla[r] || [])) add(m, 'REQ ' + r);
  }
  return porQue;
}

function relacionesDeRuta(mapa, modulos, mapaLinea) {
  const set = new Set(modulos), out = [];
  const pedidas = new Set((String(mapaLinea || '').match(/REL-\d+/g) || []));
  for (const r of mapa.relaciones || []) {
    if (r.estado && r.estado !== 'vigente' && !pedidas.has(r.id)) continue;
    const o = r.origen, d = r.destino;
    const toca = pedidas.has(r.id) || (o !== '*' && set.has(o)) || (d !== '*' && set.has(d)) || ((o === '*' || d === '*') && modulos.length);
    if (toca) out.push(r);
  }
  return out;
}

function reglasDeRuta(mapa, modulos) {
  const set = new Set(modulos);
  return (mapa.reglas || []).filter((g) => g.modulos.includes('*') || g.modulos.some((m) => set.has(m)));
}

// Módulos de un guion (misma regla que mapa.py › M4, M-520): `modulos` de un caso gana; si no, el REQ del guion (reqModulo o
// anclajeReq, sin sumar páginas); si no, las páginas de sus casos por paginaModulo. Devuelve { modulos[], anclaje }.
function modulosDeGuion(mapa, spec) {
  const ag = mapa.anclajeGuiones || {}, pm = ag.paginaModulo || {}, rm = ag.reqModulo || {}, ancla = mapa.anclajeReq || {};
  const ids = new Set((mapa.modulos || []).map((m) => m.id));
  const porCaso = new Set(), porPagina = new Set();
  for (const c of (spec && spec.casos) || []) {
    for (const m of c.modulos || []) if (ids.has(m)) porCaso.add(m);
    if (!(c.modulos || []).length && c.pagina && pm[c.pagina]) porPagina.add(pm[c.pagina]);
  }
  const porReq = new Set(rm[spec && spec.req] || ancla[spec && spec.req] || []);
  if (porCaso.size) return { modulos: [...new Set([...porCaso, ...porReq])].sort(), anclaje: 'caso' };
  if (porReq.size) return { modulos: [...porReq].sort(), anclaje: 'req' };
  return { modulos: [...porPagina].sort(), anclaje: porPagina.size ? 'pagina' : 'ninguno' };
}

// Qué cubre cada caso: lo declarado en `cubre`, o los módulos del guion.
function nodosDelCaso(g, c) {
  const n = new Set();
  for (const x of (c && c.cubre) || []) n.add(normaliza(x));
  if (!n.size) for (const m of g.modulos || []) n.add(m);
  return n;
}

function ruta(mapa, guiones, lote) {
  let porQue = modulosDelLote(mapa, lote);
  // Lote de solo guiones o herramientas (tests/, herramientas/, docs/): no toca el producto → su guion (si trae) + humo; sin huecos (M-522).
  // Cuenta como tal si todos sus archivos son de esas carpetas y ningún módulo viene de la línea «Mapa:» (el REQ no lo convierte en lote de producto).
  const archivos = (lote.archivos || []).map((a) => String(a).replace(/\\/g, '/'));
  const soloGuiones = archivos.length > 0 && archivos.every((a) => /^(tests\/|herramientas\/|docs\/|\.claude\/|CLAUDE\.md$)/.test(a)) && !Object.values(porQue).some((ms) => ms.some((x) => /Mapa:/.test(x)));
  if (soloGuiones) porQue = {};
  const modulos = Object.keys(porQue).sort();
  // Equivalencias de REQ (anclajeGuiones.reqEquivale: REQ-K3b ↔ REQ-K3-2, R-3 ↔ REQ-MOD-6) para que el guion del lote y `cubre` casen
  const equiv = (mapa.anclajeGuiones && mapa.anclajeGuiones.reqEquivale) || {};
  const reqsLote = new Set((lote.req || '').split(/[\s,;·]+/).filter(Boolean));
  for (const r of [...reqsLote]) { if (equiv[r]) reqsLote.add(equiv[r]); for (const [k, v] of Object.entries(equiv)) if (v === r) reqsLote.add(k); }
  const relaciones = relacionesDeRuta(mapa, modulos, lote.mapaLinea);
  const reglas = reglasDeRuta(mapa, modulos);
  const nodos = new Set([...modulos, ...relaciones.map((r) => r.id), ...reglas.map((r) => r.id)]);
  for (const r of reqsLote) nodos.add(r);
  const reg = normaliza(lote.regresionLinea).toLowerCase();
  const guionesCorren = [], casosCorren = [], noCorren = [];
  const cubierto = { relaciones: {}, reglas: {} };
  for (const g of guiones || []) {
    const casos = g.casos && g.casos.length ? g.casos : [{ c: '*', cubre: [] }];
    const corren = [];
    for (const c of casos) {
      const n = nodosDelCaso(g, c);
      const hit = [...n].filter((x) => nodos.has(x));
      const esPropio = g.req && reqsLote.has(g.req);
      const esHumo = /humo-pw/.test(g.archivo);
      if ((reg === 'ninguna' || soloGuiones) && !esPropio && !esHumo) continue;
      if (reg === 'todas' || esPropio || esHumo || hit.length) {
        corren.push({ c: c.c, por: esPropio ? ['guion del lote'] : (reg === 'todas' ? ['Regresión: todas'] : (hit.length ? hit : ['humo'])) });
        for (const x of hit) {
          if (/^REL-/.test(x)) (cubierto.relaciones[x] = cubierto.relaciones[x] || []).push(g.archivo + ' ' + (c.c || ''));
          if (/^RT-/.test(x)) (cubierto.reglas[x] = cubierto.reglas[x] || []).push(g.archivo + ' ' + (c.c || ''));
        }
      }
    }
    if (corren.length) { guionesCorren.push({ archivo: g.archivo, zona: g.zona, modulos: g.modulos, casos: corren.length, de: casos.length }); corren.forEach((x) => casosCorren.push({ guion: g.archivo, ...x })); }
    else noCorren.push({ archivo: g.archivo, porQue: 'ningún caso cubre un nodo de la ruta (' + (g.modulos || []).join(', ') + ')' });
  }
  // Huecos: relación (no genérica) por la que nadie pasa ni por módulos; regla de tipo 'caso' sin caso que la declare.
  // «A declarar»: algún guion de la ruta pasa por los dos módulos de la relación, pero ningún caso la declara en `cubre`.
  const modsCorren = new Set(guionesCorren.flatMap((g) => g.modulos || []));
  const pasaPorModulos = (r) => r.origen !== '*' && r.destino !== '*' && modsCorren.has(r.origen) && modsCorren.has(r.destino);
  const relNoGen = relaciones.filter((r) => !r.generica && r.origen !== '*' && r.destino !== '*');
  const huecos = {
    relaciones: relNoGen.filter((r) => !cubierto.relaciones[r.id] && !pasaPorModulos(r)).map((r) => ({ id: r.id, origen: r.origen, destino: r.destino, mecanismo: r.mecanismo })),
    reglas: reglas.filter((r) => r.prueba !== 'proceso' && !cubierto.reglas[r.id]).map((r) => ({ id: r.id, titulo: r.titulo })),
  };
  const aDeclarar = relNoGen.filter((r) => !cubierto.relaciones[r.id] && pasaPorModulos(r)).map((r) => r.id);
  const reglasFabrica = reglas.filter((r) => r.prueba === 'proceso').map((r) => r.id);
  if (soloGuiones) { huecos.relaciones = []; huecos.reglas = []; }
  return { modulos, porQue, relaciones, reglas, guionesCorren, casosCorren, noCorren, huecos, aDeclarar, reglasFabrica, soloGuiones,
    resumen: soloGuiones ? `lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos` : `${modulos.length} módulos · ${relaciones.length} relaciones · ${reglas.length} reglas · corren ${guionesCorren.length} guiones (${casosCorren.length} casos) · no corren ${noCorren.length} · huecos: ${huecos.relaciones.length} relaciones, ${huecos.reglas.length} reglas` };
}

// Cobertura global por nodo (para el mapa): solo lo declarado con `cubre`; por módulo cuenta también el anclaje del guion.
function cobertura(mapa, guiones) {
  const out = { relaciones: {}, reglas: {}, modulos: {}, casosSinCubre: 0, casos: 0 };
  for (const g of guiones || []) {
    for (const m of g.modulos || []) (out.modulos[m] = out.modulos[m] || []).push(g.archivo);
    for (const c of g.casos || []) {
      out.casos++;
      if (!c.cubre || !c.cubre.length) { out.casosSinCubre++; continue; }
      for (const x of c.cubre) {
        const k = /^REL-/.test(x) ? 'relaciones' : /^RT-/.test(x) ? 'reglas' : null;
        if (k) (out[k][x] = out[k][x] || []).push(g.archivo + ' ' + (c.c || ''));
      }
    }
  }
  return out;
}

// Cabecera de una instrucción (.md): Alcance, Mapa, Regresión, Requerimiento/REQ.
function leerCabecera(texto) {
  const lineas = String(texto || '').split(/\r?\n/).slice(0, 40);
  const linea = (re) => { const l = lineas.find((x) => re.test(x)); return l ? l.replace(re, '').trim() : ''; };
  // Alcance: solo lo que cambia (M-521). Se corta en «no toques / no tocar / sin tocar» y se descartan los tramos que solo
  // hablan de versión (`?v=`, STR_API_VERSION, schema_version: RT-20, de fábrica) o van marcados «salvo/solo `?v=`».
  let alcance = linea(/^Alcance:\s*/);
  alcance = alcance.split(/\b(?:no toques|no tocar|sin tocar|no cambies)\b/i)[0];
  const tramos = alcance.split(/\s[·;]\s|\s·|·\s/).filter((t) => !/\?v=|STR_API_VERSION|schema_version|migraci[oó]n/i.test(t));
  const archivos = [];
  for (const t of tramos) {
    for (const m of t.matchAll(/`?([A-Za-z0-9_./\\-]+\.(?:js|php|html|json|md|ps1|css|sql))`?/g)) archivos.push(m[1]);
    for (const m of t.matchAll(/(?:^|[`\s(])((?:api|modelo|tests|herramientas)\/(?:[A-Za-z0-9_./-]*\/)?)(?=[`\s·,;)]|$)/g)) archivos.push(m[1]);
  }
  // Líneas aparte, si el borrador las trae: «Cambia:» suma; «No toques:» y «Versión:» no cuentan.
  for (const m of (linea(/^Cambia:\s*/) || '').matchAll(/`?([A-Za-z0-9_./\\-]+\.(?:js|php|html|json|md|ps1|css|sql))`?/g)) archivos.push(m[1]);
  const titulo = (lineas.find((x) => /^#\s*instr/i.test(x)) || '');
  const reqs = [...new Set([...(titulo.match(/(?:REQ|INC|DT|R)-[A-Z0-9][A-Z0-9.-]*/g) || []), ...((linea(/^Origen:.*?Requerimiento:\s*/) || '').match(/REQ-[A-Z0-9][A-Z0-9.-]*/g) || [])])];
  return { archivos: [...new Set(archivos)], mapaLinea: linea(/^Mapa:[^:]*:\s*/) || linea(/^Mapa:\s*/), regresionLinea: linea(/^Regresi[oó]n:\s*/), req: reqs.join(' ') };
}

function markdown(r) {
  const L = [];
  L.push(`## Ruta de pruebas (mapa.py --ruta) · ${r.resumen}`);
  if (r.soloGuiones) { L.push(`- Lote de solo guiones o herramientas: corren ${r.guionesCorren.map((g) => g.archivo.replace('.spec.js', '')).join(', ') || 'solo el humo'}; nada más.`); return L.join('\n'); }
  L.push(`- Módulos: ${r.modulos.map((m) => `**${m}** (${[...new Set(r.porQue[m])].join('; ')})`).join(' · ') || 'ninguno: revisa Alcance y «Mapa:»'}`);
  L.push(`- Relaciones por las que pasa: ${r.relaciones.map((x) => `${x.id} ${x.origen}→${x.destino}`).join(', ') || '—'}`);
  L.push(`- Reglas que cruza: ${r.reglas.filter((x) => x.prueba !== 'proceso').map((x) => x.id).join(', ') || '—'} (de proceso, las garantiza la fábrica: ${r.reglasFabrica.join(', ') || '—'})`);
  L.push(`- Corren (regresión por ruta): ${r.guionesCorren.map((g) => `${g.archivo.replace('.spec.js', '')} (${g.casos}/${g.de})`).join(', ') || '—'}`);
  L.push(`- No corren: ${r.noCorren.length} guiones fuera de la ruta`);
  L.push(`- Huecos de la ruta (nadie pasa): el guion cubre con un caso con \`cubre\` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones ${r.huecos.relaciones.map((x) => `${x.id} (${x.origen}→${x.destino})`).join(', ') || 'ninguna'}; reglas ${r.huecos.reglas.map((x) => `${x.id} ${x.titulo}`).join(', ') || 'ninguna'} — un caso negativo por regla (quien no puede, intenta)`);
  L.push(`- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en \`cubre\`): ${r.aDeclarar.join(', ') || 'ninguna'}`);
  return L.join('\n');
}

module.exports = { ruta, cobertura, leerCabecera, markdown, modulosDelLote, relacionesDeRuta, reglasDeRuta, nodosDelCaso, modulosDeGuion };

if (require.main === module) {
  const fs = require('fs');
  const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
  const mapa = JSON.parse(fs.readFileSync(arg('--mapa', 'interno/mapa-modulos.json'), 'utf8'));
  const foto = JSON.parse(fs.readFileSync(arg('--guiones', 'interno/arquitectura/mapa-str.datos.json'), 'utf8'));
  const guiones = foto.guiones && Array.isArray(foto.guiones) ? foto.guiones : Object.entries(foto.guiones || {}).map(([archivo, g]) => ({ archivo, ...g, modulos: g.modulos || [] }));
  if (process.argv.includes('--cobertura')) { process.stdout.write(JSON.stringify(cobertura(mapa, guiones)) + '\n'); process.exit(0); }
  const instr = arg('--instr');
  const lote = instr ? leerCabecera(fs.readFileSync(instr, 'utf8')) : { archivos: (arg('--archivos', '') || '').split(',').filter(Boolean), mapaLinea: arg('--mapa-linea', ''), req: arg('--req', ''), regresionLinea: arg('--regresion', '') };
  const r = ruta(mapa, guiones, lote);
  if (process.argv.includes('--json')) process.stdout.write(JSON.stringify({ lote, ...r }, null, 1) + '\n');
  else process.stdout.write(markdown(r) + '\n');
}
