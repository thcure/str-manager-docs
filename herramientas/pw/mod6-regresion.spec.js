// mod6-regresion.spec.js (M-311): regresión de la zona modelo para L-93. Junta los casos de los guiones
// REQ-MOD-6*.spec.js del repo str-manager en LENOVO (todos de solo lectura salvo sondeos sin token con {}).
// Lo lanza la cola v7.8 con correr\mod6-regresion.txt -> log\MOD6-REGRESION-guion.json.
const path = require('path');
const os = require('os');
const dir = path.join(os.homedir(), 'str-manager', 'tests', 'e2e');
const archivos = ['REQ-MOD-6.spec.js', 'REQ-MOD-6-carga.spec.js', 'REQ-MOD-6-lectura.spec.js', 'REQ-MOD-6-complemento.spec.js', 'REQ-MOD-6-credenciales.spec.js'];
const casos = [];
for (const a of archivos) {
  const spec = require(path.join(dir, a));
  for (const c of spec.casos || []) casos.push(Object.assign({}, c, { c: a.replace('.spec.js', '') + ':' + c.c }));
}
module.exports = { req: 'REQ-MOD-6', zona: 'modelo', casos };
