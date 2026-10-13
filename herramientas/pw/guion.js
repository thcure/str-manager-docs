// guion.js - corre guiones N2 (tests/e2e/*.spec.js del repo str-manager) con el verificador local (PRUEBAS-v1, LM-18).
// Lo mantiene el Arquitecto. Los guiones los escribe el Chat Desarrollo; la CLI los copia tal cual al repo.
//
// Contrato de un guion (plantilla: str-manager-docs/herramientas/plantillas/guion-e2e.js):
//   module.exports = { req: 'REQ-X-n', zona: '<area>', casos: [ { c: 'a', perfil: 'admin|oper|colab|colab2',
//     pagina: '/str-<pagina>.html', que: '<criterio>', async prueba(h) { ... } } ], async limpiar(h) { ... } }
//   h = { page, BASE, lote, espera(condicion, observado), dato(nombre), respuesta(fragmentoRuta, accion) }
//
// Uso manual:  node guion.js <ruta\al\archivo.spec.js> [--lote L-n]      (escribe log\<lote>-guion.json)
'use strict';
const fs = require('fs');
const path = require('path');
const { abrir, BASE, COLA, PERFILES } = require('./comun');

const MARCA = /^###\s*Guion N2\s*(?:→|->)\s*`(tests\/e2e\/[A-Za-z0-9._-]+\.spec\.js)`/;

