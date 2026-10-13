// guion.js - corre guiones N2 (tests/e2e/*.spec.js del repo str-manager) con el verificador local (PRUEBAS-v1, LM-18).
// Lo mantiene el Arquitecto. Los guiones los escribe el Chat Desarrollo; la CLI los copia tal cual al repo.
//
// Contrato de un guion (plantilla: str-manager-docs/herramientas/plantillas/guion-e2e.js):
//   module.exports = { req: 'REQ-X-n', zona: '<area>', casos: [ { c: 'a', perfil: 'admin|oper|colab|colab2',
//     pagina: '/str-<pagina>.html', que: '<criterio>', async prueba(h) { ... } } ], async limpiar(h) { ... } }
//   h = { page, BASE, lote, espera(condicion, observado), dato(nombre), respuesta(fragmentoRuta, accion), captura(nombre, {ancho}) }
//   camara: true (video sintetico) o 'fixtures/qr.y4m' (relativo al guion) en el caso -> Chrome con camara simulada (N2).
//   Caso N3 (LM-19): nivel: 'N3' prepara la pantalla y llama h.captura(); no lo juzga el guion: queda ok=null para el juez local.
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

// Puro: decide el resultado de un caso. N2: ok true/false. N3 (LM-19): ok null si quedo preparado (capturas
// y sin fallos) para que lo juzgue el juez local; false si no se pudo preparar.
function cerrarCaso(caso, esperas, error, bloqueos, capturas = []) {
  const n3 = caso.nivel === 'N3';
  const fallan = esperas.filter(e => !e.ok);
  const partes = esperas.map(e => (e.ok ? 'si: ' : 'NO: ') + e.observado);
  if (!n3 && !esperas.length && !error) partes.push('el caso no comprobo nada (sin h.espera)');
  if (n3 && !capturas.length && !error) partes.push('el caso N3 no guardo ninguna captura (sin h.captura)');
  if (error) partes.push('error: ' + error);
  // v0.4.1: una escritura cortada es aviso, no fallo: la guardia ya la impidio y la app hace escrituras de fondo
  // (reintentos, colecciones enteras) que no son del caso. Queda en avisos para que Desarrollo y el juez la vean.
  if (bloqueos.length) partes.push('aviso: la guardia corto ' + bloqueos.length + ' escritura(s) sin zz-verif-: ' + [...new Set(bloqueos.map(b => b.metodo + ' ' + b.url))].join(', '));
  const limpio = !error && fallan.length === 0;
  let ok;
  if (n3) { ok = limpio && capturas.length > 0 ? null : false; if (ok === null) partes.push('preparado para el juez: ' + capturas.length + ' captura(s)'); }
  else ok = limpio && esperas.length > 0;
  const r = { c: caso.c, nivel: n3 ? 'N3' : 'N2', perfil: caso.perfil, pagina: caso.pagina, que: caso.que || '', ok, observado: partes.join(' | ').slice(0, 900) };
  if (bloqueos.length) r.escriturasCortadas = bloqueos.length;
  if (n3) r.capturas = capturas;
  return r;
}

// Corre un guion ya cargado. Abre un perfil a la vez (los perfiles persistentes no se abren dos veces).
async function correrGuion(spec, opciones = {}) {
  const lote = opciones.lote || 'L-0';
  const prefijo = opciones.prefijo || ('zz-verif-' + lote + '-');
  const resultados = [];
  const casos = (spec && Array.isArray(spec.casos)) ? spec.casos : [];
  // Grupos por perfil y camara, en el orden en que aparecen (un perfil persistente no se abre dos veces a la vez).
  const porPerfil = {};
  for (const c of casos) { const k = c.perfil + (c.camara ? '|camara:' + c.camara : ''); (porPerfil[k] = porPerfil[k] || []).push(c); }
  for (const clave of Object.keys(porPerfil)) {
    const perfil = clave.split('|')[0];
    const camara = porPerfil[clave][0].camara || null;
    if (!PERFILES[perfil]) { porPerfil[clave].forEach(c => resultados.push({ c: c.c, nivel: c.nivel === 'N3' ? 'N3' : 'N2', perfil, ok: false, observado: 'perfil desconocido: ' + perfil })); continue; }
    let ctx, a;
    try {
      a = await abrir(perfil, { headless: opciones.headless, camara: camara === true || camara === 'si' ? true : (camara ? path.resolve(opciones.dirGuion || process.cwd(), camara) : null) });
      ctx = a.ctx;
      for (const caso of porPerfil[clave]) {
        const esperas = []; const capturas = []; let error = null; const marca = a.bitacora.length;
        const page = await ctx.newPage();
        const dirCapt = path.join(COLA, 'log', 'capturas', lote);
        const h = {
          page, BASE, lote,
          espera(cond, observado) { esperas.push({ ok: !!cond, observado: String(observado || '') }); return !!cond; },
          dato(nombre) { return prefijo + nombre; },
          respuesta(fragmento, accion) {
            const p = page.waitForResponse(r => r.url().includes(fragmento), { timeout: 30000 });
            return accion ? Promise.all([p, accion()]).then(x => x[0]) : p;
          },
          // LM-19: guarda la pantalla y su texto visible para el juez local (solo en LENOVO; nunca al repo)
          async captura(nombre, op = {}) {
            fs.mkdirSync(dirCapt, { recursive: true });
            if (op.ancho) await page.setViewportSize({ width: op.ancho, height: op.alto || 900 });
            await page.waitForTimeout(op.esperaMs || 600);
            const base = String(caso.c) + '-' + String(nombre).replace(/[^A-Za-z0-9_-]/g, '_');
            const png = path.join(dirCapt, base + '.png');
            await page.screenshot({ path: png, fullPage: op.completa !== false });
            let texto = ''; try { texto = (await page.innerText('body')).slice(0, 6000); } catch (e) { }
            fs.writeFileSync(path.join(dirCapt, base + '.txt'), texto);
            capturas.push({ nombre, png: path.relative(COLA, png), ancho: page.viewportSize().width });
            return png;
          },
        };
        try {
          await page.goto(BASE + caso.pagina, { waitUntil: 'domcontentloaded', timeout: 45000 });
          await Promise.race([caso.prueba(h), new Promise((_, no) => setTimeout(() => no(new Error('el caso paso de 90 s')), 90000))]);
        } catch (e) { error = (e && e.message ? e.message : String(e)).split('\n')[0]; }
        const bloqueos = a.bitacora.slice(marca).filter(b => !b.paso);
        resultados.push(cerrarCaso(caso, esperas, error, bloqueos, capturas));
        await page.close().catch(() => { });
      }
    } catch (e) {
      porPerfil[clave].forEach(c => resultados.push({ c: c.c, nivel: c.nivel === 'N3' ? 'N3' : 'N2', perfil, ok: false, observado: 'no se pudo abrir el perfil: ' + e.message }));
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
    const r = await correrGuion(cargar(path.resolve(archivo)), { lote, dirGuion: path.dirname(path.resolve(archivo)) });
    r.casos.forEach(x => console.log((x.ok ? 'OK  ' : x.ok === null ? 'N3  ' : 'NO  ') + x.c + ' · ' + x.observado));
    fs.writeFileSync(path.join(COLA, 'log', lote + '-guion.json'), JSON.stringify(r, null, 1));
    process.exit(r.casos.every(x => x.ok !== false) ? 0 : 1);
  })();
}
