// guiones-e2e.js — toma la foto de tests/e2e para el mapa del STR (LM-40). Solo lee: cabecera (req, zona, lote) y casos
// (c, perfil, pagina, nivel, que, camara, cubre, modulos, tec) de cada *.spec.js. Uso en LENOVO:
//   node herramientas\modelo\guiones-e2e.js C:\Users\ktcol\str-manager\tests\e2e > interno\arquitectura\guiones-e2e.json
// Después: python3 -I herramientas/modelo/mapa.py . (valida y regenera interno/arquitectura/mapa-str.html).
// V11 (LM-62, PRUEBAS-v2; ISO/IEC/IEEE 29119-5 §6.5): la biblioteca de palabras clave es el objeto `h` que guion.js entrega a cada
// caso (BIBLIOTECA). Cada guion deja `palabrasClave` {palabra: usos} y la foto trae `referenciaCruzada` {palabra: {guiones, usos}},
// `palabrasDesconocidas` (h.algo que la biblioteca no define) y `palabrasSinUso`. Autoridad: Arquitecto; una palabra nueva entra por lote.
const fs = require('fs'), path = require('path');
const BIBLIOTECA = {
  page: 'página de Playwright con la guardia de red (conDesvio); navegación y lectura',
  BASE: 'origen del STR en producción',
  lote: 'id del lote que corre (L-n) o del tren',
  espera: 'verificación: h.espera(condición, observado) registra el resultado del caso',
  dato: 'nombre de dato de prueba con prefijo zz-verif-L<n>-',
  respuesta: 'espera la respuesta HTTP que contiene un fragmento (opcionalmente tras una acción)',
  captura: 'guarda pantalla y texto para el juez N3 (nombre, {ancho, alto, esperaMs, completa})',
};
function palabrasDe(texto) {
  const usos = {};
  for (const m of String(texto || '').matchAll(/\bh\.([A-Za-z_]\w*)/g)) usos[m[1]] = (usos[m[1]] || 0) + 1;
  return usos;
}
function foto(dir) {
  const out = {};
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.spec.js')).sort()) {
    let m, texto = '';
    try { texto = fs.readFileSync(path.resolve(dir, f), 'utf8'); } catch (e) { }
    try { m = require(path.resolve(dir, f)); } catch (e) { out[f] = { error: String(e.message).slice(0, 80), palabrasClave: palabrasDe(texto) }; continue; }
    out[f] = { req: m.req || null, zona: m.zona || null, lote: m.lote || null,
      casos: (m.casos || []).map((c) => ({ c: c.c || c.id || null, perfil: c.perfil || null, pagina: c.pagina || null, nivel: c.nivel || 'N2', que: c.que || '', camara: !!c.camara, cubre: Array.isArray(c.cubre) ? c.cubre.map(String) : [], modulos: Array.isArray(c.modulos) ? c.modulos.map(String) : [], ...(c.tec ? { tec: String(c.tec) } : {}) })),
      palabrasClave: palabrasDe(texto) };
  }
  const ref = {};
  for (const [g, v] of Object.entries(out)) for (const [p, n] of Object.entries(v.palabrasClave || {})) { const r = (ref[p] = ref[p] || { guiones: 0, usos: 0 }); r.guiones++; r.usos += n; }
  const desconocidas = Object.keys(ref).filter((p) => !BIBLIOTECA[p]).sort();
  const sinUso = Object.keys(BIBLIOTECA).filter((p) => !ref[p]).sort();
  return { guiones: out, referenciaCruzada: ref, biblioteca: BIBLIOTECA, palabrasDesconocidas: desconocidas, palabrasSinUso: sinUso };
}
module.exports = { palabrasDe, foto, BIBLIOTECA };
if (require.main === module) {
  const dir = process.argv[2]; if (!dir) { console.error('uso: node guiones-e2e.js <carpeta tests/e2e>'); process.exit(2); }
  const r = foto(dir);
  const hoy = new Date(); const ymd = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
  process.stdout.write(JSON.stringify({ que: 'Foto de str-manager/tests/e2e (cabecera y casos: req, zona, c, perfil, pagina, nivel, que, tec; palabras clave por guion y referencia cruzada, V11 LM-62); la toma el Arquitecto o la cola; la leen herramientas/modelo/mapa.py y linea-base.py', tomadaEn: ymd, guiones: r.guiones, referenciaCruzada: r.referenciaCruzada, biblioteca: r.biblioteca, palabrasDesconocidas: r.palabrasDesconocidas, palabrasSinUso: r.palabrasSinUso }, null, 1) + '\n');
}
