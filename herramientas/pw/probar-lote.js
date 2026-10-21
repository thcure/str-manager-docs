// probar-lote.js - pasos P4 (puerta de entrada) y P5 (N1 + N2 + regresion) de PRUEBAS-v1 (LM-18). Lo lanza la cola v6
// despues del commit y push de un lote; tambien se puede correr a mano. Lo mantiene el Arquitecto.
// No juzga N3 ni escribe el veredicto: deja log\<lote>-pruebas.json para el verificador (que juzga) y el Chat Desarrollo.
// Uso: node probar-lote.js --instr <hechas\L-n-instr-x.md> [--repo C:\Users\ktcol\str-manager] [--sin-espera]
// v0.6.0 (LM-39b, MJ-2): la regresion la elige la RUTA del lote (pw\ruta.js + pw\mapa-modulos.json, copiados de
// str-manager-docs por el Arquitecto): modulos tocados (archivos del Alcance, linea «Mapa:», REQ) → corren los guiones con
// un caso cuyo `cubre` (o sus modulos) cae en la ruta, mas los centinelas (pw\centinelas.json) en lotes criticos o de capa
// comun. «Regresión:» explicita sigue mandando (zonas o ids de modulo; ninguna; todas). `zona` admite lista. Un lote de solo
// guiones o herramientas corre pw\humo-pw.spec.js y lo deja en n2 como caso «humo». Sin mapa o sin ruta.js: cae a la zona (v0.5.27).
// v0.6.1 (M-528, Desarrollo): al empezar cada corrida, las capturas de la corrida anterior del mismo lote se APARTAN a
// log\capturas\anterior\<lote>-<AAAAMMDD-HHMM>\ (no se borran: R11 y «no se borra, se desactiva»), para que el juez solo vea
// las de esta corrida y no los *-error.png de una reprueba vieja.
// v0.11.0 (LM-62, PRUEBAS-v2): pw\v2.js. V7 el riesgo del mapa ajusta la fase (alto → ruta completa en fase 1; bajo → humo y guion
// propio, todo al tren). V1 cuarentena con plazo (pw\cuarentena.json; INC abierto en seguimiento.json; vencida → la cola salta el caso).
// V2 un rojo repite el guion entero una vez (segundo intento manda; los que pasan quedan «inestables»). V10 P4 bloqueado por entorno o
// dos guiones seguidos fallando por el entorno → log\suspension.json y «bloqueado»; la corrida siguiente del mismo lote es «reanudación»
// (no cuenta como reprueba). El informe suma fase.riesgo, inestables[], cuarentena[] y cuarentenaEntradas.
// v0.12.1 (LM-73): commitMensaje y lineaLote («Lote: L-n · …», hook v5) en el informe, para el criterio de trazabilidad del juez.
// v0.12.0 (LM-63, CONSTRUCCIÓN-v1): pw\aplicar.js. P4.f «aplicación»: cada Busca/Pon y cada «Contenido completo» de la instrucción
// contra el commit (K1; diferencia → bloqueado salvo «No hecho» en el commit; «Versión:» por grep; schema_version en /api/health);
// P4.g «N1 literal»: el test de «Tests en tests/» igual byte a byte (K2); tamaño del lote en tres columnas (K3) en el informe.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { BASE, COLA, abrir, explicarError, recuperarSesion, recuperarConChrome } = require('./comun');   // v0.5.32: recuperarSesion
const { extraerGuion, igual, loteDe, correrGuion, cargar, horaBogota } = require('./guion');
const { comprobarSemilla } = require('./semilla');
const V2 = require('./v2');
const APL = require('./aplicar');   // v0.12.0 (LM-63, CONSTRUCCIÓN-v1): K1 aplicación literal, K2 N1 literal, K3 tamaño

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
    .filter(f => { try { return tieneZona(cargar(f), zona); } catch (e) { return false; } });
}
// v0.6.0: `zona` puede ser texto o lista de textos (ids de modulo o nombres de zona)
function tieneZona(spec, zona) { const z = spec && spec.zona; return Array.isArray(z) ? z.includes(zona) : z === zona; }

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
  fs.readdirSync(dirE2e).filter(f => f.endsWith('.spec.js')).forEach(f => { try { const s = cargar(path.join(dirE2e, f)); if (s && s.zona) (Array.isArray(s.zona) ? s.zona : [s.zona]).forEach(x => z.add(x)); } catch (e) { } });
  return [...z];
}

