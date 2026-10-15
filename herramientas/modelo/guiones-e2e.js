// guiones-e2e.js — toma la foto de tests/e2e para el mapa del STR (LM-40). Solo lee: cabecera (req, zona, lote) y casos
// (c, perfil, pagina, nivel, que, camara) de cada *.spec.js. Uso en LENOVO:
//   node herramientas\modelo\guiones-e2e.js C:\Users\ktcol\str-manager\tests\e2e > interno\arquitectura\guiones-e2e.json
// Después: python3 -I herramientas/modelo/mapa.py . (valida y regenera interno/arquitectura/mapa-str.html).
const fs = require('fs'), path = require('path');
const dir = process.argv[2]; if (!dir) { console.error('uso: node guiones-e2e.js <carpeta tests/e2e>'); process.exit(2); }
const out = {};
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.spec.js')).sort()) {
  let m; try { m = require(path.resolve(dir, f)); } catch (e) { out[f] = { error: String(e.message).slice(0, 80) }; continue; }
  out[f] = { req: m.req || null, zona: m.zona || null, lote: m.lote || null,
    casos: (m.casos || []).map((c) => ({ c: c.c || c.id || null, perfil: c.perfil || null, pagina: c.pagina || null, nivel: c.nivel || 'N2', que: c.que || '', camara: !!c.camara })) };
}
const hoy = new Date(); const ymd = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
process.stdout.write(JSON.stringify({ que: 'Foto de str-manager/tests/e2e (solo cabecera y casos: req, zona, c, perfil, pagina, nivel, que); la toma el Arquitecto o la cola; la lee herramientas/modelo/mapa.py', tomadaEn: ymd, guiones: out }, null, 1) + '\n');
