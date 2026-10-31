# instr — L-188 · INC-218: el caso b de LM-79-proyectos-b busca en el Tablero y en el Plan datos que no dependen del estado del lote que se verifica
Categoría: **estándar** (solo un guion del STR y su puntero; no cambia código de ningún sitio ni del servicio)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 24/24 · subagente de Desarrollo · 2026-10-31 02:27
Decisión: ninguna (arreglo de guion por INC-218; decisión del Arquitecto en M-1349 y del Jefe de proyecto en M-1350: lote estándar de un guion dentro de la excepción M-1264)
Alcance: en str-manager, `tests/e2e/LM-79-proyectos-b.spec.js` (caso b, 5 pares) y `docs/claude/modelo.md` (puntero, dos pares) · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual · `schema_version` igual · los sitios siguen en `?v=s186`
Origen: INC-218 (veredicto de L-186, 02:15: su único rojo, b). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`
Impacto: ninguno en lo que se ve: el caso b de LM-79-proyectos-b toma en el Tablero el nombre del primer objetivo (diseno › objetivos) y en el Plan el título del último lote de un bloque abierto, en vez de un id de lote que solo aparece según su estado, y su observado cabe entero (la cola lo corta en 900 caracteres: el juez no vio seg-cambios ni seg-items a 390). Con L-188 aceptado, L-186 se acepta por composición de veredictos (M-1349).
Reglas transversales que toca: ninguna
Mapa: módulos y relaciones que cambia: MOD (solo su guion); ninguna relación nueva
Casos de uso: CU-MOD-3.1
Riesgo: bajo: unas 25 líneas de un guion, sin código; solo cambia qué dato busca el caso b en dos pestañas y acorta su observado. Conexiones a MySQL (RT-19): una lectura más del servicio en el caso b (el complemento de diseno), en serie.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (el caso b vuelve a sus muestras de L-186).
Paridad (punto 24): (1) código: sin cambios (sitios y servicio como en L-186, fabrica-servicio 623eb97); (2) no aplica: no traslada nada; b compara contra el origen leído del servicio; (3) nada se ve distinto
Depende de: L-186 construido (str-manager 7b3f18d; fabrica-servicio 623eb97) · Precondiciones para verificar: perfil zz-verif-admin; un objetivo en diseno › objetivos; sin datos que crear
¿Quién más depende de lo que cambia?: nadie: solo el caso b de LM-79-proyectos-b. Las muestras se leen del servicio en la misma corrida y no dependen del estado de ningún lote: el nombre de un objetivo y el título de un lote de un bloque que la página abre siempre (en curso, siguiente, esperando a Carlos). Simulado con los datos de ahora: el guion viejo da 2 rojos en b (Tablero a 1366 y 390) y el nuevo, verde, con un observado de 438 caracteres. Al aceptarse, L-186 se acepta por composición (la reprueba la bloquearía la puerta de independencia, M-1332). La marca sinSesion del veredicto de L-186 es un falso positivo del arnés (guion.js › esSinSesion busca «Acceso interno» y «Continuar con Google» en el texto de todos los marcos, y la pestaña Ítems muestra INC que citan esas frases): queda fuera de este lote, avisado al Arquitecto.

## 0. Contexto
- Dos archivos: 5 pares en `tests/e2e/LM-79-proyectos-b.spec.js` y dos en `docs/claude/modelo.md`. Cada «Busca» aparece una sola vez.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.

## B1. El guion (5 pares)
**G1 · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:
```js
// Un dato real por pestaña, leído aparte del servicio: el último lote del plan, la primera prioridad (una REQ de diseño), el último cambio,
// el último INC (Ítems) y, para el Tablero, el lote más reciente que no está aceptado (lo que hay en marcha)
```
Pon:
```js
// Un dato real por pestaña, leído aparte del servicio: el título (resumen) del último lote de un bloque abierto del plan (L-188: el id
// del lote solo podía aparecer en la nota de otro), la primera prioridad (una REQ de diseño), el último cambio,
// el último INC (Ítems) y, para el Tablero, el nombre del primer objetivo (diseno › objetivos; INC-218, L-188: el lote más reciente sin
// aceptar solo sale en el Tablero según su estado, y a la hora del juez ya estaba construido)
```

**G2 · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:
```js
  const prio = fp && Array.isArray(fp.valor) && fp.valor.length ? String(fp.valor[0]) : null;
  const ult = (xs, k) => { for (let i = xs.length - 1; i >= 0; i--) if (xs[i] && xs[i][k]) return String(xs[i][k]); return null; };
