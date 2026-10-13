// pruebas-v1.test.js - funciones puras de guion.js, semilla.js y probar-lote.js (sin navegador). Uso: node pruebas-v1.test.js
'use strict';
const { extraerGuion, igual, loteDe, cerrarCaso } = require('./guion');
const { nombresZz, evaluar } = require('./semilla');
const { versionNueva } = require('./probar-lote');
let ok = 0, fail = 0;
const t = (n, c) => { if (c) { ok++; console.log('OK   ' + n); } else { fail++; console.log('FAIL ' + n); } };

const instr = [
  '# instr', 'Alcance: `str-x.html` · `?v=` → `p5c80` (sea cual sea la versión actual) en estos 18 HTML', '', '## Pruebas',
  '### Guion N2 → `tests/e2e/REQ-PR-5.spec.js` (la CLI lo copia tal cual)', '', '```js', "module.exports = { req: 'REQ-PR-5', zona: 'hk', casos: [] };", '```', 'fin'].join('\r\n');
const g = extraerGuion(instr);
t('extrae la ruta del guion', g && g.ruta === 'tests/e2e/REQ-PR-5.spec.js');
t('extrae el codigo sin las vallas', g && g.codigo === "module.exports = { req: 'REQ-PR-5', zona: 'hk', casos: [] };\n");
t('sin marca no hay guion', extraerGuion('## Pruebas\n```js\nx\n```') === null);
t('marca sin bloque da error', extraerGuion('### Guion N2 → `tests/e2e/a.spec.js`\ntexto').error.includes('falta'));
t('bloque sin cerrar da error', extraerGuion('### Guion N2 → `tests/e2e/a.spec.js`\n```js\nx').error.includes('no se cierra'));
t('igual ignora CRLF y salto final', igual('a\r\nb\r\n', 'a\nb'));
t('igual detecta un byte distinto', !igual('a\nb\n', 'a\nc\n'));
t('lote L-n desde el nombre', loteDe('C:\\x\\hechas\\L-80-instr-y.md') === 'L-80' && loteDe('75-instr-z.md') === 'L-75' && loteDe('nada.md') === null);
t('version nueva desde la cabecera', versionNueva(instr) === 'p5c80');
t('sin cambio de ?v= no hay version', versionNueva('Alcance: `a` · **sin cambio de `?v=`** · x') === null);
t('plantilla no da version', versionNueva('Alcance: <archivos> · `?v=<actual>` → `<nuevo>` en <dónde>') === null);
const caso = { c: 'a', perfil: 'admin', pagina: '/p.html', que: 'q' };
t('caso con esperas buenas pasa', cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, []).ok === true);
t('caso sin esperas no pasa', cerrarCaso(caso, [], null, []).ok === false);
t('caso con escritura cortada no pasa', cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, [{ metodo: 'PUT', url: '/api/col' }]).ok === false);
t('caso con error no pasa', cerrarCaso(caso, [{ ok: true, observado: 'x' }], 'boom', []).ok === false);
const j = { items: [{ id: 1, data: { nombre: 'zz-verif-Propiedad' } }, { id: 2, data: { nombre: 'Real' } }, { id: 3, deleted: 1, data: { nombre: 'zz-verif-Vieja' } }] };
const n = nombresZz(j);
t('nombres zz-verif- sin borrados ni reales', n.has('zz-verif-Propiedad') && !n.has('Real') && !n.has('zz-verif-Vieja') && n.size === 1);
const gr = { id: 'propiedades', fuente: '/api/col?id=propiedades', nombres: ['zz-verif-Propiedad', 'zz-verif-Propiedad-2'] };
t('semilla: falta uno', evaluar(gr, n, true, false).estado === 'falta');
t('semilla: incremental no concluye', evaluar(gr, n, true, true).estado === 'no concluyente');
t('semilla: no vista no concluye', evaluar(gr, n, false, false).estado === 'no concluyente');
t('semilla: completa', evaluar(gr, new Set(['zz-verif-Propiedad', 'zz-verif-Propiedad-2']), true, false).estado === 'ok');
t('semilla: minimo', evaluar({ id: 'f', fuente: 'x', minimo: 1 }, new Set(), true, false).estado === 'falta');
console.log(ok + ' OK, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
