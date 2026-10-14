// pruebas-v1.test.js - funciones puras de guion.js, semilla.js y probar-lote.js (sin navegador). Uso: node pruebas-v1.test.js
'use strict';
const { extraerGuion, igual, loteDe, cerrarCaso } = require('./guion');
const { nombresZz, evaluar, evaluarRelacion, alcanceRelacion, registros } = require('./semilla');
const { versionNueva } = require('./probar-lote');
const { argsCamara, explicarError } = require('./comun');
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
const cc = cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, [{ metodo: 'PUT', url: '/api/col' }]);
t('escritura cortada es aviso, no fallo', cc.ok === true && cc.escriturasCortadas === 1 && cc.observado.includes('aviso'));
t('caso con error no pasa', cerrarCaso(caso, [{ ok: true, observado: 'x' }], 'boom', []).ok === false);
const c3 = { c: 'e', perfil: 'admin', pagina: '/p.html', nivel: 'N3' };
t('N3 preparado queda para el juez (ok null)', cerrarCaso(c3, [], null, [], [{ nombre: 'x', png: 'a.png' }]).ok === null);
t('N3 sin captura no se pudo preparar', cerrarCaso(c3, [], null, [], []).ok === false);
t('N3 con espera fallida no se pudo preparar', cerrarCaso(c3, [{ ok: false, observado: 'x' }], null, [], [{ nombre: 'x' }]).ok === false);
t('N3 lleva sus capturas', cerrarCaso(c3, [], null, [], [{ nombre: 'x', png: 'a.png' }]).capturas.length === 1);
const j = { items: [{ id: 1, data: { nombre: 'zz-verif-Propiedad' } }, { id: 2, data: { nombre: 'Real' } }, { id: 3, deleted: 1, data: { nombre: 'zz-verif-Vieja' } }] };
const n = nombresZz(j);
t('nombres zz-verif- sin borrados ni reales', n.has('zz-verif-Propiedad') && !n.has('Real') && !n.has('zz-verif-Vieja') && n.size === 1);
const gr = { id: 'propiedades', fuente: '/api/col?id=propiedades', nombres: ['zz-verif-Propiedad', 'zz-verif-Propiedad-2'] };
t('semilla: falta uno', evaluar(gr, n, true, false).estado === 'falta');
t('semilla: incremental no concluye', evaluar(gr, n, true, true).estado === 'no concluyente');
t('semilla: no vista no concluye', evaluar(gr, n, false, false).estado === 'no concluyente');
t('semilla: completa', evaluar(gr, new Set(['zz-verif-Propiedad', 'zz-verif-Propiedad-2']), true, false).estado === 'ok');
t('semilla: minimo', evaluar({ id: 'f', fuente: 'x', minimo: 1 }, new Set(), true, false).estado === 'falta');

