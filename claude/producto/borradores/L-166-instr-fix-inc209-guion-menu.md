# instr — L-166 · INC-209: el guion REQ-SH-2 cuenta 18 entradas en el menú del admin (con «Línea base», L-165)
Categoría: **estándar** (solo un guion de regresión: `tests/e2e/REQ-SH-2.spec.js`, caso a; no toca producto; fix del escape de L-165, en T-3 por orden del JP M-1124)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-26 20:04
Alcance: `tests/e2e/REQ-SH-2.spec.js` (caso a: el total de entradas y un comentario) · `?v=` igual · `schema_version` igual · sin cambios de base de datos
Versión: `?v=` igual · `schema_version` igual
Impacto: la regresión de la ruta del menú vuelve a verde: el caso a esperaba 17 entradas y el menú del admin tiene 18 desde L-165 (4 + 5 + 1 + 8). Nada cambia para el usuario del STR. Cierra INC-209.
Reglas transversales que toca: ninguna (solo un guion; no toca datos, permisos, archivos, retención ni conexiones)
Mapa: módulos y relaciones que cambia: ninguna (guion de regresión)
Casos de uso: CU-PRJ-1.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.2, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-KN-6.1, CU-OP-4.1, CU-U-2.5
Riesgo: bajo (R-1 del lote; R-12 por ser guion del módulo SH, nivel 6, aunque no cambia código del STR, solo lo que un guion espera). Mitigación: el guion corre entero en la cola con este lote.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (el guion vuelve a esperar 17).
Origen: log/L-165-veredicto.json (19:56), M-1124 (JP), M-1125 (Arquitecto). Requerimiento: INC-209 en `interno/seguimiento.json`. Decisión: ninguna (solo un guion; no toca áreas de A6).
Depende de: L-165 en main (ed99503, menú con «Línea base») · Precondiciones para verificar: perfiles zz-verif-admin y zz-verif-oper con sesión; sin datos que crear
¿Quién más depende de lo que cambia?: nadie fuera de la regresión del menú (la cola corre este guion en la ruta de los lotes que tocan SH); busqué otros totales literales del menú en tests/ y tests/e2e/ (=== n, length) y no queda ninguno viejo (roles.test.js ya cuenta 19).

## 0. Causa (INC-209)
En L-165 la instrucción trajo `tests/e2e/REQ-SH-2.spec.js` completo con las listas `GRUPOS` y `PAGINAS` al día (Proyecto con ocho entradas), pero el caso a seguía comprobando `todos.length === 17` (línea 86). Con «Línea base» el menú del admin tiene 18 entradas, y el caso falla aunque el menú es el correcto. **No cambies nada fuera de este guion.**

## 1. El guion
Copia el bloque de abajo a `tests/e2e/REQ-SH-2.spec.js` sin cambiar un byte; no lo corras ni lo arregles (la cola lo corre). Cambia solo dos líneas respecto de main: un comentario «INC-209 (L-166)» en la cabecera y `todos.length === 18` en el caso a.