```
Pon:
```js
  const prio = fp && Array.isArray(fp.valor) && fp.valor.length ? String(fp.valor[0]) : null;
  const rd = await h.leerModelo('complemento?proyecto=str&archivo=diseno');
  const fo = rd && rd.status === 200 && rd.cuerpo && Array.isArray(rd.cuerpo.filas) ? rd.cuerpo.filas.find((f) => f.clave === 'objetivos') : null;
  const obj = fo && Array.isArray(fo.valor) ? fo.valor.find((x) => x && x.id && x.nombre) : null;
  const ult = (xs, k) => { for (let i = xs.length - 1; i >= 0; i--) if (xs[i] && xs[i][k]) return String(xs[i][k]); return null; };
```

**G3 · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:
```js
  return { 'seg-plan': ult(lotes, 'lote'), 'seg-diseno': prio && reqs.some((q) => q.id === prio) ? prio : null, 'seg-cambios': ult(cambios, 'lote'), 'seg-items': ult(incs, 'id'),
    'seg-tablero': ult(lotes.filter((l) => l.estado !== 'aceptado'), 'lote') };
```
Pon:
```js
  // Plan de trabajo: el resumen del último lote de un bloque abierto (en curso, siguiente o esperando a Carlos), que es su título en la fila
  const abiertos = lotes.filter((l) => ['en curso', 'siguiente', 'esperando a Carlos'].includes(l.vista) && l.resumen);
  const planTxt = abiertos.length ? String(abiertos[abiertos.length - 1].resumen).slice(0, 40) : null;
  return { 'seg-plan': planTxt, 'seg-diseno': prio && reqs.some((q) => q.id === prio) ? prio : null, 'seg-cambios': ult(cambios, 'lote'), 'seg-items': ult(incs, 'id'),
    'seg-tablero': obj ? String(obj.nombre) : null };
```

**G4 · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:
```js
        h.espera(Object.values(mu).every(Boolean), 'muestras del servicio: ' + Object.entries(mu).map((x) => x.join(' ')).join(' · '));
```
Pon:
```js
        // L-188: el observado del caso cabe entero (la cola lo corta en 900 caracteres): muestras cortas y, en verde, una línea corta por entrada
        h.espera(Object.values(mu).every(Boolean), 'muestras: ' + Object.entries(mu).map((x) => x[0].replace('seg-', '') + ' «' + String(x[1]).slice(0, 24) + '»').join(' · '));
```

**G5 · caso b** (`tests/e2e/LM-79-proyectos-b.spec.js`). Busca:
```js
            h.espera(alto && tab && dato, ancho + ' · ' + e + ': visores ' + (m && m.visibles) + ' · alto ' + (m && m.alto) + ' de ' + (m && m.contenido) + ' · pestaña ' + (pest && pest.on) + (pest && pest.visible ? '' : ' (panel oculto)') + ' · «' + mu[e] + '» ' + (dato ? 'está' : 'NO está'));
```
Pon:
```js
            h.espera(alto && tab && dato, ancho + ' ' + e.replace('seg-', '') + ((alto && tab && dato) ? ': bien' : ': visores ' + (m && m.visibles) + ' · alto ' + (m && m.alto) + ' de ' + (m && m.contenido) + ' · pestaña ' + (pest && pest.on) + (pest && pest.visible ? '' : ' (panel oculto)') + ' · dato ' + (dato ? 'está' : 'NO está')));
