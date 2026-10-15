// ruta.test.js — pruebas de ruta.js (LM-41). Correr: node --test herramientas/modelo/ruta.test.js
const test = require('node:test'), assert = require('node:assert');
const { ruta, cobertura, leerCabecera, modulosDelLote } = require('./ruta.js');

const mapa = {
  modulos: [{ id: 'HK' }, { id: 'POR' }, { id: 'INV' }, { id: 'K3' }, { id: 'KN' }, { id: 'SH' }, { id: 'SRV' }],
  relaciones: [
    { id: 'REL-05', origen: 'HK', destino: 'POR', estado: 'vigente' },
    { id: 'REL-16', origen: 'HK', destino: 'K3', estado: 'vigente' },
    { id: 'REL-30', origen: 'HK', destino: 'KN', estado: 'vigente' },
    { id: 'REL-01', origen: 'SH', destino: '*', estado: 'vigente', generica: true },
    { id: 'REL-99', origen: 'KN', destino: 'SRV', estado: 'por construir' },
  ],
  reglas: [{ id: 'RT-8', titulo: 'Corte', modulos: ['K3', 'HK'], prueba: 'caso' }, { id: 'RT-2', titulo: 'Datos reales', modulos: ['*'], prueba: 'proceso' }, { id: 'RT-14', titulo: 'Permisos', modulos: ['SRV'], prueba: 'caso' }],
  anclajeReq: { 'REQ-K3-2': ['K3', 'HK'] },
  anclajeGuiones: { paginaModulo: { '/str-conocimiento.html': 'KN' }, reqModulo: { 'INC-130': ['HK', 'POR'] }, archivoModulo: { mapa: { 'str-cola-subida.js': ['HK', 'POR', 'INV', 'K3'], 'api/lib/drive-copia.php': ['K3'] } } },
};
const guiones = [
  { archivo: 'REQ-K3b.spec.js', req: 'REQ-K3b', zona: 'shell-y-api', modulos: ['K3', 'HK', 'SH'], casos: [{ c: 'a', cubre: ['REL-16', 'RT-8'] }, { c: 'b', cubre: [] }] },
  { archivo: 'INC-130.spec.js', req: 'INC-130', zona: 'inventario', modulos: ['HK', 'POR'], casos: [{ c: 'a' }] },
  { archivo: 'REQ-TB-5.spec.js', req: 'REQ-TB-5', zona: 'proyecto', modulos: ['PRJ'], casos: [{ c: 'a' }, { c: 'b' }] },
];

test('módulos del lote: archivos (archivoModulo, páginas, api/), línea Mapa y REQ', () => {
  const pq = modulosDelLote(mapa, { archivos: ['str-cola-subida.js', 'api/lib/drive-copia.php', 'str-conocimiento.html', 'api/index.php'], mapaLinea: 'HK, K3; REL-16', req: 'REQ-K3-2' });
  assert.deepStrictEqual(Object.keys(pq).sort(), ['HK', 'INV', 'K3', 'KN', 'POR', 'SRV']);
  assert.ok(pq.HK.some((x) => x.includes('Mapa')) && pq.HK.some((x) => x.startsWith('REQ')));
  assert.deepStrictEqual(pq.KN, ['página /str-conocimiento.html']);
});

test('ruta: relaciones, reglas, guiones que corren y no corren, huecos y a declarar', () => {
  const r = ruta(mapa, guiones, { archivos: ['api/lib/drive-copia.php'], mapaLinea: 'K3', req: 'REQ-K3-2' });
  assert.deepStrictEqual(r.modulos, ['HK', 'K3']);
  assert.deepStrictEqual(r.relaciones.map((x) => x.id), ['REL-05', 'REL-16', 'REL-30', 'REL-01']);   // la «por construir» no entra
  assert.deepStrictEqual(r.reglas.map((x) => x.id), ['RT-8', 'RT-2']);
  assert.deepStrictEqual(r.reglasFabrica, ['RT-2']);
  assert.deepStrictEqual(r.guionesCorren.map((g) => g.archivo), ['REQ-K3b.spec.js', 'INC-130.spec.js']);
  assert.deepStrictEqual(r.noCorren.map((g) => g.archivo), ['REQ-TB-5.spec.js']);
  assert.deepStrictEqual(r.huecos.relaciones.map((x) => x.id), ['REL-30']);      // nadie pasa por HK→KN
  assert.deepStrictEqual(r.huecos.reglas, []);                                     // RT-8 la declara K3b a
  assert.deepStrictEqual(r.aDeclarar, ['REL-05']);                                 // INC-130 pasa por HK y POR sin declararlo
});

test('ruta: «Regresión: ninguna» deja solo el guion del lote; «todas» corre todo', () => {
  const n = ruta(mapa, guiones, { archivos: [], mapaLinea: 'K3', req: 'REQ-K3b', regresionLinea: 'ninguna' });
  assert.deepStrictEqual(n.guionesCorren.map((g) => g.archivo), ['REQ-K3b.spec.js']);
  const t = ruta(mapa, guiones, { archivos: [], mapaLinea: 'KN', req: 'REQ-K2', regresionLinea: 'todas' });
  assert.strictEqual(t.guionesCorren.length, 3);
});

test('ruta: un lote en KN no corre inventario', () => {
  const r = ruta(mapa, guiones, { archivos: ['str-conocimiento.html'], mapaLinea: 'ninguna', req: 'REQ-K2' });
  assert.deepStrictEqual(r.modulos, ['KN']);
  assert.deepStrictEqual(r.guionesCorren, []);
  assert.deepStrictEqual(r.huecos.relaciones.map((x) => x.id), ['REL-30']);
});

test('cobertura: solo cuenta lo declarado en cubre; módulos por anclaje', () => {
  const c = cobertura(mapa, guiones);
  assert.deepStrictEqual(c.relaciones, { 'REL-16': ['REQ-K3b.spec.js a'] });
  assert.deepStrictEqual(c.reglas, { 'RT-8': ['REQ-K3b.spec.js a'] });
  assert.strictEqual(c.casos, 5); assert.strictEqual(c.casosSinCubre, 4);
  assert.deepStrictEqual(c.modulos.HK, ['REQ-K3b.spec.js', 'INC-130.spec.js']);
});

test('leerCabecera: archivos, Mapa, Regresión y REQ de una instrucción', () => {
  const l = leerCabecera('# instr — REQ-K3-2: copia a Drive\nCategoría: **normal**\nAlcance: `str-cola-subida.js` · `api/lib/drive-copia.php` · `tests/e2e/REQ-K3b.spec.js` · `?v=p5c96` → `p5c97`\nRegresión: ninguna (solo guiones)\nReglas transversales que toca: RT-8\nMapa: módulos y relaciones que cambia: HK, K3; REL-16\nOrigen: M-1. Requerimiento: `claude/producto/x.md` (criterios 1–3).');
  assert.deepStrictEqual(l.archivos, ['str-cola-subida.js', 'api/lib/drive-copia.php', 'tests/e2e/REQ-K3b.spec.js']);
  assert.strictEqual(l.mapaLinea, 'HK, K3; REL-16');
  assert.strictEqual(l.regresionLinea, 'ninguna (solo guiones)');
  assert.strictEqual(l.req, 'REQ-K3-2');
});
