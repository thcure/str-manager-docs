// rafaga.spec.js v1.1 - prueba de ráfaga de RT-25 (sobre de capacidad) y RT-19 (conexiones del hosting compartido). LM-68, plan de
// arquitectura A2; riesgo R-6 (INC-128: «Base de datos no disponible», errores 1040/1203 con varias pantallas a la vez).
// Lo mantiene el Arquitecto; la cola lo corre con correr\rafaga.txt -> log\RAFAGA-guion.json. SOLO LECTURA: 12 GET de
// colecciones en paralelo por STRApi.get (la sesión del STR va en el encabezado, no en cookie: un fetch a pelo da 401 y no
// toca la base, primera corrida 21-oct 21:27) con el perfil admin de zz-verif-pruebas (la guardia de pw corta cualquier
// escritura), con /api/diagnostico antes y después. Los tres casos van con el MISMO perfil porque guion.js agrupa los casos
// por perfil: con colab en medio, «después» corría antes que la ráfaga (v1). Nunca en hora de turnos: solo corre entre las 22:30 y las 05:30 de Bogotá,
// o si Carlos deja el archivo RAFAGA-AHORA en la raíz de la cola; fuera de eso los casos quedan «OMITIDO» (verdes, con el
// motivo) y no se toca el servidor. Rojo: algún GET con 500 «Base de datos no disponible», 1040 o 1203, o sin respuesta;
// o conexiones del diagnóstico >= UMBRAL después de la ráfaga. El resultado alimenta esquema.json › arquitectura.capacidad.
const fs = require('fs'), path = require('path');
const PARALELAS = 12, RONDAS = 2, PAUSA_MS = 2000, UMBRAL = 60, MUESTRAS_DIAG = 3;
// Colecciones que lee la app del colaborador (mapa-modulos.json › HK/FL/PR › colecciones.lee); un 403 cuenta como respuesta, no como rojo.
const COLECCIONES = ['propiedades', 'turnos', 'flujos', 'flujo-categorias', 'hk-config', 'guias', 'inv-articulos', 'inv-depositos', 'inv-grupos', 'inv-estados', 'prop-tipos', 'ubicaciones'];
const FORZAR = path.resolve(__dirname, '..', 'RAFAGA-AHORA');

function horaBogota(d = new Date()) {
  const f = new Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d);
  const h = +f.find(x => x.type === 'hour').value, m = +f.find(x => x.type === 'minute').value;
  return h * 60 + m;
}
// Ventana sin turnos: 22:30–05:30 (minutos desde medianoche). Pura, para la prueba.
function enVentana(min) { return min >= 22 * 60 + 30 || min < 5 * 60 + 30; }
function puedeCorrer() {
  if (fs.existsSync(FORZAR)) return { ok: true, motivo: 'RAFAGA-AHORA presente (Carlos)' };
  const m = horaBogota();
  return enVentana(m) ? { ok: true, motivo: 'ventana nocturna' } : { ok: false, motivo: 'fuera de la ventana 22:30–05:30 de Bogotá (ahora ' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + '); para forzar, Carlos crea el archivo RAFAGA-AHORA en la raíz de la cola' };
}
// Clasifica una respuesta de GET: rojo si 500 con «Base de datos no disponible», 1040/1203 en el cuerpo o sin respuesta. Pura.
function esRojo(r) {
  if (!r || r.error) return true;
  const cuerpo = String(r.texto || '');
  if (/\b(1040|1203)\b/.test(cuerpo)) return true;
  if (r.status === 500 && /base de datos no disponible/i.test(cuerpo)) return true;
  if (r.status === 500 || r.status === 502 || r.status === 503 || r.status === 504) return true;
  return false;
}
const ESTADO = { antes: null, despues: null, rafaga: null };

async function diagnostico(p) {
  const leer = () => p.evaluate(async () => {
    try {
      if (window.STRApi && typeof STRApi.get === 'function') { try { const j = await STRApi.get('/diagnostico'); if (j && typeof j === 'object') return { j }; } catch (e) { } }
      const r = await fetch('/api/diagnostico', { credentials: 'include' }); let j = null; try { j = await r.json(); } catch (e) { }
      return { status: r.status, j };
    } catch (e) { return { error: String(e && e.message || e) }; }
  });
  const m = [];
  for (let i = 0; i < MUESTRAS_DIAG; i++) {
    const r = await leer(); const j = (r && r.j) || {};
    m.push({ t: new Date().toISOString().slice(11, 19), conexiones: j.conexiones, dormidas: j.dormidas, maxUsuario: j.maxUsuario, persistente: j.persistente, error: r.error || (j && j.error) });
    if (i < MUESTRAS_DIAG - 1) await p.waitForTimeout(1500);
  }
  const ok = m.filter(x => typeof x.conexiones === 'number');
  return { muestras: m, max: ok.length ? Math.max(...ok.map(x => x.conexiones)) : null, validas: ok.length };
}