// v2 (M-263): relaciones de la semilla
const cu = {
  propiedades: [{ items: [{ id: 'p1', data: { nombre: 'zz-verif-Propiedad', colaboradorBaseId: 'u3' } }, { id: 'p9', deleted: 1, data: { nombre: 'zz-verif-Propiedad', colaboradorBaseId: 'u2' } }] }],
  usuarios: [[{ id: 'u2', nombre: 'zz-verif-oper', rol: 'operador', permisos: '{"todo":false,"inventario.ver":true}' }, { id: 'u3', nombre: 'zz-verif-colab', rol: 'colaborador' }]],
  zonas: [{ items: [{ id: 'z1', data: { nombre: 'zz-verif-Principal', rol: 'principal', propIds: ['p1'] } }, { id: 'z2', data: { nombre: 'zz-verif-Vieja', tipo: 'principal', propId: 'p1', activo: false } }] }],
};
const vg = { propiedades: true, usuarios: true, zonas: true };
t('registros: planos y sin borrados', registros(cu.propiedades).length === 1 && registros(cu.propiedades)[0].colaboradorBaseId === 'u3');
t('relacion: colaborador base ok', evaluarRelacion({ id: 'a', tipo: 'colaboradorBase', propiedad: 'zz-verif-Propiedad', usuario: 'zz-verif-colab' }, cu, vg).estado === 'ok');
t('relacion: colaborador base equivocado', evaluarRelacion({ id: 'a', tipo: 'colaboradorBase', propiedad: 'zz-verif-Propiedad', usuario: 'zz-verif-oper' }, cu, vg).estado === 'falta');
t('relacion: zona principal activa (la inactiva no cuenta)', evaluarRelacion({ id: 'b', tipo: 'zonaPrincipalActiva', propiedad: 'zz-verif-Propiedad', minimo: 1 }, cu, vg).observado.startsWith('1 '));
t('relacion: minimo 2 falta', evaluarRelacion({ id: 'b', tipo: 'zonaPrincipalActiva', propiedad: 'zz-verif-Propiedad', minimo: 2 }, cu, vg).estado === 'falta');
t('relacion: operador sin permiso ok', evaluarRelacion({ id: 'c', tipo: 'sinPermiso', usuario: 'zz-verif-oper', permiso: 'inventario.editar' }, cu, vg).estado === 'ok');
t('relacion: con todo:true falta', evaluarRelacion({ id: 'c', tipo: 'sinPermiso', usuario: 'zz-verif-oper', permiso: 'inventario.editar' }, { usuarios: [[{ id: 'u2', nombre: 'zz-verif-oper', rol: 'operador', permisos: { todo: true } }]] }, vg).estado === 'falta');
t('relacion: sin permisos en la respuesta no concluye', evaluarRelacion({ id: 'c', tipo: 'sinPermiso', usuario: 'zz-verif-colab', permiso: 'x' }, cu, vg).estado === 'no concluyente');
t('relacion: grupo no visto no concluye', evaluarRelacion({ id: 'a', tipo: 'colaboradorBase', propiedad: 'x', usuario: 'y' }, cu, { propiedades: true }).estado === 'no concluyente');
t('relacion para otro lote: falta → aviso', alcanceRelacion({ para: 'L-86' }, { estado: 'falta', observado: 'x' }, 'L-85').estado === 'aviso');
t('relacion para este lote: sigue falta', alcanceRelacion({ para: 'L-86' }, { estado: 'falta', observado: 'x' }, 'L-86').estado === 'falta');
t('relacion sin lote (a mano): estricta', alcanceRelacion({ para: 'L-86' }, { estado: 'falta', observado: 'x' }, undefined).estado === 'falta');
t('relacion sin para: siempre bloquea', alcanceRelacion({}, { estado: 'falta', observado: 'x' }, 'L-85').estado === 'falta');
// v4 (pw 0.5.6, M-361): lugares en la zona principal y tarea de inventario; 'para' también degrada el no concluyente
{
  const c4 = { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad' } }]], zonas: [[{ id: 'z1', data: { nombre: 'zz-verif-Z', rol: 'principal', propIds: ['p1'] } }]],
    lugares: [[{ id: 'l1', data: { nombre: 'zz-verif-Repisa 01', depositoId: 'z1' } }, { id: 'l2', data: { nombre: 'zz-verif-Contenedor A', depositoId: 'z9' } }]],
    flujos: [[{ id: 'f1', data: { nombre: 'zz-verif-Flujo base', tareas: [{ nombre: 'zz-verif-Conteo de cierre', inventario: { lista: 'conteo', articulos: [1, 2, 3, 4, 5, 6] } }] } }]] };
  const v4 = { propiedades: true, zonas: true, lugares: true, flujos: true };
  t('relacion: lugar en zona principal ok', evaluarRelacion({ id: 'l', tipo: 'lugaresEnZonaPrincipal', propiedad: 'zz-verif-Propiedad', lugares: ['zz-verif-Repisa 01'] }, c4, v4).estado === 'ok');
  t('relacion: lugar en otra zona falta', evaluarRelacion({ id: 'l', tipo: 'lugaresEnZonaPrincipal', propiedad: 'zz-verif-Propiedad', lugares: ['zz-verif-Repisa 01', 'zz-verif-Contenedor A'] }, c4, v4).estado === 'falta');
  t('relacion: tarea de inventario ok', evaluarRelacion({ id: 't', tipo: 'tareaInventario', flujo: 'zz-verif-Flujo base', tarea: 'zz-verif-Conteo de cierre', lista: 'conteo', articulos: 6 }, c4, v4).estado === 'ok');
  t('relacion: tarea con menos artículos falta', evaluarRelacion({ id: 't', tipo: 'tareaInventario', flujo: 'zz-verif-Flujo base', tarea: 'zz-verif-Conteo de cierre', articulos: 7 }, c4, v4).estado === 'falta');
  t('relacion: tarea con otra lista falta', evaluarRelacion({ id: 't', tipo: 'tareaInventario', flujo: 'zz-verif-Flujo base', tarea: 'zz-verif-Conteo de cierre', lista: 'entrega' }, c4, v4).estado === 'falta');
  t('para otro lote: no concluyente → aviso', alcanceRelacion({ para: 'L-86, L-101' }, { estado: 'no concluyente', observado: 'x' }, 'L-100').estado === 'aviso');
  const c5 = { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad', flujoBaseId: 'f1', invPrincipalId: 'z1' } }]], zonas: c4.zonas,
    flujos: [[{ id: 'f1', data: { nombre: 'zz-verif-Flujo base' } }]] };
  const c6 = { propiedades: c5.propiedades, zonas: c4.zonas, flujos: [[{ id: 'f1', data: { nombre: 'zz-verif-Flujo base' } }, { id: 'f2', data: { nombre: 'zz-verif-Flujo base', esPlantilla: false, propId: 'p1', plantillaId: 'f1' } }]] };
  const v5 = { propiedades: true, flujos: true, zonas: true };
  t('relacion: flujo base de la propiedad ok', evaluarRelacion({ id: 'fb', tipo: 'flujoBasePropiedad', propiedad: 'zz-verif-Propiedad', flujo: 'zz-verif-Flujo base' }, c5, v5).estado === 'ok');
  t('relacion: con copia por propiedad falta', evaluarRelacion({ id: 'fb', tipo: 'flujoBasePropiedad', propiedad: 'zz-verif-Propiedad', flujo: 'zz-verif-Flujo base' }, c6, v5).estado === 'falta');
  t('relacion: plantilla de otra propiedad no es copia', evaluarRelacion({ id: 'fb', tipo: 'flujoBasePropiedad', propiedad: 'zz-verif-Propiedad', flujo: 'zz-verif-Flujo base' }, { propiedades: c5.propiedades, zonas: c4.zonas, flujos: [[{ id: 'f1', data: { nombre: 'zz-verif-Flujo base' } }, { id: 'f3', data: { nombre: 'x', esPlantilla: false, propId: 'p9', plantillaId: 'f1' } }]] }, v5).estado === 'ok');
  t('relacion: zona principal de inventario ok', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Z' }, c5, v5).estado === 'ok');
  t('relacion: otra zona principal falta', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Otra' }, { propiedades: c5.propiedades, zonas: [[{ id: 'z9', data: { nombre: 'zz-verif-Otra' } }]] }, v5).estado === 'falta');
  t('para con dos lotes: el segundo bloquea', alcanceRelacion({ para: 'L-86, L-101' }, { estado: 'falta', observado: 'x' }, 'L-101').estado === 'falta');
}
t('error 21: perfil en uso', explicarError(new Error('browserType.launchPersistentContext: Target page closed\n  - <process did exit: exitCode=21, signal=null>'), 'admin').startsWith('perfil en uso'));
t('otro error: primera linea', explicarError(new Error('boom\nmas'), 'admin') === 'boom');
t('sin camara no hay argumentos', argsCamara(null).length === 0);
t('camara sintetica', argsCamara(true).includes('--use-fake-device-for-media-stream') && argsCamara(true).length === 2);
t('camara con video', argsCamara('x/qr.y4m').some(a => a.startsWith('--use-file-for-fake-video-capture=')));
console.log(ok + ' OK, ' + fail + ' FAIL');
process.exit(fail ? 1 : 0);
