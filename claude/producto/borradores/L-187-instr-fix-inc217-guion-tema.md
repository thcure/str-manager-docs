# instr — L-187 · INC-217: el caso g de LM-79-fabrica fija el tema del STR antes de entrar a la Fábrica, para que Marco de trabajo y Nomenclatura se capturen con el mismo tema
Categoría: **estándar** (solo un guion del STR y su puntero; no cambia código de ningún sitio ni del servicio)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 24/24 · subagente de Desarrollo · 2026-10-30 23:08
Decisión: ninguna (arreglo de guion por INC-217; decisión del Arquitecto en M-1327 y M-1329, de acuerdo el Jefe de proyecto en M-1328: lote estándar de un guion dentro de la excepción M-1264)
Alcance: en str-manager, `tests/e2e/LM-79-fabrica.spec.js` (caso g y cabecera, dos pares) y `docs/claude/modelo.md` (puntero, dos pares) · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual · `schema_version` igual · los sitios siguen en `?v=s183`
Origen: INC-217 (veredicto-2 de L-183, 22:51: su único rojo, g). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`
Impacto: ninguno en lo que se ve: el caso g captura la Fábrica con el tema del STR desde la entrada (antes lo ponía después de abrir cada página, y Marco de trabajo y Nomenclatura ya se habían armado en claro). Con L-187 aceptado, la cola repite pruebas y juez de L-183 (reprobar).
Reglas transversales que toca: ninguna
Mapa: módulos y relaciones que cambia: MOD (solo su guion); ninguna relación nueva
Casos de uso: CU-MOD-3.1
Riesgo: bajo: 9 líneas de un guion (caso g y su cabecera), sin código; solo cambia cómo y cuándo el caso g fija el tema. Conexiones a MySQL (RT-19): las mismas lecturas que ya hace el caso g.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (el caso g vuelve a poner el tema después de abrir cada página).
Paridad (punto 24): (1) código: sin cambios de código (sitios y servicio como en L-183, fabrica-servicio c0ce17a); (2) no aplica: no traslada nada; g compara el tema de la Fábrica al entrar con el del STR; (3) nada se ve distinto
Depende de: L-183 construido (str-manager 3909419; fabrica-servicio c0ce17a) y L-185 aceptado (2ba20a2) · Precondiciones para verificar: perfil zz-verif-admin; sin datos que crear
¿Quién más depende de lo que cambia?: nadie: solo cambian el caso g de LM-79-fabrica y su cabecera; el guion no guarda nada en el perfil zz-verif-admin (emulateMedia vale solo para esa página), así que los casos a–f y los demás guiones que entran a la Fábrica arrancan como hoy. L-184 cambia también LM-79-fabrica (comentario de cabecera, junto a G2, y caso e): su base pasa a incluir L-187 y Desarrollo rehace su K1 antes de encolarlo. Al aceptarse, Desarrollo deja reprobar\L-183.txt.

## 0. Contexto
- Dos archivos: dos pares en `tests/e2e/LM-79-fabrica.spec.js` y dos en `docs/claude/modelo.md`. Cada «Busca» aparece una sola vez.
- Por qué: Playwright entra a la Fábrica sin tema guardado y con el esquema de color del navegador en claro, así que el sitio arranca en claro; Marco de trabajo se arma con el tema que tiene el sitio al abrirse, y Nomenclatura (página generada sin data-theme) sigue al esquema del navegador. Por eso el caso g fija el esquema de color del navegador con el tema del STR antes de entrar (sin guardar nada en el perfil: el sitio, sin tema guardado, lo sigue) y comprueba el tema con que entra la Fábrica.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.

## B1. El guion (dos pares)
**G1 · tema antes de entrar** (`tests/e2e/LM-79-fabrica.spec.js`). Busca:
```js
        await h.captura('str-modulo-390', { ancho: 390 });
        if (!(await entrar(h)).ok) return;
        for (const e of Object.keys(PAGINAS)) {
          await ver(h, e);
          await p.evaluate((t) => { document.documentElement.setAttribute('data-theme', t); const b = document.getElementById('tema'); if (b) b.textContent = t === 'light' ? '☀️' : '🌙'; }, tema).catch(() => {});
          await p.waitForTimeout(500);
```
Pon:
```js
        await h.captura('str-modulo-390', { ancho: 390 });
        // INC-217 (L-187): el tema del STR se fija ANTES de entrar a la Fábrica con el esquema de color del navegador
        // (Playwright arranca en claro): sin tema guardado, el sitio lo sigue (tema.js), las páginas copiadas del STR se arman
        // con el del sitio al abrirse y las generadas sin data-theme, como la Nomenclatura, siguen a prefers-color-scheme.
        // No se guarda nada en el perfil; si el perfil ya trajera otro tema guardado, la espera siguiente lo dice.
        await p.emulateMedia({ colorScheme: tema === 'light' ? 'light' : 'dark' }).catch(() => {});
        if (!(await entrar(h)).ok) return;
        const temaFabrica = await p.evaluate(() => document.documentElement.getAttribute('data-theme')).catch(() => null);
        h.espera(temaFabrica === tema, 'tema del STR «' + tema + '» · la Fábrica entra en «' + temaFabrica + '», antes de abrir ninguna página');
        for (const e of Object.keys(PAGINAS)) {
          await ver(h, e);
          await p.waitForTimeout(500);
```

**G2 · cabecera del guion** (`tests/e2e/LM-79-fabrica.spec.js`). Busca:
```js
// servicio, cambia la dirección (#entrada) y el tamaño de la ventana; el tema del STR se pone solo en el DOM, sin guardarlo.
```
Pon:
```js
// servicio, cambia la dirección (#entrada) y el tamaño de la ventana; el tema del STR se pone en el DOM (f) o en el esquema
// de color del navegador (g, L-187), sin guardar nada.
```

## B2. Mapa del área (docs/claude/modelo.md), dos pares

**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-183b · dueño: MOD
```
Pon:
```md
Al día hasta L-187 · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
y desde L-183b LM-79-proyectos h mira los documentos de gobierno en Proceso de cambios (#cambios, INC-216).
```
Pon:
```md
y desde L-183b LM-79-proyectos h mira los documentos de gobierno en Proceso de cambios (#cambios, INC-216); desde L-187 el caso g de LM-79-fabrica fija el tema del STR con el esquema de color del navegador antes de entrar a la Fábrica, sin guardar nada (INC-217).
```

## Tests en `tests/`
Ninguno nuevo ni cambiado; `node tests/run.js` en verde (84/84; `e2e-esquema` carga el guion ajustado).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 1 módulos · 5 relaciones · 6 reglas · corren 24 guiones (58 casos) · no corren 32 · huecos: 1 relaciones, 0 reglas
- Módulos: **MOD** (línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-23 *→google-drive, REL-26 *→SRV, REL-29 cola-arquitecto→MOD
- Reglas que cruza: — (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-18, RT-20, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-146-purga (3/5), REQ-INV2-3-4-hk (3/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (9/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (2/7), REQ-K3c-vista (2/6), REQ-K3c (2/3), REQ-MOD-6-carga-rol (1/1), REQ-MOD-6-carga (2/2), REQ-MOD-6-complemento (1/1), REQ-MOD-6-credenciales (1/1), REQ-MOD-6-lectura (2/2), REQ-MOD-6 (3/4), REQ-OP-1 (2/8), REQ-OP-1b (1/7), REQ-SH-2 (1/11), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-29 (cola-arquitecto→MOD); reglas ninguna — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): ninguna
```

Deuda de cobertura de la ruta: REL-29 (cola-arquitecto→MOD): no aplica, el lote no cambia la carga del Arquitecto; solo el orden en que el caso g fija el tema.

## Pruebas derivadas (juez)
```
- a. Barra lateral de la Fábrica con sus tres grupos y diecinueve entradas (CU-MOD-3.1) (sigue en verde: el lote no la toca) · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: escenario · espera: caso a del guion en verde · **Detener**
- b. Cada entrada de página con un solo visor visible a toda la altura, a 1366 y 390 (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: límite · espera: caso b en verde · **Detener**
- c. Cada página carga un dato real del servicio (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso c en verde · **Detener**
- d. Visor aislado (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: decisión · espera: caso d en verde · **Detener**
- e. Ningún recurso propio sin ?v=s183 (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso e en verde · **Detener**
- f. Actualizar y Salir como el ⏻ del STR (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html y la Fábrica · precondición: la misma · tec: escenario · espera: caso f en verde · **Detener**
- g. Paridad visual con el mismo tema: el guion fija el tema del STR antes de entrar a la Fábrica y lo comprueba («la Fábrica entra en …» igual al del STR); en las capturas, las nueve páginas de la Fábrica salen con el tema del STR, Marco de trabajo y Nomenclatura incluidas, a 1366 y 390 (CU-MOD-3.1) · nivel: N3 · perfil: zz-verif-admin · página: las dos · precondición: la misma · tec: escenario · espera: la línea «si: tema del STR «dark» · la Fábrica entra en «dark»…» en el caso g y, en las capturas g-fabrica-*, las nueve páginas oscuras como el módulo del STR; lo que difiere es lo de § P de L-183 · **Detener**
- t. str-manager sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (G1–G2, D1–D2) · **Detener**
- Datos de prueba: ninguno (solo lectura; el caso g no guarda el tema: solo emula el esquema de color en su página)
- Resultado esperado del juez: «aceptado».
```

### Guion N2 → `tests/e2e/LM-79-fabrica.spec.js` (la CLI no lo copia: es el archivo como queda tras G1–G2; la cola lo compara byte a byte y corre el guion entero)
```js
// LM-79 fase 5.6 b (L-183, M-1308/M-1311, reglas 8 y 9 del contrato): herramienta-fabrica. por el árbol del universo. La barra
// lateral tiene tres grupos (Método, Herramientas, Universo) con una entrada por página o rama, cada una con data-rama (a); cada
// página del STR o generada se ve sola y a toda la altura del contenido, como openModule en el STR (b), con su dato real (c) y en
// el visor aislado (d); todo recurso propio lleva ?v=s183 (e); Actualizar y Salir son .icon-btn como el ⏻ del STR (f). g deja
// capturas por entrada a 1366 y 390 junto al STR con un módulo abierto (mismo tema) para el juez. Solo lectura: lee el DOM y el
// servicio, cambia la dirección (#entrada) y el tamaño de la ventana; el tema del STR se pone en el DOM (f) o en el esquema
// de color del navegador (g, L-187), sin guardar nada.
const FAB = 'https://herramienta-fabrica.apartamentosbucaramanga.com';
const V = 's183';
const GRUPOS = [
  ['Método', [['marco-trabajo', 'herramientas/fabrica/metodo/procesos'], ['instrucciones', 'herramientas/fabrica/metodo/procesos'], ['planes', 'herramientas/fabrica/metodo/procesos'],
    ['cobit', 'herramientas/fabrica/metodo/gobierno'], ['cambios', 'herramientas/fabrica/metodo/gobierno'], ['mejora', 'herramientas/fabrica/metodo/gobierno'],
    ['roles', 'herramientas/fabrica/metodo/roles'], ['plantillas', 'herramientas/fabrica/metodo/plantillas'],
    ['base-conocimiento', 'herramientas/fabrica/metodo/conocimiento'], ['nomenclatura', 'herramientas/fabrica/metodo/conocimiento'], ['elementos', 'herramientas/fabrica/metodo/conocimiento']]],
  ['Herramientas', [['modelo', 'herramientas/fabrica/herramientas/modelo'], ['cola', 'herramientas/fabrica/herramientas/cola'], ['verificacion', 'herramientas/fabrica/herramientas/verificacion'],
    ['comunicacion', 'herramientas/fabrica/herramientas/comunicacion'], ['servicio', 'herramientas/fabrica/servicio']]],
  ['Universo', [['piezas', 'universo'], ['arbol', 'universo'], ['mapa-procesos', 'universo']]],
];
// Entradas de página y la página que muestran (data-pagina del visor)
const PAGINAS = { 'marco-trabajo': 'str-marco-trabajo', instrucciones: 'str-instrucciones', cobit: 'str-cobit', 'base-conocimiento': 'str-base-conocimiento', elementos: 'str-elementos',
  nomenclatura: 'nomenclatura', piezas: 'universo', arbol: 'arbol', 'mapa-procesos': 'mapa-procesos' };

async function datosDe(h, archivo) {
  const r = await h.leerModelo('complemento?archivo=' + archivo);
  if (!r || r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) return null;
  const o = {};
  r.cuerpo.filas.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)).forEach((f) => { o[f.clave] = f.valor; });
  return o;
}
async function entrar(h, anotar) {
  const recursos = [];
  const oir = (q) => { try { const u = new URL(q.url()); if (u.origin === FAB && /\.(js|css)$/.test(u.pathname) && u.pathname.startsWith('/sitios/')) recursos.push(u.pathname + u.search); } catch (e) { } };
  if (anotar) h.page.on('request', oir);
  const r = await h.entrarSitio(FAB + '/');
  if (anotar) h.page.off('request', oir);
  h.espera(r.ok && r.estado === 'lista', 'entrar a la Fábrica como admin → ' + r.observado);
  return { ok: r.estado === 'lista', recursos: [...new Set(recursos)] };
}
// Lleva a la entrada por la dirección (#entrada) y espera su página dentro del visor (hasta 25 s); mide visor y contenido
async function ver(h, entrada) {
  const p = h.page;
  await p.evaluate((e) => { location.hash = e; }, entrada).catch(() => {});
  let interno = null;
  for (let i = 0; i < 50 && !interno; i++) {
    await p.waitForTimeout(500);
    const el = await p.$('#' + entrada + ' iframe.visor[data-pagina="' + PAGINAS[entrada] + '"]').catch(() => null);
    const visor = el ? await el.contentFrame().catch(() => null) : null;
    interno = visor ? visor.childFrames()[0] || null : null;
    if (interno && (await interno.evaluate(() => (document.body ? document.body.innerText.length : 0)).catch(() => 0)) < 20) interno = null;
  }
  const m = await p.evaluate((e) => {
    const c = document.querySelector('.content');
    const vis = [...document.querySelectorAll('#contenido iframe.visor')].filter((f) => f.offsetParent !== null);
    const f = vis[0];
    return { visibles: vis.length, deLaEntrada: !!f && !!f.closest('#' + e), alto: f ? Math.round(f.getBoundingClientRect().height) : null, contenido: Math.round(c.getBoundingClientRect().height),
      sandbox: f ? f.getAttribute('sandbox') : null, sel: [...document.querySelectorAll('.sidebar .nav-item.sel')].map((a) => a.dataset.parte) };
  }, entrada).catch(() => null);
  return { interno, m };
}
const texto = (i) => (i ? i.evaluate(() => document.body.innerText).catch(() => '') : '');

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'a', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'La barra lateral de la Fábrica tiene exactamente tres grupos (Método, Herramientas, Universo) con sus entradas en este orden, cada una con su data-rama; las de Método y Herramientas son ramas de fabrica/universo y no falta ninguna',
      async prueba(h) {
        const u = await datosDe(h, 'fabrica/universo');
        const ramas = u && Array.isArray(u.ramas) ? u.ramas.filter((r) => /^herramientas\/fabrica\//.test(r)) : [];
        h.espera(ramas.length > 0, 'ramas de la Fábrica en fabrica/universo: ' + ramas.length);
        if (!(await entrar(h)).ok) return;
        const v = await h.page.evaluate(() => [...document.querySelectorAll('nav.sidebar .nav-group')].map((g) => [(g.querySelector('.ngr-label') || {}).textContent,
          [...g.querySelectorAll('.nav-item[data-parte]')].map((a) => [a.dataset.parte, a.dataset.rama, a.getAttribute('href') === '#' + a.dataset.parte])])).catch(() => null);
        const esperado = GRUPOS.map(([g, es]) => [g, es.map(([e, r]) => [e, r, true])]);
        h.espera(JSON.stringify(v) === JSON.stringify(esperado), 'grupos y entradas: ' + (v ? v.map((g) => g[0] + ' (' + g[1].map((e) => e[0]).join(', ') + ')').join(' · ') : 'sin barra'));
        const usadas = GRUPOS.slice(0, 2).flatMap(([, es]) => es.map(([, r]) => r));
        h.espera(ramas.length > 0 && usadas.every((r) => ramas.includes(r)) && ramas.every((r) => r === 'herramientas/fabrica' || usadas.includes(r)), 'ramas del menú que no están en el universo: ' + (usadas.filter((r) => !ramas.includes(r)).join(', ') || 'ninguna') + ' · ramas sin entrada: ' + (ramas.filter((r) => r !== 'herramientas/fabrica' && !usadas.includes(r)).join(', ') || 'ninguna'));
      },
    },
    {
      c: 'b', perfil: 'admin', tec: 'límite', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Al elegir cada entrada de página hay un solo visor visible, el de esa entrada, y su alto es el del área de contenido (±2 px), a 1366 y a 390',
      async prueba(h) {
        const p = h.page;
        if (!(await entrar(h)).ok) return;
        const antes = p.viewportSize();
        for (const [ancho, alto] of [[1366, 900], [390, 844]]) {
          await p.setViewportSize({ width: ancho, height: alto });
          for (const e of Object.keys(PAGINAS)) {
            const { m } = await ver(h, e);
            h.espera(!!m && m.visibles === 1 && m.deLaEntrada && Math.abs(m.alto - m.contenido) <= 2 && JSON.stringify(m.sel) === JSON.stringify([e]), ancho + ' · ' + e + ': visores visibles ' + (m && m.visibles) + ' · alto ' + (m && m.alto) + ' de ' + (m && m.contenido) + ' · marcada ' + (m && m.sel.join(',')));
          }
        }
        if (antes) await p.setViewportSize(antes);
      },
    },
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Cada página carga un dato real del servicio: el primer paso del marco, una instrucción, un objetivo COBIT, un elemento, una ficha, la nomenclatura, una pieza del universo, el total de piezas en el árbol y un nodo del mapa de procesos',
      async prueba(h) {
        const d = {};
        for (const a of ['marco-trabajo', 'instrucciones', 'cobit', 'elementos', 'conocimiento', 'universo', 'mapa-procesos']) d[a] = await datosDe(h, 'fabrica/' + a);
        if (!(await entrar(h)).ok) return;
        const nodos = d['mapa-procesos'] && Array.isArray(d['mapa-procesos'].nodos) ? d['mapa-procesos'].nodos : [];
        const piezas = d.universo && Array.isArray(d.universo.piezas) ? d.universo.piezas : [];
        const muestras = {
          'marco-trabajo': d['marco-trabajo'] && d['marco-trabajo'].pasos ? String(d['marco-trabajo'].pasos[0].codigo) : null,
          instrucciones: d.instrucciones && d.instrucciones.items ? String(d.instrucciones.items[0].titulo) : null,
          cobit: d.cobit && d.cobit.objetivos ? String(d.cobit.objetivos[0].codigo || d.cobit.objetivos[0].cod || d.cobit.objetivos[0].id) : null,
          elementos: d.elementos && d.elementos.elementos ? String(d.elementos.elementos[0].nombre || d.elementos.elementos[0].id) : null,
          'base-conocimiento': d.conocimiento && Array.isArray(d.conocimiento.fichas) && d.conocimiento.fichas.length ? String(d.conocimiento.fichas[0].codigo || d.conocimiento.fichas[0].nombre) : null,
          nomenclatura: 'Nomenclatura',
          piezas: piezas.find((x) => x && x.estado === 'vigente') ? String(piezas.find((x) => x && x.estado === 'vigente').id) : null,
          arbol: piezas.length ? 'de ' + piezas.length : null,
          'mapa-procesos': nodos.length ? String(nodos[0].nombre) : null,
        };
        for (const [e, m] of Object.entries(muestras)) {
          const { interno } = await ver(h, e);
          const t = await texto(interno);
          h.espera(!!m && !!interno && t.includes(m), e + ': «' + (m || 'sin dato en el servicio').slice(0, 50) + '» ' + (interno ? (t.includes(m) ? 'está' : 'no está') : 'no se abrió'));
        }
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-14', 'RT-18'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Cada visor queda aislado: sandbox «allow-scripts allow-popups», sin allow-same-origin, origen opaco y sin acceso a la página de afuera',
      async prueba(h) {
        if (!(await entrar(h)).ok) return;
        for (const e of Object.keys(PAGINAS)) {
          const { interno, m } = await ver(h, e);
          const v = interno ? await interno.evaluate(() => [self.origin, (() => { try { return typeof parent.document; } catch (x) { return 'aislado'; } })()]).catch(() => null) : null;
          h.espera(!!m && m.sandbox === 'allow-scripts allow-popups' && !!v && v[0] === 'null' && v[1] === 'aislado', e + ' · sandbox «' + (m && m.sandbox) + '» · origen ' + (v && v[0]) + ' · afuera ' + (v && v[1]));
        }
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['MOD'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Ningún recurso propio de la Fábrica (js y css de /sitios/) sin ?v=s183',
      async prueba(h) {
        const r = await entrar(h, true);
        if (!r.ok) return;
        const sin = r.recursos.filter((x) => !x.endsWith('?v=' + V));
        h.espera(r.recursos.length >= 9 && sin.length === 0, 'recursos propios: ' + r.recursos.length + ' · sin ?v=' + V + ': ' + (sin.join(', ') || 'ninguno'));
      },
    },
    {
      c: 'f', perfil: 'admin', tec: 'escenario', cubre: ['MOD'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Actualizar y Salir son .icon-btn con el mismo tamaño, borde, fondo y color que el ⏻ del STR, con el mismo tema',
      async prueba(h) {
        const p = h.page;
        const estilo = (sel) => p.evaluate((s) => { const x = document.querySelector(s); if (!x) return null; const c = getComputedStyle(x); return { clase: x.className, medidas: [c.width, c.height, c.borderRadius, c.borderTopWidth, c.borderTopColor, c.backgroundColor, c.color] }; }, sel).catch(() => null);
        await p.goto((h.BASE || 'https://app.apartamentosbucaramanga.com') + '/str-app-shell.html', { waitUntil: 'load' }).catch(() => {});
        await p.waitForFunction(() => { const b = document.getElementById('logoutBtn'); return b && getComputedStyle(b).display !== 'none'; }, null, { timeout: 20000 }).catch(() => {});
        const tema = await p.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark').catch(() => 'dark');
        // el ⏻ de la sesión; si no se ve, cualquier .icon-btn visible de la barra (la campana): es la misma regla del shell
        const sel = await p.evaluate(() => { const b = document.getElementById('logoutBtn'); return b && getComputedStyle(b).display !== 'none' ? '#logoutBtn' : '.topbar .tb-right .icon-btn'; }).catch(() => '#logoutBtn');
        const str = await estilo(sel);
        if (!(await entrar(h)).ok) return;
        await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), tema).catch(() => {});
        await p.waitForTimeout(300);
        for (const id of ['actualizar', 'salir']) {
          const s = await estilo('#' + id);
          h.espera(!!str && !!s && s.clase === 'icon-btn' && JSON.stringify(s.medidas) === JSON.stringify(str.medidas), id + ' · clase «' + (s && s.clase) + '» · ' + JSON.stringify(s && s.medidas) + ' · STR ' + sel + ' ' + JSON.stringify(str && str.medidas));
        }
      },
    },
    {
      c: 'g', perfil: 'admin', nivel: 'N3', tec: 'escenario', cubre: ['MOD'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Paridad visual para el juez: el STR con un módulo abierto (el panel ocupa todo el contenido) y cada entrada de página de la Fábrica, a 1366 y a 390 y con el mismo tema',
      async prueba(h) {
        const p = h.page;
        await p.goto((h.BASE || 'https://app.apartamentosbucaramanga.com') + '/str-app-shell.html', { waitUntil: 'load' }).catch(() => {});
        await p.waitForSelector('.sidebar .nav-item[onclick*="openModule"]', { timeout: 20000 }).catch(() => {});
        await p.click('.sidebar .nav-item[onclick*="str-lo-que-viene.html"]').catch(() => p.click('.sidebar .nav-item[onclick*="openModule"]').catch(() => {}));
        await p.waitForTimeout(2500);
        const tema = await p.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark').catch(() => 'dark');
        await h.captura('str-modulo', { ancho: 1366 });
        await h.captura('str-modulo-390', { ancho: 390 });
        // INC-217 (L-187): el tema del STR se fija ANTES de entrar a la Fábrica con el esquema de color del navegador
        // (Playwright arranca en claro): sin tema guardado, el sitio lo sigue (tema.js), las páginas copiadas del STR se arman
        // con el del sitio al abrirse y las generadas sin data-theme, como la Nomenclatura, siguen a prefers-color-scheme.
        // No se guarda nada en el perfil; si el perfil ya trajera otro tema guardado, la espera siguiente lo dice.
        await p.emulateMedia({ colorScheme: tema === 'light' ? 'light' : 'dark' }).catch(() => {});
        if (!(await entrar(h)).ok) return;
        const temaFabrica = await p.evaluate(() => document.documentElement.getAttribute('data-theme')).catch(() => null);
        h.espera(temaFabrica === tema, 'tema del STR «' + tema + '» · la Fábrica entra en «' + temaFabrica + '», antes de abrir ninguna página');
        for (const e of Object.keys(PAGINAS)) {
          await ver(h, e);
          await p.waitForTimeout(500);
          await h.captura('fabrica-' + e, { ancho: 1366 });
          await h.captura('fabrica-' + e + '-390', { ancho: 390 });
        }
      },
    },
  ],
};
```

## B3. El commit
Mensaje con lo de siempre y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-187 · INC-217 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre
Hecho / No hecho por paso (B1–B3) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