```

## B2. Mapa del área (docs/claude/modelo.md), dos pares

**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-186 · dueño: MOD
```
Pon:
```md
Al día hasta L-188 · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
un dato real del servicio, las DA y las ADR en Decisiones, el visor aislado, `?v=s186` y deja capturas con el tema del STR fijado antes de entrar.
```
Pon:
```md
un dato real del servicio (desde L-188, INC-218: el nombre del primer objetivo en el Tablero y el título de un lote de un bloque abierto en el Plan, que no dependen del estado del lote que se verifica), las DA y las ADR en Decisiones, el visor aislado, `?v=s186` y deja capturas con el tema del STR fijado antes de entrar.
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

Deuda de cobertura de la ruta: REL-29 (cola-arquitecto→MOD): no aplica, el lote no cambia la carga del Arquitecto; solo qué dato busca el caso b.

## Pruebas derivadas (juez)
```
- a. La barra de P01 con trece entradas y su data-rama (sigue en verde: el lote no la toca) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-186 desplegado · tec: escenario · espera: caso a del guion en verde · **Detener**
- b. Cada entrada de Seg. Proyecto abre la página en su pestaña, a toda la altura en 1366 y 390, con un dato real del servicio que no depende del estado del lote: Tablero con el nombre del primer objetivo y Plan con el título del último lote de un bloque abierto (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso b del guion en verde · **Detener**
- c. Decisiones con las DA y las ADR (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso c en verde · **Detener**
- d. Visor aislado (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: decisión · espera: caso d en verde · **Detener**
- e. Ningún recurso propio sin ?v=s186 (sigue en verde) · nivel: N2 · perfil: zz-verif-admin · página: la misma · precondición: la misma · tec: escenario · espera: caso e en verde · **Detener**
- f. Paridad visual con el tema del STR fijado antes de entrar (sigue en verde) · nivel: N3 · perfil: zz-verif-admin · página: las dos · precondición: la misma · tec: escenario · espera: «proyectos. entra en» el tema del STR y las capturas con la página a toda la altura, con el mismo tema · **Detener**
- t. str-manager sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (G1–G5, D1–D2) · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Resultado esperado del juez: «aceptado».
```

### Guion N2 → `tests/e2e/LM-79-proyectos-b.spec.js` (la CLI no lo copia: es el archivo como queda tras G1–G5; la cola lo compara byte a byte y corre el guion entero)
```js
// LM-79 fase 5.6 c, segunda parte (L-186, M-1309/M-1312/M-1343, regla 9 del contrato): P01 en proyectos. por sus secciones
// (ADR-009) con las cinco pestañas de Seg. Proyecto del STR como entradas de página. La barra de P01 tiene trece entradas en
// el orden de las secciones, cada una con la data-rama de su sección (a); cada entrada de Seg. Proyecto abre la página del STR
// en el visor, en su pestaña, a toda la altura del contenido en 1366 y 390, con un dato real del servicio (b); Decisiones
// muestra las DA y las ADR del proyecto con su título (c); el visor queda aislado (d); ?v=s186 en todo recurso propio (e);
// capturas para el juez con el tema del STR fijado antes de entrar (f, como L-187). Solo lectura: lee el DOM y el servicio,
// cambia la dirección (#entrada), el tamaño de la ventana y el esquema de color del navegador, sin guardar nada.
const PRO = 'https://proyectos.apartamentosbucaramanga.com';
const V = 's186';
const P01 = [['resumen', 'proyectos/P01'], ['seg-tablero', 'proyectos/P01'], ['alcance', 'proyectos/P01/alcance'], ['seg-diseno', 'proyectos/P01/alcance'],
  ['decisiones', 'proyectos/P01/decisiones'], ['construccion', 'proyectos/P01/construccion'], ['seg-plan', 'proyectos/P01/construccion'],
  ['seg-cambios', 'proyectos/P01/construccion'], ['seg-items', 'proyectos/P01/construccion'], ['arquitectura', 'proyectos/P01/arquitectura'],
  ['lineabase', 'proyectos/P01/arquitectura'], ['pruebas', 'proyectos/P01/pruebas'], ['buzon', 'proyectos/P01']];
// Entrada → pestaña de la página y su panel
const SEG = { 'seg-tablero': ['tablero', 'paneTablero'], 'seg-diseno': ['diseno', 'paneDiseno'], 'seg-plan': ['plan', 'panePlan'], 'seg-cambios': ['cambios', 'paneCambios'], 'seg-items': ['items', 'paneItems'] };

async function entrar(h) {
  const recursos = [];
  const oir = (q) => { try { const u = new URL(q.url()); if (u.origin === PRO && /\.(js|css)$/.test(u.pathname) && u.pathname.startsWith('/sitios/')) recursos.push(u.pathname + u.search); } catch (e) { } };
  h.page.on('request', oir);
  const r = await h.entrarSitio(PRO + '/');
  h.page.off('request', oir);
  h.espera(r.ok && r.estado === 'lista', 'entrar a proyectos. como admin → ' + r.observado);
  return { ok: r.estado === 'lista', recursos: [...new Set(recursos)] };
}
// Filas de una tabla del servicio (en el orden del archivo, extra.i)
async function tabla(h, ruta) {
  const r = await h.leerModelo(ruta);
  const fs = r && r.status === 200 && r.cuerpo && Array.isArray(r.cuerpo.filas) ? r.cuerpo.filas : [];
  return fs.map((f, k) => [f && f.extra && typeof f.extra.i === 'number' ? f.extra.i : k, f]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}
const o = (f) => (f && f.extra && f.extra.o && typeof f.extra.o === 'object' ? f.extra.o : {});
// Un dato real por pestaña, leído aparte del servicio: el título (resumen) del último lote de un bloque abierto del plan (L-188: el id
// del lote solo podía aparecer en la nota de otro), la primera prioridad (una REQ de diseño), el último cambio,
// el último INC (Ítems) y, para el Tablero, el nombre del primer objetivo (diseno › objetivos; INC-218, L-188: el lote más reciente sin
// aceptar solo sale en el Tablero según su estado, y a la hora del juez ya estaba construido)
async function muestras(h) {
  const lotes = (await tabla(h, 'lote?proyecto=str&limite=2000')).filter((f) => f.extra && f.extra.f === 'seguimiento.plan').map(o);
  const reqs = (await tabla(h, 'requisito?proyecto=str&limite=2000')).filter((f) => f.extra && f.extra.f === 'diseno.reqs').map(o);
  const cambios = (await tabla(h, 'cambio?proyecto=str&limite=2000')).filter((f) => f.extra && f.extra.f === 'seguimiento.cambios').map(o);
  const incs = (await tabla(h, 'incidente?proyecto=str&limite=2000')).filter((f) => f.extra && f.extra.f === 'seguimiento.incs').map(o);
  const r = await h.leerModelo('complemento?archivo=' + encodeURIComponent('fabrica/proyecto/P01'));
  const fp = r && r.status === 200 && r.cuerpo && Array.isArray(r.cuerpo.filas) ? r.cuerpo.filas.find((f) => f.clave === 'prioridades') : null;
  const prio = fp && Array.isArray(fp.valor) && fp.valor.length ? String(fp.valor[0]) : null;
  const rd = await h.leerModelo('complemento?proyecto=str&archivo=diseno');
  const fo = rd && rd.status === 200 && rd.cuerpo && Array.isArray(rd.cuerpo.filas) ? rd.cuerpo.filas.find((f) => f.clave === 'objetivos') : null;
  const obj = fo && Array.isArray(fo.valor) ? fo.valor.find((x) => x && x.id && x.nombre) : null;
  const ult = (xs, k) => { for (let i = xs.length - 1; i >= 0; i--) if (xs[i] && xs[i][k]) return String(xs[i][k]); return null; };
  // Plan de trabajo: el resumen del último lote de un bloque abierto (en curso, siguiente o esperando a Carlos), que es su título en la fila
  const abiertos = lotes.filter((l) => ['en curso', 'siguiente', 'esperando a Carlos'].includes(l.vista) && l.resumen);
  const planTxt = abiertos.length ? String(abiertos[abiertos.length - 1].resumen).slice(0, 40) : null;
  return { 'seg-plan': planTxt, 'seg-diseno': prio && reqs.some((q) => q.id === prio) ? prio : null, 'seg-cambios': ult(cambios, 'lote'), 'seg-items': ult(incs, 'id'),
    'seg-tablero': obj ? String(obj.nombre) : null };
}
// Lleva a la entrada por la dirección y espera la página dentro del visor (hasta 30 s); mide visor y contenido y lee la pestaña
async function ver(h, entrada) {
  const p = h.page;
  await p.evaluate((e) => { location.hash = e; }, entrada).catch(() => {});
  let interno = null;
  for (let i = 0; i < 60 && !interno; i++) {
    await p.waitForTimeout(500);
    const el = await p.$('#' + entrada + ' iframe.visor[data-pagina="str-seg-proyecto"]').catch(() => null);
    const visor = el ? await el.contentFrame().catch(() => null) : null;
    interno = visor ? visor.childFrames()[0] || null : null;
    if (interno && (await interno.evaluate(() => (document.body ? document.body.innerText.length : 0)).catch(() => 0)) < 200) interno = null;
  }
  const m = await p.evaluate((e) => {
    const c = document.querySelector('.content');
    const vis = [...document.querySelectorAll('#contenido iframe.visor')].filter((f) => f.offsetParent !== null);
    const f = vis[0];
    return { visibles: vis.length, deLaEntrada: !!f && !!f.closest('#' + e), alto: f ? Math.round(f.getBoundingClientRect().height) : null, contenido: Math.round(c.getBoundingClientRect().height),
      sandbox: f ? f.getAttribute('sandbox') : null, sel: [...document.querySelectorAll('.sidebar .nav-item.sel')].map((a) => a.dataset.parte) };
  }, entrada).catch(() => null);
  const pest = interno ? await interno.evaluate((pane) => ({ on: (document.querySelector('.tab.on') || {}).dataset ? document.querySelector('.tab.on').dataset.tab : null,
    visible: !!document.getElementById(pane) && !document.getElementById(pane).hidden,
    texto: document.getElementById(pane) ? document.getElementById(pane).innerText : '' }), SEG[entrada][1]).catch(() => null) : null;
  return { interno, m, pest };
}

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'a', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'La barra de P01 tiene trece entradas en el orden de sus secciones (las cinco de Seg. Proyecto en la suya), cada una con la data-rama de su sección; las de Seg. Proyecto son entradas de página',
      async prueba(h) {
        if (!(await entrar(h)).ok) return;
        const v = await h.page.evaluate(() => ({
          p01: [...document.querySelectorAll('#nav-group-p01 .nav-item')].map((a) => [a.dataset.parte, a.dataset.rama]),
          paginas: [...document.querySelectorAll('section.parte.vista-pagina')].map((s) => s.id),
        })).catch(() => null);
        h.espera(!!v && JSON.stringify(v.p01) === JSON.stringify(P01), 'P01: ' + (v ? v.p01.map((x) => x.join(' ')).join(' · ') : 'sin barra'));
        h.espera(!!v && JSON.stringify(v.paginas) === JSON.stringify(Object.keys(SEG)), 'entradas de página: ' + (v ? v.paginas.join(', ') : '—'));
      },
    },
    {
      c: 'b', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Cada entrada de Seg. Proyecto abre la página del STR en el visor, en su pestaña, a toda la altura del contenido (1366 y 390), con un dato real del servicio',
      async prueba(h) {
        const mu = await muestras(h);
        // L-188: el observado del caso cabe entero (la cola lo corta en 900 caracteres): muestras cortas y, en verde, una línea corta por entrada
        h.espera(Object.values(mu).every(Boolean), 'muestras: ' + Object.entries(mu).map((x) => x[0].replace('seg-', '') + ' «' + String(x[1]).slice(0, 24) + '»').join(' · '));
        if (!(await entrar(h)).ok) return;
        for (const ancho of [1366, 390]) {
          await h.page.setViewportSize({ width: ancho, height: ancho > 500 ? 900 : 844 }).catch(() => {});
          for (const e of Object.keys(SEG)) {
            const { m, pest } = await ver(h, e);
            const alto = !!m && m.visibles === 1 && m.deLaEntrada && m.alto !== null && Math.abs(m.alto - m.contenido) <= 2;
            const tab = !!pest && pest.on === SEG[e][0] && pest.visible;
            const dato = !!pest && !!mu[e] && pest.texto.includes(mu[e]);
            h.espera(alto && tab && dato, ancho + ' ' + e.replace('seg-', '') + ((alto && tab && dato) ? ': bien' : ': visores ' + (m && m.visibles) + ' · alto ' + (m && m.alto) + ' de ' + (m && m.contenido) + ' · pestaña ' + (pest && pest.on) + (pest && pest.visible ? '' : ' (panel oculto)') + ' · dato ' + (dato ? 'está' : 'NO está')));
          }
        }
        await h.page.setViewportSize({ width: 1366, height: 900 }).catch(() => {});
      },
    },
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Decisiones muestra las DA y, plegables, las ADR del proyecto (fabrica/proyecto/P01/doc/ADR-nnn) con su título',
      async prueba(h) {
        const r = await h.leerModelo('complemento?prefijo=' + encodeURIComponent('fabrica/proyecto/P01/doc/'));
        const adrs = r && r.status === 200 && r.cuerpo && Array.isArray(r.cuerpo.filas) ? r.cuerpo.filas.filter((f) => f.clave === 'texto' && /\/doc\/ADR-\d+$/.test(f.archivo)) : [];
        const das = (await tabla(h, 'decision?proyecto=str&limite=500')).length;
        h.espera(adrs.length > 0 && das > 0, 'en el servicio: ' + adrs.length + ' ADR · ' + das + ' DA');
        if (!(await entrar(h)).ok) return;
        await h.page.evaluate(() => { location.hash = 'decisiones'; }).catch(() => {});
        await h.page.waitForTimeout(400);
        const v = await h.page.evaluate(() => ({
          adr: [...document.querySelectorAll('#decisiones details.adr')].map((d) => [d.dataset.archivo, (d.querySelector('summary') || {}).textContent || '']),
          das: (document.querySelector('#decisiones .cuerpo').innerText.match(/\bDA-\d+/g) || []).length,
        })).catch(() => null);
        const sinTitulo = v ? v.adr.filter((x) => !/^ADR-\d+ · \S/.test(x[1]) && !/^ADR-\d+\S*\s+\S/.test(x[1])) : [];
        h.espera(!!v && v.adr.length === adrs.length && sinTitulo.length === 0, 'ADR en Decisiones: ' + (v ? v.adr.length : 0) + ' de ' + adrs.length + ' · sin título: ' + (sinTitulo.map((x) => x[0]).join(', ') || 'ninguna') + (v && v.adr[0] ? ' · la primera «' + v.adr[0][1].slice(0, 60) + '»' : ''));
        h.espera(!!v && v.das > 0, 'DA en Decisiones: ' + (v ? v.das : 0));
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-14', 'RT-18'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Cada visor de Seg. Proyecto queda aislado: sandbox «allow-scripts allow-popups», sin allow-same-origin, origen opaco y sin acceso a la página de afuera',
      async prueba(h) {
        if (!(await entrar(h)).ok) return;
        for (const e of Object.keys(SEG)) {
          const { interno, m } = await ver(h, e);
          const v = interno ? await interno.evaluate(() => [self.origin, (() => { try { return typeof parent.document; } catch (x) { return 'aislado'; } })()]).catch(() => null) : null;
          h.espera(!!m && m.sandbox === 'allow-scripts allow-popups' && !!v && v[0] === 'null' && v[1] === 'aislado', e + ' · sandbox «' + (m && m.sandbox) + '» · origen ' + (v && v[0]) + ' · afuera ' + (v && v[1]));
        }
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['MOD'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Ningún recurso propio de proyectos. (js y css de /sitios/) sin ?v=s186',
      async prueba(h) {
        const e = await entrar(h);
        if (!e.ok) return;
        const sin = e.recursos.filter((x) => !x.endsWith('?v=' + V));
        h.espera(e.recursos.length >= 9 && sin.length === 0, 'recursos propios: ' + e.recursos.length + ' · sin ?v=' + V + ': ' + (sin.join(', ') || 'ninguno'));
      },
    },
    {
      c: 'f', perfil: 'admin', nivel: 'N3', tec: 'escenario', cubre: ['MOD'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Paridad visual para el juez: el STR con un módulo abierto y cada entrada de Seg. Proyecto de proyecto., a 1366 y a 390 y con el mismo tema (fijado antes de entrar)',
      async prueba(h) {
        const p = h.page;
        await p.goto((h.BASE || 'https://app.apartamentosbucaramanga.com') + '/str-app-shell.html', { waitUntil: 'load' }).catch(() => {});
        await p.waitForSelector('.sidebar .nav-item[onclick*="openModule"]', { timeout: 20000 }).catch(() => {});
        await p.click('.sidebar .nav-item[onclick*="str-lo-que-viene.html"]').catch(() => p.click('.sidebar .nav-item[onclick*="openModule"]').catch(() => {}));
        await p.waitForTimeout(2500);
        const tema = await p.evaluate(() => document.documentElement.getAttribute('data-theme') || 'dark').catch(() => 'dark');
        await h.captura('str-modulo', { ancho: 1366 });
        await h.captura('str-modulo-390', { ancho: 390 });
        // El tema del STR se fija ANTES de entrar, con el esquema de color del navegador (L-187): sin tema guardado el sitio lo
        // sigue y la página se arma con el del sitio. No se guarda nada en el perfil.
        await p.setViewportSize({ width: 1366, height: 900 }).catch(() => {});
        await p.emulateMedia({ colorScheme: tema === 'light' ? 'light' : 'dark' }).catch(() => {});
        if (!(await entrar(h)).ok) return;
        const temaSitio = await p.evaluate(() => document.documentElement.getAttribute('data-theme')).catch(() => null);
        h.espera(temaSitio === tema, 'tema del STR «' + tema + '» · proyectos. entra en «' + temaSitio + '», antes de abrir ninguna página');
        for (const e of Object.keys(SEG)) {
          await ver(h, e);
          await p.waitForTimeout(500);
          await h.captura('proyectos-' + e, { ancho: 1366 });
          await h.captura('proyectos-' + e + '-390', { ancho: 390 });
          await p.setViewportSize({ width: 1366, height: 900 }).catch(() => {});
        }
      },
    },
  ],
};
```

## B3. El commit
Mensaje con lo de siempre y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-188 · INC-218 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre
Hecho / No hecho por paso (B1–B3) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
