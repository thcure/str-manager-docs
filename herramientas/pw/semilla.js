// semilla.js - comprueba la semilla fija zz-verif- (PRUEBAS-v1, LM-18, BAI07.04). Lo mantiene el Arquitecto.
// Solo lectura: abre cada pagina con zz-verif-admin y lee las respuestas que la propia app pide (no toca tokens
// ni ejecuta JavaScript sobre la sesion). Guarda solo nombres zz-verif- y conteos: nada de datos reales.
// v1 comprueba; reponer lo que falte se hace con un guion de semilla del Chat Desarrollo (paso siguiente).
// v5.1 (pw 0.5.11, M-387): relación campoValor (estados de ropa con su pendiente y proveedor activo, para L-103).
// v5 (pw 0.5.10, M-384): relaciones zonaConRol y articulosDePropiedad (para L-103).
// v4.3 (pw 0.5.9, M-377): invPrincipalPropiedad acepta cualquiera de las zonas con ese nombre que sea principal activa de la propiedad.
// v4.1 (pw 0.5.7, M-370): relaciones flujoBasePropiedad e invPrincipalPropiedad (para L-101).
// v4 (pw 0.5.6, M-361): grupos con 'para' (como las relaciones) y relaciones lugaresEnZonaPrincipal y tareaInventario
//   para la segunda pasada de L-100 (INV2-7-1 en HK); con 'para', también un 'no concluyente' de otro lote es aviso.
// v3 (pw 0.4.8, M-278): una relacion con 'para' bloquea solo al lote que nombra; en los demas es 'aviso' (no bloquea).
// v2 (pw 0.4.6, M-263, L-86): 'relaciones' de semilla.json (colaborador base, zona principal activa, operador sin un
// permiso). Se evaluan en memoria sobre las respuestas; al log solo van nombres zz-verif- y conteos.
// Uso: node semilla.js   (escribe log\pw-semilla.json; sale 0 si esta completa, 1 si falta algo, 2 si no concluye)
'use strict';
const fs = require('fs');
const path = require('path');
const { abrir, BASE, COLA } = require('./comun');

const CONF = JSON.parse(fs.readFileSync(path.join(__dirname, 'semilla.json'), 'utf8'));

// Puro: todas las cadenas que empiezan por zz-verif- dentro de un JSON (items borrados fuera).
function nombresZz(j) {
  const out = new Set();
  const items = j && Array.isArray(j.items) ? j.items.filter(x => !x.deleted) : j;
  (function rec(o) {
    if (typeof o === 'string') { if (o.startsWith('zz-verif-')) out.add(o); return; }
    if (Array.isArray(o)) { o.forEach(rec); return; }
    if (o && typeof o === 'object') Object.values(o).forEach(rec);
  })(items);
  return out;
}

// Puro: evalua un grupo contra lo observado. parcial = la respuesta traia ?since= (solo cambios recientes).
function evaluar(grupo, vistos, visto, parcial) {
  if (!visto) return { id: grupo.id, estado: 'no concluyente', observado: 'la pagina no pidio ' + grupo.fuente };
  const faltan = (grupo.nombres || []).filter(n => !vistos.has(n));
  const total = [...vistos].length;
  const faltaMinimo = grupo.minimo && total < grupo.minimo;
  const opc = (grupo.opcionales || []).filter(n => !vistos.has(n));
  if (!faltan.length && !faltaMinimo) return { id: grupo.id, estado: 'ok', observado: total + ' nombre(s) zz-verif-' + (opc.length ? ' · opcionales sin crear: ' + opc.join(', ') : '') };
  if (parcial) return { id: grupo.id, estado: 'no concluyente', observado: 'respuesta incremental (?since=); faltaria: ' + (faltan.join(', ') || 'minimo ' + grupo.minimo) };
  return { id: grupo.id, estado: 'falta', observado: 'faltan: ' + (faltan.join(', ') || ('minimo ' + grupo.minimo + ', hay ' + total)) };
}

// Puro: registros planos ({id, ...data}) de las respuestas; fuera los borrados.
function registros(cuerpos) {
  const out = [];
  const rec = (o) => {
    if (Array.isArray(o)) { o.forEach(rec); return; }
    if (!o || typeof o !== 'object' || o.deleted) return;
    if ('id' in o) out.push(Object.assign({}, (o.data && typeof o.data === 'object' && !Array.isArray(o.data)) ? o.data : {}, o));
    Object.values(o).forEach(v => { if (v && typeof v === 'object') rec(v); });
  };
  (cuerpos || []).forEach(rec);
  return out;
}
const porNombre = (regs, nombre) => regs.find(r => Object.values(r).some(v => v === nombre)) || null;
const lista = (v) => Array.isArray(v) ? v.map(String) : [];
function permisosDe(u) {
  let p = u.permisos;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = undefined; } }
  return p && typeof p === 'object' ? p : undefined;
}

