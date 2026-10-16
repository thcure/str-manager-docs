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
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { BASE, COLA, abrir, explicarError, recuperarSesion } = require('./comun');   // v0.5.32: recuperarSesion
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

async function sesionViva(perfil) {
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
    if (enLogin) { const rec = await recuperarSesion(ctx, p, perfil); if (rec.ok) return { ok: true, observado: rec.observado, recuperada: true }; enLogin = true; var motivoRec = rec.observado; }
    if (enLogin) return { ok: false, observado: perfil + ': el shell termina en login.html (sesion de Google/Firebase del perfil perdida; /api/me ' + (s.ultimo == null ? 'no pedido' : s.ultimo) + '; recuperación automática: ' + (motivoRec || '—') + ') (Carlos: node abrir-perfil.js ' + perfil + ')' };
    return s.ok ? { ok: true, observado: perfil + ': /api/me 200' + (s.renovada ? ' (renovada por el shell tras ' + estados.filter((x) => x !== 200).join(',') + ')' : ''), renovada: s.renovada }
      : { ok: false, observado: perfil + ': sin sesion (/api/me ' + (s.ultimo == null ? 'sin respuesta' : estados.join(',')) + ' en ' + Math.round(VENTANA_RENOVACION_MS / 1000) + ' s) (Carlos: node abrir-perfil.js ' + perfil + ')' };
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
  // v0.6.0 (LM-39b): la regresion la elige la ruta del lote (seleccionRegresion); «Regresión:» explicita manda; sin mapa, zona.
  const dirE2e = rutaSpec ? path.dirname(rutaSpec) : path.join(repo, 'tests', 'e2e');
  const mapa = leerJson(path.join(__dirname, 'mapa-modulos.json'), null);
  const centinelas = leerJson(path.join(__dirname, 'centinelas.json'), []);
  const guiones = cargarGuiones(dirE2e, rutaSpec ? path.basename(rutaSpec) : null);
  const sel = seleccionRegresion(texto, spec, guiones, mapa, centinelas);
  const humoSpec = sel.humo && fs.existsSync(path.join(__dirname, 'humo-pw.spec.js')) ? cargar(path.join(__dirname, 'humo-pw.spec.js')) : null;
  // v0.5.28 (M-474): P4.e comprueba la sesion de TODOS los perfiles que van a correr (guion del lote + regresion), no solo
  // los del guion: un perfil sin sesion tumbaba 30 casos en cascada (L-122) en vez de bloquear en la puerta.
  const perfiles = new Set(((spec && spec.casos) || []).map(c => c.perfil));
  for (const c of sel.corren) { const g = guiones.find(x => x.archivo === c.archivo); if (g) (g.spec.casos || []).forEach(k => { if (k.nivel !== 'N3' && k.perfil) perfiles.add(k.perfil); }); }
  if (humoSpec) (humoSpec.casos || []).forEach(k => { if (k.perfil) perfiles.add(k.perfil); });
  for (const p of perfiles) { const s = await sesionViva(p); if (!entra('sesion ' + p, s.ok, s.observado)) return fin('bloqueado', s.observado); }

  // P5 guion del lote + regresion (sin Claude). v0.6.1: las capturas de la corrida anterior de este lote se apartan antes.
  const apartadas = apartarCapturas(lote);
  if (apartadas) { out.capturasApartadas = path.relative(COLA, apartadas); console.log('capturas de la corrida anterior apartadas en ' + out.capturasApartadas); }
  out.regresionSeleccion = { modo: sel.modo, motivo: sel.motivo, ruta: sel.ruta, corren: sel.corren, noCorren: sel.noCorren, centinelas: centinelas.map(c => c.guion), mapaLineaBase: mapa ? mapa.lineaBase : null };
  out.zonasRegresion = { zonas: [], motivo: 'v0.6.0: la regresion se elige por ' + sel.modo + ' (ver regresionSeleccion)' };   // compatibilidad con el juez
  console.log('regresion (' + sel.modo + '): corren ' + (sel.corren.length ? sel.corren.map(x => x.archivo.replace('.spec.js', '')).join(', ') : '(ninguno)') + ' · no corren ' + sel.noCorren.length + ' · ' + sel.motivo);
  if (sel.ruta && (sel.ruta.huecos.relaciones.length || sel.ruta.huecos.reglas.length)) console.log('huecos de la ruta: ' + sel.ruta.huecos.relaciones.map(x => x.id).concat(sel.ruta.huecos.reglas.map(x => x.id)).join(', '));
  if (spec) {
    const r = await correrGuion(spec, { lote, dirGuion: path.dirname(rutaSpec) }); out.n2 = r.casos; out.limpieza = r.limpieza; out.perfiles = r.perfiles;   /* v0.5.31 (M-499): aperturas y cierres por perfil */
    r.casos.forEach(x => console.log((x.ok ? 'OK  ' : x.ok === null ? 'N3  ' : 'NO  ') + x.nivel + ' ' + x.c + ' · ' + x.observado));
  }
  // v0.6.0 (LM-39b, M-524): lote de solo guiones o herramientas → humo-pw dentro de la corrida, como caso n2 «humo»
  if (humoSpec) {
    const rh = await correrGuion(humoSpec, { lote, prefijo: 'zz-verif-' + lote + '-h-', dirGuion: __dirname, nombreGuion: 'humo-pw' });
    const okH = rh.casos.length > 0 && rh.casos.every(x => x.ok !== false);
    out.humo = { ok: okH, casos: rh.casos, limpieza: rh.limpieza, perfiles: rh.perfiles };
    out.n2.push({ c: 'humo', nivel: 'N2', perfil: 'admin', pagina: '/str-app-shell.html', que: 'humo-pw en verde (lote de solo guiones o herramientas)', ok: okH, observado: rh.casos.map(x => (x.ok ? 'OK ' : 'NO ') + x.c + ' ' + x.observado).join(' | ').slice(0, 600) });
    console.log((okH ? 'OK  ' : 'NO  ') + 'N2 humo · ' + rh.casos.length + ' caso(s)');
  }
  {
    const lista = sel.corren.map(c => (guiones.find(g => g.archivo === c.archivo) || {}).ruta).filter(Boolean);
    for (const f of lista) {
      try { const sp = cargar(f); sp.casos = (sp.casos || []).filter(c => c.nivel !== 'N3'); const rr = await correrGuion(sp, { lote, prefijo: 'zz-verif-' + lote + '-r-', dirGuion: path.dirname(f), nombreGuion: path.basename(f).replace(/\.spec\.js$/, '') });   /* v0.5.25: capturas <guion>-<letra>-error.png */ /* la regresion no repite los N3 */ rr.casos.forEach(x => out.regresion.push(Object.assign({ guion: path.basename(f) }, x))); out.limpiezaRegresion.push({ guion: path.basename(f), limpieza: rr.limpieza, perfiles: rr.perfiles }); /* v0.5.12 (M-390) */ }
      catch (e) { out.regresion.push({ guion: path.basename(f), ok: false, observado: e.message }); }
    }
    out.regresion.forEach(x => console.log((x.ok ? 'OK  ' : 'NO  ') + 'regresion ' + x.guion + ' ' + (x.c || '') + ' · ' + x.observado));
    out.limpiezaRegresion.forEach(x => console.log('limpieza regresion ' + x.guion + ' · ' + x.limpieza));
  }
  const rojo = out.n2.some(x => x.ok === false) || out.regresion.some(x => x.ok === false);
  out.n3Preparados = out.n2.filter(x => x.nivel === 'N3' && x.ok === null).map(x => x.c);
  return fin(rojo ? 'rojo' : 'verde', rojo ? 'fallan: ' + out.n2.concat(out.regresion).filter(x => x.ok === false).map(x => (x.guion ? x.guion + ' ' : '') + x.c).join(', ') : null);
}

module.exports = { sesionPorRespuestas, versionNueva, guionesDeZona, zonasRegresion, TOCA_COMUN, tieneZona, seleccionRegresion, cargarGuiones, carpetaCapturasAnterior, apartarCapturas };
if (require.main === module) main().catch(e => { console.log('error: ' + e.message); process.exit(1); });