function casoDiag(c, cuando) {
  return {
    c, perfil: 'admin', pagina: '/str-app-shell.html',
    que: '/api/diagnostico ' + cuando + ' de la ráfaga: conexiones < ' + UMBRAL + ' (RT-19)',
    async prueba(h) {
      const puede = puedeCorrer();
      if (!puede.ok) { h.espera(true, 'OMITIDO: ' + puede.motivo); return; }
      await h.page.waitForLoadState('networkidle').catch(() => {});
      const d = await diagnostico(h.page); ESTADO[cuando] = d;
      h.espera(d.validas === MUESTRAS_DIAG, 'lecturas válidas ' + d.validas + '/' + MUESTRAS_DIAG + (d.validas ? '' : ' · ' + JSON.stringify(d.muestras[0]).slice(0, 200)));
      h.espera(d.max != null && d.max < UMBRAL, 'conexiones máx. ' + d.max + ' · dormidas ' + d.muestras.map(x => x.dormidas).join(',') + ' · maxUsuario ' + (d.muestras[0] && d.muestras[0].maxUsuario));
      if (cuando === 'despues' && ESTADO.antes && ESTADO.antes.max != null && d.max != null) h.espera(true, 'antes ' + ESTADO.antes.max + ' → después ' + d.max + (ESTADO.rafaga ? ' · ráfaga: ' + ESTADO.rafaga : ''));
    },
  };
}

module.exports = {
  req: 'RAFAGA',
  zona: 'sesiones',
  casos: [
    casoDiag('a', 'antes'),
    {
      c: 'b', perfil: 'admin', pagina: '/str-app-shell.html',
      que: RONDAS + ' rondas de ' + PARALELAS + ' GET /api/col/* en paralelo (STRApi.get, sesión real) con 200 y sin 1040/1203 ni «Base de datos no disponible» (RT-25)',
      async prueba(h) {
        const puede = puedeCorrer();
        if (!puede.ok) { h.espera(true, 'OMITIDO: ' + puede.motivo); return; }
        const p = h.page;
        await p.waitForLoadState('networkidle').catch(() => {});
        const rondas = [];
        for (let r = 0; r < RONDAS; r++) {
          const t0 = Date.now();
          const res = await p.evaluate(async (cols) => {
            // STRApi.get pone la sesión del STR; resuelve con el JSON (200) o rechaza con e.status y e.message (401/403/500…).
            const una = async (c) => {
              const ini = performance.now();
              if (!window.STRApi || typeof STRApi.get !== 'function') return { col: c, error: 'sin STRApi en la página', ms: 0 };
              try {
                const j = await STRApi.get('/col/' + c);
                const n = Array.isArray(j) ? j.length : (j && Array.isArray(j.items)) ? j.items.length : null;
                return { col: c, status: 200, ms: Math.round(performance.now() - ini), texto: '', filas: n };
              } catch (e) {
                const st = (e && e.status) || 0;
                const texto = String((e && (e.message || e.error)) || '').slice(0, 300);
                return st ? { col: c, status: st, ms: Math.round(performance.now() - ini), texto } : { col: c, error: texto || 'sin respuesta', ms: Math.round(performance.now() - ini) };
              }
            };
            return Promise.all(cols.map(una));
          }, COLECCIONES.slice(0, PARALELAS)).catch(e => COLECCIONES.map(c => ({ col: c, error: String(e && e.message || e) })));
          const rojos = res.filter(esRojo);
          rondas.push({ ronda: r + 1, totalMs: Date.now() - t0, maxMs: Math.max(...res.map(x => x.ms || 0)), codigos: res.map(x => x.status || 'ERR').join(','), filas: res.reduce((n, x) => n + (x.filas || 0), 0), rojos: rojos.map(x => x.col + ':' + (x.status || x.error)).join(' ') });
          if (r < RONDAS - 1) await p.waitForTimeout(PAUSA_MS);
        }
        const rojosTotal = rondas.reduce((n, x) => n + (x.rojos ? x.rojos.split(' ').length : 0), 0);
        ESTADO.rafaga = rondas.map(x => 'R' + x.ronda + ' ' + x.totalMs + ' ms (máx ' + x.maxMs + ')').join(' · ');
        const con200 = rondas.every(x => x.codigos.split(',').filter(c => c === '200').length >= PARALELAS / 2);
        h.espera(con200, 'la ráfaga tocó la base: ' + rondas.map(x => x.codigos.split(',').filter(c => c === '200').length + '/' + PARALELAS + ' con 200').join(', ') + (con200 ? '' : ' (sin sesión o sin permiso: la prueba no mide nada)'));
        h.espera(rojosTotal === 0, rondas.map(x => 'ronda ' + x.ronda + ': ' + x.totalMs + ' ms, máx ' + x.maxMs + ' ms, ' + x.filas + ' filas, códigos ' + x.codigos + (x.rojos ? ' · ROJOS ' + x.rojos : '')).join(' | ') + ' · modo: ' + puede.motivo);
      },
    },
    casoDiag('c', 'despues'),
  ],
  _puras: { enVentana, esRojo, COLECCIONES, PARALELAS, UMBRAL },
};
