// comun.js - verificador local (Playwright) del STR (B10-1, LM-17; lo mantiene el Arquitecto).
// Perfiles persistentes de prueba en pw\perfiles-chrome\<usuario>\ (cookies del STR); nunca el perfil de Carlos.
// v0.2 (12-oct): usa el Chrome instalado (channel 'chrome'), no el Chromium de Playwright: Google no deja iniciar sesion
// en un navegador automatizado, asi que el inicio de sesion se hace en Chrome normal (abrir-perfil.js) y Playwright
// reutiliza ese mismo perfil despues, ya con la sesion del STR.
// Guardia de red: el navegador solo habla con la lista de hosts; toda escritura al STR sin 'zz-verif-' se corta
// (v0.4.1: con respuesta 409, para que la app no la reintente).
// v0.5.3 (M8 de la migración, M-320/M-321): el servicio del modelo vive en fabrica. (BASE_MODELO). Las páginas siguen
// en app. (sesión y base del STR), y el navegador desvía app./modelo/* a fabrica. (destinoModelo): los guiones no cambian.
// Las reglas de la guardia se aplican a la URL original (en el modelo solo eco y los sondeos sin token con «{}»).
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const COLA = path.resolve(__dirname, '..');
const HOST_STR = 'app.apartamentosbucaramanga.com';
const HOST_MODELO = 'fabrica.apartamentosbucaramanga.com';
const BASE = 'https://' + HOST_STR;
const BASE_MODELO = 'https://' + HOST_MODELO;
// Puro: URL a la que va de verdad una petición del navegador (app./modelo/* → fabrica.), o null si no se desvía.
function destinoModelo(url) {
  let u; try { u = new URL(url); } catch (e) { return null; }
  if (u.hostname !== HOST_STR || !/^\/modelo(\/|$)/.test(u.pathname)) return null;
  u.hostname = HOST_MODELO; return u.href;
}
const PERFILES = { admin: 'zz-verif-admin', oper: 'zz-verif-oper', colab: 'zz-verif-colab', colab2: 'zz-verif-colab2' };
const HOSTS_OK = [HOST_STR, HOST_MODELO, 'securetoken.googleapis.com', 'identitytoolkit.googleapis.com',
  'firestore.googleapis.com', 'www.googleapis.com', 'apis.google.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const LECTURA = ['GET', 'HEAD', 'OPTIONS'];
// v0.4.3 (INC-119): el grupo Proyecto lee str-manager-docs de GitHub (raw y la API de commits). Solo lectura.
const HOSTS_SOLO_LECTURA = ['raw.githubusercontent.com', 'api.github.com'];
const ESCRITURA_PERMITIDA = [/^\/modelo\/api\/eco$/];
// v0.4.5 (LM-20): sondeo sin token a /modelo/api/cargar, solo con cuerpo vacío «{}» (espera 403).
// v0.5.0 (LM-27b): también /modelo/api/credenciales, con las mismas condiciones.
const SONDEO_SIN_TOKEN = [/^\/modelo\/api\/cargar$/, /^\/modelo\/api\/credenciales$/];

// v0.4.2 (N2 con camara simulada): true = video sintetico de Chrome; '<ruta>.y4m' = ese video (p. ej. un QR).
// Sin dialogo de permiso: --use-fake-ui-for-media-stream lo acepta solo.
function argsCamara(camara) {
  if (!camara) return [];
  const a = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'];
  if (typeof camara === 'string') a.push('--use-file-for-fake-video-capture=' + path.resolve(camara));
  return a;
}

function dirPerfil(u) { return path.join(__dirname, 'perfiles-chrome', u); }

// Funcion pura (test en guardia.test.js): ¿se deja pasar esta peticion?
// idsZz: ids de filas zz-verif- que esta misma corrida ya subio; solo esas se pueden borrar por id (limpiar()).
const ID_ZZ = new Set();
function decidir(url, metodo, cuerpo, idsZz = ID_ZZ) {
  let u;
  try { u = new URL(url); } catch (e) { return { ok: false, motivo: 'url invalida' }; }
  if (u.protocol === 'data:' || u.protocol === 'blob:') return { ok: true };
  if (HOSTS_SOLO_LECTURA.includes(u.hostname)) return LECTURA.includes(String(metodo).toUpperCase()) ? { ok: true } : { ok: false, motivo: 'escritura a ' + u.hostname + ' (solo lectura)' };
  if (!HOSTS_OK.includes(u.hostname)) return { ok: false, motivo: 'host fuera de la lista: ' + u.hostname };
  if (LECTURA.includes(String(metodo).toUpperCase())) return { ok: true };
  if (u.hostname !== HOST_STR && u.hostname !== HOST_MODELO) return { ok: true, nota: 'servicio de Google (identidad o lectura)' };
  if (ESCRITURA_PERMITIDA.some(r => r.test(u.pathname))) return { ok: true };
  if (SONDEO_SIN_TOKEN.some(r => r.test(u.pathname))) return String(cuerpo || '').trim() === '{}' ? { ok: true } : { ok: false, motivo: 'carga del modelo con datos: solo el Arquitecto por la cola' };
  if (u.hostname === HOST_MODELO) return { ok: false, motivo: 'escritura a la fábrica: solo el Arquitecto por la cola' };
  // v0.4.1: en /api/col/<coleccion> cada item debe ser zz-verif- y no se borra nada: una subida de la coleccion
  // entera que solo incluya una fila de prueba arrastraria datos reales (y podria pisarlos con una copia vieja).
  if (/^\/api\/col(\/|$)/.test(u.pathname)) {
    let j = null; try { j = JSON.parse(cuerpo || ''); } catch (e) { }
    if (!j || !Array.isArray(j.items)) return { ok: false, motivo: 'escritura a ' + u.pathname + ' sin cuerpo legible' };
    const borra = Array.isArray(j.deleted) ? j.deleted.map(String) : [];
    if (borra.some(id => !idsZz.has(id))) return { ok: false, motivo: 'borrado de un id que esta corrida no creo como zz-verif- en ' + u.pathname };
    if (!j.items.length) return borra.length ? { ok: true } : { ok: false, motivo: 'escritura vacia a ' + u.pathname };
    const reales = j.items.filter(it => !JSON.stringify(it).includes('zz-verif-'));
    if (reales.length) return { ok: false, motivo: reales.length + ' fila(s) sin zz-verif- en ' + u.pathname };
    j.items.forEach(it => { if (it && it.id != null) idsZz.add(String(it.id)); });
    return { ok: true };
  }
  if (String(cuerpo || '').includes('zz-verif-') || u.href.includes('zz-verif-')) return { ok: true };
  return { ok: false, motivo: 'escritura sin zz-verif- a ' + u.pathname };
}

// Abre el perfil persistente de un usuario de prueba. opciones: { headless, viewport, guardia }
// v0.4.7 (M-273): Chrome sale con exitCode 21 cuando otra ventana tiene abierto el mismo perfil (user-data-dir).
function explicarError(e, perfil) {
  const m = String((e && e.message) || e || '');
  if (/exitCode=21\b|exit code 21\b|code:? 21\b/i.test(m)) return 'perfil en uso: cierra la ventana de Chrome del perfil de prueba ' + perfil + ' (la que abrio abrir-perfil.js) y repite';
  return m.split('\n')[0].slice(0, 300);
}

async function abrir(usuario, opciones = {}) {
  if (!PERFILES[usuario]) throw new Error('usuario de prueba desconocido: ' + usuario);
  const ctx = await chromium.launchPersistentContext(dirPerfil(usuario), {
    channel: 'chrome',
    headless: opciones.headless !== false && !process.env.PW_VISIBLE,   // PW_VISIBLE=1 muestra la ventana (diagnostico)
    viewport: opciones.viewport || { width: 1366, height: 900 },
    args: argsCamara(opciones.camara),
  });
  if (opciones.camara) { try { await ctx.grantPermissions(['camera'], { origin: BASE }); } catch (e) { } }
  const bitacora = [];
  const guardia = opciones.guardia !== false;
  await ctx.route('**/*', async (route) => {
    const r = route.request();
    if (guardia) {
      const d = decidir(r.url(), r.method(), r.postData());
      if (!LECTURA.includes(r.method()) || !d.ok) bitacora.push({ metodo: r.method(), url: r.url().split('?')[0].slice(0, 200), paso: d.ok, motivo: d.motivo || d.nota || '' });
      if (!d.ok) {
        // v0.4.1: al STR se le responde 409 en vez de cortar la conexion. Asi str-api.js lo trata como rechazo del
        // servidor (no lo guarda en su cola de reintentos) y vacia los reintentos que ya tuviera guardados.
        if ([HOST_STR, HOST_MODELO].includes(new URL(r.url()).hostname)) return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'guardia del verificador: escritura sin zz-verif- cortada' }) });
        return route.abort('blockedbyclient');
      }
    }
    // v0.5.3: el modelo se pide a la fábrica; la página cree que respondió app. (sin CORS ni cambio en los guiones)
    const otro = destinoModelo(r.url());
    if (otro) {
      try { const resp = await route.fetch({ url: otro }); return route.fulfill({ response: resp }); }
      catch (e) { bitacora.push({ metodo: r.method(), url: otro.split('?')[0].slice(0, 200), paso: false, motivo: 'fabrica sin respuesta: ' + String(e.message || e).split('\n')[0] }); return route.abort('failed'); }
    }
    return route.continue();
  });
  return { ctx, bitacora };
}

module.exports = { COLA, BASE, BASE_MODELO, destinoModelo, PERFILES, HOSTS_OK, HOSTS_SOLO_LECTURA, decidir, abrir, dirPerfil, argsCamara, explicarError };
