// aplicar-lNNN.js (plantilla de Desarrollo): aplica en la carpeta hermana de fabrica-servicio los cambios de un lote.
// Uso: node aplicar-lNNN.js <carpeta de fabrica-servicio>. Primero lo valida todo en memoria (cada «busca» aparece una
// sola vez; los archivos nuevos no existen); si algo no cuadra, no escribe nada y sale con 1. Después escribe (LF) y
// compara el hash de git de cada archivo con el esperado.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const H = process.argv[2];
if (!H || !fs.existsSync(path.join(H, '.git'))) { console.log('FAIL carpeta sin .git: ' + H); process.exit(1); }
const OPS = [];
const HASHES = {};
const mem = {}; let mal = 0;
const leer = (r) => { if (!(r in mem)) mem[r] = fs.existsSync(path.join(H, r)) ? fs.readFileSync(path.join(H, r), 'utf8').replace(/\r\n/g, '\n') : null; return mem[r]; };
OPS.forEach((o, i) => {
  const t = leer(o.ruta);
  if (o.tipo === 'nuevo') { if (t !== null) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': ya existe'); } else mem[o.ruta] = o.texto; return; }
  if (t === null) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': no existe'); return; }
  const n = t.split(o.busca).length - 1;
  if (n !== 1) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': «busca» aparece ' + n + ' veces'); return; }
  mem[o.ruta] = t.replace(o.busca, () => o.pon);
});
if (mal) { console.log('No escribí nada: ' + mal + ' fallo(s).'); process.exit(1); }
for (const r of Object.keys(mem)) { fs.mkdirSync(path.dirname(path.join(H, r)), { recursive: true }); fs.writeFileSync(path.join(H, r), mem[r]); }
for (const [r, esp] of Object.entries(HASHES)) {
  const real = execFileSync('git', ['-C', H, 'hash-object', r], { encoding: 'utf8' }).trim();
  if (real !== esp) mal++;
  console.log((real === esp ? 'OK   ' : 'FAIL ') + r + ' ' + real + (real === esp ? '' : ' (esperado ' + esp + ')'));
}
console.log(mal ? 'Hash distinto en ' + mal + ' archivo(s).' : 'Todo igual: ' + Object.keys(HASHES).length + ' archivos.');
process.exit(mal ? 1 : 0);