// v0.6.0 (LM-39b): seleccion de la regresion por la ruta del lote. Pura: recibe el texto de la instruccion, el guion del lote
// (o null), los guiones de tests/e2e ya cargados [{archivo, spec}], el mapa (o null) y los centinelas [{guion, inc, desde}].
//   → { modo, corren: [{archivo, por}], noCorren: [{archivo, porQue}], ruta, humo, motivo }
//   modo: 'declarada' («Regresión:» en la cabecera) | 'ruta' | 'zona' (sin mapa o sin ruta.js: como v0.5.27).
function cargarRuta() { try { return require('./ruta'); } catch (e) { return null; } }
function seleccionRegresion(texto, spec, guiones, mapa, centinelas = [], R = cargarRuta()) {
  const cab = String(texto).replace(/\r\n/g, '\n').split('\n').slice(0, 20).join('\n');
  const al = (cab.match(/^Alcance:.*$/m) || [''])[0];
  const critico = /^Categor[ií]a:.*cr[ií]tico/mi.test(cab);
  const conCentinelas = critico || TOCA_COMUN.test(al);
  const porArchivo = Object.fromEntries(guiones.map(g => [g.archivo, g]));
  const out = { modo: null, corren: [], noCorren: [], ruta: null, humo: false, motivo: '' };
  const meter = (archivo, por) => { const e = out.corren.find(x => x.archivo === archivo); if (e) { if (!e.por.includes(por)) e.por.push(por); } else out.corren.push({ archivo, por: [por] }); };
  const mods = (g) => (mapa && R ? R.modulosDeGuion(mapa, g.spec).modulos : []);
  const dec = cab.match(/^Regresi[oó]n:\s*(.+)$/mi);
  if (dec) {
    const v = dec[1].trim(); out.modo = 'declarada'; out.motivo = 'la instruccion declara «Regresión: ' + v + '»';
    if (/^todas\b/i.test(v)) guiones.forEach(g => meter(g.archivo, 'Regresión: todas'));
    else if (!/^ninguna\b/i.test(v)) {
      const toks = v.split(/[,;]| y /).map(x => x.trim().replace(/^zonas?\s+/i, '').replace(/^m[oó]dulos?\s+/i, '').replace(/[.`()]+$/, '').replace(/\s.*$/, '')).filter(Boolean);
      for (const g of guiones) for (const t of toks) if (tieneZona(g.spec, t) || mods(g).includes(t)) meter(g.archivo, 'Regresión: ' + t);
    }
  } else if (mapa && R) {
    const lote = R.leerCabecera(texto);
    if (spec && spec.req && !lote.req.includes(spec.req)) lote.req = (lote.req + ' ' + spec.req).trim();
    const gs = guiones.map(g => { const m = R.modulosDeGuion(mapa, g.spec); return { archivo: g.archivo, req: g.spec.req, zona: g.spec.zona, modulos: m.modulos, casos: (g.spec.casos || []).map(c => ({ c: c.c, cubre: c.cubre || [] })) }; });
    const r = R.ruta(mapa, gs, lote);
    out.modo = 'ruta'; out.ruta = { modulos: r.modulos, porQue: r.porQue, relaciones: r.relaciones.map(x => x.id), reglas: r.reglas.map(x => x.id), huecos: r.huecos, aDeclarar: r.aDeclarar, soloGuiones: !!r.soloGuiones, resumen: r.resumen };
    out.humo = !!r.soloGuiones;
    out.motivo = r.resumen;
    for (const g of r.guionesCorren) { const cc = r.casosCorren.filter(x => x.guion === g.archivo); meter(g.archivo, 'ruta: ' + [...new Set(cc.flatMap(x => x.por))].slice(0, 4).join(', ')); }
  } else {
    out.modo = 'zona'; const zr = zonasRegresion(texto, spec ? spec.zona : null, [...new Set(guiones.flatMap(g => Array.isArray(g.spec.zona) ? g.spec.zona : [g.spec.zona]).filter(Boolean))]);
    out.motivo = 'sin mapa-modulos.json o ruta.js en pw\\: ' + zr.motivo;
    for (const g of guiones) for (const z of zr.zonas) if (tieneZona(g.spec, z)) meter(g.archivo, 'zona ' + z);
  }
  if (conCentinelas && !(dec && /^ninguna\b/i.test(dec[1]))) for (const c of centinelas) if (porArchivo[c.guion]) meter(c.guion, 'centinela (' + (c.inc || 'INC') + ')');
  for (const g of guiones) if (!out.corren.some(x => x.archivo === g.archivo)) out.noCorren.push({ archivo: g.archivo, porQue: out.modo === 'ruta' ? 'ningun caso cubre un nodo de la ruta (' + mods(g).join(', ') + ')' : out.modo === 'declarada' ? 'fuera de lo declarado' : 'fuera de la zona' });
  return out;
}
// v0.7.0 (LM-49, cruce de Carlos 17-oct-2026): pruebas por fases. Fase 1 (frena el lote): N1, guion y N3 propios, humo y
// los centinelas que caen en la ruta. La regresión restante se DIFIERE al tren (pw\tren.js), que la corre una sola vez para
// varios lotes. Fase completa (regresión en el propio lote, como antes): críticos, capa común, migraciones, «Regresión:»
// declarada, o el archivo FASE-COMPLETA en la cola. Puras: faseDelLote, anotarTren.
function faseDelLote(texto, opciones = {}) {
  const cab = String(texto || '').replace(/\r\n/g, '\n').split('\n').slice(0, 20).join('\n');
  const al = (cab.match(/^Alcance:.*$/m) || [''])[0];
  if (opciones.forzar) return { fase: 'completa', motivo: 'archivo FASE-COMPLETA en la cola' };
  if (/^Categor[ií]a:.*cr[ií]tico/mi.test(cab)) return { fase: 'completa', motivo: 'lote crítico' };
  if (TOCA_COMUN.test(al)) return { fase: 'completa', motivo: 'el Alcance toca la capa común o el servidor' };
  if (/migraci[oó]n|migrate\.php|schema_version[^\n]*\d+\s*(?:→|->)\s*\d+/i.test(cab)) return { fase: 'completa', motivo: 'migración de base de datos' };
  if (/^Regresi[oó]n:/mi.test(cab)) return { fase: 'completa', motivo: 'la instrucción declara «Regresión:»' };
  return { fase: '1', motivo: 'lote normal: regresión diferida al tren (LM-49)' };
}
function anotarTren(pendiente, entrada) {   // un lote reprobado reemplaza su entrada anterior
  const lista = (Array.isArray(pendiente) ? pendiente : []).filter((x) => x && x.lote !== entrada.lote);
  if (entrada.diferidos && entrada.diferidos.length) lista.push(entrada);
  return lista;
}
// Puro: nombre de la carpeta donde se apartan las capturas de una corrida anterior.
function carpetaCapturasAnterior(lote, d = new Date()) {
  const dd = n => String(n).padStart(2, '0');
  return lote + '-' + d.getFullYear() + dd(d.getMonth() + 1) + dd(d.getDate()) + '-' + dd(d.getHours()) + dd(d.getMinutes());
}
// Aparta las capturas de la corrida anterior de ESTE lote (nunca las de otro). Devuelve adonde fueron, o null.
function apartarCapturas(lote, d = new Date()) {
  const dir = path.join(COLA, 'log', 'capturas', lote);
  try {
    if (!fs.existsSync(dir) || !fs.readdirSync(dir).length) return null;
    const destino = path.join(COLA, 'log', 'capturas', 'anterior', carpetaCapturasAnterior(lote, d));
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    fs.renameSync(dir, destino);
    return destino;
  } catch (e) { return null; }
}

function leerJson(ruta, porDefecto) { try { return JSON.parse(fs.readFileSync(ruta, 'utf8')); } catch (e) { return porDefecto; } }
function cargarGuiones(dirE2e, excluir) {
  if (!fs.existsSync(dirE2e)) return [];
  const out = [];
  for (const f of fs.readdirSync(dirE2e).filter(f => f.endsWith('.spec.js') && f !== excluir).sort()) { try { out.push({ archivo: f, ruta: path.join(dirE2e, f), spec: cargar(path.join(dirE2e, f)) }); } catch (e) { } }
  return out;
}

// v0.6.3 (LM-44): con el JWT vencido (dura 24 h) la PRIMERA /api/me del shell da 401 y, segundos después, el propio shell
// renueva con Firebase y pide /api/me otra vez (200). La puerta tomaba la primera respuesta y bloqueaba «sin sesión» con una
// sesión viva (L-131 colab 11:03, L-132 colab2 11:27, 16-oct; Carlos abría el perfil y «ya estaba abierta»). Ahora mira todas
// las /api/me de la carga durante una ventana corta: basta una 200 (la que trae la renovación del propio shell). Pura.
function sesionPorRespuestas(estados) {
  const e = (estados || []).filter((x) => x != null);
  if (!e.length) return { ok: false, ultimo: null, renovada: false };
  const ok = e.indexOf(200) !== -1;
  return { ok, ultimo: ok ? 200 : e[e.length - 1], renovada: ok && e[0] !== 200 };
}
const VENTANA_RENOVACION_MS = 15000;

async function sesionUnaVez(perfil) {
  let ctx;
  try {
    const a = await abrir(perfil); ctx = a.ctx;
    const p = await ctx.newPage();
    const estados = [];
    p.on('response', (r) => { try { if (new URL(r.url()).pathname.endsWith('/api/me')) estados.push(r.status()); } catch (e) { } });
    const me = p.waitForResponse(r => new URL(r.url()).pathname.endsWith('/api/me'), { timeout: 30000 }).catch(() => null);
    await p.goto(BASE + '/str-app-shell.html', { waitUntil: 'domcontentloaded' });
    await me;
    // LM-44: si la primera no fue 200, espera a que el shell renueve (otra /api/me 200) antes de decidir.
    const t0 = Date.now();
    while (!sesionPorRespuestas(estados).ok && Date.now() - t0 < VENTANA_RENOVACION_MS) await p.waitForTimeout(500);
    const s = sesionPorRespuestas(estados);
    // v0.5.28 (M-474): la app exige el usuario de Google/Firebase antes de mirar /api/me; si el perfil lo perdió, el shell
    // va a login.html sin pedir nada (o con /api/me 200 y aun así a login). Eso también es «sin sesión» y bloquea.
    await p.waitForTimeout(1500);
    let enLogin = /\/login\.html/.test(p.url()) || await p.locator('input[type="password"]').count().catch(() => 0) > 0;
    // v0.5.32: antes de bloquear, intenta recuperarla como lo hace Carlos (Continuar con Google, sin contraseña)
    if (enLogin) { const rec = await recuperarSesion(ctx, p, perfil); if (rec.ok) return { ok: true, caso: 'ok', observado: rec.observado, recuperada: true }; enLogin = true; var motivoRec = rec.observado; }
    if (enLogin) return { ok: false, caso: 'google', observado: perfil + ': SESION DE GOOGLE PERDIDA: el shell termina en login.html (/api/me ' + (s.ultimo == null ? 'no pedido' : s.ultimo) + '; recuperación automática: ' + (motivoRec || '—') + ') (Carlos: node abrir-perfil.js ' + perfil + ')' };
    return s.ok ? { ok: true, caso: 'ok', observado: perfil + ': /api/me 200' + (s.renovada ? ' (renovada por el shell tras ' + estados.filter((x) => x !== 200).join(',') + ')' : ''), renovada: s.renovada }
      : { ok: false, caso: 'api-me', estados: estados.slice(), observado: perfil + ': /api/me ' + (s.ultimo == null ? 'sin respuesta' : estados.join(',')) + ' en ' + Math.round(VENTANA_RENOVACION_MS / 1000) + ' s, con la sesión de Google viva (el shell no fue a login)' };
  } catch (e) { return { ok: false, caso: 'error', observado: perfil + ': ' + explicarError(e, perfil) }; }
  finally { if (ctx) await ctx.close().catch(() => { }); }
}

// v0.6.5 (LM-46, M-576 de Diseño con Carlos, 16-oct): la sesión del perfil casi nunca se pierde; un /api/me que no da 200
// con Google vivo es del servidor o de la red, y abrir el perfil no lo arregla. Por eso: (1) si el shell no fue a login y
// /api/me no dio 200, se repite la comprobación UNA vez más (perfil cerrado y reabierto, 3 s después) y solo se bloquea si
// falla dos veces seguidas; (2) el bloqueo dice cuál de los dos casos es: «SESION DE GOOGLE PERDIDA» (único caso en que
// Carlos abre el perfil) o «/api/me no dio 200 dos veces con Google vivo» (no abrir el perfil; lo revisa el Arquitecto).
function mensajeSesion(perfil, intentos) {
  const ult = intentos[intentos.length - 1];
  if (ult.ok) return { ok: true, caso: 'ok', observado: ult.observado + (intentos.length > 1 ? ' (segundo intento; el primero: ' + intentos[0].observado + ')' : ''), renovada: ult.renovada };
  if (ult.caso === 'google' || ult.caso === 'error') return { ok: false, caso: ult.caso, observado: ult.observado };
  return { ok: false, caso: 'api-me', observado: perfil + ': /api/me NO DIO 200 DOS VECES SEGUIDAS con la sesión de Google viva (' + intentos.map((x) => (x.estados || []).join(',') || 'sin respuesta').join(' / ') + '). No es el perfil: NO hace falta abrirlo; el Arquitecto revisa el servidor (LM-46)' };
}
async function sesionViva(perfil, opciones = {}) {
  const intentos = [await sesionUnaVez(perfil)];
  if (!intentos[0].ok && intentos[0].caso === 'api-me') { await new Promise((r) => setTimeout(r, opciones.espera == null ? 3000 : opciones.espera)); intentos.push(await sesionUnaVez(perfil)); }
  const res = mensajeSesion(perfil, intentos);
  // v0.8.0 (LM-51): sesión de Google perdida y recuperarSesion no pudo → Chrome normal del perfil 25 s (como abrir-perfil.js)
  if (!res.ok && res.caso === 'google' && !opciones.sinChrome) {
    const rc = await recuperarConChrome(perfil, (pf) => sesionViva(pf, Object.assign({}, opciones, { sinChrome: true })));
    if (rc.ok) return { ok: true, caso: 'ok', observado: rc.observado, recuperada: 'chrome' };
    return { ok: false, caso: 'google', observado: res.observado + ' · ' + rc.observado };
  }
  return res;
}

// v0.9.0 (LM-52, cruce de Carlos 17-oct-2026): sin internet en LENOVO a mitad de la corrida. Un caso rojo con un error de
// red DEL EQUIPO (no del servidor) hace esperar a la red (GET /api/health cada 20 s, hasta 10 min); si vuelve, el guion se
// repite una vez (repetidoPorRed); si no, la corrida queda «bloqueado» y no llega al juez. Puras: esSinRed.
const RE_SIN_RED = /net::ERR_(INTERNET_DISCONNECTED|NAME_NOT_RESOLVED|NETWORK_CHANGED|NETWORK_ACCESS_DENIED|ADDRESS_UNREACHABLE)\b/;
function esSinRed(texto) { return RE_SIN_RED.test(String(texto || '')); }
async function hayRed() {
  try { const r = await fetch(BASE + '/api/health', { signal: AbortSignal.timeout(8000) }); return !!r; } catch (e) { return false; }
}
async function esperarRed(maxMs = 10 * 60000, cadaMs = 20000, probar = hayRed) {
  const t0 = Date.now();
  while (Date.now() - t0 < maxMs) { if (await probar()) return true; await new Promise((r) => setTimeout(r, cadaMs)); }
  return probar();
}

// v0.8.0 (LM-51): corre un guion cuidando la sesión de sus perfiles. Si un caso cae en login (rc.sinSesion, guion.js),
// recupera ese perfil (sesionViva: Firebase y, si no, Chrome normal) y repite el guion UNA vez. Un perfil que no se
// recupera queda en estado.caidos: sus casos de este y de los guiones siguientes no se corren y salen ok:false con
// sinSesion (entorno). estado = { caidos: Set, recuperadas: [], perdidas: [] }. Lo usan la regresión, el guion propio y tren.js.
function saltarCaidos(sp, estado) {
  const saltados = [];
  sp.casos = (sp.casos || []).filter((c) => {
    const pf = c.perfil || 'admin';
    if (!estado.caidos.has(pf)) return true;
    saltados.push({ c: c.c, nivel: c.nivel || 'N2', perfil: pf, pagina: c.pagina, que: c.que, ok: false, sinSesion: true, observado: 'no se corrió: la sesión de ' + pf + ' se perdió y no se recuperó (entorno, LM-51)' });
    return false;
  });
  return saltados;
}
async function correrConSesion(sp, opts, estado, nombre, deps = {}) {
  const correr = deps.correr || correrGuion, comprobar = deps.sesion || sesionViva;
  let saltados = saltarCaidos(sp, estado);
  let rr = sp.casos.length ? await correr(sp, opts) : { casos: [], limpieza: 'sin casos (perfiles sin sesión)', perfiles: [] };
  // LM-52: la red antes que la sesión (sin red, la recuperación de sesión fallaría y dejaría perfiles caídos sin motivo)
  if (rr.casos.some((x) => x.ok === false && esSinRed(x.observado))) {
    estado.red = estado.red || { cortes: [], bloqueada: false };
    const desde = horaBogota();
    const vuelve = await (deps.esperarRed || esperarRed)();
    if (!vuelve) { estado.red.cortes.push({ desde, hasta: null, guion: nombre }); estado.red.bloqueada = true; return rr; }
    estado.red.cortes.push({ desde, hasta: horaBogota(), guion: nombre });
    rr = await correr(sp, opts); rr.casos.forEach((x) => { x.repetidoPorRed = true; });
    if (rr.casos.some((x) => x.ok === false && esSinRed(x.observado))) { estado.red.cortes.push({ desde: horaBogota(), hasta: null, guion: nombre }); estado.red.bloqueada = true; return rr; }
  }
  const perdidos = [...new Set(rr.casos.filter((x) => x.sinSesion).map((x) => x.perfil || 'admin'))];
  if (perdidos.length) {
    let alguno = false;
    for (const pf of perdidos) {
      const s = await comprobar(pf);
      if (s.ok) { alguno = true; estado.recuperadas.push({ perfil: pf, guion: nombre, hora: horaBogota(), observado: s.observado }); }
      else { estado.caidos.add(pf); estado.perdidas.push({ perfil: pf, guion: nombre, hora: horaBogota(), observado: s.observado }); }
    }
    if (alguno) {
      saltados = saltados.concat(saltarCaidos(sp, estado));
      if (sp.casos.length) { rr = await correr(sp, opts); rr.casos.forEach((x) => { x.repetidoPorSesion = true; }); }
      else rr = { casos: [], limpieza: rr.limpieza, perfiles: rr.perfiles };
    } else {
      // nadie se recuperó: los casos de esos perfiles quedan como «sin sesión», el resto tal cual
      rr.casos = rr.casos.map((x) => (estado.caidos.has(x.perfil || 'admin') && x.ok === false) ? Object.assign(x, { sinSesion: true }) : x);
    }
  }
  rr.casos = rr.casos.concat(saltados);
  return rr;
}

// v0.6.4 (LM-45, cruce de Carlos 16-oct): una nueva prueba del MISMO commit no repite lo que ya pasó en verde con ese commit.
// N1 (P4.b): se salta si la cola ya lo dio en verde para ese commit con el árbol limpio. Guion (P4.c): se salta la comparación
// si ya se comparó con ESE commit y ESE bloque de la instrucción (si la instrucción cambió, se vuelve a comparar). El guion se
// sigue cargando siempre (lo usa el paso 13). Memoria: log\entrada-por-commit.json. Puras: claveGuion, puedeSaltar, anotar.
function claveGuion(codigo) { return require('crypto').createHash('sha256').update(String(codigo || '').replace(/\r\n/g, '\n')).digest('hex').slice(0, 16); }
function puedeSaltar(memoria, commit, limpio, que, clave) {
  if (!commit || !limpio || !memoria || !memoria[commit]) return null;
  const m = memoria[commit][que];
  if (!m || m.ok !== true) return null;
  if (que === 'guion' && m.clave !== clave) return null;
  return m;
}
function anotar(memoria, commit, que, dato) {
  const out = Object.assign({}, memoria || {});
  out[commit] = Object.assign({}, out[commit] || {}, { [que]: dato });
  const claves = Object.keys(out);   // se guardan solo los últimos 30 commits
  if (claves.length > 30) claves.slice(0, claves.length - 30).forEach((k) => { delete out[k]; });
  return out;
}

async function main() {
  const instr = arg('--instr'); const repo = arg('--repo', path.join(require('os').homedir(), 'str-manager'));
  if (!instr || !fs.existsSync(instr)) { console.log('Uso: node probar-lote.js --instr <archivo de la instruccion>'); process.exit(2); }
  const texto = fs.readFileSync(instr, 'utf8');
  const lote = loteDe(instr) || 'L-0';
  const out = { lote, instruccion: path.basename(instr), proceso: 'PRUEBAS-v2', inicio: new Date().toISOString(), entrada: [], n1: null, n2: [], regresion: [], limpiezaRegresion: [], cuarentena: [], inestables: [], resultado: null, causa: null };
  // V10: si este lote quedó suspendido por entorno en la corrida anterior, esta es su reanudación (fase 1 completa; no es reprueba)
  const suspPrev = V2.leerSuspension(COLA);
  if (V2.esReanudacion(suspPrev, lote)) out.reanudacion = { de: suspPrev.hora, causa: suspPrev.causa };
  const git = spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: repo, encoding: 'utf8' });
  out.commit = (git.stdout || '').trim() || null;
  // LM-45: commit completo y árbol limpio (sin cambios sin commit) para poder reutilizar resultados de una corrida anterior
  const commitLargo = (spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).stdout || '').trim() || null;
  // v0.12.1 (LM-73): el mensaje del commit y su línea de trazabilidad «Lote: L-n · id · Casos de uso: …» (hook v5, K5) quedan en el informe,
  // para que el juez lea el criterio «el commit lleva la línea Lote:» de aquí y no lo infiera del hook (L-164 parcial, M-1083).
  const msgCommit = (spawnSync('git', ['log', '-1', '--format=%B'], { cwd: repo, encoding: 'utf8' }).stdout || '').replace(/\r\n/g, '\n').trim();
  out.commitMensaje = msgCommit || null;
  const mLinea = msgCommit.match(/^Lote:\s*L-\d+\s*·.*$/m);
  out.lineaLote = mLinea ? mLinea[0].trim() : null;
  const st = spawnSync('git', ['status', '--porcelain'], { cwd: repo, encoding: 'utf8' });
  const arbolLimpio = st.status === 0 && !(st.stdout || '').trim();
  const rutaMemoria = path.join(COLA, 'log', 'entrada-por-commit.json');
  let memoria = leerJson(rutaMemoria, {});
  const guardarMemoria = (que, dato) => { if (!commitLargo || !arbolLimpio) return; memoria = anotar(memoria, commitLargo, que, dato); try { fs.writeFileSync(rutaMemoria, JSON.stringify(memoria, null, 1)); } catch (e) { } };
  const entra = (c, ok, observado) => { out.entrada.push({ c, ok, observado }); console.log((ok ? 'OK  ' : 'NO  ') + 'P4 ' + c + ' · ' + observado); return ok; };
  const fin = (resultado, causa, suspension) => {
    if (suspension) { V2.escribirSuspension(COLA, { estado: 'suspendido', lote, hora: horaBogota(), causa: suspension, avisar: ['Chat Jefe de proyecto', 'Chat Desarrollo'], reanuda: 'con humo y semilla en verde se repite la fase 1 completa del lote (V10)' }); out.suspension = suspension; }
    else if (out.reanudacion && resultado !== 'bloqueado') { V2.escribirSuspension(COLA, { estado: 'reanudado', lote, hora: horaBogota(), de: out.reanudacion }); causa = ['reanudacion tras suspension por entorno', causa].filter(Boolean).join(' · '); }
    out.resultado = resultado; out.causa = causa || null; out.fin = new Date().toISOString();
    if (out.sesiones && out.sesiones.red) out.red = out.sesiones.red;   // LM-52
    if (out.sesiones && out.sesiones.caidos instanceof Set) out.sesiones = { recuperadas: out.sesiones.recuperadas, perdidas: out.sesiones.perdidas, caidos: [...out.sesiones.caidos] };   // LM-51
    fs.writeFileSync(path.join(COLA, 'log', lote + '-pruebas.json'), JSON.stringify(out, null, 1));
    console.log('Pruebas ' + lote + ': ' + resultado + (causa ? ' - ' + causa : '') + ' - log\\' + lote + '-pruebas.json');
    process.exit(resultado === 'verde' ? 0 : 1);
  };

  // P4.a despliegue: /api/health y, si el lote cambia ?v=, la version en el HTML (espera hasta 10 min al despliegue)
  const v = versionNueva(texto);
  let desplegado = false, obs = '', salud = null;
  for (let i = 0; i < (process.argv.includes('--sin-espera') ? 1 : 20); i++) {
    try {
      const h = await fetch(BASE + '/api/health'); const j = await h.json();
      if (h.status === 200 && j.ok) {
        salud = j;
        if (!v) { desplegado = true; obs = '/api/health 200; el lote no cambia ?v='; break; }
        const html = await (await fetch(BASE + '/str-app-shell.html?nc=' + Date.now())).text();
        if (html.includes('v=' + v)) { desplegado = true; obs = '/api/health 200 y ?v=' + v + ' en str-app-shell.html'; break; }
        obs = 'aun sin ?v=' + v + ' en str-app-shell.html';
      } else obs = '/api/health ' + h.status;
    } catch (e) { obs = e.message; }
    await dormir(30000);
  }
  if (!entra('despliegue', desplegado, obs)) return fin('bloqueado', 'despliegue: ' + obs, 'P4 despliegue: ' + obs);

  // P4.b tests/ en verde (N1) en el commit del lote
  const yaN1 = puedeSaltar(memoria, commitLargo, arbolLimpio, 'n1');
  if (yaN1) {
    out.n1 = { ok: true, observado: 'node tests/run.js: ' + yaN1.resumen + ' (ya en verde con este commit a las ' + yaN1.hora + '; no se repite, LM-45)', reutilizado: true };
    entra('tests/ en verde', true, out.n1.observado);
  } else {
    const t = spawnSync(process.execPath, ['tests/run.js'], { cwd: repo, encoding: 'utf8', timeout: 300000 });
    const resumen = ((t.stdout || '').match(/\d+\/\d+ archivos OK/) || ['sin resumen'])[0];
    out.n1 = { ok: t.status === 0, observado: 'node tests/run.js: ' + resumen };
    if (!entra('tests/ en verde', t.status === 0, resumen)) return fin('bloqueado', 'tests/ en rojo en el commit del lote: ' + resumen);
    guardarMemoria('n1', { ok: true, resumen, hora: horaBogota() });
  }

  // P4.c guion N2 igual al de la instruccion
  const g = extraerGuion(texto);
  let spec = null, rutaSpec = null;
  if (!g) entra('guion N2', true, 'la instruccion no trae guion N2 (solo N1/N3)');
  else {
    rutaSpec = path.join(repo, ...g.ruta.split('/'));
    if (!g.codigo) return entra('guion N2', false, g.error), fin('bloqueado', 'guion N2 mal escrito en la instruccion: ' + g.error);
    if (!fs.existsSync(rutaSpec)) return entra('guion N2', false, g.ruta + ' no esta en el commit'), fin('bloqueado', 'la CLI no copio el guion a ' + g.ruta);
    const claveG = claveGuion(g.codigo), yaG = puedeSaltar(memoria, commitLargo, arbolLimpio, 'guion', claveG);
    if (!yaG) {
      if (!igual(fs.readFileSync(rutaSpec, 'utf8'), g.codigo)) return entra('guion N2', false, g.ruta + ' distinto del bloque de la instruccion'), fin('bloqueado', 'el guion del commit no es igual al de la instruccion (independencia)');
      guardarMemoria('guion', { ok: true, clave: claveG, ruta: g.ruta, hora: horaBogota() });
    }
    try { spec = cargar(rutaSpec); } catch (e) { return entra('guion N2', false, 'no carga: ' + e.message), fin('bloqueado', 'el guion no carga: ' + e.message); }
    entra('guion N2', true, g.ruta + ' igual a la instruccion · ' + (spec.casos || []).length + ' caso(s)' + (yaG ? ' (comparado con este commit a las ' + yaG.hora + '; no se repite, LM-45)' : ''));
  }

  // P4.f aplicación literal (K1), P4.g N1 literal (K2) y tamaño (K3) — LM-63, sin créditos ni navegador
  try {
    const rev = APL.revisarCommit(texto, repo, { health: salud });
    out.aplicacion = rev.aplicacion; out.n1Literal = rev.n1; out.tamano = rev.tamano;
    if (!entra('aplicación', rev.aplicacion.ok, rev.aplicacion.resumen)) return fin('bloqueado', 'el commit no aplica la instrucción tal cual (K1): ' + rev.aplicacion.resumen.slice(0, 300));
    if (!entra('N1 literal', rev.n1.ok, rev.n1.resumen || rev.n1.aviso)) return fin('bloqueado', 'el N1 del commit no es igual al de la instrucción (K2, independencia): ' + rev.n1.resumen);
    if (rev.n1.sinPrueba && rev.n1.sinPrueba.length) console.log('aviso K2: puntos sin caso N1 que los nombre: ' + rev.n1.sinPrueba.join(', '));
    const tm = rev.tamano; console.log('tamaño (K3): código ' + tm.codigo.lineas + ' líneas / ' + tm.codigo.archivos + ' archivos · pruebas ' + tm.pruebas.lineas + ' · versión ' + tm.version.archivos + ' archivos' + (tm.grande ? ' · LOTE GRANDE (aviso: > 400 líneas o > 8 archivos de código)' : ''));
  } catch (e) { entra('aplicación', true, 'no se pudo revisar (sigue, aviso): ' + String(e && e.message || e).slice(0, 160)); }

  // P4.d semilla zz-verif- y P4.e sesiones de los perfiles que usa el guion
  const sem = await comprobarSemilla({ lote });
  out.semilla = sem;
  // Sin guion N2 la cola no usa la semilla: queda como aviso y no bloquea (v0.3.1)
  if (!spec && sem.estado === 'incompleta') entra('semilla zz-verif- (aviso, el lote no trae guion)', true, sem.grupos.filter(x => x.estado === 'falta').map(x => x.id + ': ' + x.observado).join('; '));
  else if (!entra('semilla zz-verif-', sem.estado !== 'incompleta', sem.estado + (sem.error ? ' · ' + sem.error : '') + ' · ' + sem.grupos.map(x => x.id + ' ' + x.estado).join(', '))) return fin('bloqueado', 'semilla incompleta: ' + sem.grupos.filter(x => x.estado === 'falta').map(x => x.observado).join('; '), 'P4 semilla incompleta');
  // v0.6.0 (LM-39b): la regresion la elige la ruta del lote (seleccionRegresion); «Regresión:» explicita manda; sin mapa, zona.
  const dirE2e = rutaSpec ? path.dirname(rutaSpec) : path.join(repo, 'tests', 'e2e');
  const mapa = leerJson(path.join(__dirname, 'mapa-modulos.json'), null);
  const centinelas = leerJson(path.join(__dirname, 'centinelas.json'), []);
  const guiones = cargarGuiones(dirE2e, rutaSpec ? path.basename(rutaSpec) : null);
  const sel = seleccionRegresion(texto, spec, guiones, mapa, centinelas);
  // LM-49: fase 1 → solo corren los centinelas que caen en la ruta; lo demás va al tren. Humo siempre en fase 1.
  const riesgo = V2.riesgoDeRuta(mapa, sel.ruta ? sel.ruta.modulos : []);   // V7
  const fase = V2.faseConRiesgo(faseDelLote(texto, { forzar: fs.existsSync(path.join(COLA, 'FASE-COMPLETA')) }), riesgo);
  const esCentinela = (a) => centinelas.some((c) => c.guion === a);
  const diferidos = fase.fase === '1' ? sel.corren.filter((c) => fase.minima || !esCentinela(c.archivo)).map((c) => c.archivo) : [];
  if (fase.fase === '1') sel.corren = fase.minima ? [] : sel.corren.filter((c) => esCentinela(c.archivo));
  out.fase = { fase: fase.fase, motivo: fase.motivo, riesgo: fase.riesgo || null, minima: !!fase.minima, corren: sel.corren.map((c) => c.archivo), diferidos };
  console.log('fase ' + fase.fase + ' (' + fase.motivo + ')' + (diferidos.length ? ' · al tren: ' + diferidos.join(', ') : ''));
  const humoSpec = (sel.humo || fase.fase === '1') && fs.existsSync(path.join(__dirname, 'humo-pw.spec.js')) ? cargar(path.join(__dirname, 'humo-pw.spec.js')) : null;
  // v0.5.28 (M-474): P4.e comprueba la sesion de TODOS los perfiles que van a correr (guion del lote + regresion), no solo
  // los del guion: un perfil sin sesion tumbaba 30 casos en cascada (L-122) en vez de bloquear en la puerta.
  const perfiles = new Set(((spec && spec.casos) || []).map(c => c.perfil));
  for (const c of sel.corren) { const g = guiones.find(x => x.archivo === c.archivo); if (g) (g.spec.casos || []).forEach(k => { if (k.nivel !== 'N3' && k.perfil) perfiles.add(k.perfil); }); }
  if (humoSpec) (humoSpec.casos || []).forEach(k => { if (k.perfil) perfiles.add(k.perfil); });
  for (const p of perfiles) { const s = await sesionViva(p); if (!entra('sesion ' + p, s.ok, s.observado)) return fin('bloqueado', s.observado, 'P4 sesión ' + p + ': ' + s.observado); }
  // V1: entradas de cuarentena válidas para esta corrida (INC abierto en seguimiento.json del repo público; plazo en lotes aceptados)
  const entradasQ = leerJson(path.join(__dirname, 'cuarentena.json'), []);
  let seguimiento = null;
  if (entradasQ.length) { try { seguimiento = await (await fetch('https://raw.githubusercontent.com/thcure/str-manager-docs/main/interno/seguimiento.json')).json(); } catch (e) { seguimiento = null; } }
  const cq = V2.validarCuarentena(entradasQ, { incs: (seguimiento && seguimiento.incs) || [], guionPropio: rutaSpec ? path.basename(rutaSpec) : null, modulosLote: sel.ruta ? sel.ruta.modulos : [], lotesAceptados: (desde) => V2.lotesAceptadosDesde((seguimiento && seguimiento.cambios) || [], desde) });
  if (entradasQ.length && !seguimiento) cq.rechazadas.push({ porQue: 'no se pudo leer seguimiento.json del repo: ninguna entrada vale en esta corrida' }), cq.validas = [];
  out.cuarentenaEntradas = { validas: cq.validas.map((e) => ({ guion: e.guion, caso: e.caso, inc: e.inc, vencida: e.vencida, aceptadosDesde: e.aceptadosDesde })), rechazadas: cq.rechazadas.map((r) => ({ guion: r.entrada && r.entrada.guion, caso: r.entrada && r.entrada.caso, porQue: r.porQue })) };
  if (entradasQ.length) console.log('cuarentena: ' + cq.validas.length + ' entrada(s) válida(s)' + (cq.validas.some((e) => e.vencida) ? ' (' + cq.validas.filter((e) => e.vencida).length + ' vencida(s): se saltan)' : '') + ', ' + cq.rechazadas.length + ' rechazada(s)');

  // P5 guion del lote + regresion (sin Claude). v0.6.1: las capturas de la corrida anterior de este lote se apartan antes.
  const apartadas = apartarCapturas(lote);
  if (apartadas) { out.capturasApartadas = path.relative(COLA, apartadas); console.log('capturas de la corrida anterior apartadas en ' + out.capturasApartadas); }
  out.regresionSeleccion = { modo: sel.modo, motivo: sel.motivo, ruta: sel.ruta, corren: sel.corren, noCorren: sel.noCorren, centinelas: centinelas.map(c => c.guion), mapaLineaBase: mapa ? mapa.lineaBase : null };
  out.zonasRegresion = { zonas: [], motivo: 'v0.6.0: la regresion se elige por ' + sel.modo + ' (ver regresionSeleccion)' };   // compatibilidad con el juez
  console.log('regresion (' + sel.modo + '): corren ' + (sel.corren.length ? sel.corren.map(x => x.archivo.replace('.spec.js', '')).join(', ') : '(ninguno)') + ' · no corren ' + sel.noCorren.length + ' · ' + sel.motivo);
  if (sel.ruta && (sel.ruta.huecos.relaciones.length || sel.ruta.huecos.reglas.length)) console.log('huecos de la ruta: ' + sel.ruta.huecos.relaciones.map(x => x.id).concat(sel.ruta.huecos.reglas.map(x => x.id)).join(', '));
  const estadoSesion = { caidos: new Set(), recuperadas: [], perdidas: [] };   // v0.8.0 (LM-51)
  out.sesiones = estadoSesion;
  // v0.9.0 (LM-52 · M-658, INC-148): restos de una corrida caída. Antes del guion y la regresión se borran los turnos
  // zz-verif- de hoy en zz-verif-Propiedad (misma regla que limpiar-zz v3). No bloquea: si falla, queda anotado.
  try {
    const rz = await correrGuion(require('./limpiar-zz.spec.js').especCon({ col: 'turnos', campo: 'propName', prefijo: 'zz-verif-Propiedad', hoy: true, pagina: '/str-m1-housekeeping.html' }), { lote, prefijo: 'zz-verif-' + lote + '-z-', dirGuion: __dirname, nombreGuion: 'limpiar-restos' });
    entra('restos', true, rz.casos.map((x) => x.observado).join(' | ').slice(0, 400) || 'sin casos');
  } catch (e) { entra('restos', true, 'no se pudo limpiar (sigue): ' + String(e && e.message || e).slice(0, 200)); }
  if (spec) {
    const r = await V2.correrConReintento(correrConSesion, spec, { lote, dirGuion: path.dirname(rutaSpec) }, estadoSesion, 'guion del lote', () => cargar(rutaSpec), esSinRed); out.n2 = r.casos; out.limpieza = r.limpieza; out.perfiles = r.perfiles;   /* v0.5.31 (M-499): aperturas y cierres por perfil */
    if (r.reintentado) { out.reintentoGuion = { inestables: r.inestables, primeraLimpieza: r.primeraLimpieza }; r.inestables.forEach((x) => out.inestables.push(Object.assign({ guion: path.basename(rutaSpec) }, x))); console.log('reintento del guion del lote (V2): ' + r.inestables.length + ' caso(s) inestable(s)'); }
    r.casos.forEach(x => console.log((x.ok ? 'OK  ' : x.ok === null ? 'N3  ' : 'NO  ') + x.nivel + ' ' + x.c + ' · ' + x.observado));
  }
  if (estadoSesion.red && estadoSesion.red.bloqueada) return fin('bloqueado', 'sin internet en LENOVO desde ' + estadoSesion.red.cortes[estadoSesion.red.cortes.length - 1].desde + ' (LM-52): se repite con reprobar cuando vuelva la red');
  // v0.6.0 (LM-39b, M-524): lote de solo guiones o herramientas → humo-pw dentro de la corrida, como caso n2 «humo»
  if (humoSpec) {
    const rh = await correrGuion(humoSpec, { lote, prefijo: 'zz-verif-' + lote + '-h-', dirGuion: __dirname, nombreGuion: 'humo-pw' });
    const okH = rh.casos.length > 0 && rh.casos.every(x => x.ok !== false);
    out.humo = { ok: okH, casos: rh.casos, limpieza: rh.limpieza, perfiles: rh.perfiles };
    out.n2.push({ c: 'humo', nivel: 'N2', perfil: 'admin', pagina: '/str-app-shell.html', que: fase.fase === '1' ? 'humo-pw en verde (fase 1, LM-49)' : 'humo-pw en verde (lote de solo guiones o herramientas)', ok: okH, observado: rh.casos.map(x => (x.ok ? 'OK ' : 'NO ') + x.c + ' ' + x.observado).join(' | ').slice(0, 600) });
    console.log((okH ? 'OK  ' : 'NO  ') + 'N2 humo · ' + rh.casos.length + ' caso(s)');
  }
  {
    const lista = sel.corren.map(c => (guiones.find(g => g.archivo === c.archivo) || {}).ruta).filter(Boolean);
    const porGuion = [];   // V10: resultados por guion en orden, para detectar dos seguidos caídos por el entorno
    for (const f of lista) {
      if (estadoSesion.red && estadoSesion.red.bloqueada) break;   // LM-52
      const nombreG = path.basename(f);
      try {
        const sp = cargar(f); sp.casos = (sp.casos || []).filter(c => c.nivel !== 'N3');   /* la regresion no repite los N3 */
        const salto = V2.casosASaltar(sp, cq.validas, nombreG); sp.casos = salto.casos; salto.saltados.forEach((x) => out.cuarentena.push(Object.assign({ guion: nombreG }, x)));   /* V1: vencidas */
        const opts = { lote, prefijo: 'zz-verif-' + lote + '-r-', dirGuion: path.dirname(f), nombreGuion: nombreG.replace(/\.spec\.js$/, '') };
        const rr = sp.casos.length ? await V2.correrConReintento(correrConSesion, sp, opts, estadoSesion, nombreG, () => { const s2 = cargar(f); s2.casos = (s2.casos || []).filter(c => c.nivel !== 'N3'); return s2; }, esSinRed) : { casos: [], limpieza: 'sin casos (todos en cuarentena vencida)', perfiles: [] };   /* V2 */
        if (rr.reintentado) rr.inestables.forEach((x) => out.inestables.push(Object.assign({ guion: nombreG }, x)));
        const sep = V2.aplicarCuarentena(rr.casos, cq.validas, nombreG);   /* V1 */
        sep.regresion.forEach(x => out.regresion.push(Object.assign({ guion: nombreG }, x))); sep.cuarentena.forEach(x => out.cuarentena.push(Object.assign({ guion: nombreG }, x)));   /* v0.5.25: capturas <guion>-<letra>-error.png */
        out.limpiezaRegresion.push({ guion: nombreG, limpieza: rr.limpieza, perfiles: rr.perfiles }); /* v0.5.12 (M-390) */
        porGuion.push({ guion: nombreG, casos: sep.regresion });
      }
      catch (e) { out.regresion.push({ guion: nombreG, ok: false, observado: e.message }); porGuion.push({ guion: nombreG, casos: [{ ok: false, observado: e.message }] }); }
      const susp = V2.detectarSuspension(porGuion);   /* V10 */
      if (susp.suspender) { out.regresionSuspendida = { en: nombreG, causa: susp.causa }; return fin('bloqueado', 'suspendido por entorno (V10): ' + susp.causa + ' · se reanuda con humo y semilla en verde', susp.causa); }
    }
    if (estadoSesion.red && estadoSesion.red.bloqueada) return fin('bloqueado', 'sin internet en LENOVO desde ' + estadoSesion.red.cortes[estadoSesion.red.cortes.length - 1].desde + ' (LM-52): se repite con reprobar cuando vuelva la red');
    out.regresion.forEach(x => console.log((x.ok ? 'OK  ' : 'NO  ') + 'regresion ' + x.guion + ' ' + (x.c || '') + (x.inestable ? ' (inestable)' : '') + ' · ' + x.observado));
    out.cuarentena.forEach(x => console.log('Q   cuarentena ' + x.guion + ' ' + (x.c || '') + ' · ' + (x.inc || '') + ' · ' + x.observado));
    out.limpiezaRegresion.forEach(x => console.log('limpieza regresion ' + x.guion + ' · ' + x.limpieza));
  }
  if (fase.fase === '1') {   // LM-49: deja la regresión diferida en la fila del tren
    const rutaTren = path.join(COLA, 'log', 'tren-pendiente.json');
    try { fs.writeFileSync(rutaTren, JSON.stringify(anotarTren(leerJson(rutaTren, []), { lote, commit: out.commit, hora: horaBogota(), diferidos }), null, 1)); out.fase.tren = 'anotado en log\\tren-pendiente.json'; }
    catch (e) { out.fase.tren = 'no se pudo anotar: ' + e.message; }
  }
  const rojo = out.n2.some(x => x.ok === false) || out.regresion.some(x => x.ok === false);
  out.n3Preparados = out.n2.filter(x => x.nivel === 'N3' && x.ok === null).map(x => x.c);
  return fin(rojo ? 'rojo' : 'verde', rojo ? 'fallan: ' + out.n2.concat(out.regresion).filter(x => x.ok === false).map(x => (x.guion ? x.guion + ' ' : '') + x.c).join(', ') : null);
}

module.exports = { esSinRed, esperarRed, correrConSesion, saltarCaidos, faseDelLote, anotarTren, mensajeSesion, sesionViva, claveGuion, puedeSaltar, anotar, sesionPorRespuestas, versionNueva, guionesDeZona, zonasRegresion, TOCA_COMUN, tieneZona, seleccionRegresion, cargarGuiones, carpetaCapturasAnterior, apartarCapturas };
if (require.main === module) main().catch(e => { console.log('error: ' + e.message); process.exit(1); });