// Puro: saca de la instruccion el bloque del guion N2. Devuelve { ruta, codigo } o null.
function extraerGuion(texto) {
  const lineas = String(texto).replace(/\r\n/g, '\n').split('\n');
  for (let i = 0; i < lineas.length; i++) {
    const m = lineas[i].match(MARCA);
    if (!m) continue;
    let j = i + 1;
    while (j < lineas.length && lineas[j].trim() === '') j++;
    if (j >= lineas.length || !/^```(js|javascript)\s*$/.test(lineas[j].trim())) return { ruta: m[1], codigo: null, error: 'falta el bloque ```js tras la marca' };
    const ini = j + 1;
    let fin = ini;
    while (fin < lineas.length && lineas[fin].trim() !== '```') fin++;
    if (fin >= lineas.length) return { ruta: m[1], codigo: null, error: 'el bloque ```js no se cierra' };
    return { ruta: m[1], codigo: lineas.slice(ini, fin).join('\n') + '\n' };
  }
  return null;
}

// Puro: misma copia salvo finales de linea y salto final.
function normalizar(s) { return String(s).replace(/\r\n/g, '\n').replace(/\s+$/, '') + '\n'; }
function igual(a, b) { return normalizar(a) === normalizar(b); }

// Puro: id de lote desde el nombre del archivo de la cola (L-80-instr-x.md o 80-instr-x.md).
function loteDe(nombre) { const m = String(nombre).split(/[\\/]/).pop().match(/^(?:L-)?(\d+)-/); return m ? 'L-' + m[1] : null; }

// Puro: decide el resultado de un caso.
function cerrarCaso(caso, esperas, error, bloqueos) {
  const fallan = esperas.filter(e => !e.ok);
  const ok = !error && fallan.length === 0 && bloqueos.length === 0 && esperas.length > 0;
  const partes = esperas.map(e => (e.ok ? 'si: ' : 'NO: ') + e.observado);
  if (!esperas.length && !error) partes.push('el caso no comprobo nada (sin h.espera)');
  if (error) partes.push('error: ' + error);
  if (bloqueos.length) partes.push('la guardia corto ' + bloqueos.length + ' escritura(s): ' + bloqueos.map(b => b.metodo + ' ' + b.url).join(', '));
  return { c: caso.c, nivel: 'N2', perfil: caso.perfil, pagina: caso.pagina, que: caso.que || '', ok, observado: partes.join(' | ').slice(0, 900) };
}

// Corre un guion ya cargado. Abre un perfil a la vez (los perfiles persistentes no se abren dos veces).
async function correrGuion(spec, opciones = {}) {
  const lote = opciones.lote || 'L-0';
  const prefijo = opciones.prefijo || ('zz-verif-' + lote + '-');
  const resultados = [];
  const casos = (spec && Array.isArray(spec.casos)) ? spec.casos : [];
  const porPerfil = {};
  for (const c of casos) (porPerfil[c.perfil] = porPerfil[c.perfil] || []).push(c);
  for (const perfil of Object.keys(porPerfil)) {
    if (!PERFILES[perfil]) { porPerfil[perfil].forEach(c => resultados.push({ c: c.c, nivel: 'N2', perfil, ok: false, observado: 'perfil desconocido: ' + perfil })); continue; }
    let ctx, a;
    try {
      a = await abrir(perfil, { headless: opciones.headless });
      ctx = a.ctx;
      for (const caso of porPerfil[perfil]) {
        const esperas = []; let error = null; const marca = a.bitacora.length;
        const page = await ctx.newPage();
        const h = {
          page, BASE, lote,
          espera(cond, observado) { esperas.push({ ok: !!cond, observado: String(observado || '') }); return !!cond; },
          dato(nombre) { return prefijo + nombre; },
          respuesta(fragmento, accion) {
            const p = page.waitForResponse(r => r.url().includes(fragmento), { timeout: 30000 });
            return accion ? Promise.all([p, accion()]).then(x => x[0]) : p;
          },
        };
        try {
          await page.goto(BASE + caso.pagina, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await Promise.race([caso.prueba(h), new Promise((_, no) => setTimeout(() => no(new Error('el caso paso de 90 s')), 90000))]);
        } catch (e) { error = (e && e.message ? e.message : String(e)).split('\n')[0]; }
        const bloqueos = a.bitacora.slice(marca).filter(b => !b.paso);
        resultados.push(cerrarCaso(caso, esperas, error, bloqueos));
        await page.close().catch(() => { });
      }
    } catch (e) {
      porPerfil[perfil].forEach(c => resultados.push({ c: c.c, nivel: 'N2', perfil, ok: false, observado: 'no se pudo abrir el perfil: ' + e.message }));
    } finally { if (ctx) await ctx.close().catch(() => { }); }
  }
  // limpieza de los datos del lote (se intenta siempre; lo que quede se lista)
  let limpieza = 'sin limpiar() en el guion';
  if (spec && typeof spec.limpiar === 'function') {
    let ctx;
    try {
      const a = await abrir('admin', { headless: opciones.headless }); ctx = a.ctx;
      const page = await ctx.newPage();
      await page.goto(BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' });
      await spec.limpiar({ page, BASE, lote, dato: n => prefijo + n });
      limpieza = 'limpiar() corrio sin error';
    } catch (e) { limpieza = 'limpiar() fallo: ' + e.message + ' (borrar a mano lo que empiece por ' + prefijo + ')'; }
    finally { if (ctx) await ctx.close().catch(() => { }); }
  }
  return { req: spec && spec.req, zona: spec && spec.zona, casos: resultados, limpieza };
}

function cargar(ruta) { delete require.cache[require.resolve(ruta)]; return require(ruta); }

module.exports = { extraerGuion, normalizar, igual, loteDe, cerrarCaso, correrGuion, cargar, MARCA };

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    const archivo = args.find(x => !x.startsWith('--'));
    const iL = args.indexOf('--lote'); const lote = iL >= 0 ? args[iL + 1] : 'L-0';
    if (!archivo) { console.log('Uso: node guion.js <archivo.spec.js> [--lote L-n]'); process.exit(2); }
    const r = await correrGuion(cargar(path.resolve(archivo)), { lote });
    r.casos.forEach(x => console.log((x.ok ? 'OK  ' : 'NO  ') + x.c + ' · ' + x.observado));
    fs.writeFileSync(path.join(COLA, 'log', lote + '-guion.json'), JSON.stringify(r, null, 1));
    process.exit(r.casos.every(x => x.ok) ? 0 : 1);
  })();
}
