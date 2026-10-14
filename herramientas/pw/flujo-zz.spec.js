// flujo-zz.spec.js - diagnóstico de solo lectura del flujo base de prueba (M-382, INC-127). Lo mantiene el Arquitecto.
// Abre Flujos y Propiedades con zz-verif-admin, lee las respuestas que pide la propia app y anota SOLO la forma de las
// filas zz-verif-: si zz-verif-Flujo base es compuesto, cuántos subflujos tiene, dónde está la tarea
// «zz-verif-Conteo de cierre» y si zz-verif-Propiedad tiene copia del flujo. Nada de datos reales. No escribe.
// La cola lo corre con correr\flujo-zz.txt -> log\FLUJO-ZZ-guion.json
const BASE_N = 'zz-verif-Flujo base', TAREA = 'zz-verif-Conteo de cierre', PROP = 'zz-verif-Propiedad';
const filas = (j) => (j && Array.isArray(j.items) ? j.items : Array.isArray(j) ? j : []).filter(x => x && !x.deleted).map(x => Object.assign({}, x.data && typeof x.data === 'object' ? x.data : {}, { id: x.id }));
const tiene = (o, v) => JSON.stringify(o).includes(v);
function ruta(o, v, camino = []) {   // primer camino de claves hasta un objeto que tiene el valor v (sin datos, solo claves e índices)
  if (!o || typeof o !== 'object') return null;
  if (Object.values(o).includes(v)) return camino.join('.') || '(raíz)';
  for (const [k, x] of Object.entries(o)) { const r = ruta(x, v, camino.concat(k)); if (r) return r; }
  return null;
}
module.exports = {
  req: 'FLUJO-ZZ',
  zona: 'semilla',
  casos: [{
    c: 'a', perfil: 'admin', pagina: '/str-flujos.html',
    que: 'forma de zz-verif-Flujo base y de su copia por propiedad (solo lectura)',
    async prueba(h) {
      // copia local completa de la app (la respuesta de red puede ser incremental con ?since=); solo claves de flujos y
      // propiedades, nunca sesión ni tokens; de ahí solo salen al log formas de filas zz-verif-
      await h.page.waitForLoadState('networkidle').catch(() => { });
      const locales = await h.page.evaluate(() => Object.keys(localStorage).filter(k => /^str-(flujos|propiedades)/.test(k) && !/token|sesion|auth|lastpush/i.test(k))
        .map(k => [k, localStorage.getItem(k)]));
      const leer = (re) => { for (const [k, v] of locales) if (re.test(k)) { try { const j = JSON.parse(v); const f = filas(j.items ? j : { items: Array.isArray(j) ? j.map(x => (x && x.data ? x : { id: x && x.id, data: x })) : [] }); if (f.length) return f; } catch (e) { } } return []; };
      let fl = leer(/^str-flujos/);
      const base = fl.find(f => f.nombre === BASE_N || f.name === BASE_N);
      if (!base) return h.espera(false, 'no está ' + BASE_N + ' en la copia local (' + fl.length + ' flujos leídos; claves: ' + locales.map(x => x[0]).join(', ') + ')');
      const subs = Array.isArray(base.subFlujos) ? base.subFlujos : Array.isArray(base.subflujos) ? base.subflujos : [];
      const rTarea = ruta(base, TAREA);
      const enSub = subs.map(s => (typeof s === 'object' ? s.id || s.flujoId : s)).map(String)
        .map(id => fl.find(f => String(f.id) === id)).filter(Boolean).filter(f => tiene(f, TAREA)).map(f => f.nombre || f.name);
      const copias = fl.filter(f => f.esPlantilla === false && String(f.plantillaId) === String(base.id));
      let props = leer(/^str-propiedades/);
      const p = props.find(x => x.nombre === PROP || x.name === PROP);
      const copiaProp = p ? copias.filter(f => String(f.propId) === String(p.id)).length : null;
      h.espera(true, 'esCompuesto=' + (base.esCompuesto === true) + ' · subflujos=' + subs.length + ' · tarea en ' + (rTarea || 'ninguna parte del base')
        + ' · tarea en subflujos zz: ' + (enSub.join(', ') || 'ninguno') + ' · copias del base: ' + copias.length + ' (de ' + PROP + ': ' + copiaProp + ')'
        + ' · flujoBaseId de ' + PROP + ' = base: ' + (p ? String(p.flujoBaseId) === String(base.id) : 'sin ' + PROP));
    },
  }],
};
