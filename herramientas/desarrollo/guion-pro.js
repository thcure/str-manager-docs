// L-184a: corre un guion del STR contra los dos sitios servidos en sus orígenes (proyectos. y herramienta-fabrica., desviados
// a archivos locales con la CSP del .htaccess), Firebase y el servicio simulados con el paquete (todas las tablas, con CORS).
// Playwright: el del contenedor del chat (cambia la ruta si corre en otro lado)
const { chromium } = require(process.env.PLAYWRIGHT || '/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
const RAIZ = process.argv[2], PAQ = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const ht = fs.readFileSync(path.join(RAIZ, '.htaccess'), 'utf8');
const csps = [...ht.matchAll(/Content-Security-Policy "([^"]+)"/g)].map((m) => m[1]);
const CSP = csps[0], CSP_VISOR = csps.find((c) => /default-src 'none'/.test(c));
const FAB = 'https://herramienta-fabrica.apartamentosbucaramanga.com', PRO = 'https://proyectos.apartamentosbucaramanga.com';
const APP = `export function initializeApp(c){ return {c}; }`;
const AUTH = `const auth={currentUser:{uid:'admin',getIdToken:async()=> 'tok-admin'}};
export function getAuth(){ return auth; } export function onAuthStateChanged(a,f){ setTimeout(()=>f(auth.currentUser),10); }
export class GoogleAuthProvider{} export async function signInWithPopup(){} export async function signOut(){}`;
const T = PAQ.tablas;
const tipo = (f) => ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[path.extname(f)] || 'text/plain') + '; charset=utf-8';
const lecturas = [];
function servicio(u) {
  const ruta = u.pathname.replace('/modelo/api/', '');
  lecturas.push(ruta + u.search);
  if (ruta === 'salud') return { ok: true, servicio: 'modelo', db: true, sha: '8cc9762aaaabbbbccccddddeeeeffff0000111122', cargadoEn: '2026-10-30T20:40:00Z' };
  if (ruta === 'estado') return { proyecto: 'str', conteos: {} };
  let fs_ = (T[ruta] || []).slice();
  for (const k of ['archivo', 'prefijo', 'estado']) { const v = u.searchParams.get(k); if (v !== null) fs_ = fs_.filter((f) => k === 'archivo' ? f.archivo === v : k === 'prefijo' ? String(f.archivo).startsWith(v) : f.estado === v); }
  fs_.sort((a, b) => String(a.id || a.archivo).localeCompare(String(b.id || b.archivo)));
  const desde = +(u.searchParams.get('desde') || 0), lim = +(u.searchParams.get('limite') || 500);
  return { ok: true, total: fs_.length, filas: fs_.slice(desde, desde + lim) };
}
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 900 } });
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(String(e).slice(0, 160)));
  await ctx.route('https://www.gstatic.com/**', (r) => r.fulfill({ contentType: 'text/javascript', body: r.request().url().includes('auth') ? AUTH : APP }));
  const cors = { 'Access-Control-Allow-Origin': PRO, 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
  for (const [host, inicio] of [[FAB, '/sitios/fabrica/index.html'], [PRO, '/sitios/proyectos/index.html']]) await ctx.route(host + '/**', (r) => {
    const u = new URL(r.request().url());
    if (u.pathname.startsWith('/modelo/api/')) {
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors });
      return r.fulfill({ status: 200, headers: Object.assign({ 'Content-Type': 'application/json' }, cors), body: JSON.stringify(servicio(u)) });
    }
    let pa = u.pathname; if (pa === '/') pa = inicio;
    const f = path.join(RAIZ, pa); if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    return r.fulfill({ status: 200, headers: { 'Content-Type': tipo(f), 'Content-Security-Policy': /visor\.html$/.test(f) ? CSP_VISOR : CSP }, body: fs.readFileSync(f) });
  });
  const G = require(process.argv[4]);
  const salida = {};
  const solo = (process.env.SOLO || '').split(',').filter(Boolean);
  for (const caso of G.casos.filter((c) => !solo.length || solo.includes(c.c))) {
    const vistos = [];
    const h = { page: p, BASE: 'https://app.apartamentosbucaramanga.com', captura: async (n, o) => { if (process.env.CAP) { if (o && o.ancho) await p.setViewportSize({ width: o.ancho, height: o.ancho > 500 ? 900 : 844 }); await p.waitForTimeout(300); await p.screenshot({ path: path.join(process.env.CAP, n + '.png') }); } },
      espera: (c, o) => vistos.push((c ? 'si: ' : 'NO: ') + o),
      entrarSitio: async (url) => { await p.goto(url); await p.waitForFunction(() => ['lista', 'error', 'denegada'].includes(document.documentElement.dataset.sesion), null, { timeout: 15000 }).catch(() => {}); const e = await p.evaluate(() => document.documentElement.dataset.sesion).catch(() => null); return { ok: e === 'lista', estado: e, observado: 'admin: sitio en «' + e + '»' }; },
      leerModelo: async (ruta) => { const u = new URL('http://x/modelo/api/' + ruta); return { status: 200, cuerpo: servicio(u) }; } };
    await caso.prueba(h).catch((e) => vistos.push('EXC: ' + e.message));
    salida[caso.c] = vistos;
  }
  salida.errores = errores;
  if (process.env.LECTURAS) salida.lecturas = lecturas;
  console.log(JSON.stringify(salida, null, 1));
  await b.close();
})();
