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

// Qué cubre cada caso: lo declarado en `cubre`, o los módulos del guion.
function nodosDelCaso(g, c) {
  const n = new Set();
  for (const x of (c && c.cubre) || []) n.add(normaliza(x));
  if (!n.size) for (const m of g.modulos || []) n.add(m);
  return n;
}

function ruta(mapa, guiones, lote) {
  const porQue = modulosDelLote(mapa, lote);
  const modulos = Object.keys(porQue).sort();
  const relaciones = relacionesDeRuta(mapa, modulos, lote.mapaLinea);
  const reglas = reglasDeRuta(mapa, modulos);
  const nodos = new Set([...modulos, ...relaciones.map((r) => r.id), ...reglas.map((r) => r.id)]);
  for (const r of (lote.req || '').split(/[\s,;·]+/).filter(Boolean)) nodos.add(r);
  const reg = normaliza(lote.regresionLinea).toLowerCase();
  const guionesCorren = [], casosCorren = [], noCorren = [];
  const cubierto = { relaciones: {}, reglas: {} };
  for (const g of guiones || []) {
    const casos = g.casos && g.casos.length ? g.casos : [{ c: '*', cubre: [] }];
    const corren = [];
    for (const c of casos) {
      const n = nodosDelCaso(g, c);
      const hit = [...n].filter((x) => nodos.has(x));
      const esPropio = g.req && lote.req && String(lote.req).includes(g.req);
      if (reg === 'ninguna' && !esPropio) continue;
      if (reg === 'todas' || esPropio || hit.length) {
        corren.push({ c: c.c, por: esPropio ? ['guion del lote'] : (reg === 'todas' ? ['Regresión: todas'] : hit) });
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
  return { modulos, porQue, relaciones, reglas, guionesCorren, casosCorren, noCorren, huecos, aDeclarar, reglasFabrica,
    resumen: `${modulos.length} módulos · ${relaciones.length} relaciones · ${reglas.length} reglas · corren ${guionesCorren.length} guiones (${casosCorren.length} casos) · no corren ${noCorren.length} · huecos: ${huecos.relaciones.length} relaciones, ${huecos.reglas.length} reglas` };
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
  const alcance = linea(/^Alcance:\s*/);
  const archivos = [];
  for (const m of alcance.matchAll(/`?([A-Za-z0-9_./\\-]+\.(?:js|php|html|json|md|ps1|css|sql))`?/g)) archivos.push(m[1]);
  for (const m of alcance.matchAll(/(?:^|[`\s(])((?:api|modelo|tests|herramientas)\/(?:[A-Za-z0-9_./-]*\/)?)(?=[`\s·,;)]|$)/g)) archivos.push(m[1]);
  const titulo = (lineas.find((x) => /^#\s*instr/i.test(x)) || '');
  const reqs = [...new Set([...(titulo.match(/(?:REQ|INC|DT|R)-[A-Z0-9][A-Z0-9.-]*/g) || []), ...((linea(/^Origen:.*?Requerimiento:\s*/) || '').match(/REQ-[A-Z0-9][A-Z0-9.-]*/g) || [])])];
  return { archivos: [...new Set(archivos)], mapaLinea: linea(/^Mapa:[^:]*:\s*/) || linea(/^Mapa:\s*/), regresionLinea: linea(/^Regresi[oó]n:\s*/), req: reqs.join(' ') };
}

function markdown(r) {
  const L = [];
  L.push(`## Ruta de pruebas (mapa.py --ruta) · ${r.resumen}`);
  L.push(`- Módulos: ${r.modulos.map((m) => `**${m}** (${[...new Set(r.porQue[m])].join('; ')})`).join(' · ') || 'ninguno: revisa Alcance y «Mapa:»'}`);
  L.push(`- Relaciones por las que pasa: ${r.relaciones.map((x) => `${x.id} ${x.origen}→${x.destino}`).join(', ') || '—'}`);
  L.push(`- Reglas que cruza: ${r.reglas.filter((x) => x.prueba !== 'proceso').map((x) => x.id).join(', ') || '—'} (de proceso, las garantiza la fábrica: ${r.reglasFabrica.join(', ') || '—'})`);
  L.push(`- Corren (regresión por ruta): ${r.guionesCorren.map((g) => `${g.archivo.replace('.spec.js', '')} (${g.casos}/${g.de})`).join(', ') || '—'}`);
  L.push(`- No corren: ${r.noCorren.length} guiones fuera de la ruta`);
  L.push(`- Huecos (nadie pasa; el guion del lote los cubre con un caso con \`cubre\`): relaciones ${r.huecos.relaciones.map((x) => `${x.id} (${x.origen}→${x.destino})`).join(', ') || 'ninguna'}; reglas ${r.huecos.reglas.map((x) => `${x.id} ${x.titulo}`).join(', ') || 'ninguna'} — un caso negativo por regla (quien no puede, intenta)`);
  L.push(`- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en \`cubre\`): ${r.aDeclarar.join(', ') || 'ninguna'}`);
  return L.join('\n');
}

module.exports = { ruta, cobertura, leerCabecera, markdown, modulosDelLote, relacionesDeRuta, reglasDeRuta, nodosDelCaso };

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