// Puro: evalua una relacion. cuerpos = {idGrupo: [json, ...]}; vistos = {idGrupo: bool}.
function evaluarRelacion(rel, cuerpos, vistos) {
  const r = (estado, observado) => ({ id: rel.id, estado, observado });
  const necesita = { colaboradorBase: ['propiedades', 'usuarios'], zonaPrincipalActiva: ['propiedades', 'zonas'], sinPermiso: ['usuarios'],
    lugaresEnZonaPrincipal: ['propiedades', 'zonas', 'lugares'], tareaInventario: ['flujos'],
    flujoBasePropiedad: ['propiedades', 'flujos'], invPrincipalPropiedad: ['propiedades', 'zonas'],
    zonaConRol: ['propiedades', 'zonas'], articulosDePropiedad: ['propiedades', rel.grupo || 'articulos'], campoValor: [rel.grupo] }[rel.tipo];
  if (!necesita) return r('no concluyente', 'tipo desconocido: ' + rel.tipo);
  const noVisto = necesita.filter(g => !vistos[g]);
  if (noVisto.length) return r('no concluyente', 'sin respuesta de: ' + noVisto.join(', '));
  const props = registros(cuerpos.propiedades), usuarios = registros(cuerpos.usuarios);
  const principalesDe = (p) => registros(cuerpos.zonas).filter(z => (z.rol === 'principal' || (!z.rol && z.tipo === 'principal')) && z.activo !== false && z.privada !== true
    && (lista(z.propIds).includes(String(p.id)) || String(z.propId) === String(p.id)));
  if (rel.tipo === 'lugaresEnZonaPrincipal') {
    // v4: cada lugar (inv-sububicaciones) existe, está activo y cuelga de una zona principal activa de la propiedad
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const zonas = new Set(principalesDe(p).map(z => String(z.id)));
    const regsL = registros(cuerpos.lugares);
    const mal = (rel.lugares || []).filter(n => {
      const l = porNombre(regsL, n);
      const zona = l && (l.depositoId ?? l.zonaId ?? l.invDepositoId ?? l.deposito);
      return !l || l.activo === false || !zonas.has(String(zona));
    });
    return mal.length ? r('falta', 'no están en una zona principal activa de ' + rel.propiedad + ': ' + mal.join(', ')) : r('ok', (rel.lugares || []).length + ' lugar(es) en la zona principal de ' + rel.propiedad);
  }
  if (rel.tipo === 'flujoBasePropiedad') {
    // v4.1 (M-370): la propiedad usa ese flujo como base y no hay una copia del flujo para esa propiedad (HK usaría la copia)
    const p = porNombre(props, rel.propiedad), flujos = registros(cuerpos.flujos), f = porNombre(flujos, rel.flujo);
    if (!p || !f) return r('falta', 'no está ' + (!p ? rel.propiedad : rel.flujo));
    if (String(p.flujoBaseId) !== String(f.id)) return r('falta', rel.propiedad + ' no tiene ' + rel.flujo + ' como flujo base');
    // copia por propiedad (str-propiedades _fbFlujoParaProp, M-372): esPlantilla === false, plantillaId = id del general, propId = la propiedad
    const copias = flujos.filter(x => String(x.id) !== String(f.id) && x.esPlantilla !== true && (String(x.propId) === String(p.id) || lista(x.propIds).includes(String(p.id)))
      && ['plantillaId', 'origenId', 'clonDe', 'copiaDe', 'baseId'].some(k => String(x[k]) === String(f.id)));
    return copias.length ? r('falta', 'hay ' + copias.length + ' copia(s) de ' + rel.flujo + ' para ' + rel.propiedad) : r('ok', rel.propiedad + ' usa ' + rel.flujo + ' sin copia');
  }
  if (rel.tipo === 'invPrincipalPropiedad') {
    // v4.1 (M-370): el conteo va a la zona principal fijada en la propiedad (invPrincipalId)
    // v4.3 (M-377): puede haber varias zonas con ese nombre (viejas o inactivas); vale la que apunta la propiedad si es
    // una principal activa que le sirve. El observado dice cuántas hay y a qué id apunta (solo ids de filas zz-verif-).
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const mismas = registros(cuerpos.zonas).filter(z => Object.values(z).some(v => v === rel.zona));
    if (!mismas.length) return r('falta', 'no está ' + rel.zona);
    const buenas = principalesDe(p).filter(z => Object.values(z).some(v => v === rel.zona)).map(z => String(z.id));
    const detalle = mismas.length + ' zona(s) ' + rel.zona + '; la propiedad apunta a ' + (p.invPrincipalId || 'ninguna');
    return buenas.includes(String(p.invPrincipalId)) ? r('ok', rel.propiedad + ' cuenta en ' + rel.zona + ' (' + detalle + ')')
      : r('falta', rel.propiedad + ' no apunta a una ' + rel.zona + ' principal activa (' + detalle + '; válidas: ' + (buenas.join(', ') || 'ninguna') + ')');
  }
  if (rel.tipo === 'campoValor') {
    // v5.1 (M-387): la fila activa con ese nombre en el grupo tiene campo = valor (estado con su pendiente, proveedor activo)
    const f = porNombre(registros(cuerpos[rel.grupo]), rel.nombre);
    if (!f) return r('falta', 'no está ' + rel.nombre);
    if (f.activo === false) return r('falta', rel.nombre + ' está inactivo');
    if (rel.campo && String(f[rel.campo]) !== String(rel.valor)) return r('falta', rel.nombre + ': ' + rel.campo + '=' + f[rel.campo] + ', se esperaba ' + rel.valor);
    return r('ok', rel.nombre + (rel.campo ? ' (' + rel.campo + '=' + rel.valor + ')' : ' activo'));
  }
  if (rel.tipo === 'zonaConRol') {
    // v5 (M-384, L-103): una zona activa con ese nombre y ese rol que sirve a la propiedad
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const z = registros(cuerpos.zonas).filter(x => Object.values(x).some(v => v === rel.zona) && x.activo !== false
      && (lista(x.propIds).includes(String(p.id)) || String(x.propId) === String(p.id)));
    if (!z.length) return r('falta', rel.zona + ' no sirve a ' + rel.propiedad);
    return z.some(x => x.rol === rel.rol) ? r('ok', rel.zona + ' (' + rel.rol + ') en ' + rel.propiedad) : r('falta', rel.zona + ' tiene rol ' + z.map(x => x.rol).join('/') + ', se esperaba ' + rel.rol);
  }
  if (rel.tipo === 'articulosDePropiedad') {
    // v5 (M-384, L-103): artículos de esa clase con propId de la propiedad
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const regsA = registros(cuerpos[rel.grupo || 'articulos']);   // v0.5.17 (M-402): los juegos viven en inv-grupos (grupo juegos-l103)
    const mal = (rel.nombres || []).filter(n => { const a = porNombre(regsA, n); return !a || a.activo === false || (rel.clase && a.clase !== rel.clase) || String(a.propId) !== String(p.id); });
    return mal.length ? r('falta', 'no son ' + (rel.clase || 'artículos') + ' de ' + rel.propiedad + ': ' + mal.join(', ')) : r('ok', (rel.nombres || []).length + ' ' + (rel.clase || 'artículo') + '(s) de ' + rel.propiedad);
  }
  if (rel.tipo === 'tareaInventario') {
    // v4: el flujo tiene una tarea con ese nombre y inventario.lista = rel.lista (y al menos rel.articulos artículos)
    const f = porNombre(registros(cuerpos.flujos), rel.flujo);
    if (!f) return r('falta', 'no está ' + rel.flujo);
    let hallada = null;
    (function rec(o) {
      if (hallada || !o || typeof o !== 'object') return;
      if (!Array.isArray(o) && o.inventario && typeof o.inventario === 'object' && Object.values(o).includes(rel.tarea)) { hallada = o; return; }
      Object.values(o).forEach(rec);
    })(f);
    if (!hallada) return r('falta', rel.flujo + ' no tiene la tarea ' + rel.tarea + ' con inventario');
    const inv = hallada.inventario, n = Array.isArray(inv.articulos) ? inv.articulos.length : 0;
    if (rel.lista && inv.lista !== rel.lista) return r('falta', rel.tarea + ': lista ' + inv.lista + ', se esperaba ' + rel.lista);
    if (rel.articulos && n < rel.articulos) return r('falta', rel.tarea + ': ' + n + ' artículo(s), mínimo ' + rel.articulos);
    return r('ok', rel.tarea + ' en ' + rel.flujo + ' (lista ' + inv.lista + ', ' + n + ' artículos)');
  }
  if (rel.tipo === 'colaboradorBase') {
    const p = porNombre(props, rel.propiedad), u = porNombre(usuarios, rel.usuario);
    if (!p || !u) return r('falta', 'no está ' + (!p ? rel.propiedad : rel.usuario));
    return String(p.colaboradorBaseId) === String(u.id) ? r('ok', rel.usuario + ' es colaborador base de ' + rel.propiedad) : r('falta', rel.usuario + ' no es colaborador base de ' + rel.propiedad);
  }
  if (rel.tipo === 'zonaPrincipalActiva') {
    const p = porNombre(props, rel.propiedad);
    if (!p) return r('falta', 'no está ' + rel.propiedad);
    const n = principalesDe(p).length;
    return n >= (rel.minimo || 1) ? r('ok', n + ' zona(s) principal(es) activa(s) en ' + rel.propiedad) : r('falta', rel.propiedad + ' tiene ' + n + ' zona(s) principal(es) activa(s); mínimo ' + (rel.minimo || 1));
  }
  const u = porNombre(usuarios, rel.usuario);
  if (!u) return r('falta', 'no está ' + rel.usuario);
  const p = permisosDe(u);
  if (p === undefined) return r('no concluyente', 'la respuesta no trae los permisos de ' + rel.usuario);
  return (u.rol === 'operador' && p.todo === false && p[rel.permiso] !== true) ? r('ok', rel.usuario + ' sin ' + rel.permiso)
    : r('falta', rel.usuario + ' tiene ' + rel.permiso + (p.todo !== false ? ' (todo)' : '') + (u.rol !== 'operador' ? ' · rol ' + u.rol : ''));
}

