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
// v0.5.3: page.request (APIRequestContext) no pasa por ctx.route; esta envoltura desvía igual sus URL a la fábrica.
// La usan guion.js en h.page. Todo lo demás de la página se usa tal cual.
const METODOS_REQUEST = ['get', 'post', 'put', 'patch', 'delete', 'head', 'fetch'];
function conDesvio(page) {
  let req = null;
  return new Proxy(page, {
    get(t, k) {
      if (k === 'request') {
        if (!req) req = new Proxy(t.request, { get(rt, rk) {
          const v = rt[rk];
          if (METODOS_REQUEST.includes(rk) && typeof v === 'function') return (url, ...resto) => v.call(rt, typeof url === 'string' ? (destinoModelo(url) || url) : url, ...resto);
          return typeof v === 'function' ? v.bind(rt) : v;
        } });
        return req;
      }
      const v = t[k];
      return typeof v === 'function' ? v.bind(t) : v;
    },
  });
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
// v0.5.6 (LM-35, ajuste de Diseño M-359): ids de filas zz-verif- que esta corrida LEYÓ (semilla fija: artículos, zonas,
// lugares). Solo sirven como referencia de un movimiento de turno zz; nunca habilitan un borrado.
const ID_ZZ_LEIDOS = new Set();
function registrarLeidos(texto, leidos = ID_ZZ_LEIDOS) {
  let j = null; try { j = JSON.parse(texto); } catch (e) { return 0; }
  let n = 0;
  (function rec(o) {
    if (Array.isArray(o)) { o.forEach(rec); return; }
    if (!o || typeof o !== 'object') return;
    if (o.id != null && JSON.stringify(o).includes('zz-verif-')) { leidos.add(String(o.id)); n++; }
    Object.values(o).forEach(v => { if (v && typeof v === 'object') rec(v); });
  })(j);
  return n;
}
// v0.5.12: la ampliación v5 de LM-35 (pendienteId de un pendiente zz; proveedor y juego también zz) queda APAGADA
// hasta el nuevo cruce de Carlos (M-385). Con v5 = false la guardia decide igual que la instalada (v0.5.6 + M-359).
// Se enciende cambiando esta línea a true (un commit, reinstalar comun.js); guardia.test.js prueba las dos.
const GUARDIA = { v5: false };
const REF_INVENTARIO_V41 = /(articulo|deposito|zona|origen|destino|lugar|ubicacion)/i;
const REF_INVENTARIO = /(articulo|deposito|zona|origen|destino|lugar|ubicacion|proveedor|juego)/i;   // v0.5.10 (M-384): proveedor y juego
function decidir(url, metodo, cuerpo, idsZz = ID_ZZ, idsLeidos = ID_ZZ_LEIDOS) {
  let u;
  try { u = new URL(url); } catch (e) { return { ok: false, motivo: 'url invalida' }; }
  if (u.protocol === 'data:' || u.protocol === 'blob:') return { ok: true };
  if (HOSTS_SOLO_LECTURA.includes(u.hostname)) return LECTURA.includes(String(metodo).toUpperCase()) ? { ok: true } : { ok: false, motivo: 'escritura a ' + u.hostname + ' (solo lectura)' };
  if (!HOSTS_OK.includes(u.hostname)) return { ok: false, motivo: 'host fuera de la lista: ' + u.hostname };
  if (LECTURA.includes(String(metodo).toUpperCase())) return { ok: true };
  if (u.hostname !== HOST_STR && u.hostname !== HOST_MODELO) return { ok: true, nota: 'servicio de Google (identidad o lectura)' };
  // v0.5.12 (M-390): cada escritura que pasa lleva su porqué en nota (queda en la bitácora y en «escrituras» del caso)
  if (ESCRITURA_PERMITIDA.some(r => r.test(u.pathname))) return { ok: true, nota: 'ruta de eco permitida' };
  if (SONDEO_SIN_TOKEN.some(r => r.test(u.pathname))) return String(cuerpo || '').trim() === '{}' ? { ok: true, nota: 'sondeo sin datos ({})' } : { ok: false, motivo: 'carga del modelo con datos: solo el Arquitecto por la cola' };
  if (u.hostname === HOST_MODELO) return { ok: false, motivo: 'escritura a la fábrica: solo el Arquitecto por la cola' };
  // v0.4.1: en /api/col/<coleccion> cada item debe ser zz-verif- y no se borra nada: una subida de la coleccion
  // entera que solo incluya una fila de prueba arrastraria datos reales (y podria pisarlos con una copia vieja).
  if (/^\/api\/col(\/|$)/.test(u.pathname)) {
    let j = null; try { j = JSON.parse(cuerpo || ''); } catch (e) { }
    if (!j || !Array.isArray(j.items)) return { ok: false, motivo: 'escritura a ' + u.pathname + ' sin cuerpo legible' };
    const borra = Array.isArray(j.deleted) ? j.deleted.map(String) : [];
    if (borra.some(id => !idsZz.has(id))) return { ok: false, motivo: 'borrado de un id que esta corrida no creo como zz-verif- en ' + u.pathname };
    if (!j.items.length) return borra.length ? { ok: true, nota: 'borrado de ' + borra.length + ' id(s) zz-verif- de la corrida' } : { ok: false, motivo: 'escritura vacia a ' + u.pathname };
    // v0.5.6 (LM-35, M-357): una fila sin el texto zz-verif- también es de prueba si cuelga de un turno que esta corrida
    // creó como zz-verif- (p. ej. inv-movimientos con turnoId sh-m-… de zz-verif-Propiedad)
    // y además todo lo que nombra (artículo, zona, lugar, origen, destino) es zz-verif- (subido o leído en esta corrida):
    // un movimiento de un turno zz sobre un artículo real movería inventario de Carlos (R11)
    const refsZz = it => {
      let ok = true;
      (function rec(o) {
        if (!ok || !o || typeof o !== 'object') return;
        for (const [k, v] of Object.entries(o)) {
          if (v && typeof v === 'object') { rec(v); continue; }
          if (k === 'turnoId' || k === 'pendienteId' || k === 'id' || !(GUARDIA.v5 ? REF_INVENTARIO : REF_INVENTARIO_V41).test(k) || v == null || v === '') continue;
          if (String(v).includes('zz-verif-')) continue;   // nombre de una fila de prueba (articuloNombre, zonaNombre…)
          if (!idsZz.has(String(v)) && !idsLeidos.has(String(v))) { ok = false; return; }
        }
      })(it);
      return ok;
    };
    // v0.5.10 (M-384, L-103): también cuelga de prueba si su pendienteId es un pendiente zz-verif- de esta corrida
    const deTurnoZz = it => {
      if (!GUARDIA.v5) { const t = it && ((it.data && it.data.turnoId) || it.turnoId); return t != null && idsZz.has(String(t)) && refsZz(it); }   // v0.5.6 + M-359
      const d = (it && it.data) || {};
      const padre = [d.turnoId, it && it.turnoId, d.pendienteId, it && it.pendienteId].find(v => v != null && idsZz.has(String(v)));
      return padre != null && refsZz(it);
    };
    const conTexto = j.items.filter(it => JSON.stringify(it).includes('zz-verif-'));
    const reales = j.items.filter(it => !JSON.stringify(it).includes('zz-verif-') && !deTurnoZz(it));
    if (reales.length) return { ok: false, motivo: reales.length + ' fila(s) sin zz-verif- en ' + u.pathname };
    j.items.forEach(it => { if (it && it.id != null) idsZz.add(String(it.id)); });
    const deTurno = j.items.length - conTexto.length;
    return { ok: true, nota: [conTexto.length ? conTexto.length + ' fila(s) con zz-verif-' : '', deTurno ? deTurno + ' fila(s) de un turno o pendiente zz de la corrida, con referencias zz' : '', borra.length ? borra.length + ' borrado(s) zz de la corrida' : ''].filter(Boolean).join(' + ') };
  }
  // v0.5.6 (LM-35, M-357): la foto de HK sube por POST /api/upload (multipart) con ref = id del turno; pasa solo si ese
  // turno lo creó esta corrida como zz-verif-
  if (u.pathname === '/api/upload') {
    const m = /name="ref"\r?\n\r?\n([^\r\n]+)/.exec(String(cuerpo || ''));
    if (m && idsZz.has(m[1].trim())) return { ok: true, nota: 'foto con ref de un turno zz de la corrida' };
    return { ok: false, motivo: 'subida de archivo sin turno zz-verif- de esta corrida' };
  }
  if (String(cuerpo || '').includes('zz-verif-') || u.href.includes('zz-verif-')) return { ok: true, nota: 'zz-verif- en ' + (String(cuerpo || '').includes('zz-verif-') ? 'el cuerpo' : 'la url') };
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
  // v0.5.6 (LM-35): ids de filas zz-verif- que la app lee de /api/col (semilla fija), para validar referencias de movimientos
  ctx.on('response', async (resp) => {
    try {
      const u = new URL(resp.url());
      if (u.hostname === HOST_STR && /^\/api\/col(\/|$)/.test(u.pathname) && resp.request().method() === 'GET' && resp.ok()) registrarLeidos(await resp.text());
    } catch (e) { }
  });
  await ctx.route('**/*', async (route) => {
    const r = route.request();
    if (guardia) {
      let cuerpo = null; try { cuerpo = r.postData(); } catch (e) { }
      if (cuerpo == null) { try { const b = r.postDataBuffer(); if (b) cuerpo = b.toString('latin1'); } catch (e) { } }   // v0.5.6: multipart
      const d = decidir(r.url(), r.method(), cuerpo);
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

module.exports = { COLA, BASE, BASE_MODELO, destinoModelo, conDesvio, PERFILES, HOSTS_OK, HOSTS_SOLO_LECTURA, GUARDIA, decidir, registrarLeidos, ID_ZZ_LEIDOS, abrir, dirPerfil, argsCamara, explicarError };
