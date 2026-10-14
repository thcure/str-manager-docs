// espejo.js - LM-34 (B7-6): comparación diaria servicio ↔ Git, en GitHub Actions. Uso: node herramientas/modelo/espejo.js
// GET salud (sha cargado) → GET export (token rol «carga») → cada archivo con el formato exacto de pw/json-crudo.js
// (el mismo del EXPORTAR de la cola, LM-28/LM-29) contra `git show <sha>:<ruta>`, byte a byte.
// Registro PÚBLICO: solo sha, conteo y las rutas distintas; nunca contenido ni token. Salida 0 = 0 diferencias.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs');
const { bonito, valorCrudo, conFinDeLinea } = require('../pw/json-crudo');
const BASE = (process.env.MODELO_BASE || 'https://fabrica.apartamentosbucaramanga.com').replace(/\/$/, '');
const lineas = [];
const log = t => { lineas.push(t); console.log(t); };
function fin(ok) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (f) fs.appendFileSync(f, ['```', ...lineas, '```', ''].join('\n'));
  process.exit(ok ? 0 : 1);
}
(async () => {
  const token = (process.env.MODELO_TOKEN || '').trim();
  if (!token) { log('espejo: falta el secreto MODELO_TOKEN'); return fin(false); }
  let sha;
  try { const r = await fetch(BASE + '/modelo/api/salud'); const j = await r.json(); sha = j && j.sha; log(`salud: ${r.status} sha=${sha || '?'}`); }
  catch (e) { log('salud: 0'); return fin(false); }
  if (!sha) { log('espejo: el servicio no dice qué sha tiene cargado'); return fin(false); }
  let texto, cuerpo;
  try {
    const r = await fetch(BASE + '/modelo/api/export', { headers: { 'X-Modelo-Token': token } });
    texto = await r.text(); log(`export: ${r.status}`);
    if (!r.ok) return fin(false);
    cuerpo = JSON.parse(texto);
  } catch (e) { log('export: 0'); return fin(false); }
  const distintos = []; let n = 0;
  for (const [ruta, contenido] of Object.entries(cuerpo.archivos || {})) {
    if (!/^interno\/[a-z0-9_\/-]+\.json$/.test(ruta) || ruta.includes('..')) continue;
    n++;
    const crudo = valorCrudo(texto, ['archivos', ruta]);
    const servicio = Buffer.from(conFinDeLinea(crudo ? bonito(crudo) : JSON.stringify(contenido, null, 1)), 'utf8');
    let git;
    try { git = execFileSync('git', ['show', `${sha}:${ruta}`], { maxBuffer: 64 * 1024 * 1024 }); } catch (e) { distintos.push(ruta + ' (no está en el commit)'); continue; }
    if (!servicio.equals(git)) distintos.push(ruta);
  }
  log(`espejo: ${n} archivos, ${distintos.length} distintos`);
  for (const d of distintos) log('  - ' + d);
  fin(n > 0 && distintos.length === 0);
})();