## Tests en `tests/`
Ninguno nuevo ni cambiado; `node tests/run.js` en verde (`e2e-esquema.test.js` carga el guion).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos
- Lote de solo guiones o herramientas: corren REQ-SH-2, herramientas/pw/humo-pw; nada más.
```

## Pruebas derivadas (juez; verificador estándar)
```
- a. El admin ve los 4 grupos con sus entradas en orden y 18 entradas en total, sin maquetas · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: L-165 en main · tec: escenario · espera: caso a del guion en verde («entradas: 18») · **Detener**
- b. El resto del guion REQ-SH-2 sigue en verde (operador, Proyecto con 8 páginas que abren, Favoritos, 390 px) · nivel: N2 · perfil: zz-verif-admin y zz-verif-oper · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: a en verde · tec: escenario · espera: los demás casos del guion en verde · **Detener**
- c. El guion del commit es igual al de la instrucción y run.js sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: la cola compara el guion (igual) y `node tests/run.js` n/n · **Detener**
- Datos de prueba: ninguno (solo lectura)
```

### Guion N2 → `tests/e2e/REQ-SH-2.spec.js` (la CLI lo copia tal cual, sin cambiar un byte)
```js
// REQ-SH-2 (L-<n>): menú del STR con solo lo que funciona — Operación del día · Configurar el negocio · Lo que viene (admin)
// · Proyecto (admin, plegado al final). Sin Dashboard ni maquetas; desde OP-1b (L-143) el STR abre en el Tablero (REQ-OP-1,
// data-inicio="1"); sin esa entrada abriría en Limpieza & HK. Solo lectura: navega y lee el DOM, no crea datos.
// El arnés agrupa por perfil en el orden de primera aparición: admin (a, c–j) → oper (b, b2).
// INC-209 (L-166): con «Línea base» (LM-82, L-165) el menú del admin tiene 18 entradas (4 + 5 + 1 + 8).
const base = (h) => h.BASE || new URL(h.page.url()).origin;
const limpio = (t) => String(t || '').replace(/\s+/g, ' ').trim();
const GRUPOS = [
  ['Operación del día', ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario']],
  ['Configurar el negocio', ['Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración']],
  ['Lo que viene', ['Lo que viene']],
  ['Proyecto', ['Seg. Proyecto', 'Marco de Trabajo', 'Instrucciones', 'Cobit', 'Elementos', 'Base de conocimiento', 'Nomenclatura', 'Línea base']],
];
const OPER = ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario', 'Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración'];
const PAGINAS = ['str-tablero.html', 'str-calendario.html', 'str-m1-housekeeping.html', 'str-inventario.html', 'str-propiedades.html', 'str-flujos.html', 'str-conocimiento.html',
  'str-usuarios.html', 'str-lo-que-viene.html', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html',
  'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
const PANELES = ['workflows', 'config', 'housekeeping']; // housekeeping: data-panel de la entrada de HK (abre con openModule)
const MUESTRA = ['Carlos Méndez', 'María González', 'James Smith', 'Laura Ramírez', 'Laura Mesa', 'Ana Ruiz', 'Pedro García', 'Miguel Torres',
  'Apto Centro', 'Casa Laureles', 'Estudio Norte', 'Fuga grifo', 'Vista global del portafolio', 'Ocupación promedio', 'Próximamente en Q'];
const ETAPAS = ['idea', 'definido', 'en construcción'];

// Menú tal como lo deja el shell: grupos con su rótulo, si el rol los oculta (style.display de _aplicarRolesMenu) y si
// están plegados; entradas con rótulo, destino y data-inicio. Solo lee el DOM.
async function menu(h) {
  const p = h.page;
  await p.waitForSelector('.sidebar .nav-group', { timeout: 20000 });
  await p.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  return p.evaluate(() => {
    const oculto = (el) => { for (let e = el; e && !e.classList.contains('sidebar'); e = e.parentElement) if (e.style && e.style.display === 'none') return true; return false; };
    return Array.from(document.querySelectorAll('.sidebar > .nav-group')).map((g) => {
      const hdr = g.querySelector(':scope > .nav-group-hdr');
      return {
        id: g.id, label: ((g.querySelector('.ngr-label') || {}).textContent || '').trim(), oculto: oculto(g),
        plegado: !!(hdr && hdr.classList.contains('collapsed')),
        items: Array.from(g.querySelectorAll(':scope > .nav-group-body > .nav-item')).map((n) => {
          const oc = n.getAttribute('onclick') || '';
          const m = oc.match(/openModule\(this,\s*'([^']*)',\s*'([^']+)'\)/);
          return { label: ((n.querySelector('.ni-label') || {}).textContent || '').trim(), oculto: oculto(n), clase: n.className,
            url: m ? m[2] : null, key: m ? m[1] : null, panel: n.getAttribute('data-panel'), inicio: n.getAttribute('data-inicio'),
            accion: /^(openModule|nav|navSub)\(this/.test(oc) };
        }),
      };
    });
  });
}
const vistas = (gs) => gs.filter((g) => !g.oculto && g.id !== 'nav-group-favoritos').map((g) => [g.label, g.items.filter((i) => !i.oculto).map((i) => i.label)]);
const item = (p, label) => p.locator('.sidebar .nav-item', { has: p.locator('.ni-label', { hasText: new RegExp('^\\s*' + label.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&') + '\\s*$') }) }).first();
async function hasta(cond, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await cond()) return true; await new Promise((r) => setTimeout(r, 300)); } return false; }

// Abre una entrada con su clic y comprueba que su página real se ve (iframe cargado, sin «Sin permiso») o su panel.
async function abrirEntrada(h, it) {
  const p = h.page;
  await item(p, it.label).click({ timeout: 10000 });
  if (it.url) {
    const vis = await hasta(() => p.locator('#panel-mod-' + it.key + '.show').isVisible().catch(() => false), 15000);
    let fr = null;
    await hasta(async () => { fr = p.frames().find((f) => f.url().includes('/' + it.url)); return !!fr; }, 15000);
    if (fr) await fr.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    if (fr) await fr.waitForTimeout(800);
    const txt = fr ? limpio(await fr.evaluate(() => document.body ? document.body.innerText : '').catch(() => '')) : '';
    const muestra = MUESTRA.filter((s) => txt.includes(s));
    h.espera(vis && !!fr && txt.length > 0 && !/Sin permiso para este módulo/.test(txt) && !muestra.length,
      '«' + it.label + '» → ' + it.url + ': panel ' + (vis ? 'a la vista' : 'NO') + ' · página ' + (fr ? 'cargada' : 'NO') + ' · «' + txt.slice(0, 80) + '»' + (muestra.length ? ' · muestra: ' + muestra.join(', ') : ''));
    return fr;
  }
  const id = it.panel === 'workflows' ? '#panel-workflows' : '#panel-' + it.panel;
  const vis = await hasta(() => p.locator(id + '.show').isVisible().catch(() => false), 15000);
  h.espera(vis, '«' + it.label + '» → panel ' + id + ': ' + (vis ? 'a la vista' : 'NO'));
  return null;
}

module.exports = {
  req: 'REQ-SH-2',
  zona: ['SH'],
  casos: [
    {
      c: 'a', perfil: 'admin', cubre: ['REQ-SH-2', 'SH', 'PRJ'], pagina: '/str-app-shell.html',
      que: 'Criterio 1: el admin ve solo los 4 grupos y sus entradas, en orden (más Favoritos); ninguna maqueta',
      async prueba(h) {
        const gs = await menu(h);
        const v = vistas(gs);
        h.espera(JSON.stringify(v) === JSON.stringify(GRUPOS), 'menú del admin: ' + JSON.stringify(v));
        h.espera(!!gs.length && gs[0].id === 'nav-group-favoritos', 'Favoritos arriba: ' + (gs[0] && gs[0].id));
        const todos = gs.flatMap((g) => g.items);
        const raros = todos.filter((i) => !i.accion || /type-(soon|dash|bottom)/.test(i.clase) || (i.url ? !PAGINAS.includes(i.url) : !PANELES.includes(i.panel)));
        h.espera(todos.length === 18 && !raros.length, 'entradas: ' + todos.length + ' · maquetas o sin página real: ' + (raros.map((i) => i.label).join(', ') || 'ninguna'));
      },
    },
    {
      c: 'c', perfil: 'admin', cubre: ['REQ-SH-2', 'SH', 'PRJ', 'REL-24', 'RT-4'], pagina: '/str-app-shell.html',
      que: 'Criterio 3: «Lo que viene» lista lo pendiente con nombre, para y etapa; la etapa mostrada es la que sale de diseno.json y seguimiento.json del mismo commit (M-547)',
      async prueba(h) {
        const gs = await menu(h);
        const it = gs.flatMap((g) => g.items).find((i) => i.label === 'Lo que viene');
        h.espera(!!it && it.url === 'str-lo-que-viene.html', 'entrada «Lo que viene»: ' + JSON.stringify(it || null));
        if (!it) return;
        const fr = await abrirEntrada(h, it);
        if (!fr) return;
        await hasta(async () => (await fr.locator('#lqvLista').getAttribute('data-lqv-estado').catch(() => 'cargando')) !== 'cargando', 20000);
        const estado = await fr.locator('#lqvLista').getAttribute('data-lqv-estado').catch(() => null);
        const enc = limpio(await fr.locator('[data-docs-encabezado]').first().textContent().catch(() => ''));
        const sha = await fr.locator('[data-docs-encabezado]').first().getAttribute('data-sha').catch(() => null);
        h.espera(/^Datos (de las|del) .* · [0-9a-f]{7}$|^Datos de main/.test(enc), 'encabezado: «' + enc + '» · sha ' + (sha || '—'));
        const areas = await fr.locator('[data-lqv-area]').evaluateAll((els) => els.map((e) => ({
          nombre: ((e.querySelector('.lqv-nombre') || {}).textContent || '').trim(),
          para: ((e.querySelector('.lqv-para') || {}).textContent || '').trim(),
          etapa: (e.querySelector('.lqv-etapa') || { getAttribute: () => null }).getAttribute('data-etapa'),
          orden: ((e.querySelector('.lqv-orden') || {}).textContent || '').trim() }))).catch(() => []);
        const malas = areas.filter((a) => !a.nombre || !a.para || !ETAPAS.includes(a.etapa));
        h.espera(estado === 'ok' && areas.length > 0 && !malas.length,
          'estado ' + estado + ' · ' + areas.length + ' áreas · sin nombre, para o etapa: ' + JSON.stringify(malas.slice(0, 3)) + ' · primeras: ' + JSON.stringify(areas.slice(0, 3)));
        const ords = areas.map((a) => Number(a.orden)).filter((n) => Number.isFinite(n));
        h.espera(ords.every((n, i) => !i || ords[i - 1] <= n), 'en orden: ' + ords.join(', '));
        // M-547: la etapa no se escribe a mano: se recalcula aquí, por separado, de los tres JSON publicados del MISMO commit
        // (solo GET a raw.githubusercontent.com, que la guardia deja leer) y se compara con lo que muestra la página.
        // Cambiar el estado de un REQ real no se puede desde un guion (diseno.json es de Diseño, en otro repo): ese caso va en N1.
        const raw = (ruta) => h.page.request.get('https://raw.githubusercontent.com/thcure/str-manager-docs/' + (sha || 'main') + '/' + ruta)
          .then((r) => (r.ok() ? r.json() : null)).catch(() => null);
        const [lqv, dis, seg] = await Promise.all([raw('interno/lo-que-viene.json'), raw('interno/diseno.json'), raw('interno/seguimiento.json')]);
        h.espera(!!(lqv && dis && seg), 'JSON publicados leídos: lo-que-viene ' + !!lqv + ' · diseno ' + !!dis + ' · seguimiento ' + !!seg);
        if (!(lqv && dis && seg)) return;
        const N = (r) => String(r == null ? '' : r).trim().toUpperCase();
        const est = {}, lot = {};
        (dis.reqs || []).forEach((r) => { if (r && r.id) est[N(r.id)] = String(r.estado || '').toLowerCase(); });
        (seg.plan || []).forEach((p) => { if (p && p.req) (lot[N(p.req)] = lot[N(p.req)] || []).push(String(p.estado || '').toLowerCase()); });
        const etapa = (a) => {
          const rs = (a.reqs || []).map(N).filter(Boolean);
          if (!rs.length) return ETAPAS.includes(String(a.etapa || '').toLowerCase()) ? String(a.etapa).toLowerCase() : 'idea';
          const vivos = rs.filter((r) => !['aceptado', 'cerrado', 'descartado'].includes(est[r] || 'borrador'));
          if (!vivos.length) return null;
          if (vivos.some((r) => (lot[r] || []).some((e) => ['encolado', 'construyendo', 'construido', 'verificando', 'desplegado', 'parcial'].includes(e)))) return 'en construcción';
          if (vivos.some((r) => ['definido', 'aprobado', 'entregado', 'construido'].includes(est[r] || 'borrador'))) return 'definido';
          return 'idea';
        };
        const esperado = (lqv.areas || []).filter((a) => a && String(a.nombre || '').trim()).map((a) => ({ nombre: String(a.nombre).trim(), etapa: etapa(a) })).filter((a) => a.etapa !== null);
        const vista = {}; areas.forEach((a) => { vista[a.nombre] = a.etapa; });
        const dif = esperado.filter((a) => vista[a.nombre] !== a.etapa).map((a) => a.nombre + ': se ve ' + vista[a.nombre] + ', sale ' + a.etapa);
        const sobran = areas.filter((a) => !esperado.some((x) => x.nombre === a.nombre)).map((a) => a.nombre);
        h.espera(!dif.length && !sobran.length && esperado.length === areas.length,
          'etapa mostrada = calculada de los JSON (' + esperado.length + ' áreas; las que tienen todos sus REQ aceptados no salen): ' + (dif.concat(sobran.map((x) => x + ' no debería salir')).join(' · ') || 'todas iguales'));
      },
    },
    {
      c: 'd', perfil: 'admin', cubre: ['REQ-SH-2', 'SH'], pagina: '/str-app-shell.html',
      que: 'Criterio 4: al entrar, ni el shell ni su página de inicio muestran datos inventados; sin selector de propiedad de muestra',
      async prueba(h) {
        const p = h.page;
        await menu(h);
        const txt = limpio(await p.evaluate(() => document.body.innerText).catch(() => ''));
        const hay = MUESTRA.filter((s) => txt.includes(s));
        h.espera(!hay.length, 'textos de muestra en el shell: ' + (hay.join(', ') || 'ninguno'));
        const sel = await p.locator('#propBtn, #propDropdown, .prop-option').count();
        h.espera(sel === 0, 'selector de propiedad de muestra: ' + sel);
        await hasta(() => p.frames().some((f) => /str-tablero\.html/.test(f.url())), 20000);
        const fr = p.frames().find((f) => /str-tablero\.html/.test(f.url()));
        const t2 = fr ? limpio(await fr.evaluate(() => document.body ? document.body.innerText : '').catch(() => '')) : '';
        const hay2 = MUESTRA.filter((s) => t2.includes(s));
        h.espera(!!fr && !hay2.length, 'Tablero (inicio, OP-1b): ' + (fr ? 'abierto' : 'NO') + ' · textos de muestra: ' + (hay2.join(', ') || 'ninguno'));
      },
    },
    {
      c: 'e', perfil: 'admin', cubre: ['REQ-SH-2', 'SH'], pagina: '/str-app-shell.html',
      que: 'Criterio 5: al entrar, el STR abre en el Tablero si su entrada existe (REQ-OP-1); si no, en Limpieza & HK',
      async prueba(h) {
        const p = h.page;
        const gs = await menu(h);
        const cands = gs.filter((g) => !g.oculto).flatMap((g) => g.items).filter((i) => i.inicio && !i.oculto).sort((x, y) => Number(x.inicio) - Number(y.inicio));
        const esp = cands[0] || null;
        h.espera(!!esp && (esp.label === 'Tablero' || (esp.label === 'Limpieza & HK' && !gs.flatMap((g) => g.items).some((i) => i.label === 'Tablero'))), 'inicio esperado: ' + (esp ? esp.label : 'ninguno'));
        if (!esp) return;
        const vis = await hasta(() => p.locator('#panel-mod-' + esp.key + '.show').isVisible().catch(() => false), 20000);
        const sel = limpio(await p.locator('.sidebar .nav-item.sel .ni-label').first().textContent().catch(() => ''));
        const otros = await p.locator('.content > .panel.show').count();
        h.espera(vis && sel === esp.label && otros === 1, 'abierto: ' + (vis ? esp.url : 'nada') + ' · marcado en el menú: «' + sel + '» · paneles a la vista: ' + otros);
      },
    },
    {
      c: 'f', perfil: 'admin', cubre: ['REQ-SH-2', 'SH', 'PRJ'], pagina: '/str-app-shell.html',
      que: 'Criterio 6: Proyecto va al final, cerrado al entrar, solo admin; sus 8 páginas abren igual (LM-82: + Línea base)',
      async prueba(h) {
        const p = h.page;
        const gs = await menu(h);
        const pr = gs[gs.length - 1] || {};
        const otrosPleg = gs.filter((g) => g.id !== 'nav-group-proyecto' && g.plegado).map((g) => g.label);
        h.espera(pr.id === 'nav-group-proyecto' && pr.plegado && !otrosPleg.length, 'último grupo: ' + pr.label + ' · cerrado: ' + pr.plegado + ' · otros plegados: ' + (otrosPleg.join(', ') || 'ninguno'));
        const cuerpo = await p.locator('#nav-group-proyecto > .nav-group-body').isVisible().catch(() => true);
        h.espera(!cuerpo, 'entradas de Proyecto ocultas hasta abrirlo: ' + (!cuerpo ? 'sí' : 'no'));
        await p.click('#nav-group-proyecto > .nav-group-hdr');
        for (const it of pr.items || []) await abrirEntrada(h, it);
      },
    },
    {
      c: 'g', perfil: 'admin', cubre: ['REQ-SH-2', 'SH'], pagina: '/str-app-shell.html',
      que: 'Criterio 7: ninguna entrada aparece dos veces fuera de Favoritos; Favoritos solo trae lo que el perfil marcó',
      async prueba(h) {
        const p = h.page;
        const gs = await menu(h);
        const fuera = gs.filter((g) => g.id !== 'nav-group-favoritos').flatMap((g) => g.items);
        const lab = fuera.map((i) => i.label), dst = fuera.map((i) => i.url || 'panel:' + i.panel);
        h.espera(new Set(lab).size === lab.length && new Set(dst).size === dst.length, 'repetidos fuera de Favoritos: ' + (lab.filter((x, i) => lab.indexOf(x) !== i).concat(dst.filter((x, i) => dst.indexOf(x) !== i)).join(', ') || 'ninguno'));
        const fav = await p.evaluate(() => ({
          vacio: !!document.querySelector('#fav-list .fav-empty'),
          items: Array.from(document.querySelectorAll('#fav-list .fav-item .fi-label')).map((e) => e.textContent.trim()),
          estrellas: Array.from(document.querySelectorAll('.sidebar .nav-item .ni-star.active')).map((s) => ((s.parentNode.querySelector('.ni-label') || {}).textContent || '').trim()),
        }));
        const vivos = fav.items.filter((l) => fav.estrellas.includes(l));
        h.espera(fav.vacio ? fav.items.length === 0 : fav.items.length > 0, 'Favoritos: ' + (fav.vacio ? 'vacío' : fav.items.join(', ')) + ' · con ★ en el menú: ' + (vivos.join(', ') || 'ninguno'));
      },
    },
    {
      c: 'h', perfil: 'admin', cubre: ['REQ-SH-2', 'SH', 'PRJ'], pagina: '/str-app-shell.html',
      que: 'Criterio 8: cada página real abre desde su nueva entrada (Operación del día, Configurar el negocio, Lo que viene)',
      async prueba(h) {
        const gs = await menu(h);
        for (const g of gs.filter((x) => ['nav-group-operacion', 'nav-group-configurar', 'nav-group-lo-que-viene'].includes(x.id))) {
          for (const it of g.items) await abrirEntrada(h, it);
        }
      },
    },
    {
      c: 'i', nivel: 'N3', perfil: 'admin', cubre: ['REQ-SH-2', 'SH'], pagina: '/str-app-shell.html',
      que: 'Criterio 8 (390 px): el menú plegado se abre con ☰ y se leen los grupos sin desbordar',
      async prueba(h) {
        const p = h.page;
        await p.setViewportSize({ width: 390, height: 844 }); // primero el ancho (L-106)
        await p.goto(base(h) + '/str-app-shell.html', { waitUntil: 'load' });
        await menu(h);
        const antes = await p.locator('.sidebar.mobile-open').count();
        await p.click('#hamburger');
        await p.waitForTimeout(700);
        const despues = await p.locator('.sidebar.mobile-open').count();
        h.espera(antes === 0 && despues === 1, 'menú a 390 px: cerrado al entrar ' + (antes === 0 ? 'sí' : 'no') + ' · abierto con ☰ ' + (despues === 1 ? 'sí' : 'no'));
        const a = await p.$eval('html', (el) => ({ s: el.scrollWidth, c: el.clientWidth }));
        h.espera(a.s <= a.c, 'shell a 390 px: scrollWidth ' + a.s + ' · clientWidth ' + a.c);
        await h.captura('menu-390', { ancho: 390, completa: false });
      },
    },
    {
      c: 'j', nivel: 'N3', perfil: 'admin', cubre: ['REQ-SH-2', 'SH', 'PRJ'], pagina: '/str-app-shell.html',
      que: 'Criterio 3 (vista): «Lo que viene» se entiende a 390 px: por área, nombre, para qué sirve, etapa y orden',
      async prueba(h) {
        const p = h.page;
        await p.setViewportSize({ width: 390, height: 844 });
        await p.goto(base(h) + '/str-app-shell.html', { waitUntil: 'load' });
        await menu(h);
        await p.click('#hamburger');
        await p.waitForTimeout(500);
        await item(p, 'Lo que viene').click({ timeout: 10000 });
        let fr = null;
        await hasta(async () => { fr = p.frames().find((f) => /str-lo-que-viene\.html/.test(f.url())); return !!fr; }, 15000);
        if (fr) await hasta(async () => (await fr.locator('#lqvLista').getAttribute('data-lqv-estado').catch(() => 'cargando')) !== 'cargando', 20000);
        await p.waitForTimeout(600);
        await h.captura('lo-que-viene-390', { ancho: 390, completa: false });
      },
    },
    {
      c: 'b', perfil: 'oper', cubre: ['REQ-SH-2', 'SH'], pagina: '/str-app-shell.html',
      que: 'Criterios 2 y 5: el operador no ve «Lo que viene» ni «Proyecto»; ve las 9 entradas que su rol abre y entra en el Tablero (OP-1b)',
      async prueba(h) {
        const p = h.page;
        const gs = await menu(h);
        const v = vistas(gs);
        const ocultos = gs.filter((g) => g.oculto).map((g) => g.id).sort();
        h.espera(JSON.stringify(ocultos) === JSON.stringify(['nav-group-lo-que-viene', 'nav-group-proyecto']), 'grupos ocultos al operador: ' + ocultos.join(', '));
        h.espera(JSON.stringify(v.flatMap((x) => x[1])) === JSON.stringify(OPER), 'entradas del operador: ' + JSON.stringify(v));
        const vis = await hasta(() => p.locator('#panel-mod-tablero.show').isVisible().catch(() => false), 20000);
        h.espera(vis, 'inicio del operador: Tablero ' + (vis ? 'abierto' : 'NO'));
      },
    },
    {
      c: 'b2', perfil: 'oper', cubre: ['REQ-SH-2', 'SH', 'PRJ', 'RT-14', 'RT-13'], pagina: '/str-app-shell.html',
      que: 'Criterio 2 (negativo, RT-14 y RT-13): el operador que abre a mano «Lo que viene» o Seg. Proyecto vuelve al STR sin ver nada',
      async prueba(h) {
        const p = h.page;
        for (const pg of ['str-lo-que-viene.html', 'str-seg-proyecto.html']) {
          await p.goto(base(h) + '/' + pg, { waitUntil: 'load' }).catch(() => null);
          await hasta(() => /\/str-app-shell\.html/.test(p.url()), 10000);
          const lista = await p.locator('#lqvLista [data-lqv-area], #paneTablero').count().catch(() => 0);
          h.espera(/\/str-app-shell\.html/.test(p.url()) && lista === 0, pg + ' como operador → ' + p.url().replace(base(h), '') + ' · contenido de la página: ' + lista);
        }
      },
    },
  ],
};
```

## 2. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-166 · INC-209 · Casos de uso: CU-PRJ-1.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.2, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-KN-6.1, CU-OP-4.1, CU-U-2.5
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: no aplica (solo un guion)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
