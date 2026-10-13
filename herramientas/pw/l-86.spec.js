// l-86.spec.js (M-288): corre solo limpiar() del guion de L-86 (REQ-INV2-4-1-interfaz.spec.js del repo str-manager en LENOVO).
// Lo lanza la cola v7.8 con correr\l-86.txt -> lote L-86 -> prefijo zz-verif-L-86-. Sin casos: no prueba nada, solo limpia.
const path = require('path');
const os = require('os');
const spec = require(path.join(os.homedir(), 'str-manager', 'tests', 'e2e', 'REQ-INV2-4-1-interfaz.spec.js'));
module.exports = { req: spec.req, zona: spec.zona, casos: [], limpiar: spec.limpiar };
