// pruebas-v1.test.js - funciones puras de guion.js, semilla.js y probar-lote.js (sin navegador). Uso: node pruebas-v1.test.js
'use strict';
const { extraerGuion, igual, loteDe, cerrarCaso } = require('./guion');
const { nombresZz, evaluar, evaluarRelacion, alcanceRelacion, registros } = require('./semilla');
const { versionNueva, zonasRegresion, seleccionRegresion, tieneZona, carpetaCapturasAnterior } = require('./probar-lote');
let RUTA; try { RUTA = require('./ruta'); } catch (e) { RUTA = require('../modelo/ruta'); }   // en LENOVO vive como pw\ruta.js; en el repo, herramientas/modelo/ruta.js
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
  t('relacion: dos zonas con el mismo nombre, apunta a la activa', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Z' },
    { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad', invPrincipalId: 'z2' } }]], zonas: [[{ id: 'z0', data: { nombre: 'zz-verif-Z', rol: 'principal', propIds: ['p1'], activo: false } }, { id: 'z2', data: { nombre: 'zz-verif-Z', rol: 'principal', propIds: ['p1'] } }]] }, v5).estado === 'ok');
  t('relacion: apunta a la inactiva falta', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Z' },
    { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad', invPrincipalId: 'z0' } }]], zonas: [[{ id: 'z0', data: { nombre: 'zz-verif-Z', rol: 'principal', propIds: ['p1'], activo: false } }, { id: 'z2', data: { nombre: 'zz-verif-Z', rol: 'principal', propIds: ['p1'] } }]] }, v5).estado === 'falta');
  t('relacion: zona principal de inventario ok', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Z' }, c5, v5).estado === 'ok');
  t('relacion: otra zona principal falta', evaluarRelacion({ id: 'ip', tipo: 'invPrincipalPropiedad', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Otra' }, { propiedades: c5.propiedades, zonas: [[{ id: 'z9', data: { nombre: 'zz-verif-Otra' } }]] }, v5).estado === 'falta');
  const c7 = { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad' } }]], zonas: [[{ id: 'zt', data: { nombre: 'zz-verif-Tendedero', rol: 'otra', propIds: ['p1'] } }]],
    articulos: [[{ id: 'j2', data: { nombre: 'zz-verif-J2', clase: 'juego', propId: 'p1' } }, { id: 'j4', data: { nombre: 'zz-verif-J4', clase: 'unidad', propId: 'p1' } }]] };
  const v7 = { propiedades: true, zonas: true, articulos: true };
  t('relacion: zona con rol ok', evaluarRelacion({ id: 'zr', tipo: 'zonaConRol', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Tendedero', rol: 'otra' }, c7, v7).estado === 'ok');
  t('relacion: zona con otro rol falta', evaluarRelacion({ id: 'zr', tipo: 'zonaConRol', propiedad: 'zz-verif-Propiedad', zona: 'zz-verif-Tendedero', rol: 'principal' }, c7, v7).estado === 'falta');
  t('relacion: juego de la propiedad ok', evaluarRelacion({ id: 'jp', tipo: 'articulosDePropiedad', propiedad: 'zz-verif-Propiedad', nombres: ['zz-verif-J2'], clase: 'juego' }, c7, v7).estado === 'ok');
  t('relacion: clase distinta falta', evaluarRelacion({ id: 'jp', tipo: 'articulosDePropiedad', propiedad: 'zz-verif-Propiedad', nombres: ['zz-verif-J2', 'zz-verif-J4'], clase: 'juego' }, c7, v7).estado === 'falta');
  const c8 = { estados: [[{ id: 'e1', data: { nombre: 'zz-verif-Secando', pendiente: 'turno' } }, { id: 'e2', data: { nombre: 'zz-verif-Sucia', pendiente: 'nada', activo: false } }]] };
  t('relacion: estado con su pendiente ok', evaluarRelacion({ id: 'cv', tipo: 'campoValor', grupo: 'estados', nombre: 'zz-verif-Secando', campo: 'pendiente', valor: 'turno' }, c8, { estados: true }).estado === 'ok');
  t('relacion: estado inactivo falta', evaluarRelacion({ id: 'cv', tipo: 'campoValor', grupo: 'estados', nombre: 'zz-verif-Sucia', campo: 'pendiente', valor: 'nada' }, c8, { estados: true }).estado === 'falta');
  t('relacion: grupo no visto no concluye', evaluarRelacion({ id: 'cv', tipo: 'campoValor', grupo: 'estados', nombre: 'x' }, c8, {}).estado === 'no concluyente');
  t('para con dos lotes: el segundo bloquea', alcanceRelacion({ para: 'L-86, L-101' }, { estado: 'falta', observado: 'x' }, 'L-101').estado === 'falta');
}
t('error 21: perfil en uso', explicarError(new Error('browserType.launchPersistentContext: Target page closed\n  - <process did exit: exitCode=21, signal=null>'), 'admin').startsWith('perfil en uso'));
t('otro error: primera linea', explicarError(new Error('boom\nmas'), 'admin') === 'boom');
t('sin camara no hay argumentos', argsCamara(null).length === 0);
t('camara sintetica', argsCamara(true).includes('--use-fake-device-for-media-stream') && argsCamara(true).length === 2);
t('camara con video', argsCamara('x/qr.y4m').some(a => a.startsWith('--use-file-for-fake-video-capture=')));
// v0.5.12 (M-390): escrituras que pasaron, agrupadas con su porqué
{
  const { resumirEscrituras } = require('./guion');
  const B = 'https://app.apartamentosbucaramanga.com';
  const r = resumirEscrituras([
    { metodo: 'PUT', url: B + '/api/col/inv-movimientos', paso: true, motivo: '1 fila(s) de un turno o pendiente zz de la corrida, con referencias zz' },
    { metodo: 'PUT', url: B + '/api/col/inv-movimientos', paso: true, motivo: '1 fila(s) de un turno o pendiente zz de la corrida, con referencias zz' },
    { metodo: 'POST', url: B + '/api/upload', paso: true, motivo: 'foto con ref de un turno zz de la corrida' }]);
  t('escrituras agrupadas con conteo', r.length === 2 && r[0] === 'PUT app /api/col/inv-movimientos · 1 fila(s) de un turno o pendiente zz de la corrida, con referencias zz (x2)' && r[1].startsWith('POST app /api/upload · foto'));
  t('caso sin escrituras → []', Array.isArray(cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, []).escrituras) && cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, []).escrituras.length === 0);
}
// v0.5.17 (M-402): juegos en inv-grupos (relación con grupo)
{
  const { evaluarRelacion } = require('./semilla');
  const c = { propiedades: [[{ id: 'p1', data: { nombre: 'zz-verif-Propiedad' } }]], 'juegos-l103': [[{ id: 'g2', data: { nombre: 'zz-verif-J2', clase: 'juego', propId: 'p1', activo: true } }]] };
  const v = { propiedades: true, 'juegos-l103': true };
  t('relacion: juego en inv-grupos ok', evaluarRelacion({ id: 'jp', tipo: 'articulosDePropiedad', grupo: 'juegos-l103', propiedad: 'zz-verif-Propiedad', nombres: ['zz-verif-J2'], clase: 'juego' }, c, v).estado === 'ok');
  t('relacion: juego inactivo falta', evaluarRelacion({ id: 'jp', tipo: 'articulosDePropiedad', grupo: 'juegos-l103', propiedad: 'zz-verif-Propiedad', nombres: ['zz-verif-J2'], clase: 'juego' }, { propiedades: c.propiedades, 'juegos-l103': [[{ id: 'g2', data: { nombre: 'zz-verif-J2', clase: 'juego', propId: 'p1', activo: false } }]] }, v).estado === 'falta');
}
// v0.5.21 (INC-128): el 5xx de una escritura sale en observado con su cuerpo
{
  const r = cerrarCaso(caso, [{ ok: false, observado: 'turnos 500' }], null, [], [], [{ metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, status: 500, motivo: 'respuesta 500: {"error":"SQLSTATE[HY000]: 1205 Lock wait timeout"}' }]);
  t('5xx en observado con el mensaje', /error del servidor: PUT \/api\/col\/turnos → respuesta 500: .*1205/.test(r.observado));
}
// v0.5.22 (INC-128): cronología de escrituras

// v0.6.0 (LM-39b): seleccion de la regresion por la ruta del lote
{
  const mapa = { modulos: [{ id: 'HK' }, { id: 'POR' }, { id: 'INV' }, { id: 'K3' }, { id: 'KN' }, { id: 'SH' }, { id: 'SRV' }],
    relaciones: [{ id: 'REL-05', origen: 'HK', destino: 'POR', estado: 'vigente' }, { id: 'REL-30', origen: 'HK', destino: 'KN', estado: 'vigente' }],
    reglas: [{ id: 'RT-8', titulo: 'Corte', modulos: ['K3', 'HK'], prueba: 'caso' }],
    anclajeReq: { 'REQ-K3-2': ['K3', 'HK'], 'REQ-K2': ['KN'] },
    anclajeGuiones: { paginaModulo: { '/str-conocimiento.html': 'KN', '/portal.html': 'POR' }, reqModulo: { 'INC-130': ['HK', 'POR'] }, archivoModulo: { mapa: { 'str-cola-subida.js': ['HK', 'POR', 'INV', 'K3'] } } } };
  const guiones = [
    { archivo: 'INC-130.spec.js', spec: { req: 'INC-130', zona: 'inventario', casos: [{ c: 'a', perfil: 'colab', pagina: '/portal.html', cubre: ['HK', 'REL-05'] }] } },
    { archivo: 'REQ-K3b.spec.js', spec: { req: 'REQ-K3b', zona: ['K3', 'HK'], casos: [{ c: 'a', perfil: 'admin', pagina: '/str-app-shell.html', cubre: ['REL-16', 'RT-8'] }] } },
    { archivo: 'REQ-TB-5.spec.js', spec: { req: 'REQ-TB-5', zona: 'proyecto', casos: [{ c: 'a', perfil: 'admin', pagina: '/str-seg-proyecto.html', cubre: ['PRJ'] }] } },
    { archivo: 'REQ-INV2-4-2.spec.js', spec: { req: 'REQ-INV2-4-2', zona: 'inventario', casos: [{ c: 'c', perfil: 'colab', pagina: '/portal.html', cubre: ['INV', 'HK'] }] } },
  ];
  const cent = [{ guion: 'REQ-INV2-4-2.spec.js', inc: 'INC-133', desde: '2026-10-15' }];
  const cabCola = '# instr — INC-999: cola\nCategoría: **normal**\nAlcance: `str-cola-subida.js` · `?v=p1` → `p2`; no toques `api/`\nMapa: módulos y relaciones que cambia: HK\n';
  let r = seleccionRegresion(cabCola, null, guiones, mapa, cent, RUTA);
  t('seleccion por ruta: modo ruta y modulos HK, INV, K3, POR', r.modo === 'ruta' && r.ruta.modulos.join(',') === 'HK,INV,K3,POR');
  t('seleccion por ruta: corren los guiones de la ruta y no el de proyecto', r.corren.map(x => x.archivo).sort().join(',') === 'INC-130.spec.js,REQ-INV2-4-2.spec.js,REQ-K3b.spec.js' && r.noCorren.map(x => x.archivo).join() === 'REQ-TB-5.spec.js');
  t('seleccion por ruta: centinela entra por capa comun (str-cola-subida)', r.corren.find(x => x.archivo === 'REQ-INV2-4-2.spec.js').por.some(p => /centinela/.test(p)));
  const cabKn = '# instr — REQ-K2: guias\nCategoría: **estándar**\nAlcance: `str-conocimiento.html`\nMapa: módulos y relaciones que cambia: ninguna\n';
  r = seleccionRegresion(cabKn, null, guiones, mapa, cent, RUTA);
  t('seleccion por ruta: un lote en KN no corre inventario ni centinelas', r.corren.length === 0 && r.noCorren.length === 4 && r.ruta.modulos.join() === 'KN');
  r = seleccionRegresion('# instr — x\nAlcance: `str-cola-subida.js`\nRegresión: ninguna (solo guiones)\n', null, guiones, mapa, cent, RUTA);
  t('«Regresión: ninguna» no corre nada, ni centinelas', r.modo === 'declarada' && r.corren.length === 0);
  r = seleccionRegresion('# instr — x\nAlcance: `str-conocimiento.html`\nRegresión: todas\n', null, guiones, mapa, cent, RUTA);
  t('«Regresión: todas» corre los cuatro', r.corren.length === 4);
  r = seleccionRegresion('# instr — x\nAlcance: `str-conocimiento.html`\nRegresión: proyecto, K3\n', null, guiones, mapa, cent, RUTA);
  t('«Regresión: proyecto, K3» acepta zona y id de modulo (zona como lista)', r.corren.map(x => x.archivo).sort().join(',') === 'REQ-K3b.spec.js,REQ-TB-5.spec.js');
  r = seleccionRegresion('# instr — L-129: cubre\nCategoría: **normal**\nAlcance: `tests/e2e/INC-130.spec.js` · `tests/e2e-esquema.test.js`\nMapa: módulos y relaciones que cambia: ninguno\n', null, guiones, mapa, cent, RUTA);
  t('lote de solo guiones: humo y sin regresion', r.humo === true && r.corren.length === 0 && r.ruta.soloGuiones === true);
  r = seleccionRegresion(cabCola, { req: 'INC-999', zona: 'inventario', casos: [] }, guiones, null, cent, RUTA);
  t('sin mapa cae a la zona (v0.5.27) y mantiene centinelas', r.modo === 'zona' && r.corren.some(x => x.archivo === 'INC-130.spec.js') && r.corren.some(x => x.archivo === 'REQ-INV2-4-2.spec.js'));
  r = seleccionRegresion(cabCola.replace('**normal**', '**crítico** (DA-1, cruce)'), null, guiones, mapa, cent, RUTA);
  t('lote critico: centinela aunque la ruta no lo trajera', r.corren.find(x => x.archivo === 'REQ-INV2-4-2.spec.js').por.some(p => /centinela/.test(p)));
  t('v0.6.1: carpeta de capturas apartadas con fecha y hora', carpetaCapturasAnterior('L-117', new Date(2026, 9, 15, 19, 44)) === 'L-117-20261015-1944');
  t('tieneZona: texto y lista', tieneZona({ zona: 'a' }, 'a') && tieneZona({ zona: ['a', 'b'] }, 'b') && !tieneZona({ zona: ['a'] }, 'b'));
}
{
  const r = cerrarCaso(caso, [{ ok: true, observado: 'x' }], null, [], [], [
    { metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, motivo: 'a', t: 1000, status: 200, ms: 180 },
    { metodo: 'PUT', url: 'https://app.x/api/col/inv-movimientos', paso: true, motivo: 'b', t: 1020, status: 500, ms: 90 },
    { metodo: 'PUT', url: 'https://app.x/api/col/inv-movimientos', paso: true, status: 500, resp: true, motivo: 'respuesta 500: x' },
    { metodo: 'POST', url: 'https://identitytoolkit.googleapis.com/v1/accounts:lookup', paso: true, motivo: 'g', t: 1030, status: 200 }]);
  t('cronología: +ms, estado y duración', Array.isArray(r.cronologia) && r.cronologia.length === 2 && r.cronologia[0] === '+0ms PUT /api/col/turnos → 200 en 180ms' && r.cronologia[1] === '+20ms PUT /api/col/inv-movimientos → 500 en 90ms');
  // v0.5.27 (M-463): zonas de la regresion
  const cabA = '# instr — x\nCategoría: normal\nAlcance: `api/drive.php`, `str-app-shell.html` (subida)\nImpacto: y\n';
  let z = zonasRegresion(cabA, null, ['inventario', 'sesiones']);
  t('regresión: sin guion pero toca api/ y shell → inventario', z.zonas.join(',') === 'inventario' && /capa comun/.test(z.motivo));
  z = zonasRegresion('# instr\nAlcance: `tests/e2e/REQ-INV2-3-4.spec.js` (foco)\n', 'pruebas', ['inventario']);
  t('regresión: zona del guion sola cuando el Alcance no toca servidor', z.zonas.join(',') === 'pruebas');
  z = zonasRegresion('# instr\nAlcance: `str-api.js` ×1\n', 'inventario', ['inventario']);
  t('regresión: guion de inventario + str-api.js → inventario una sola vez', z.zonas.join(',') === 'inventario');
  z = zonasRegresion('# instr\nRegresión: inventario, sesiones\nAlcance: `docs/x.md`\n', null, ['inventario', 'sesiones', 'drive']);
  t('regresión declarada: lista', z.zonas.join(',') === 'inventario,sesiones' && /declara/.test(z.motivo));
  z = zonasRegresion('# instr\nRegresion: todas\n', 'drive', ['inventario', 'drive']);
  t('regresión declarada: todas', z.zonas.join(',') === 'inventario,drive');
  z = zonasRegresion('# instr\nRegresión: ninguna (solo documentación)\nAlcance: `api/x.php`\n', 'inventario', ['inventario']);
  t('regresión declarada: ninguna manda sobre lo inferido', z.zonas.length === 0 && /ninguna/.test(z.motivo));
  z = zonasRegresion('# instr\nAlcance: `docs/claude/x.md`\n', null, ['inventario']);
  t('regresión: sin guion ni servidor → ninguna, con motivo', z.zonas.length === 0 && /puede declarar/.test(z.motivo));
  // v0.5.24 (M-431): escrituras en serie o a la vez, con tolerancia de 5 ms entre relojes
  const { maxEnVuelo } = require('./guion.js');
  const T = 1000;
  t('en vuelo: serie exacta (L-111 tercera corrida: +0→160, +160→325, +324→…)', maxEnVuelo([{ t: T, ms: 160 }, { t: T + 160, ms: 165 }, { t: T + 324, ms: 100 }]) === 1);
  t('en vuelo: la siguiente empieza 1 ms antes del fin anotado → sigue siendo serie', maxEnVuelo([{ t: T, ms: 238 }, { t: T + 237, ms: 597 }]) === 1);
  t('en vuelo: dos a la vez de verdad (segunda a +50 de una de 238)', maxEnVuelo([{ t: T, ms: 238 }, { t: T + 50, ms: 200 }]) === 2);
  t('en vuelo: tres a la vez', maxEnVuelo([{ t: T, ms: 500 }, { t: T + 10, ms: 500 }, { t: T + 20, ms: 500 }, { t: T + 600, ms: 10 }]) === 3);
  t('en vuelo: sin respuesta no cuenta como abierta', maxEnVuelo([{ t: T, ms: null }, { t: T + 1, ms: 100 }]) === 1);
  const rS = cerrarCaso({ c: 'd', perfil: 'colab' }, [{ ok: true, observado: 'x' }], null, [], [], [
    { metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, t: T, ms: 160, status: 200 },
    { metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, t: T + 160, ms: 165, status: 200 },
    { metodo: 'PUT', url: 'https://app.x/api/col/inv-movimientos', paso: true, t: T + 324, ms: 100, status: 200 }]);
  t('observado dice «escrituras en serie» y enVuelo 1', rS.enVuelo === 1 && /escrituras en serie \(máx\. 1 en vuelo\)/.test(rS.observado));
  const rP2 = cerrarCaso({ c: 'd', perfil: 'colab' }, [{ ok: true, observado: 'x' }], null, [], [], [
    { metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, t: T + 50, ms: 200, status: 200 },
    { metodo: 'PUT', url: 'https://app.x/api/col/turnos', paso: true, t: T, ms: 238, status: 200 }]);
  t('observado dice «hasta 2 escrituras a la vez» y la cronología queda ordenada por inicio', rP2.enVuelo === 2 && /hasta 2 escrituras a la vez/.test(rP2.observado) && rP2.cronologia[0].startsWith('+0ms') && rP2.cronologia[1].startsWith('+50ms'));
  // v0.5.23 (M-427): un N2 que revienta conserva su captura «error»; uno que pasa no lleva capturas
  const rE = cerrarCaso({ c: 'b', perfil: 'admin' }, [], 'locator.click: Timeout 30000ms exceeded.', [], [{ nombre: 'error', png: 'log/capturas/L-1/b-error.png', ancho: 1280 }], []);
  t('N2 con error: ok false y captura «error» en el informe', rE.ok === false && Array.isArray(rE.capturas) && rE.capturas[0].nombre === 'error');
  const rP = cerrarCaso({ c: 'a', perfil: 'admin' }, [{ ok: true, observado: 'x' }], null, [], [], []);
  t('N2 que pasa: sin capturas', rP.ok === true && rP.capturas === undefined);
}
{ // v0.5.30 (M-487): hora de Bogotá con segundos, para que el juez compare el orden real con las capturas
  const { horaBogota } = require('./guion');
  t('horaBogota: HH:MM:SS', /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(horaBogota()));
  t('horaBogota: 15-oct 15:00Z = 10:00:00 Bogotá', horaBogota(new Date('2026-10-15T15:00:00Z')) === '10:00:00');
  t('horaBogota: 05:00Z = 00:00:00 (no 24:00)', horaBogota(new Date('2026-10-15T05:00:00Z')) === '00:00:00');
}
{ // v0.5.33 (M-502): el texto de las capturas no lleva teléfonos ni correos
  const { enmascararTexto } = require('./guion');
  t('enmascarar: teléfono con espacios', enmascararTexto('Llamar al 300 123 4567 hoy') === 'Llamar al [tel] hoy');
  t('enmascarar: teléfono con +57 y guiones', enmascararTexto('Tel: +57 300-123-4567.') === 'Tel: [tel].');
  t('enmascarar: correo', enmascararTexto('ana.perez+x@gmail.com escribió') === '[correo] escribió');
  t('enmascarar: id sh-m-1792083473461 se conserva', enmascararTexto('turno sh-m-1792083473461') === 'turno sh-m-1792083473461');
  t('enmascarar: fecha y hora se conservan', enmascararTexto('2026-10-15 12:06 · 390 px · 6/6') === '2026-10-15 12:06 · 390 px · 6/6');
  t('enmascarar: zz-verif-L-117-r-ar1 se conserva', enmascararTexto('zz-verif-L-117-r-ar1-sn3kg') === 'zz-verif-L-117-r-ar1-sn3kg');
  t('enmascarar: cantidad corta no se toca', enmascararTexto('cantidad 12345') === 'cantidad 12345');
}
{ // v0.6.3 (LM-44): la puerta mira todas las /api/me de la carga; basta una 200 (renovación del propio shell)
  const { sesionPorRespuestas } = require('./probar-lote');
  const s1 = sesionPorRespuestas([200]);
  t('sesión: 200 a la primera → ok, no renovada', s1.ok && !s1.renovada);
  const s2 = sesionPorRespuestas([401, 200]);
  t('sesión: 401 y luego 200 (JWT vencido, el shell renueva) → ok, renovada', s2.ok && s2.renovada && s2.ultimo === 200);
  const s3 = sesionPorRespuestas([401, 401]);
  t('sesión: solo 401 → sin sesión', !s3.ok && s3.ultimo === 401);
  t('sesión: ninguna /api/me → sin sesión', !sesionPorRespuestas([]).ok && sesionPorRespuestas(null).ultimo === null);
}
{ // v0.7.0 (LM-49): pruebas por fases
  const { faseDelLote, anotarTren } = require('./probar-lote');
  const { unirTren } = require('./tren');
  const normal = 'L-139\nCategoría: normal\nAlcance: str-flujos.html, tests/e2e/REQ-FL-12.spec.js\n';
  t('LM-49: lote normal → fase 1', faseDelLote(normal).fase === '1');
  t('LM-49: crítico → completa', faseDelLote('Categoría: crítico (DA-9)\nAlcance: str-flujos.html\n').fase === 'completa');
  t('LM-49: capa común → completa', faseDelLote('Categoría: normal\nAlcance: str-api.js, str-flujos.html\n').fase === 'completa');
  t('LM-49: migración → completa', faseDelLote('Categoría: normal\nAlcance: api/x.php\nschema_version 13 → 14\n').fase === 'completa');
  t('LM-49: «Regresión:» declarada → completa', faseDelLote(normal + 'Regresión: todas\n').fase === 'completa');
  t('LM-49: FASE-COMPLETA fuerza completa', faseDelLote(normal, { forzar: true }).fase === 'completa');
  let f = anotarTren([], { lote: 'L-1', diferidos: ['A.spec.js'] }); f = anotarTren(f, { lote: 'L-2', diferidos: ['A.spec.js', 'B.spec.js'] });
  t('LM-49: la fila guarda un lote por entrada', f.length === 2);
  f = anotarTren(f, { lote: 'L-1', diferidos: ['C.spec.js'] });
  t('LM-49: reprobar un lote reemplaza su entrada', f.length === 2 && f.find((x) => x.lote === 'L-1').diferidos[0] === 'C.spec.js');
  t('LM-49: sin diferidos no entra a la fila', anotarTren([], { lote: 'L-3', diferidos: [] }).length === 0);
  const u = unirTren([{ lote: 'L-1', diferidos: ['A.spec.js'] }, { lote: 'L-2', diferidos: ['A.spec.js', 'B.spec.js'] }]);
  t('LM-49: el tren corre cada guion una vez y sabe qué lotes lo pidieron', u.length === 2 && u[0].archivo === 'A.spec.js' && u[0].lotes.join() === 'L-1,L-2' && u[1].lotes.join() === 'L-2');
  t('LM-49: fila vacía → nada que correr', unirTren([]).length === 0 && unirTren(null).length === 0);
}
{ // v0.6.5 (LM-46, M-576): dos intentos antes de bloquear y el bloqueo dice cuál de los dos casos es
  const { mensajeSesion } = require('./probar-lote');
  const okA = { ok: true, caso: 'ok', observado: 'colab: /api/me 200' };
  const meA = { ok: false, caso: 'api-me', estados: [401], observado: 'colab: /api/me 401' };
  const goo = { ok: false, caso: 'google', observado: 'colab: SESION DE GOOGLE PERDIDA: login.html' };
  const err = { ok: false, caso: 'error', observado: 'colab: perfil en uso' };
  t('LM-46: 200 a la primera → ok sin segundo intento', mensajeSesion('colab', [okA]).ok && !/segundo/.test(mensajeSesion('colab', [okA]).observado));
  const r2 = mensajeSesion('colab', [meA, okA]);
  t('LM-46: falla y luego 200 → ok, dice «segundo intento»', r2.ok && /segundo intento/.test(r2.observado));
  const r3 = mensajeSesion('colab', [meA, Object.assign({}, meA, { estados: [401, 401] })]);
  t('LM-46: /api/me sin 200 dos veces → bloquea como api-me', !r3.ok && r3.caso === 'api-me' && /DOS VECES/.test(r3.observado) && /401 \/ 401,401/.test(r3.observado));
  t('LM-46: api-me no manda a abrir el perfil', !/node abrir-perfil/.test(r3.observado) && /NO hace falta abrirlo/.test(r3.observado));
  const r4 = mensajeSesion('colab', [goo]);
  t('LM-46: Google perdida → caso google, sí pide abrir el perfil', !r4.ok && r4.caso === 'google' && /GOOGLE PERDIDA/.test(r4.observado));
  t('LM-46: error de perfil en uso → caso error, mensaje tal cual', mensajeSesion('colab', [err]).caso === 'error' && mensajeSesion('colab', [err]).observado === err.observado);
  t('LM-46: sesionViva exportada', typeof require('./probar-lote').sesionViva === 'function');
}
{ // v0.6.4 (LM-45): una nueva prueba del mismo commit no repite N1 ni la comparación del guion
  const { puedeSaltar, anotar, claveGuion } = require('./probar-lote');
  let m = anotar({}, 'abc', 'n1', { ok: true, resumen: '80/80 archivos OK', hora: '12:00:00' });
  t('LM-45: mismo commit y árbol limpio → salta N1', !!puedeSaltar(m, 'abc', true, 'n1'));
  t('LM-45: otro commit → no salta', puedeSaltar(m, 'def', true, 'n1') === null);
  t('LM-45: árbol con cambios sin commit → no salta', puedeSaltar(m, 'abc', false, 'n1') === null);
  m = anotar(m, 'abc', 'guion', { ok: true, clave: claveGuion('x\r\ny'), ruta: 'tests/e2e/X.spec.js' });
  t('LM-45: guion con el mismo bloque (CRLF = LF) → salta la comparación', !!puedeSaltar(m, 'abc', true, 'guion', claveGuion('x\ny')));
  t('LM-45: instrucción cambiada (otro bloque) → vuelve a comparar', puedeSaltar(m, 'abc', true, 'guion', claveGuion('x\nz')) === null);
  t('LM-45: anotar conserva n1 al anotar guion', !!puedeSaltar(m, 'abc', true, 'n1'));
  let big = {}; for (let i = 0; i < 35; i++) big = anotar(big, 'c' + i, 'n1', { ok: true });
  t('LM-45: la memoria guarda solo 30 commits', Object.keys(big).length === 30 && !big.c0 && !!big.c34);
}
{ // v0.8.0 (LM-51): la cola recupera sola la sesión caída (Chrome normal del perfil) y repite el guion una vez
  const { puedeRecuperar, anotarRecuperacion, TOPE_RECUPERAR_MS } = require('./comun');
  const { esSinSesion } = require('./guion');
  const { saltarCaidos, correrConSesion } = require('./probar-lote');
  t('LM-51: sin registro → se puede recuperar', puedeRecuperar([], 'colab', 0));
  t('LM-51: el mismo perfil hace 29 min → no (tope 30 min)', !puedeRecuperar([{ perfil: 'colab', ms: 0 }], 'colab', 29 * 60000));
  t('LM-51: el mismo perfil hace 30 min → sí', puedeRecuperar([{ perfil: 'colab', ms: 0 }], 'colab', TOPE_RECUPERAR_MS));
  t('LM-51: otro perfil reciente no frena', puedeRecuperar([{ perfil: 'admin', ms: 0 }], 'colab', 1000));
  let reg = []; for (let i = 0; i < 105; i++) reg = anotarRecuperacion(reg, { perfil: 'colab', ms: i });
  t('LM-51: el registro guarda las últimas 100', reg.length === 100 && reg[0].ms === 5);
  t('LM-51: login.html en la página → sin sesión', esSinSesion('https://app.x/login.html', [], ''));
  t('LM-51: login.html en un iframe → sin sesión', esSinSesion('https://app.x/portal.html', ['https://app.x/login.html?v=p5c104'], ''));
  t('LM-51: «Tu sesión no está activa» en el portal → sin sesión', esSinSesion('https://app.x/portal.html', [], 'Tu sesión no está activa · Iniciar sesión'));
  t('LM-51: HK normal → no', !esSinSesion('https://app.x/portal.html', ['https://app.x/str-m1-housekeeping.html'], 'Turnos de hoy'));
  const est0 = { caidos: new Set(['colab']), recuperadas: [], perdidas: [] };
  const sp0 = { casos: [{ c: 'a', perfil: 'admin' }, { c: 'b', perfil: 'colab' }, { c: 'c' }] };
  const sal = saltarCaidos(sp0, est0);
  t('LM-51: saltarCaidos quita los casos del perfil caído y los deja ok:false sinSesion', sp0.casos.map((c) => c.c).join() === 'a,c' && sal.length === 1 && sal[0].c === 'b' && sal[0].ok === false && sal[0].sinSesion === true);
  global.__lm51 = (async () => {
    // 1) colab cae en login, se recupera → el guion se repite una vez y quedan los resultados de la repetición
    let vueltas = 0;
    const correr = async (sp) => { vueltas++; return { casos: sp.casos.map((c) => ({ c: c.c, perfil: c.perfil, ok: vueltas > 1 || c.perfil !== 'colab', sinSesion: vueltas === 1 && c.perfil === 'colab' })), limpieza: 'ok', perfiles: [] }; };
    const e1 = { caidos: new Set(), recuperadas: [], perdidas: [] };
    const r1 = await correrConSesion({ casos: [{ c: 'a', perfil: 'admin' }, { c: 'b', perfil: 'colab' }] }, {}, e1, 'X.spec.js', { correr, sesion: async () => ({ ok: true, observado: 'colab: recuperada' }) });
    t('LM-51: sesión caída y recuperada → el guion corre 2 veces y queda verde', vueltas === 2 && r1.casos.every((c) => c.ok && c.repetidoPorSesion) && e1.recuperadas.length === 1 && e1.recuperadas[0].guion === 'X.spec.js');
    // 2) no se recupera → colab queda caído; el guion siguiente no corre sus casos de colab
    let corridas = [];
    const correr2 = async (sp) => { corridas.push(sp.casos.map((c) => c.c).join()); return { casos: sp.casos.map((c) => ({ c: c.c, perfil: c.perfil, ok: c.perfil !== 'colab', sinSesion: c.perfil === 'colab' })), limpieza: 'ok', perfiles: [] }; };
    const e2 = { caidos: new Set(), recuperadas: [], perdidas: [] };
    const r2 = await correrConSesion({ casos: [{ c: 'a', perfil: 'admin' }, { c: 'b', perfil: 'colab' }] }, {}, e2, 'Y.spec.js', { correr: correr2, sesion: async () => ({ ok: false, observado: 'colab: no' }) });
    t('LM-51: no se recupera → no repite, colab caído y su caso sinSesion', corridas.length === 1 && e2.caidos.has('colab') && r2.casos.find((c) => c.c === 'b').sinSesion === true && e2.perdidas.length === 1);
    const r3 = await correrConSesion({ casos: [{ c: 'x', perfil: 'colab' }, { c: 'y', perfil: 'oper' }] }, {}, e2, 'Z.spec.js', { correr: correr2, sesion: async () => ({ ok: false }) });
    t('LM-51: guion siguiente: solo corre oper; colab sale «no se corrió»', corridas[1] === 'y' && r3.casos.find((c) => c.c === 'x').ok === false && /no se corrió/.test(r3.casos.find((c) => c.c === 'x').observado));
    // 3) sin caídas → corre una vez y no toca nada
    let v3 = 0;
    const r4 = await correrConSesion({ casos: [{ c: 'a' }] }, {}, { caidos: new Set(), recuperadas: [], perdidas: [] }, 'W', { correr: async (sp) => { v3++; return { casos: [{ c: 'a', ok: true }], limpieza: 'ok', perfiles: [] }; }, sesion: async () => { throw new Error('no debía'); } });
    t('LM-51: lote sin caídas → una corrida, sin repetidos', v3 === 1 && !r4.casos[0].repetidoPorSesion);
  })();
}
{ // v0.10.0 (LM-54): guardia de /api/cuenta-pruebas (DA-47, L-150)
  const c = require('./comun');
  const B = 'https://app.apartamentosbucaramanga.com', U = B + '/api/cuenta-pruebas';
  const d = (b, m = 'POST', u = U) => c.decidir(u, m, JSON.stringify(b), new Set(), new Set());
  const mover = { confirmo: 'zz-verif-pruebas', ids: [11, 12, 13, 14] };
  t('LM-54: sin la bandera, mover corta aunque diga zz-verif-', !d(mover).ok);
  t('LM-54: sin la bandera, revertir corta', !d({ confirmo: 'zz-verif-pruebas', revertir: true }).ok);
  t('LM-54: el ensayo (GET) pasa como lectura', c.decidir(U, 'GET', '', new Set(), new Set()).ok);
  t('LM-54: PUT y DELETE cortan', !d(mover, 'PUT').ok && !d(mover, 'DELETE').ok);
  t('LM-54: otra ruta bajo /api/cuenta-pruebas/ corta', !d(mover, 'POST', U + '/otra').ok);
  c.GUARDIA.cuentaPruebas = true; c.GUARDIA.cuentaPruebasModo = 'mover'; c.GUARDIA.cuentaPruebasIds = new Set(['11', '12', '13', '14']);
  t('LM-54: modo mover con los ids del ensayo pasa', d(mover).ok);
  t('LM-54: un id que el ensayo no listó corta', !d({ confirmo: 'zz-verif-pruebas', ids: [11, 99] }).ok);
  t('LM-54: sin confirmo exacto corta', !d({ confirmo: 'zz-verif-', ids: [11] }).ok);
  t('LM-54: lista vacía u 11 ids cortan', !d({ confirmo: 'zz-verif-pruebas', ids: [] }).ok && !d({ confirmo: 'zz-verif-pruebas', ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }).ok);
  t('LM-54: revertir en modo mover corta', !d({ confirmo: 'zz-verif-pruebas', revertir: true }).ok);
  c.GUARDIA.cuentaPruebasModo = 'revertir';
  t('LM-54: modo revertir pasa sin ids', d({ confirmo: 'zz-verif-pruebas', revertir: true }).ok);
  t('LM-54: revertir con ids corta', !d({ confirmo: 'zz-verif-pruebas', revertir: true, ids: [11] }).ok);
  t('LM-54: mover en modo revertir corta', !d(mover).ok);
  c.GUARDIA.cuentaPruebas = false; c.GUARDIA.cuentaPruebasModo = null; c.GUARDIA.cuentaPruebasIds = new Set();
  const cp = require('./cuenta-pruebas.spec.js');
  const zz = (n) => n.map((x, i) => ({ id: 11 + i, nombre: x, rol: 'admin' }));
  const ens = (u, o = {}) => Object.assign({ ensayo: true, cuentaSesion: { id: 1, esPruebas: false }, destino: { existe: false, id: null }, usuariosZz: u, movimientosSinRevertir: 0 }, o);
  t('LM-54: revisarEnsayo acepta exactamente los 4', cp.revisarEnsayo(ens(zz(['zz-verif-oper', 'zz-verif-admin', 'zz-verif-colab2', 'zz-verif-colab']))).ok);
  t('LM-54: revisarEnsayo rechaza 3, 5 o uno distinto', !cp.revisarEnsayo(ens(zz(['zz-verif-oper', 'zz-verif-admin', 'zz-verif-colab']))).ok && !cp.revisarEnsayo(ens(zz(['zz-verif-oper', 'zz-verif-admin', 'zz-verif-colab', 'zz-verif-colab2', 'zz-verif-x']))).ok && !cp.revisarEnsayo(ens(zz(['zz-verif-oper', 'zz-verif-admin', 'zz-verif-colab', 'zz-verif-otro']))).ok);
  t('LM-54: revisarEnsayo rechaza sesión en la cuenta de pruebas o movimientos sin revertir', !cp.revisarEnsayo(ens(zz(cp.ESPERADOS), { cuentaSesion: { id: 2, esPruebas: true } })).ok && !cp.revisarEnsayo(ens(zz(cp.ESPERADOS), { movimientosSinRevertir: 1 })).ok);
  t('LM-54: los dos scripts cargan con la bandera apagada', cp.casos.length === 1 && require('./cuenta-pruebas-revertir.spec.js').casos[0].c === 'r' && c.GUARDIA.cuentaPruebas === false);
  // v0.10.1 (LM-54 paso 4): reingreso de los 4 perfiles en la cuenta nueva
  const rz = require('./reingreso-zz.spec.js');
  const me = (cu, cs, n = 'zz-verif-admin', nc = 'zz-verif-pruebas') => ({ status: 200, user: { cuenta_id: cu, nombre: n }, cuenta: { id: cs, nombre: nc } });
  t('LM-54 reingreso: previo listo / no movido / reingresar / sin sesión', rz.decidirPrevio(me(9, 9)) === 'listo' && rz.decidirPrevio(me(1, 1, 'zz-verif-admin', 'negocio')) === 'no-movido' && rz.decidirPrevio(me(9, 1, 'zz-verif-admin', 'negocio')) === 'reingresar' && rz.decidirPrevio({ status: 401 }) === 'reingresar');
  t('LM-54 reingreso: borra todo el almacenamiento de la app salvo Firebase', JSON.stringify(rz.clavesABorrar(['str-token', 'firebase:authUser:x', 'str-turnos-v1'])) === '["str-token","str-turnos-v1"]' && JSON.stringify(rz.basesABorrar(['str-cola-subida', 'firebaseLocalStorageDb', 'firebase-heartbeat-database'])) === '["str-cola-subida"]');
  t('LM-54 reingreso: revisar exige cuenta de pruebas, mismo usuario y nombre del perfil', rz.revisarReingreso(me(9, 9, 'zz-verif-colab2'), 'colab2').ok && !rz.revisarReingreso(me(9, 1, 'zz-verif-admin', 'negocio'), 'admin').ok && !rz.revisarReingreso(me(9, 9, 'zz-verif-oper'), 'admin').ok);
  t('LM-54 reingreso: 4 casos, uno por perfil, desde un archivo estático', rz.casos.map((x) => x.perfil).join() === 'admin,oper,colab,colab2' && rz.casos.every((x) => x.pagina === '/str-api.js'));
}
{ // v0.9.0 (LM-52): sin internet a mitad de la corrida · (LM-53): guardia de la purga de movimientos de prueba
  const { esSinRed, esperarRed, correrConSesion } = require('./probar-lote');
  const c = require('./comun');
  t('LM-52: ERR_INTERNET_DISCONNECTED y ERR_NAME_NOT_RESOLVED son sin red', esSinRed('page.goto: net::ERR_INTERNET_DISCONNECTED at x') && esSinRed('net::ERR_NAME_NOT_RESOLVED'));
  t('LM-52: errores del servidor no (CONNECTION_REFUSED, 500, 409)', !esSinRed('net::ERR_CONNECTION_REFUSED') && !esSinRed('HTTP 500') && !esSinRed('409'));
  const B = 'https://app.apartamentosbucaramanga.com', ids = new Set(['mv1', 'mv2']);
  const d = (b, u = '/api/purga-prueba/movimientos') => c.decidir(B + u, 'POST', JSON.stringify(b), ids, new Set());
  t('LM-53: purga con ids de la corrida pasa', d({ confirmo: 'zz-verif-', ids: ['mv1', 'mv2'] }).ok);
  t('LM-53: un id ajeno corta', !d({ confirmo: 'zz-verif-', ids: ['mv1', 'real'] }).ok);
  t('LM-53: sin confirmo corta (aunque el cuerpo diga zz-verif-)', !d({ ids: ['mv1'], nota: 'zz-verif-x' }).ok);
  t('LM-53: sin ids (purga completa) corta sin el script', !d({ confirmo: 'zz-verif-' }).ok);
  t('LM-53: lista vacía corta', !d({ confirmo: 'zz-verif-', ids: [] }).ok);
  t('LM-53: otra ruta bajo /api/purga-prueba/ corta', !d({ confirmo: 'zz-verif-', ids: ['mv1'] }, '/api/purga-prueba/otra').ok);
  c.GUARDIA.purgaCompleta = true;
  t('LM-53: con GUARDIA.purgaCompleta la purga completa pasa', d({ confirmo: 'zz-verif-' }).ok);
  c.GUARDIA.purgaCompleta = false;
  t('LM-53: el ensayo (GET) pasa como lectura', c.decidir(B + '/api/purga-prueba/movimientos', 'GET', '', ids, new Set()).ok);
  t('LM-53: purga-movimientos.spec.js carga y apaga la bandera por defecto', require('./purga-movimientos.spec.js').casos.length === 1 && c.GUARDIA.purgaCompleta === false);
  t('LM-52: limpiar-zz.especCon arma un caso con la regla de restos', require('./limpiar-zz.spec.js').especCon({ col: 'turnos', campo: 'propName', prefijo: 'zz-verif-Propiedad', hoy: true, pagina: '/str-m1-housekeeping.html' }).casos[0].pagina === '/str-m1-housekeeping.html');
  global.__lm52 = (async () => {
    let n = 0; const p = []; let cuenta = 0;
    t('LM-52: esperarRed devuelve true cuando vuelve la red', await esperarRed(1000, 1, async () => (++cuenta) >= 3));
    t('LM-52: esperarRed devuelve false si no vuelve', !(await esperarRed(20, 5, async () => false)));
    const sinRed = { ok: false, observado: 'page.goto: net::ERR_INTERNET_DISCONNECTED' };
    const correr = async (sp) => { n++; return { casos: sp.casos.map((k) => (n === 1 ? Object.assign({ c: k.c, perfil: k.perfil }, sinRed) : { c: k.c, perfil: k.perfil, ok: true })), limpieza: 'ok', perfiles: [] }; };
    const e1 = { caidos: new Set(), recuperadas: [], perdidas: [] };
    const r1 = await correrConSesion({ casos: [{ c: 'a', perfil: 'admin' }] }, {}, e1, 'X.spec.js', { correr, sesion: async () => { throw new Error('no debía'); }, esperarRed: async () => true });
    t('LM-52: vuelve la red → repite el guion una vez, verde y repetidoPorRed', n === 2 && r1.casos[0].ok && r1.casos[0].repetidoPorRed && e1.red.cortes.length === 1 && e1.red.bloqueada === false);
    n = 0;
    const e2 = { caidos: new Set(), recuperadas: [], perdidas: [] };
    await correrConSesion({ casos: [{ c: 'a', perfil: 'admin' }] }, {}, e2, 'Y.spec.js', { correr, sesion: async () => ({ ok: true }), esperarRed: async () => false });
    t('LM-52: no vuelve en el tope → bloqueada, sin repetir ni tocar sesiones', n === 1 && e2.red.bloqueada === true && e2.caidos.size === 0);
  })();
}
{ // v0.5.31 (M-499): cierre suave: páginas primero, luego el contexto; devuelve la hora
  const { cerrarSuave } = require('./guion');
  const orden = [];
  const ctx = { pages: () => [{ close: async () => { orden.push('pagina'); } }, { close: async () => { throw new Error('ya cerrada'); } }], close: async () => { orden.push('ctx'); } };
  Promise.resolve(global.__lm51).then(() => global.__lm52).then(() => cerrarSuave(ctx)).then((h) => { t('cerrarSuave: páginas antes que el contexto', orden.join(',') === 'pagina,ctx'); t('cerrarSuave: devuelve HH:MM:SS', /^\d\d:\d\d:\d\d$/.test(h)); console.log(ok + ' OK, ' + fail + ' FAIL'); process.exit(fail ? 1 : 0); });
}

