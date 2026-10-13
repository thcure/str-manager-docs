// comun.js - verificador local (Playwright) del STR (B10-1, LM-17; lo mantiene el Arquitecto).
// Perfiles persistentes de prueba en pw\perfiles\<usuario>\ (cookies del STR); nunca el perfil de Carlos.
// Guardia de red: el navegador solo habla con la lista de hosts; toda escritura al STR sin 'zz-verif-' se corta.
'use strict';
const path = require('path');
const { chromium } = require('playwright');

const COLA = path.resolve(__dirname, '..');
const BASE = 'https://app.apartamentosbucaramanga.com';
const PERFILES = { admin: 'zz-verif-admin', oper: 'zz-verif-oper', colab: 'zz-verif-colab', colab2: 'zz-verif-colab2' };
const HOSTS_OK = ['app.apartamentosbucaramanga.com', 'securetoken.googleapis.com', 'identitytoolkit.googleapis.com',
  'firestore.googleapis.com', 'www.googleapis.com', 'apis.google.com', 'www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
const LECTURA = ['GET', 'HEAD', 'OPTIONS'];
const ESCRITURA_PERMITIDA = [/^\/modelo\/api\/eco$/];

function dirPerfil(u) { return path.join(__dirname, 'perfiles', u); }

// Funcion pura (test en guardia.test.js): ¿se deja pasar esta peticion?
function decidir(url, metodo, cuerpo) {
  let u;
  try { u = new URL(url); } catch (e) { return { ok: false, motivo: 'url invalida' }; }
  if (u.protocol === 'data:' || u.protocol === 'blob:') return { ok: true };
  if (!HOSTS_OK.includes(u.hostname)) return { ok: false, motivo: 'host fuera de la lista: ' + u.hostname };
  if (LECTURA.includes(String(metodo).toUpperCase())) return { ok: true };
  if (u.hostname !== 'app.apartamentosbucaramanga.com') return { ok: true, nota: 'servicio de Google (identidad o lectura)' };
  if (ESCRITURA_PERMITIDA.some(r => r.test(u.pathname))) return { ok: true };
  if (String(cuerpo || '').includes('zz-verif-') || u.href.includes('zz-verif-')) return { ok: true };
  return { ok: false, motivo: 'escritura sin zz-verif- a ' + u.pathname };
}

// Abre el perfil persistente de un usuario de prueba. opciones: { headless, viewport, guardia }
async function abrir(usuario, opciones = {}) {
  if (!PERFILES[usuario]) throw new Error('usuario de prueba desconocido: ' + usuario);
  const ctx = await chromium.launchPersistentContext(dirPerfil(usuario), {
    headless: opciones.headless !== false,
    viewport: opciones.viewport || { width: 1366, height: 900 },
  });
  const bitacora = [];
  if (opciones.guardia !== false) {
    await ctx.route('**/*', async (route) => {
      const r = route.request();
      const d = decidir(r.url(), r.method(), r.postData());
      if (!LECTURA.includes(r.method()) || !d.ok) bitacora.push({ metodo: r.method(), url: r.url().slice(0, 200), paso: d.ok, motivo: d.motivo || d.nota || '' });
      return d.ok ? route.continue() : route.abort('blockedbyclient');
    });
  }
  return { ctx, bitacora };
}

module.exports = { COLA, BASE, PERFILES, HOSTS_OK, decidir, abrir, dirPerfil };