// Puro: si la relacion es 'para' otro lote, una falta se degrada a aviso. Sin lote (node semilla.js a mano) se evalua estricta.
function alcanceRelacion(rel, resultado, lote) {
  if (!rel.para || !lote || (resultado.estado !== 'falta' && resultado.estado !== 'no concluyente')) return resultado;
  const nombra = String(rel.para).split(/[\s,;()]+/).includes(lote);
  return nombra ? resultado : Object.assign({}, resultado, { estado: 'aviso', observado: resultado.observado + ' (solo bloquea a ' + rel.para + ')' });
}

async function comprobarSemilla(opciones = {}) {
  const grupos = [], cuerpos = {}, vistosG = {};
  let ctx;
  try {
    const a = await abrir('admin', { headless: opciones.headless }); ctx = a.ctx;
    for (const g of CONF.grupos) {
      const page = await ctx.newPage();
      const vistos = new Set(); let visto = false, parcial = true;
      page.on('response', async (r) => {
        const u = r.url();
        if (!u.includes(g.fuente) || r.request().method() !== 'GET' || r.status() !== 200) return;
        visto = true; if (!/[?&]since=/.test(u)) parcial = false;
        try { const j = await r.json(); nombresZz(j).forEach(n => vistos.add(n)); (cuerpos[g.id] = cuerpos[g.id] || []).push(j); } catch (e) { }
      });
      try {
        await page.goto(BASE + g.pagina, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1500);
      } catch (e) { }
      grupos.push(alcanceRelacion(g, evaluar(g, vistos, visto, parcial), opciones.lote)); vistosG[g.id] = visto && !parcial;   // v4: grupos con 'para'
      await page.close().catch(() => { });
    }
  } catch (e) {
    return { ok: false, estado: 'no concluyente', grupos, error: 'no se pudo abrir zz-verif-admin: ' + e.message };
  } finally { if (ctx) await ctx.close().catch(() => { }); }
  for (const rel of (CONF.relaciones || [])) grupos.push(alcanceRelacion(rel, evaluarRelacion(rel, cuerpos, vistosG), opciones.lote));
  const estado = grupos.some(g => g.estado === 'falta') ? 'incompleta' : grupos.some(g => g.estado !== 'ok' && g.estado !== 'aviso') ? 'no concluyente' : 'completa';
  return { ok: estado === 'completa', estado, grupos };
}

module.exports = { comprobarSemilla, nombresZz, evaluar, evaluarRelacion, alcanceRelacion, registros, CONF };

if (require.main === module) {
  (async () => {
    const r = await comprobarSemilla();
    r.fecha = new Date().toISOString();
    r.grupos.forEach(g => console.log(g.estado.padEnd(15) + g.id + ' · ' + g.observado));
    if (r.error) console.log(r.error);
    console.log('Semilla: ' + r.estado + ' · log\\pw-semilla.json');
    fs.writeFileSync(path.join(COLA, 'log', 'pw-semilla.json'), JSON.stringify(r, null, 1));
    process.exit(r.estado === 'completa' ? 0 : r.estado === 'incompleta' ? 1 : 2);
  })();
}
