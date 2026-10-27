# instr — L-165 · LM-82: página «Línea base» del grupo Proyecto (`str-linea-base.html`): el explorador de la línea base del STR, al día, en un iframe aislado
Categoría: **normal** (pantalla interna nueva de solo lectura y solo admin, con la misma guarda que Lo que viene y seis páginas del grupo; no toca datos, permisos del servidor, `api/` ni la base; orden de Carlos M-1118, única excepción a la pausa de producto; JP M-1120, tanda T-3)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-26 19:34
Alcance: `str-linea-base.html` (nuevo) · `str-app-shell.html` (una entrada del menú, P2) · `tests/linea-base-pagina.test.js` (nuevo) · `tests/menu-sh2.test.js` · `tests/roles.test.js` · `tests/e2e/LM-82.spec.js` (nuevo) · `tests/e2e/REQ-SH-2.spec.js` · `CLAUDE.md` (§ 2 y § 3) · `docs/claude/proyecto.md` · `docs/claude/shell-y-api.md` · `docs/claude/tests-y-despliegue.md` · `?v=` `p5c112` → `p5c113` · `schema_version` igual · sin cambios de base de datos
Versión: `?v=` `p5c112` → `p5c113` en todos los archivos que cargan `str-api.js` y en las dos líneas de `CLAUDE.md` · `schema_version` igual (14)
Impacto: el admin ve en el STR, en Proyecto › Línea base, el explorador de la línea base (lo construido · línea objetivo · brecha) del último commit del repo de documentos, que GitHub Actions regenera solo con cada cambio de sus fuentes (LM-82). Nada cambia para operador ni colaborador. Casos de uso: los del menú salen del guion REQ-SH-2 que cambia; CU-PRJ-2.1 y CU-PRJ-2.2 (encabezado y Actualizar) los ejerce el guion LM-82 (c, e), pero el cálculo C2 no los ve porque e2e-esquema no admite CU-n en «cubre» (aviso al Arquitecto).
Reglas transversales que toca: RT-20 (versión `p5c113` en todas las páginas y en `CLAUDE.md`) · RT-4 (un dato, una fuente: el explorador se lee del repo de documentos, no se copia al STR)
Mapa: módulos y relaciones que cambia: PRJ (página nueva `str-linea-base.html`) · SH (entrada del menú en Proyecto) · REL-24 (PRJ → github) gana una ruta: `interno/linea-base/linea-base.html` (texto, no JSON)
Casos de uso: CU-PRJ-1.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.1, CU-SH-5.2, CU-SH-5.3, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-KN-6.1, CU-OP-4.1, CU-U-2.5
Riesgo: medio (R-12: toca SH, nivel 6; un lote malo en main llega a producción en minutos). K3 sale en la ruta solo porque comparte `str-app-shell.html`; el lote no lo toca. Mitigación: el shell solo gana una entrada de menú (`menu-sh2.test.js`, `roles.test.js` y el guion `REQ-SH-2.spec.js` corren en la ruta) y la página nueva no escribe ni ve la sesión del STR (iframe sin permiso de mismo origen).
¿Datos personales o dinero?: no (el explorador trae ids de casos de uso, REQ e INC del repo de documentos; ningún dato de huéspedes ni de personas) · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-82; orden de Carlos M-1118)
Reversión: `git revert <hash>` (se va la página y su entrada de menú; la versión vuelve a `p5c112`).
Origen: M-1118 (orden de Carlos), M-1119 (Arquitecto), M-1120 (JP). Requerimiento: `interno/lotes-modelo/LM-82.md` (§ Lote del STR). Decisión: ninguna (no toca `api/`, auth, retención, cron ni secretos; el STR no tiene CSP que bloquee `srcdoc`, comprobado en `.htaccess` y en las páginas)
Depende de: L-164 aceptado (be8a550) y `interno/linea-base/linea-base.html` publicado en main del repo de documentos (3825543) · Precondiciones para verificar: perfiles zz-verif-admin, zz-verif-oper y zz-verif-colab con sesión; sin datos que crear
¿Quién más depende de lo que cambia?: `tests/menu-sh2.test.js`, `tests/roles.test.js` y `tests/e2e/REQ-SH-2.spec.js` cuentan las páginas de Proyecto (pasan de siete a ocho); los favoritos del shell (`data-fav-url`); el Arquitecto añade después los casos de uso de la capacidad «Línea base del STR» en `interno/linea-base/PRJ.json` y la fila del mapa.

## 0. Contexto
- Es la **única excepción a la pausa de producto** (orden de Carlos, M-1118): un solo lote, sin nada más.
- No toques `api/`, `str-api.js` (salvo `STR_API_VERSION`), los hooks ni ningún archivo fuera del Alcance. No hay CSP en el STR (`.htaccess` y las páginas no la declaran): no añadas ninguna.
- La página nueva copia la guarda, el tema y el encabezado de `str-lo-que-viene.html` (mismas clases y atributos `data-docs-*`); no la reescribas a tu modo: va completa en § 1.
- El explorador es un `.html` autónomo de ~1,6 MB del repo de documentos (`interno/linea-base/linea-base.html`, lo regenera GitHub Actions). Va en un iframe con `sandbox="allow-scripts allow-popups"` y **sin** permiso de mismo origen: no añadas `allow-same-origin` ni `allow-top-navigation`, ni lo cargues con `src`.

## 1. `str-linea-base.html` (nuevo)
**P1 · archivo nuevo** `str-linea-base.html`. Contenido completo:
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Línea base · STR Manager</title>
  <!-- LM-82 (L-165): explorador de la línea base del STR (lo construido · línea objetivo · brecha), siempre al día. Solo admin.
       Lee interno/linea-base/linea-base.html del repo de documentos (lo regenera GitHub Actions con cada push a sus fuentes)
       con STRApi.docs, del mismo commit de main que dice el encabezado, y lo muestra en un iframe aislado
       (sandbox="allow-scripts allow-popups", sin permiso de mismo origen: no ve la sesión ni el almacenamiento del STR). No escribe nada. -->
  <style>
    /* ── TOKENS (compartidos con str-app-shell.html — REQ-S1) ─── */
    :root {
      color-scheme: dark;
      --bg-base: #080c14; --bg-surface: #0a111c; --bg-card: #0d1623; --bg-card-hover: #0f1e2e; --bg-inset: #070b12;
      --text-1: #f8fafc; --text-2: #94a3b8; --text-3: #475569; --text-4: #334155;
      --border: #1a2840; --border-s: #111f30;
      --accent: #7c3aed; --accent-fg: #c084fc; --accent-bg: #7c3aed18;
      --green: #10b981; --green-fg: #34d399; --green-bg: #10b98115;
      --yellow: #f59e0b; --yellow-fg: #fbbf24; --yellow-bg: #f59e0b15;
      --red: #ef4444; --red-fg: #f87171; --red-bg: #ef444415;
      --blue: #3b82f6; --blue-fg: #60a5fa; --blue-bg: #3b82f615;
      --card-shadow: 0 1px 2px rgba(0,0,0,.35);
      --bg: var(--bg-base); --card: var(--bg-card); --text: var(--text-1); --text2: var(--text-2);
      --primary: var(--accent); --primary-h: #6d28d9; --danger: var(--red); --radius: 10px;
    }
    :root[data-theme="light"] {
      color-scheme: light;
      --bg-base: #f0f4f8; --bg-surface: #ffffff; --bg-card: #ffffff; --bg-card-hover: #f7f9fc; --bg-inset: #f7f9fc;
      --text-1: #0f172a; --text-2: #1e293b; --text-3: #64748b; --text-4: #94a3b8;
      --border: #dce3ed; --border-s: #e8eef5;
      --accent: #7c3aed; --accent-fg: #6d28d9; --accent-bg: #7c3aed12;
      --green: #059669; --green-fg: #047857; --green-bg: #d1fae5;
      --yellow: #d97706; --yellow-fg: #b45309; --yellow-bg: #fef3c7;
      --red: #dc2626; --red-fg: #b91c1c; --red-bg: #fee2e2;
      --blue: #2563eb; --blue-fg: #1d4ed8; --blue-bg: #dbeafe;
      --card-shadow: 0 1px 2px rgba(15,23,42,.06), 0 0 0 1px rgba(15,23,42,.04);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; font-size: 13px; }

    .topbar { position: sticky; top: 0; z-index: 100; background: var(--bg-surface); border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; padding: 0 16px; height: 52px; gap: 12px; }
    .topbar-left { display: flex; align-items: center; gap: 10px; }
    .topbar-title { font-size: .95rem; font-weight: 800; color: var(--text-1); }
    .shell-back { display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border: 1px solid var(--border);
      border-radius: 8px; color: var(--text2); text-decoration: none; font-size: 13px; font-weight: 500; }
    .shell-back:hover { background: var(--bg-inset); color: var(--text); }
    body.in-iframe .topbar { display: none; }
    body.in-iframe .lb-pagina { height: 100vh; }

    .lb-pagina { display: flex; flex-direction: column; height: calc(100vh - 52px); }
    .lb-cab { flex: none; display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; padding: 10px 16px;
      border-bottom: 1px solid var(--border); background: var(--bg-surface); }
    .lb-cab h1 { font-size: .95rem; font-weight: 800; }
    .actualizado { color: var(--text-3); font-size: .72rem; }
    .docs-act { margin-left: 8px; padding: 1px 8px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-card);
      color: var(--text-2); font-size: .68rem; font-family: inherit; cursor: pointer; }
    .docs-act:disabled { opacity: .5; cursor: default; }
    .lb-cuerpo { flex: 1; min-height: 0; position: relative; }
    #lbMarco { display: block; width: 100%; height: 100%; border: none; background: #f4f6f3; }
    #lbMarco[hidden] { display: none; }
    .empty { text-align: center; padding: 56px 20px; color: var(--text-3); line-height: 1.5; }
    .empty:empty { display: none; }
    .empty-icon { font-size: 36px; margin-bottom: 10px; }
    .btn-retry { margin-top: 12px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-card);
      color: var(--text-1); font-size: .74rem; font-family: inherit; cursor: pointer; }
    .btn-retry:hover { border-color: var(--primary); }
    .sin-permiso { padding: 24px; color: var(--text-2); font-family: sans-serif; }
    @media (max-width: 480px) {
      .lb-cab { padding: 8px 12px; }
    }
  </style>
</head>
<body>
  <div class="topbar">
    <div class="topbar-left">
      <a href="str-app-shell.html" class="shell-back">← Shell</a>
      <span class="topbar-title">📐 Línea base</span>
    </div>
  </div>

  <div class="lb-pagina">
    <div class="lb-cab">
      <h1>📐 Línea base</h1>
      <div class="actualizado"><span id="actualizado" data-docs-encabezado>Cargando…</span><button type="button" class="docs-act" id="btnDocsAct" data-docs-actualizar>⟳ Actualizar</button></div>
    </div>
    <div class="lb-cuerpo" id="lbCuerpo" data-lb-estado="cargando">
      <div class="empty" id="lbVacio"></div>
      <iframe id="lbMarco" title="Explorador de la línea base" sandbox="allow-scripts allow-popups" hidden></iframe>
    </div>
  </div>

<script src="str-api.js?v=p5c113"></script>
<script>
(function () {
  if (window.self !== window.top) document.body.classList.add('in-iframe');

  /* ── THEME (misma regla que el shell: str-theme, default dark) — REQ-S1 ── */
  try { document.documentElement.setAttribute('data-theme', localStorage.getItem('str-theme') || 'dark'); }
  catch (e) { document.documentElement.setAttribute('data-theme', 'dark'); }
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'str-theme') document.documentElement.setAttribute('data-theme', ev.newValue || 'dark');
  });

  // ── Acceso: superadmin o admin (la misma guarda que las páginas del grupo Proyecto) ──
  if (!STRApi.requireSession(location.pathname.split('/').pop() + location.search)) return;
  const _me = STRApi.user && STRApi.user();
  const _rol = _me && _me.user ? _me.user.rol : null;
  if (_rol !== 'superadmin' && _rol !== 'admin') {
    if (window.self !== window.top) {
      document.body.innerHTML = '<div class="sin-permiso">Sin permiso para este módulo.</div>';
    } else {
      location.replace(STRApi.rutaInicio ? STRApi.rutaInicio(_me) : 'str-app-shell.html');
    }
    return;
  }


  // [LB-inicio] LM-82: funciones puras (tests/linea-base-pagina.test.js). El explorador es un .html autónomo del repo de documentos;
  // se muestra entero en srcdoc con la cabecera mínima (sin <base> ni acceso al STR).
  const LB_RUTA = 'interno/linea-base/linea-base.html';
  const LB_CABECERA = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
  function _lbSrcdoc(texto) { return LB_CABECERA + String(texto == null ? '' : texto); }
  // [LB-fin]

  const $ = (sel) => document.querySelector(sel);
  const _esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const cuerpo = $('#lbCuerpo'), marco = $('#lbMarco'), vacio = $('#lbVacio');

  function pintarVacio(icono, texto, estado, conReintento) {
    cuerpo.dataset.lbEstado = estado;
    marco.hidden = true;
    vacio.innerHTML = '<div class="empty-icon">' + icono + '</div>' + _esc(texto)
      + (conReintento ? '<div><button class="btn-retry" id="btnReintentar">Reintentar</button></div>' : '');
    if (conReintento) $('#btnReintentar').addEventListener('click', () => cargar(true));
  }

  // Una consulta a la API de GitHub por carga (commit de main) y el explorador de ese mismo commit; «⟳ Actualizar» la repite.
  // Solo 200 cuenta: 404 = aún no publicado; cualquier otro código o un fallo de red = error con «Reintentar».
  function cargar(forzar) {
    cuerpo.dataset.lbEstado = 'cargando';
    return STRApi.docs.commit({ forzar: forzar === true }).then((commit) => {
      const e = $('#actualizado');
      e.textContent = STRApi.docs.encabezado(commit);
      if (commit) e.dataset.sha = commit.sha; else delete e.dataset.sha;
      return fetch(STRApi.docs.url(LB_RUTA, commit), { cache: 'no-store', credentials: 'omit' });
    }).then((r) => {
      if (r.status === 404) { pintarVacio('📐', 'Todavía no hay explorador publicado (falta ' + LB_RUTA + ' en el repo de documentos).', 'vacio', false); return; }
      if (r.status !== 200) throw new Error('HTTP ' + r.status);
      return r.text().then((texto) => {
        vacio.innerHTML = '';
        marco.srcdoc = _lbSrcdoc(texto);
        marco.hidden = false;
        cuerpo.dataset.lbEstado = 'ok';
      });
    }).catch((err) => {
      pintarVacio('⚠', 'No se pudo leer el explorador de la línea base (' + ((err && err.message) || 'error') + '). Reintenta en un momento.', 'error', true);
    });
  }
  $('#btnDocsAct').addEventListener('click', () => {
    const b = $('#btnDocsAct');
    b.disabled = true;
    cargar(true).finally(() => { b.disabled = false; });
  });

  cargar();
})();
</script>
</body>
</html>
```

## 2. `str-app-shell.html` — entrada del menú

**P2 · octava entrada del grupo Proyecto, después de Nomenclatura** (`str-app-shell.html`). Busca:
```md
        <div class="nav-item type-active" data-fav-url="str-nomenclatura.html" data-roles="admin" onclick="openModule(this,'nomenclatura','str-nomenclatura.html')"><div class="ni-icon">📘</div><div class="ni-label">Nomenclatura</div></div>
```
Pon:
```md
        <div class="nav-item type-active" data-fav-url="str-nomenclatura.html" data-roles="admin" onclick="openModule(this,'nomenclatura','str-nomenclatura.html')"><div class="ni-icon">📘</div><div class="ni-label">Nomenclatura</div></div>
        <div class="nav-item type-active" data-fav-url="str-linea-base.html" data-roles="admin" onclick="openModule(this,'linea-base','str-linea-base.html')"><div class="ni-icon">📐</div><div class="ni-label">Línea base</div></div>
```

## 3. Versión `p5c112` → `p5c113`
Cambia `p5c112` por `p5c113` en **todos** los `.html` y `.js` de la raíz que lo traen (34 apariciones en 21 archivos: `str-api.js` y `STR_API_VERSION` del shell incluidos; `grep -rn "p5c112" *.html *.js` debe quedar vacío) y en `CLAUDE.md` § 3 (C1, C2). `str-linea-base.html` ya nace con `p5c113`.

## 4. `CLAUDE.md`

**C1 · versión, § 3** (`CLAUDE.md`). Busca:
```md
- `?v=` / `STR_API_VERSION`: **`p5c112`** (desde L-159,
```
Pon:
```md
- `?v=` / `STR_API_VERSION`: **`p5c113`** (desde L-165,
```

**C2 · INC-37, § 3** (`CLAUDE.md`). Busca:
```md
(hoy `p5c112`, desde L-159)
```
Pon:
```md
(hoy `p5c113`, desde L-165)
```

**C3 · fila nueva del índice, § 2** (`CLAUDE.md`). Busca:
```md
| `str-lo-que-viene.html` | `proyecto.md` (lo que falta del STR por área; lee `interno/lo-que-viene.json`, REQ-SH-2) |
```
Pon:
```md
| `str-lo-que-viene.html` | `proyecto.md` (lo que falta del STR por área; lee `interno/lo-que-viene.json`, REQ-SH-2) |
| `str-linea-base.html` | `proyecto.md` (explorador de la línea base del STR al día; lee `interno/linea-base/linea-base.html`, LM-82) |
```

## 5. Docs del área

**D1 · cabecera de proyecto.md** (`docs/claude/proyecto.md`). Busca:
```md
Al día hasta L-163 · dueño: PRJ
```
Pon:
```md
Al día hasta L-165 · dueño: PRJ
```

**D2 · archivos de proyecto.md** (`docs/claude/proyecto.md`). Busca:
```md
`str-nomenclatura.html` y `str-conocimiento.html` (biblioteca de guías del negocio).
```
Pon:
```md
`str-nomenclatura.html`, `str-linea-base.html` y `str-conocimiento.html` (biblioteca de guías del negocio).
```

**D3 · fila de la página nueva en proyecto.md** (`docs/claude/proyecto.md`). Busca:
```md
| `str-lo-que-viene.html` | Lo que viene (REQ-SH-2) | Solo admin (misma guarda que las páginas de Proyecto). Lee `interno/lo-que-viene.json` (escritor: Diseño; `{areas:[{orden, nombre, para, reqs, etapa?}]}`), `interno/diseno.json` y `interno/seguimiento.json` con `STRApi.docs` del mismo commit de main que el encabezado; la etapa se calcula (`_lqvEtapaDe`, M-547: REQ todos aceptados → el área sale; lote en cola o construido → en construcción; algún REQ definido/entregado → definido; si no, idea; `etapa` escrita solo sin REQ); muestra por área orden, nombre, etapa, para qué sirve y REQ; si falla diseño o seguimiento, avisa y sigue. 404 → «todavía no hay nada publicado»; error → «Reintentar». Funciones puras `[LQV]` en `tests/menu-sh2.test.js`. No escribe. |
```
Pon:
```md
| `str-lo-que-viene.html` | Lo que viene (REQ-SH-2) | Solo admin (misma guarda que las páginas de Proyecto). Lee `interno/lo-que-viene.json` (escritor: Diseño; `{areas:[{orden, nombre, para, reqs, etapa?}]}`), `interno/diseno.json` y `interno/seguimiento.json` con `STRApi.docs` del mismo commit de main que el encabezado; la etapa se calcula (`_lqvEtapaDe`, M-547: REQ todos aceptados → el área sale; lote en cola o construido → en construcción; algún REQ definido/entregado → definido; si no, idea; `etapa` escrita solo sin REQ); muestra por área orden, nombre, etapa, para qué sirve y REQ; si falla diseño o seguimiento, avisa y sigue. 404 → «todavía no hay nada publicado»; error → «Reintentar». Funciones puras `[LQV]` en `tests/menu-sh2.test.js`. No escribe. |
| `str-linea-base.html` | Línea base (LM-82, L-165) | Octava página del grupo Proyecto (nav-item 📐 después de Nomenclatura, `openModule(this,'linea-base',…)`, `data-roles="admin"`); misma guarda que las demás (solo admin; embebida → «Sin permiso», suelta → `rutaInicio`). Muestra el explorador de la línea base del STR (lo construido · línea objetivo · brecha), que el Arquitecto genera con `linea-base-pagina.py` y GitHub Actions regenera con cada push a sus fuentes (`.github/workflows/linea-base-pagina.yml` del repo de documentos): trae `interno/linea-base/linea-base.html` del commit que dice el encabezado (`STRApi.docs.commit` / `.url` / `.encabezado`, `credentials: 'omit'`, solo 200; 404 → «Todavía no hay explorador publicado»; otro → «Reintentar») y lo pone en `#lbMarco` con `srcdoc` = cabecera mínima + texto (`_lbSrcdoc`, bloque `[LB]`). **Aislado:** `sandbox="allow-scripts allow-popups"` sin `allow-same-origin` ni `allow-top-navigation`: el explorador no ve la sesión, el token ni el almacenamiento del STR. ~1,6 MB por apertura; «⟳ Actualizar» repite con `forzar`. No escribe. Lo vigilan `tests/linea-base-pagina.test.js` y el guion `tests/e2e/LM-82.spec.js`. |
```

**D4 · cabecera de shell-y-api.md (el shell gana una entrada)** (`docs/claude/shell-y-api.md`). Busca:
```md
Al día hasta L-163 · dueño: SH, API
```
Pon:
```md
Al día hasta L-165 · dueño: SH, API
```

**D5 · cabecera de tests-y-despliegue.md** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
Al día hasta L-164 · dueño: tests/
```
Pon:
```md
Al día hasta L-165 · dueño: tests/
```

**D6 · los tests nuevos y los que cambian** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
- **`tests/col-log-errores.test.js`** (DT-36, L-109)
```
Pon:
```md
- **`tests/linea-base-pagina.test.js`** (LM-82, L-165): texto real de `str-linea-base.html` (guarda de admin, encabezado y ⟳ Actualizar con `STRApi.docs`, explorador del mismo commit, iframe con `sandbox="allow-scripts allow-popups"` sin `allow-same-origin`, `srcdoc` por `_lbSrcdoc` en un vm, `str-api.js?v=` vigente, no escribe) y la entrada «Línea base» del grupo Proyecto en `str-app-shell.html` (octava, solo admin). `menu-sh2.test.js`, `roles.test.js` y el guion `REQ-SH-2.spec.js` cuentan ocho páginas en Proyecto (19 ítems con `data-roles`).
- **`tests/col-log-errores.test.js`** (DT-36, L-109)
```

## Tests en `tests/`
**T1 · archivo nuevo `tests/linea-base-pagina.test.js`** (N1 de P1 y P2; falla en `HEAD` porque la página no existe). Contenido completo:
```js
// LM-82 (L-165): página «Línea base» del grupo Proyecto. Lee str-linea-base.html y str-app-shell.html REALES.
// Puntos: P1 (página: guarda de admin, encabezado y ⟳ Actualizar con STRApi.docs, explorador del mismo commit en un iframe aislado),
// P2 (entrada del menú en Proyecto, solo admin). El resto del menú lo vigilan menu-sh2.test.js y roles.test.js.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { leerTexto } = require('./lib/leer-texto.js');

const raiz = path.join(__dirname, '..');
let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}

const ruta = path.join(raiz, 'str-linea-base.html');
const pag = fs.existsSync(ruta) ? leerTexto(ruta) : '';
check('P1: str-linea-base.html existe', pag.length > 0);

// Guarda: la misma que las páginas del grupo Proyecto (sesión; solo admin o superadmin; embebida → «Sin permiso», suelta → inicio de su rol).
check('P1: guarda de sesión (requireSession) antes de leer nada', /if \(!STRApi\.requireSession\(location\.pathname\.split\('\/'\)\.pop\(\) \+ location\.search\)\) return;/.test(pag));
check('P1: solo admin o superadmin', /if \(_rol !== 'superadmin' && _rol !== 'admin'\) \{/.test(pag));
check('P1: otro rol embebido ve «Sin permiso para este módulo.»; suelto vuelve a su inicio (rutaInicio)',
  pag.includes("document.body.innerHTML = '<div class=\"sin-permiso\">Sin permiso para este módulo.</div>';") && /location\.replace\(STRApi\.rutaInicio \? STRApi\.rutaInicio\(_me\) : 'str-app-shell\.html'\);/.test(pag));
const iGuarda = pag.indexOf("if (_rol !== 'superadmin' && _rol !== 'admin')"), iCargar = pag.indexOf('cargar();\n})();');
check('P1: la guarda va antes de la primera carga', iGuarda > 0 && iCargar > iGuarda);

// Encabezado y Actualizar (REQ-TB-3): el commit con STRApi.docs.commit, su encabezado, y el explorador de ESE commit.
check('P1: encabezado del commit (data-docs-encabezado) y botón ⟳ Actualizar (data-docs-actualizar)',
  /<span id="actualizado" data-docs-encabezado>/.test(pag) && /<button type="button" class="docs-act" id="btnDocsAct" data-docs-actualizar>⟳ Actualizar<\/button>/.test(pag));
check('P1: STRApi.docs.commit con forzar al Actualizar, encabezado y data-sha',
  /STRApi\.docs\.commit\(\{ forzar: forzar === true \}\)/.test(pag) && /STRApi\.docs\.encabezado\(commit\)/.test(pag) && /e\.dataset\.sha = commit\.sha/.test(pag) && /cargar\(true\)\.finally/.test(pag));
check('P1: trae interno/linea-base/linea-base.html del mismo commit, sin credenciales',
  /fetch\(STRApi\.docs\.url\(LB_RUTA, commit\), \{ cache: 'no-store', credentials: 'omit' \}\)/.test(pag));
check('P1: solo 200 se muestra; 404 = «Todavía no hay explorador publicado»; otro código = error con Reintentar',
  /if \(r\.status === 404\)/.test(pag) && /if \(r\.status !== 200\) throw new Error\('HTTP ' \+ r\.status\);/.test(pag) && /Todavía no hay explorador publicado/.test(pag) && /'error', true\);/.test(pag));

// Aislamiento: el explorador corre en un iframe sandbox sin allow-same-origin (no ve la sesión, el token ni el localStorage del STR).
const marcos = pag.match(/<iframe\b[^>]*>/g) || [];
check('P1: un solo iframe, #lbMarco', marcos.length === 1 && /id="lbMarco"/.test(marcos[0]), marcos);
check('P1: sandbox exacto «allow-scripts allow-popups»', /\ssandbox="allow-scripts allow-popups"/.test(marcos[0] || ''), marcos[0]);
check('P1: nunca allow-same-origin ni allow-top-navigation en la página', !/allow-same-origin|allow-top-navigation/.test(pag));
check('P1: el contenido entra por srcdoc (nunca src ni document.write)', /marco\.srcdoc = _lbSrcdoc\(texto\);/.test(pag) && !/marco\.src\s*=/.test(pag) && !/document\.write/.test(pag) && !/\ssrc=/.test(marcos[0] || ''));

// Bloque puro [LB]: ruta y cabecera mínima del srcdoc.
const bloque = (pag.match(/\/\/ \[LB-inicio\][\s\S]*?\/\/ \[LB-fin\]/) || [''])[0];
check('P1: bloque [LB-inicio]…[LB-fin]', bloque.length > 0);
const sb = {};
vm.createContext(sb);
try { vm.runInContext(bloque + '\nthis.LB_RUTA = LB_RUTA; this._lbSrcdoc = _lbSrcdoc;', sb); } catch (e) { sb.error = String(e); }
check('P1: LB_RUTA = interno/linea-base/linea-base.html', sb.LB_RUTA === 'interno/linea-base/linea-base.html', sb.LB_RUTA || sb.error);
const CAB = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">';
check('P1: srcdoc = cabecera mínima + el texto tal cual', typeof sb._lbSrcdoc === 'function' && sb._lbSrcdoc('<title>X</title><p>á</p>') === CAB + '<title>X</title><p>á</p>');
check('P1: srcdoc con texto vacío o nulo = solo la cabecera', typeof sb._lbSrcdoc === 'function' && sb._lbSrcdoc(null) === CAB && sb._lbSrcdoc('') === CAB);

// Versión: carga str-api.js con la versión vigente (la misma que STR_API_VERSION de str-api.js).
const api = leerTexto(path.join(raiz, 'str-api.js'));
const ver = (api.match(/var STR_API_VERSION = '([^']+)'/) || [])[1];
// (la cadena se arma por partes: aplicar.js toma por «página que carga str-api.js» todo .js que la traiga entera)
check('P1: carga str-api.js con la versión de STR_API_VERSION (' + ver + ')', !!ver && pag.includes('<script src="str-api.js' + '?v=' + ver + '"></script>'));
check('P1: no escribe nada (sin STRApi.col, request ni localStorage.setItem)', !/STRApi\.col|STRApi\.request|localStorage\.setItem|method:\s*'(POST|PUT|DELETE)'/.test(pag));

// P2: entrada del menú, la octava de Proyecto, solo admin.
const shell = leerTexto(path.join(raiz, 'str-app-shell.html'));
const grupo = (shell.match(/<div class="nav-group" id="nav-group-proyecto" data-roles="admin">[\s\S]*?\n {4}<\/div>\n/) || [''])[0];
const items = [...grupo.matchAll(/<div class="nav-item[^"]*"([^>]*)>[\s\S]*?<div class="ni-label">([^<]*)<\/div><\/div>/g)].map((m) => ({ attrs: m[1], label: m[2] }));
const lb = items.find((i) => /data-fav-url="str-linea-base\.html"/.test(i.attrs));
check('P2: «Línea base» en el grupo Proyecto, después de Nomenclatura (octava)', !!lb && lb.label === 'Línea base' && items.length === 8 && items[7] === lb && items[6].label === 'Nomenclatura', items.map((i) => i.label));
check('P2: la entrada es solo admin y abre str-linea-base.html con openModule', !!lb && /data-roles="admin"/.test(lb.attrs) && /onclick="openModule\(this,'linea-base','str-linea-base\.html'\)"/.test(lb.attrs), lb && lb.attrs);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

**T2 · `tests/menu-sh2.test.js`** (archivo completo: Proyecto con ocho entradas, `str-linea-base.html` entre las páginas reales). Contenido completo:
```js
// REQ-SH-2 — menú del STR: solo lo que funciona (lee el str-app-shell.html REAL y str-lo-que-viene.html). LM-82 (L-165): Proyecto con ocho páginas (+ Línea base).
// 1) Grupos y entradas en orden, sin repetidos fuera de Favoritos, sin maquetas ni paneles de muestra; cada entrada abre
//    una página real que existe en el repo.
// 2) Quién ve qué (bloque [ROL-inicio]…[ROL-fin] REAL): Lo que viene y Proyecto solo admin; el operador ve lo demás.
// 3) Página de inicio = el Tablero (REQ-OP-1, OP-1b: entrada «Tablero» con data-inicio="1"); Limpieza & HK (2) queda detrás.
// 4) Ninguna página alcanzable desde el menú trae los textos de muestra del Dashboard viejo (huéspedes, propiedades, tickets).
// 5) Favoritos por usuario: uno nuevo empieza vacío; los guardados antes pasan una vez al primer usuario.
// 6) «Lo que viene»: guarda de admin, lee lo-que-viene.json, diseno.json y seguimiento.json con STRApi.docs; la etapa se calcula
//    del estado de los reqs y de sus lotes (M-547), con casos sintéticos: un REQ cambia de estado y su área cambia de etapa.
// 7) Aviso «Subir mis datos» retirado.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { leerTexto } = require('./lib/leer-texto.js');
const raiz = path.join(__dirname, '..');
const leer = (f) => leerTexto(path.join(raiz, f));

let ok = 0, fail = 0;
function check(nombre, cond, detalle) { cond ? ok++ : fail++; console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle))); }

const shell = leer('str-app-shell.html');
const sidebar = (shell.match(/<nav class="sidebar">([\s\S]*?)<\/nav>/) || [])[1] || '';
check('shell: hay <nav class="sidebar">', sidebar.length > 0);

// ── 1. Grupos y entradas ──
// Cada grupo: <div class="nav-group…" id="…" [data-roles]> + su .ngr-label; cada entrada: <div class="nav-item…"> + su .ni-label.
const fichas = [];
for (const m of sidebar.matchAll(/<div class="nav-group"([^>]*)>|<span class="ngr-label">([^<]*)<\/span>|<div class="nav-item([^"]*)"([^>]*)>(?:(?!<div class="nav-item)[\s\S])*?<div class="ni-label">([^<]*)<\/div>/g)) {
  if (m[1] !== undefined) fichas.push({ t: 'grupo', attrs: m[1] });
  else if (m[2] !== undefined) { const g = [...fichas].reverse().find((x) => x.t === 'grupo'); if (g && g.label == null) g.label = m[2]; }
  else fichas.push({ t: 'item', clase: m[3], attrs: m[4], label: m[5] });
}
const grupos = [];
for (const f of fichas) {
  if (f.t === 'grupo') grupos.push({ label: f.label, attrs: f.attrs, items: [] });
  else if (grupos.length) grupos[grupos.length - 1].items.push(f);
}
const ESPERADO = [
  ['Favoritos', []],
  ['Operación del día', ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario']], // REQ-OP-1 (OP-1b): «Tablero» primero, con data-inicio="1"
  ['Configurar el negocio', ['Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración']],
  ['Lo que viene', ['Lo que viene']],
  ['Proyecto', ['Seg. Proyecto', 'Marco de Trabajo', 'Instrucciones', 'Cobit', 'Elementos', 'Base de conocimiento', 'Nomenclatura', 'Línea base']],
];
const real = grupos.map((g) => [g.label, g.items.map((i) => i.label)]);
check('menú: Favoritos + los cuatro grupos de REQ-SH-2, con sus entradas en orden', JSON.stringify(real) === JSON.stringify(ESPERADO), real);
const fuera = grupos.filter((g) => g.label !== 'Favoritos').flatMap((g) => g.items);
const labels = fuera.map((i) => i.label);
check('menú: ninguna entrada repetida fuera de Favoritos (por nombre)', new Set(labels).size === labels.length, labels);
const destino = (i) => ((i.attrs.match(/openModule\(this,\s*'[^']*',\s*'([^']+)'\)/) || [])[1]) || ('panel:' + ((i.attrs.match(/data-panel="([^"]+)"/) || [])[1] || '?'));
const destinos = fuera.map(destino);
check('menú: ninguna página o panel se abre desde dos entradas', new Set(destinos).size === destinos.length, destinos);
check('menú: Favoritos nace vacío (solo el texto de ayuda)', /<div class="nav-group-body" id="fav-list">\s*<div class="fav-empty">[^<]*<\/div>\s*<\/div>/.test(sidebar));
check('menú: sin maquetas (type-soon), sin Dashboard (type-dash) ni entradas de abajo (type-bottom)', !/class="nav-item[^"]*\b(type-soon|type-dash|type-bottom)\b/.test(sidebar));
check('menú: «Tablero» (REQ-OP-1) es la única entrada con data-inicio="1" y abre str-tablero.html', labels.includes('Tablero') && (sidebar.match(/<div class="nav-item[^>]*data-inicio="1"/g) || []).length === 1 && /data-inicio="1"[^>]*openModule\(this,'tablero','str-tablero\.html'\)/.test(sidebar));
check('menú: sin Check-in, Mantenimiento, Reservas, Channel Manager, Huéspedes, Comunicaciones, Finanzas, Analytics, Plan & billing, Onboarding',
  !/>(Check-in \/ Out|Mantenimiento|Reservas|Channel Manager|Huéspedes|Comunicaciones|Precios &amp; Revenue|Precios & Revenue|Finanzas|Analytics|Plan & billing|Onboarding|Portafolio|Dashboard)</.test(sidebar));

// Páginas reales (archivo en el repo y en uso): toda entrada abre una de estas o un panel real del shell.
const PAGINAS_REALES = ['str-tablero.html', 'str-calendario.html', 'str-m1-housekeeping.html', 'str-inventario.html', 'str-propiedades.html', 'str-flujos.html',
  'str-conocimiento.html', 'str-usuarios.html', 'str-lo-que-viene.html', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html',
  'str-cobit.html', 'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
const PANELES_REALES = ['workflows', 'config']; // Flujos (iframe estático, INC-43) y Configuración (copia en Drive, K3a)
for (const i of fuera) {
  const d = destino(i);
  const accion = /onclick="(openModule|nav|navSub)\(this/.test(i.attrs);
  const real = d.startsWith('panel:') ? PANELES_REALES.includes(d.slice(6)) : PAGINAS_REALES.includes(d);
  check('entrada «' + i.label + '» abre algo real (' + d + ')', accion && real, i.attrs);
}
for (const p of PAGINAS_REALES) check('página real existe en el repo: ' + p, fs.existsSync(path.join(raiz, p)));
const furl = fuera.map((i) => (i.attrs.match(/data-fav-url="([^"]+)"/) || [])[1]).filter(Boolean);
check('data-fav-url = la página que abre (los favoritos viejos siguen resolviendo)', fuera.every((i) => { const u = (i.attrs.match(/data-fav-url="([^"]+)"/) || [])[1]; const d = destino(i); return !u || u === d || (d === 'panel:workflows' && u === 'str-flujos.html'); }), furl);
check('ids de favorito de antes en las entradas renombradas (Calendario único, Conocimiento, Usuarios & Roles)',
  ['calendario-unico', 'conocimiento', 'usuarios-roles'].every((id) => new RegExp('data-fav-id="' + id + '"').test(sidebar)));
const panelesHtml = [...shell.matchAll(/<div class="panel[^"]*" id="panel-([^"]+)"/g)].map((m) => m[1]);
check('shell: solo los paneles reales (workflows, config); sin Dashboard, Housekeeping, Check-in, Mantenimiento ni «Próximamente»', JSON.stringify(panelesHtml.sort()) === JSON.stringify(['config', 'workflows']), panelesHtml);
check('shell: ningún panel nace abierto (class="panel show")', !/class="panel show"/.test(shell));
check('shell: sin el selector de propiedad de muestra', !/id="propBtn"|id="propDropdown"|class="prop-option"/.test(shell));
check('Proyecto: grupo propio al final, solo admin', /<div class="nav-group" id="nav-group-proyecto" data-roles="admin">/.test(sidebar) && grupos[grupos.length - 1].label === 'Proyecto');
check('Lo que viene: grupo solo admin y su entrada solo admin', /<div class="nav-group" id="nav-group-lo-que-viene" data-roles="admin">/.test(sidebar)
  && /data-fav-url="str-lo-que-viene\.html" data-roles="admin"/.test(sidebar));
const init = (shell.match(/document\.addEventListener\('DOMContentLoaded', function\(\) \{\n  _favRepintar\(\);[\s\S]*?\n\}\);/) || [''])[0];
check('al cargar: solo Proyecto arranca plegado (cerrado por defecto)', init.includes("document.querySelectorAll('#nav-group-proyecto > .nav-group-hdr')") && !init.includes(".nav-group-hdr:not(.fav-hdr)"), init.slice(0, 200));

// ── 2. Quién ve qué (bloque [ROL] real) ──
const bloque = (shell.match(/\/\/ \[ROL-inicio\][\s\S]*?\/\/ \[ROL-fin\]/) || [])[0] || '';
check('shell: bloque [ROL-inicio]…[ROL-fin] con _inicioElegir', /function _inicioElegir\(cands, rol\)/.test(bloque));
const sb = {};
vm.createContext(sb);
vm.runInContext(bloque + '\nthis._rolVeElemento = _rolVeElemento; this._inicioElegir = typeof _inicioElegir === \'function\' ? _inicioElegir : () => -1;', sb);
const rolesDe = (attrs) => (attrs.match(/data-roles="([^"]*)"/) || [])[1];
const cadena = (g, i) => [rolesDe(i.attrs), rolesDe(g.attrs)].filter((x) => x != null);
const visibles = (rol) => grupos.filter((g) => g.label !== 'Favoritos').flatMap((g) => g.items.filter((i) => cadena(g, i).every((r) => sb._rolVeElemento(r, rol))).map((i) => i.label));
const OPER = ['Tablero', 'Calendario', 'Limpieza & HK', 'Inventario', 'Propiedades', 'Flujos de trabajo', 'Guías', 'Equipo y permisos', 'Configuración'];
check('admin ve todas las entradas', JSON.stringify(visibles('admin')) === JSON.stringify(labels), visibles('admin'));
check('superadmin (legado) ve lo mismo que admin', JSON.stringify(visibles('superadmin')) === JSON.stringify(labels));
check('operador ve Operación del día y Configurar el negocio, sin Lo que viene ni Proyecto', JSON.stringify(visibles('operador')) === JSON.stringify(OPER), visibles('operador'));
check('colaborador y sin rol: ninguna entrada con data-roles', visibles('colaborador').every((l) => l === 'Configuración') && visibles(null).every((l) => l === 'Configuración'));
check('toda entrada salvo Configuración lleva data-roles (RT-14: el menú solo oculta; el servidor decide)', fuera.every((i) => i.label === 'Configuración' || rolesDe(i.attrs)));

// ── 3. Página de inicio ──
const cands = [];
for (const g of grupos) for (const i of g.items) { const o = (i.attrs.match(/data-inicio="(\d+)"/) || [])[1]; if (o) cands.push({ label: i.label, orden: o, roles: cadena(g, i) }); }
const inicio = (rol, cs) => { const k = sb._inicioElegir(cs, rol); return k === -1 ? null : cs[k].label; };
check('inicio: dos entradas con data-inicio, Tablero (1) y Limpieza & HK (2)', JSON.stringify(cands.map((c) => c.label + ':' + c.orden)) === JSON.stringify(['Tablero:1', 'Limpieza & HK:2']), cands);
check('inicio admin = Tablero (REQ-OP-1)', inicio('admin', cands) === 'Tablero');
check('inicio operador = Tablero (REQ-OP-1)', inicio('operador', cands) === 'Tablero');
check('inicio sin rol o colaborador = ninguno', inicio(null, cands) === null && inicio('colaborador', cands) === null);
const sinTablero = cands.filter((c) => c.label !== 'Tablero');
check('inicio sin la entrada del Tablero = Limpieza & HK (2)', inicio('admin', sinTablero) === 'Limpieza & HK' && inicio('operador', sinTablero) === 'Limpieza & HK');
check('inicio: un Tablero solo de admin no es el inicio del operador', inicio('operador', [{ label: 'Tablero', orden: '1', roles: ['admin'] }].concat(sinTablero)) === 'Limpieza & HK');
const apl = (shell.match(/function _aplicarRolesMenu\(rol\) \{[\s\S]*?\n\}/) || [''])[0];
check('_aplicarRolesMenu abre el inicio con su clic solo si hay rol y nada abierto', /if \(rol && !document\.querySelector\('\.panel\.show'\)\)/.test(apl) && /els\[i\]\.click\(\)/.test(apl) && !/panel-dashboard|data-panel="dashboard"/.test(apl));

// ── 4. Sin datos de ejemplo en lo alcanzable ──
const MUESTRA = ['Carlos Méndez', 'María González', 'James Smith', 'Laura Ramírez', 'Laura Mesa', 'Ana Ruiz', 'Pedro García', 'Miguel Torres',
  'Apto Centro', 'Casa Laureles', 'Estudio Norte', 'J. Ramírez', 'Fuga grifo', 'Vista global del portafolio', 'strmanager.co/t/',
  'Ocupación promedio', 'Tolerancia vencida', 'Próximamente en Q'];
for (const f of ['str-app-shell.html'].concat(PAGINAS_REALES)) {
  if (!fs.existsSync(path.join(raiz, f))) { check('sin textos de muestra: ' + f + ' (no existe)', false); continue; }
  const t = leer(f);
  const hay = MUESTRA.filter((s) => t.includes(s));
  check('sin textos de muestra: ' + f, hay.length === 0, hay);
}
check('shell: sin nombre de relleno en la barra antes de Firebase', /<div class="avatar" id="userAvatar">·<\/div>\s*<div class="user-name" id="userName"><\/div>/.test(shell));

// ── 5. Favoritos por usuario ──
const fav = (shell.match(/const FAV_KEY = 'str-favoritos-v1';[\s\S]*?\nfunction saveFavs\(favs\) \{[\s\S]*?\n\}/) || [''])[0];
check('shell: Favoritos por usuario (_favKey, loadFavs, saveFavs)', /function _favKey\(\)/.test(fav));
function ctxFav(store, uid) {
  const ls = { getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  const c = { localStorage: ls, JSON, String, STRApi: { user: () => (uid == null ? null : { user: { id: uid } }) } };
  c.window = c;
  vm.createContext(c);
  vm.runInContext(fav + '\nthis.loadFavs = loadFavs; this.saveFavs = saveFavs;', c);
  return c;
}
const st = {};
check('usuario nuevo, navegador limpio: Favoritos vacío', JSON.stringify(ctxFav(st, 7).loadFavs()) === '[]');
const viejo = { 'str-favoritos-v1': JSON.stringify([{ id: 'inventario', label: 'Inventario', icon: '📦', panel: '', url: 'str-inventario.html' }]) };
check('favoritos guardados antes: pasan al primer usuario que abre el shell', ctxFav(viejo, 1).loadFavs().length === 1 && viejo['str-favoritos-v1:1'] && viejo['str-favoritos-v1-de'] === 'str-favoritos-v1:1');
check('la clave vieja no se borra', !!viejo['str-favoritos-v1']);
check('otro usuario en el mismo navegador empieza vacío', JSON.stringify(ctxFav(viejo, 2).loadFavs()) === '[]');
ctxFav(viejo, 2).saveFavs([{ id: 'guias' }]);
check('lo que guarda uno no lo ve el otro', ctxFav(viejo, 1).loadFavs().length === 1 && ctxFav(viejo, 2).loadFavs().length === 1 && ctxFav(viejo, 2).loadFavs()[0].id === 'guias');
check('sin usuario: ni lee ni guarda', JSON.stringify(ctxFav(viejo, null).loadFavs()) === '[]');
check('Favoritos y estrellas se vuelven a pintar al cargar y al aplicar el rol del servidor',
  /function _favRepintar\(\)/.test(shell) && /_favRepintar\(\);/.test(init)
  && /_aplicarRolesMenu\(rol\);\n    if \(typeof _favRepintar === 'function'\) _favRepintar\(\);/.test(shell));
check('☆ sin usuario no finge guardar (toggleFav exige _favKey)', /function toggleFav\(starBtn\) \{[\s\S]{0,120}if \(!_favKey\(\)\) \{ shellToast\(/.test(shell));
const res = (shell.match(/function _favEsResoluble\(f\) \{[\s\S]*?\n\}/) || [''])[0];
check('un favorito de una entrada retirada (Check-in, Mantenimiento) se ve atenuado: se resuelve solo contra el menú', /\.sidebar \.nav-item\[data-panel=/.test(res) && !/return !!\(f\.panel \|\| f\.url\)/.test(res));

// ── 6. «Lo que viene» ──
const lqv = fs.existsSync(path.join(raiz, 'str-lo-que-viene.html')) ? leer('str-lo-que-viene.html') : '';
check('str-lo-que-viene.html existe', lqv.length > 0);
check('Lo que viene: guarda de admin (como las páginas de Proyecto)', /if \(_rol !== 'superadmin' && _rol !== 'admin'\)/.test(lqv) && /Sin permiso para este módulo\./.test(lqv));
check('Lo que viene: lee lo-que-viene.json, diseno.json y seguimiento.json con STRApi.docs (un commit, url del mismo sha) y muestra el encabezado',
  /LQV_RUTA = 'interno\/lo-que-viene\.json', LQV_DISENO = 'interno\/diseno\.json', LQV_SEG = 'interno\/seguimiento\.json';/.test(lqv)
  && /STRApi\.docs\.commit\(/.test(lqv) && /STRApi\.docs\.url\(ruta, commit\)/.test(lqv) && /_leer\(LQV_RUTA, commit\), _leer\(LQV_DISENO, commit\), _leer\(LQV_SEG, commit\)/.test(lqv)
  && /data-docs-encabezado/.test(lqv) && /STRApi\.docs\.encabezado\(commit\)/.test(lqv));
check('Lo que viene: 404 → mensaje claro; otro error → mensaje y Reintentar (no rompe)', /r\.status === 404/.test(lqv) && /No se pudo leer «Lo que viene»/.test(lqv) && /btnReintentar/.test(lqv));
check('Lo que viene: no escribe (sin STRApi.put/post/col.push ni localStorage.setItem)', !/STRApi\.(put|post|del)\(|col\.push|localStorage\.setItem/.test(lqv));
check('Lo que viene: carga str-api.js con la versión del lote (RT-20)', (lqv.match(/str-api\.js\?v=([a-z0-9]+)/) || [])[1] === (leer('str-api.js').match(/STR_API_VERSION = '([^']+)'/) || [])[1]);
const bl = (lqv.match(/\/\/ \[LQV-inicio\][\s\S]*?\/\/ \[LQV-fin\]/) || [''])[0];
const sl = {};
vm.createContext(sl);
vm.runInContext((bl || 'function _lqvAreas() { return []; } function _lqvEtapaDe() { return undefined; } function _lqvEstadosReq() { return {}; } function _lqvLotesReq() { return {}; } function _lqvResumen() { return null; }') + '\nthis.f = { _lqvAreas, _lqvEtapaDe, _lqvEstadosReq, _lqvLotesReq, _lqvResumen };', sl); // sin la página: sus checks fallan, no el archivo
// Regla de etapa (M-547) con datos sintéticos: diseno.json › reqs[].estado y seguimiento.json › plan[].estado.
const dis = (o) => ({ reqs: Object.entries(o).map(([id, estado]) => ({ id, estado })) });
const seg = (o) => ({ plan: Object.entries(o).map(([req, estado]) => ({ req, lote: 'L-x', estado })) });
const et = (reqs, d, s, etapa) => sl.f._lqvEtapaDe({ reqs, etapa }, d ? sl.f._lqvEstadosReq(d) : null, s ? sl.f._lqvLotesReq(s) : null);
check('etapa: sin reqs → la escrita (definido); sin escrita o desconocida → idea', et([], {}, {}, 'Definido') === 'definido' && et([], {}, {}, 'otra') === 'idea' && et([], {}, {}, undefined) === 'idea');
check('etapa: sin reqs y sin diseno.json → igual la escrita', et([], null, null, 'idea') === 'idea');
check('etapa: todos borrador → idea', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'borrador', 'REQ-B': 'borrador' }), seg({})) === 'idea');
check('etapa: un REQ que diseno.json no tiene cuenta como borrador → idea', et(['REQ-Z'], dis({}), seg({})) === 'idea');
check('etapa: alguno definido → definido', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'borrador', 'REQ-B': 'definido' }), seg({})) === 'definido');
check('etapa: alguno entregado sin lote en cola → definido', et(['REQ-A'], dis({ 'REQ-A': 'entregado' }), seg({ 'REQ-A': 'previsto' })) === 'definido');
for (const e of ['encolado', 'construyendo', 'construido', 'verificando', 'desplegado', 'parcial']) {
  check('etapa: alguno con lote «' + e + '» → en construcción', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'entregado', 'REQ-B': 'borrador' }), seg({ 'REQ-A': e })) === 'en construcción');
}
for (const e of ['previsto', 'redactado', 'aceptado', 'fallido', 'no aceptado', 'superado', 'pospuesto']) {
  check('etapa: lote «' + e + '» no es en construcción', et(['REQ-A'], dis({ 'REQ-A': 'entregado' }), seg({ 'REQ-A': e })) === 'definido');
}
check('etapa: el lote de un REQ ya aceptado no cuenta', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'aceptado', 'REQ-B': 'borrador' }), seg({ 'REQ-A': 'verificando' })) === 'idea');
check('etapa: todos aceptados → el área no se muestra (null)', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'aceptado', 'REQ-B': 'aceptado' }), seg({})) === null);
check('etapa: aceptados y descartados → no se muestra; aceptado + borrador → idea', et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'aceptado', 'REQ-B': 'descartado' }), seg({})) === null
  && et(['REQ-A', 'REQ-B'], dis({ 'REQ-A': 'aceptado', 'REQ-B': 'borrador' }), seg({})) === 'idea');
check('etapa: sin diseno.json (no se pudo leer) → «» (Sin etapa), sin romper', et(['REQ-A'], null, seg({ 'REQ-A': 'encolado' })) === '');
check('etapa: sin seguimiento.json → no hay en construcción, sí definido', et(['REQ-A'], dis({ 'REQ-A': 'entregado' }), null) === 'definido');
check('etapa: REQ con mayúsculas o espacios distintos se encuentra igual', et([' req-a '], dis({ 'REQ-A': 'definido' }), seg({})) === 'definido');
// Un REQ cambia de estado y su área cambia de etapa sin tocar lo-que-viene.json (caso que pidió Diseño, M-547).
const LQV = { areas: [
  { orden: 2, nombre: 'Compras', para: 'reponer', reqs: ['REQ-C1'] },
  { orden: 1, nombre: 'Mantenimiento', para: 'arreglos', reqs: ['REQ-M1', 'REQ-M2'] },
  { orden: 3, nombre: 'Mensajes', para: 'avisar al huésped', etapa: 'idea', reqs: [] },
  { orden: 4, nombre: '  ', reqs: [] },
  null,
] };
const fotos = (d, s) => sl.f._lqvAreas(LQV, d, s).map((x) => x.nombre + ':' + x.etapa).join(' · ');
const pasos = [
  [dis({ 'REQ-M1': 'borrador', 'REQ-M2': 'borrador', 'REQ-C1': 'borrador' }), seg({}), 'Mantenimiento:idea · Compras:idea · Mensajes:idea'],
  [dis({ 'REQ-M1': 'definido', 'REQ-M2': 'borrador', 'REQ-C1': 'borrador' }), seg({}), 'Mantenimiento:definido · Compras:idea · Mensajes:idea'],
  [dis({ 'REQ-M1': 'entregado', 'REQ-M2': 'borrador', 'REQ-C1': 'borrador' }), seg({ 'REQ-M1': 'encolado' }), 'Mantenimiento:en construcción · Compras:idea · Mensajes:idea'],
  [dis({ 'REQ-M1': 'aceptado', 'REQ-M2': 'aceptado', 'REQ-C1': 'entregado' }), seg({ 'REQ-M1': 'aceptado', 'REQ-C1': 'previsto' }), 'Compras:definido · Mensajes:idea'],
];
const antes = JSON.stringify(LQV);
pasos.forEach(([d, s, esp], k) => check('cambio de estado ' + (k + 1) + ' → ' + esp, fotos(d, s) === esp, fotos(d, s)));
check('el JSON de áreas no se tocó entre pasos', JSON.stringify(LQV) === antes);
const A = sl.f._lqvAreas(LQV, pasos[0][0], pasos[0][1]);
check('_lqvAreas: por orden, sin nombre fuera; para y reqs', JSON.stringify(A.map((x) => x.orden)) === '[1,2,3]' && (A[0] || {}).para === 'arreglos' && JSON.stringify((A[0] || {}).reqs) === '["REQ-M1","REQ-M2"]', A);
check('_lqvAreas: JSON sin áreas o roto → []', sl.f._lqvAreas(null, null, null).length === 0 && sl.f._lqvAreas({}, {}, {}).length === 0 && sl.f._lqvAreas({ areas: 'x' }, null, null).length === 0);
check('_lqvResumen', sl.f._lqvResumen(sl.f._lqvAreas(LQV, pasos[2][0], pasos[2][1])) === '3 áreas · 1 en construcción · 2 ideas', sl.f._lqvResumen(sl.f._lqvAreas(LQV, pasos[2][0], pasos[2][1])));
check('Lo que viene: nota al pie «En construcción incluye lotes desplegados o parcialmente aceptados.»', lqv.includes('>En construcción incluye lotes desplegados o parcialmente aceptados.</p>'));
check('Lo que viene: si falla diseno.json o seguimiento.json, la lista sale con un aviso (#lqvAviso)', /id="lqvAviso"/.test(lqv) && /No se pudo leer ' \+ LQV_DISENO/.test(lqv) && /No se pudo leer ' \+ LQV_SEG/.test(lqv));

// ── 7. Aviso de datos locales ──
check('aviso «Subir mis datos al servidor» retirado (HTML, funciones y llamadas)', !/colMigrateBanner|_uploadMisDatos|_checkMigrationBanner|COL_MIGRATE_DEFS/.test(shell));
// La renovación de sesión («Entrar» con la sesión iniciada) va en INC-134 (lote aparte) y su test.

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

**T3 · `tests/roles.test.js`** (archivo completo: 19 ítems con `data-roles`, Proyecto con ocho páginas). Contenido completo:
```js
// INC-108 / REQ-U8 — un usuario, un rol (el del servidor).
// 1) STRApi.rol / exigirRol con el str-api.js REAL en un vm (str-user sintéticos).
// 2) Visibilidad del menú del shell: bloque [ROL-inicio]…[ROL-fin] REAL de str-app-shell.html
//    contra los `data-roles` REALES del menú.
// 3) RÉPLICA (port, no PHP): invitar a un admin, aceptar su invitación y PUT rol. Las
//    funciones puras viven en api/lib/session.php; aquí se portan y se exige que el PHP real
//    las use con los mismos mensajes.
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');
const vm = require('vm');
const path = require('path');
const raiz = path.join(__dirname, '..');
const leer = f => leerTexto(path.join(raiz, f));

let ok = 0, fail = 0;
function check(nombre, cond, detalle) { cond ? ok++ : fail++; console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle))); }

// ── 1. STRApi.rol / exigirRol ──
function ctxApi(store, embebido) {
  const ls = {
    getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { store[k] = String(v); },
    removeItem(k) { delete store[k]; },
  };
  const efectos = { replace: null, post: null, body: null };
  const doc = {
    readyState: 'complete',
    documentElement: { style: {} },
    addEventListener() {},
    getElementById() { return null; },
    body: { set innerHTML(v) { efectos.body = v; }, get innerHTML() { return efectos.body; } },
  };
  const ctx = {
    localStorage: ls,
    sessionStorage: { getItem() { return null; }, setItem() {} },
    console, Promise, JSON, Date,
    document: doc,
    location: { pathname: '/str-propiedades.html', search: '', origin: 'https://x', replace(u) { efectos.replace = u; } },
  };
  ctx.window = ctx;
  ctx.self = ctx;
  ctx.top = embebido ? {} : ctx;
  ctx.parent = { postMessage(m) { efectos.post = m; } };
  vm.createContext(ctx);
  vm.runInContext(leer('str-api.js'), ctx);
  return { api: ctx.STRApi, efectos };
}
const sesion = rol => ({ 'str-token': 't', 'str-user': JSON.stringify({ user: { id: 7, rol, cuenta_id: 1 }, cuenta: { id: 1, nombre: 'N' } }) });

for (const rol of ['admin', 'operador', 'colaborador']) {
  check('rol() = ' + rol, ctxApi(sesion(rol), false).api.rol() === rol);
}
check('rol() sin sesión = null', ctxApi({}, false).api.rol() === null);

let c = ctxApi(sesion('admin'), true);
check('exigirRol admin en [admin,operador] → true', c.api.exigirRol(['admin', 'operador']) === true && c.efectos.body === null);
c = ctxApi(sesion('operador'), true);
check('exigirRol operador en [admin,operador] → true', c.api.exigirRol(['admin', 'operador']) === true);
c = ctxApi(sesion('operador'), true);
check('exigirRol operador en [admin] embebido → false + «Sin permiso»', c.api.exigirRol(['admin']) === false && /class="sin-permiso"[^>]*>Sin permiso para este módulo\./.test(c.efectos.body || ''), c.efectos);
c = ctxApi(sesion('colaborador'), true);
check('exigirRol colaborador embebido → false + «Sin permiso»', c.api.exigirRol(['admin', 'operador']) === false && /Sin permiso para este módulo/.test(c.efectos.body || ''));
c = ctxApi(sesion('colaborador'), false);
check('exigirRol colaborador suelto → false + vuelve al portal', c.api.exigirRol(['admin', 'operador']) === false && c.efectos.replace === 'portal.html' && c.efectos.body === null, c.efectos);
c = ctxApi(sesion('operador'), false);
check('exigirRol operador suelto en [admin] → false + al shell', c.api.exigirRol(['admin']) === false && c.efectos.replace === 'str-app-shell.html', c.efectos);
c = ctxApi({}, false);
check('exigirRol sin sesión suelto → false + login', c.api.exigirRol(['admin', 'operador']) === false && /^login\.html\?next=/.test(c.efectos.replace || ''), c.efectos);
c = ctxApi({}, true);
check('exigirRol sin sesión embebido → false + aviso al padre, sin «Sin permiso»', c.api.exigirRol(['admin']) === false && c.efectos.post && c.efectos.post.tipo === 'str:sin-sesion' && c.efectos.body === null, c.efectos);
c = ctxApi(sesion('superadmin'), true);
check('superadmin (legado MySQL) cuenta como admin', c.api.exigirRol(['admin']) === true && c.api.rol() === 'superadmin');
check('rolPermitido(null, …) = false', ctxApi({}, false).api.rolPermitido(null, ['admin', 'operador']) === false);

// ── 2. Menú del shell ──
const shell = leer('str-app-shell.html');
const bloque = (shell.match(/\/\/ \[ROL-inicio\][\s\S]*?\/\/ \[ROL-fin\]/) || [])[0];
check('shell: bloque [ROL-inicio]…[ROL-fin] presente', !!bloque);
const sb = {};
vm.createContext(sb);
vm.runInContext(bloque + '\nthis._rolVeElemento = _rolVeElemento;', sb);
const ve = sb._rolVeElemento;
const items = [];
for (const m of shell.matchAll(/<div ([^>]*?)data-roles="([^"]*)"([^>]*)>/g)) {
  const attrs = m[1] + m[3];
  const id = (attrs.match(/(?:^|\s)id="([^"]+)"/) || attrs.match(/data-fav-url="([^"]+)"/) || attrs.match(/data-panel="([^"]+)"/) || [])[1]; // REQ-SH-2: no el de data-fav-id
  items.push({ id, roles: m[2] });
}
const roles = id => (items.find(i => i.id === id) || {}).roles;
check('shell: 19 ítems con data-roles (REQ-SH-2 + Tablero de REQ-OP-1 + Línea base de LM-82)', items.length === 19, items.length);
check('shell: sin superadmin/limpieza/porteria/mantenimiento en data-roles', items.every(i => i.roles.split(',').every(r => ['admin', 'operador', 'colaborador'].includes(r))), items.filter(i => /superadmin|limpieza|porteria|mantenimiento/.test(i.roles)));
check('shell: sin autoNav por rol ni lectura de Firestore profiles', !/autoNav/.test(shell) && !/'profiles'/.test(shell) && !/getFirestore/.test(shell));
const proyecto = ['nav-group-proyecto', 'str-seg-proyecto.html', 'str-marco-trabajo.html', 'str-instrucciones.html', 'str-cobit.html', 'str-elementos.html', 'str-base-conocimiento.html', 'str-nomenclatura.html', 'str-linea-base.html'];
check('admin ve el grupo Proyecto y sus ocho páginas', proyecto.every(id => roles(id) && ve(roles(id), 'admin')), proyecto.map(roles));
check('admin ve Equipo y Lo que viene (REQ-SH-2)', ve(roles('str-usuarios.html'), 'admin') && ['nav-group-lo-que-viene', 'str-lo-que-viene.html'].every(id => roles(id) && ve(roles(id), 'admin')));
check('operador no ve Proyecto', proyecto.every(id => !ve(roles(id), 'operador')));
check('operador no ve Lo que viene (REQ-SH-2)', ['nav-group-lo-que-viene', 'str-lo-que-viene.html'].every(id => roles(id) && !ve(roles(id), 'operador')));
const operativos = ['str-tablero.html', 'str-propiedades.html', 'str-calendario.html', 'str-m1-housekeeping.html', 'str-flujos.html', 'str-conocimiento.html', 'str-inventario.html', 'str-usuarios.html'];
check('operador ve los operativos y Equipo', operativos.every(id => roles(id) && ve(roles(id), 'operador')), operativos.map(roles));
check('sin rol no ve nada', items.every(i => !ve(i.roles, null) && !ve(i.roles, '')));
check('colaborador no ve nada del shell', items.every(i => !ve(i.roles, 'colaborador')));

// ── INC-109: el HTML del menú — todo ítem que abre algo lleva data-roles ──
// Lista blanca explícita: solo data-panel="config" (Configuración). Los type-soon no tienen panel.
const navItems = [...shell.matchAll(/<div class="nav-item[^"]*"[^>]*>/g)].map(m => m[0]);
const abren = navItems.filter(t => /data-panel="/.test(t) || /openModule\(/.test(t));
const sinRoles = abren.filter(t => !/data-roles="/.test(t) && !/data-panel="config"/.test(t));
check('INC-109: todo .nav-item con data-panel u openModule( tiene data-roles (salvo config)', abren.length > 15 && sinRoles.length === 0, sinRoles);
check('INC-109: los type-soon no tienen panel ni openModule', navItems.filter(t => /type-soon/.test(t)).every(t => !/data-panel="|openModule\(/.test(t)));
const dashTags = navItems.filter(t => /data-panel="dashboard"/.test(t));
check('REQ-SH-2: sin ítems del Dashboard (retirado; el inicio es el Tablero desde OP-1b)', dashTags.length === 0, dashTags);
check('INC-109: ningún ítem nace con sel', navItems.every(t => !/class="[^"]*\bsel\b/.test(t)));
const cuerpoNav = (shell.match(/function nav\(el\) \{[\s\S]*?\n\}/) || [''])[0];
const guardaNav = "if (el.hasAttribute('data-roles') && !_rolVeElemento(el.getAttribute('data-roles'), STRApi.rol())) return;";
check('INC-109: nav() revisa el rol antes de abrir el panel', cuerpoNav.indexOf(guardaNav) !== -1 && cuerpoNav.indexOf(guardaNav) < cuerpoNav.indexOf("classList.add('show')"));

// ── Equipo sin editor de roles de Firestore ──
const equipo = leer('str-usuarios.html');
check('Equipo: sin profiles/FB_ROLES/renderFbList/updateDoc/Vincular', !/profiles'|FB_ROLES|renderFbList|updateDoc|fbList|vincModal|openVincModal/.test(equipo));
check('Equipo: acceso con exigirRol([admin,operador])', /STRApi\.exigirRol\(\['admin','operador'\]\)/.test(equipo));
for (const f of ['str-propiedades.html', 'str-calendario.html', 'str-inventario.html', 'str-flujos.html', 'str-conocimiento.html']) {
  check(f + ': guarda exigirRol([admin,operador])', /window\._strRolOk = STRApi\.exigirRol\(\['admin','operador'\]\);/.test(leer(f)));
}
check('HK sin exigirRol (el portal lo usa con ?modo=colaborador)', !/exigirRol/.test(leer('str-m1-housekeeping.html')));

// ── 3. Réplica PHP ──
const php = leer('api/lib/session.php');
const usuariosPhp = leer('api/usuarios/index.php');
const invPhp = leer('api/invitacion/index.php');
// ports de api/lib/session.php
const _rolEsAdmin = r => r === 'admin' || r === 'superadmin';
const _invitarRolPermitido = (rolInvitado, rolQuien) => !_rolEsAdmin(rolInvitado) || rolQuien === 'admin';
const _invitacionCorreoValido = (rolInvitado, emailUsuario, emailGoogle) => {
  if (!_rolEsAdmin(rolInvitado)) return true;
  const a = String(emailUsuario || '').trim().toLowerCase(), b = String(emailGoogle || '').trim().toLowerCase();
  return a !== '' && a === b;
};
check('PHP: session.php define las tres funciones', /function _rolEsAdmin\(\$rol\)/.test(php) && /function _invitarRolPermitido\(\$rolInvitado, \$rolQuienInvita\)/.test(php) && /function _invitacionCorreoValido\(\$rolInvitado, \$emailUsuario, \$emailGoogle\)/.test(php));
check('PHP: _invitarRolPermitido igual al port', /return !_rolEsAdmin\(\$rolInvitado\) \|\| \$rolQuienInvita === 'admin';/.test(php));
check('PHP: _invitacionCorreoValido compara en minúsculas', /strtolower\(trim\(\(string\)\$emailUsuario\)\)/.test(php) && /return \$a !== '' && \$a === \$b;/.test(php));
check('PHP: invitar lee el rol y responde 403 con el mensaje', /SELECT id, nombre, email, rol FROM usuario/.test(usuariosPhp) && /_invitarRolPermitido\(\$u\['rol'\] \?\? '', \$auth\['rol'\]\)[\s\S]{0,80}http_response_code\(403\)[\s\S]{0,80}Solo un administrador invita a otro administrador/.test(usuariosPhp));
check('PHP: aceptar responde 409 antes de vincular', /_invitacionCorreoValido\([\s\S]{0,120}http_response_code\(409\)[\s\S]{0,120}Entra con esa cuenta de Google/.test(invPhp) && invPhp.indexOf('_invitacionCorreoValido(') < invPhp.indexOf('UPDATE usuario SET firebase_uid'));

// réplica de POST /usuarios/{id}/invitar (solo el orden de guardas que importa aquí)
function invitar(auth, invitado, permisosOperador) {
  const puede = auth.rol === 'admin' || (auth.rol === 'operador' && (!permisosOperador || permisosOperador.todo !== false || permisosOperador['equipo.invitar'] === true));
  if (!['admin', 'operador'].includes(auth.rol) || !puede) return { status: 403, error: 'Sin permiso para invitar usuarios' };
  if (!_invitarRolPermitido(invitado.rol, auth.rol)) return { status: 403, error: 'Solo un administrador invita a otro administrador' };
  if (!invitado.email) return { status: 422 };
  return { status: 200, ok: true };
}
const admNuevo = { id: 50, rol: 'admin', email: 'zz-verif-admin@x.co' };
check('invitar a un admin desde un operador → 403', invitar({ rol: 'operador' }, admNuevo).status === 403 && invitar({ rol: 'operador' }, admNuevo).error === 'Solo un administrador invita a otro administrador');
check('invitar a un admin desde un operador con equipo.invitar → 403', invitar({ rol: 'operador' }, admNuevo, { todo: false, 'equipo.invitar': true }).status === 403);
check('invitar a un admin desde un admin → ok', invitar({ rol: 'admin' }, admNuevo).status === 200);
check('operador con equipo.invitar invita a un colaborador → ok (sin cambio)', invitar({ rol: 'operador' }, { rol: 'colaborador', email: 'c@x.co' }, { todo: false, 'equipo.invitar': true }).status === 200);

// réplica de POST /invitacion/aceptar
function aceptar(usuario, google) {
  if (!_invitacionCorreoValido(usuario.rol, usuario.email, google.email)) return { status: 409, error: 'Esta invitación es para ' + usuario.email + '. Entra con esa cuenta de Google.', vinculado: false };
  return { status: 200, token: 'jwt', vinculado: true, user: { id: usuario.id, rol: usuario.rol } };
}
let ra = aceptar(admNuevo, { email: 'otra@gmail.com' });
check('aceptar invitación de admin con otro correo → 409 y no vincula', ra.status === 409 && !ra.vinculado && ra.error === 'Esta invitación es para zz-verif-admin@x.co. Entra con esa cuenta de Google.');
ra = aceptar(admNuevo, { email: 'ZZ-Verif-Admin@X.co' });
check('aceptar invitación de admin con el mismo correo (mayúsculas) → sesión admin', ra.status === 200 && ra.token && ra.user.rol === 'admin');
check('aceptar invitación de colaborador con otro correo → sesión (sin cambio)', aceptar({ id: 9, rol: 'colaborador', email: 'c@x.co' }, { email: 'otra@gmail.com' }).status === 200);
check('aceptar invitación de operador con otro correo → sesión (sin cambio)', aceptar({ id: 8, rol: 'operador', email: 'o@x.co' }, { email: 'otra@gmail.com' }).status === 200);
check('admin sin correo guardado → 409', aceptar({ id: 51, rol: 'admin', email: '' }, { email: '' }).status === 409);

// PUT /usuarios/{id} con rol: una sola columna `rol`, el nuevo reemplaza al anterior.
check('PHP: PUT rol escribe la única columna rol', /if \(array_key_exists\('rol', \$d\)\) \{ \$fields\[\] = 'rol=\?'; \$params\[\] = \$d\['rol'\]; \}/.test(usuariosPhp));
const fila = { id: 60, nombre: 'zz-verif-x', rol: 'colaborador' };
function putUsuario(f, d) { const n = Object.assign({}, f); if (Object.prototype.hasOwnProperty.call(d, 'rol')) n.rol = d.rol; return n; }
const tras = putUsuario(fila, { rol: 'operador' });
check('PUT rol deja un solo rol (el nuevo)', tras.rol === 'operador' && typeof tras.rol === 'string' && !Array.isArray(tras.rol) && Object.keys(tras).filter(k => /rol/i.test(k)).length === 1);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

**G2 · `tests/e2e/REQ-SH-2.spec.js`** (archivo completo; guion existente que cuenta el menú: Proyecto con ocho entradas y `str-linea-base.html` entre las páginas; cópialo tal cual, no lo corras). Contenido completo:
```js
// REQ-SH-2 (L-<n>): menú del STR con solo lo que funciona — Operación del día · Configurar el negocio · Lo que viene (admin)
// · Proyecto (admin, plegado al final). Sin Dashboard ni maquetas; desde OP-1b (L-143) el STR abre en el Tablero (REQ-OP-1,
// data-inicio="1"); sin esa entrada abriría en Limpieza & HK. Solo lectura: navega y lee el DOM, no crea datos.
// El arnés agrupa por perfil en el orden de primera aparición: admin (a, c–j) → oper (b, b2).
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
        h.espera(todos.length === 17 && !raros.length, 'entradas: ' + todos.length + ' · maquetas o sin página real: ' + (raros.map((i) => i.label).join(', ') || 'ninguna'));
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

`node tests/run.js` en verde (sin PHP en LENOVO los que lo llaman salen «OMITIDA», como siempre).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · 3 módulos · 14 relaciones · 17 reglas · corren 23 guiones (106 casos) · no corren 32 · huecos: 3 relaciones, 3 reglas
- Módulos: **K3** (archivo str-app-shell.html) · **PRJ** (línea «Mapa:») · **SH** (archivo str-app-shell.html; página /str-app-shell.html; línea «Mapa:»)
- Relaciones por las que pasa: REL-01 SH→*, REL-02 *→SH, REL-16 HK→K3, REL-17 K3→HK, REL-18 K3→SH, REL-19 K3→INC1, REL-23 *→google-drive, REL-24 PRJ→github, REL-26 *→SRV, REL-37 API→SH, REL-38 API→PRJ, REL-99 SRV→SH, REL-102 U→SH, REL-112 U→PRJ
- Reglas que cruza: RT-3, RT-7, RT-8, RT-9, RT-10, RT-11, RT-13, RT-16, RT-25 (de proceso, las garantiza la fábrica: RT-2, RT-4, RT-12, RT-18, RT-20, RT-22, RT-23, RT-24)
- Corren (regresión por ruta): DT-42 (1/4), INC-125 (1/3), INC-131 (2/3), INC-132 (3/6), INC-134 (2/2), INC-146-purga (3/5), REQ-INV2-3-4-hk (9/13), REQ-INV2-3-4 (2/5), REQ-INV2-4-2-dif (7/9), REQ-INV2-4-2 (10/14), REQ-INV2-7-1-hk-turno (3/5), REQ-INV2-7-1 (3/10), REQ-K3b-aviso (7/7), REQ-K3b (5/5), REQ-K3c-vista (6/6), REQ-K3c (3/3), REQ-OP-1 (2/8), REQ-OP-1b (3/7), REQ-SH-2 (11/11), REQ-TB-3 (8/8), REQ-TB-4 (7/7), REQ-TB-5 (7/7), herramientas/pw/humo-pw (1/1)
- No corren: 32 guiones fuera de la ruta
- Huecos de la ruta (nadie pasa): el guion cubre con un caso con `cubre` los que SU CAMBIO ejerce; los demás quedan aquí como deuda de cobertura (una línea de por qué no aplica basta al revisor previo). Relaciones REL-37 (API→SH), REL-38 (API→PRJ), REL-99 (SRV→SH); reglas RT-10 Evidencia de incidentes, RT-11 Fotos de tarea, RT-25 Sobre de capacidad v1 — un caso negativo por regla (quien no puede, intenta)
- A declarar (algún guion pasa por sus módulos, ningún caso lo dice en `cubre`): REL-19, REL-102, REL-112
```

Deuda de cobertura de la ruta (no la ejerce este lote): REL-37 y REL-38 (API→SH/PRJ) y REL-99 (SRV→SH): `str-api.js` y el servidor no cambian, solo `STR_API_VERSION`; RT-10, RT-11 y RT-25: la página no toca incidentes, fotos ni el servidor (lee un archivo de GitHub); REL-19 (K3→INC1): entra en la ruta solo porque `str-app-shell.html` también es de K3, y el lote no toca la copia a Drive. REL-102 y REL-112 (U→SH, U→PRJ) los ejercen los casos d y g del guion, pero e2e-esquema solo admite REL de dos cifras en «cubre» (aviso al Arquitecto).

## Pruebas derivadas (juez; verificador normal)
```
- a. La página nueva: guarda de admin, encabezado y ⟳ Actualizar con STRApi.docs, explorador del mismo commit en un iframe sandbox sin mismo origen, versión vigente · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `linea-base-pagina.test.js` n OK, 0 FAIL · **Detener**
- b. El menú cuenta ocho páginas en Proyecto y 19 ítems con data-roles; el operador sigue sin ver Proyecto · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: decisión · espera: `menu-sh2.test.js` y `roles.test.js` con 0 FAIL · **Detener**
- c. El admin ve el encabezado del commit y, dentro del iframe, «STR Manager» y la tabla «Línea objetivo»; el documento del iframe tiene origen opaco · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: linea-base.html publicado en el commit del encabezado · tec: escenario · espera: caso c del guion en verde · **Revertir**
- d. El operador no ve «Línea base» y, si abre la página a mano, vuelve al STR sin el explorador · nivel: N2 · perfil: zz-verif-oper · página: https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: ninguna · tec: decisión · espera: caso d del guion en verde · **Revertir**
- e. ⟳ Actualizar vuelve a pedir el commit y deja el explorador cargado · nivel: N2 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: c en verde · tec: escenario · espera: caso e del guion en verde · **Detener**
- f. El explorador ocupa toda el área bajo el encabezado, en escritorio y a 390 px, sin doble barra de la página · nivel: N3 · perfil: zz-verif-admin · página: https://app.apartamentosbucaramanga.com/str-linea-base.html · precondición: c en verde · espera: capturas f-escritorio y f-movil con el explorador a lo ancho y alto · **Seguir**
- g. El colaborador que abre la página a mano vuelve a su inicio sin el explorador · nivel: N2 · perfil: zz-verif-colab · página: https://app.apartamentosbucaramanga.com/portal.html (desde ahí abre str-linea-base.html) · precondición: ninguna · tec: decisión · espera: caso g del guion en verde · **Revertir**
- h. Cada punto se aplicó literal y la versión quedó en p5c113 · nivel: N1 · perfil: tests/ · precondición: a y b en verde · tec: escenario · espera: `aplicar.js` K1 con P1, P2, C1–C3, D1–D6, T2, T3, G2 y Versión en verde; K2 `tests/linea-base-pagina.test.js` igual · **Detener**
- Datos de prueba: ninguno (solo lectura; semilla fija de perfiles)
```

### Guion N2 → `tests/e2e/LM-82.spec.js` (la CLI lo copia tal cual, sin cambiar un byte)
```js
// LM-82 (L-165): página «Línea base» del grupo Proyecto. El admin ve el encabezado del commit y, dentro del iframe aislado,
// el explorador de la línea base (título «STR Manager» y la tabla «Línea objetivo»); el operador y el colaborador no entran.
// Solo lectura: no crea datos. El arnés agrupa por perfil en el orden de primera aparición: admin (c, e, f) → oper (d) → colab (g).
const RAW = 'https://raw.githubusercontent.com/thcure/str-manager-docs/';
const base = (h) => h.BASE || new URL(h.page.url()).origin;
async function hasta(fn, ms) {
  const fin = Date.now() + ms;
  for (;;) { if (await fn()) return true; if (Date.now() > fin) return false; await new Promise((r) => setTimeout(r, 300)); }
}
// Espera el encabezado del commit y el estado final de la página; devuelve {sha, estado, encabezado}.
async function cargada(h) {
  const p = h.page;
  await p.waitForSelector('[data-docs-encabezado]', { timeout: 30000 });
  await p.waitForFunction(() => { const e = document.querySelector('[data-docs-encabezado]'); return e && /Datos de|Datos del/.test(e.textContent); }, null, { timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => { const c = document.querySelector('#lbCuerpo'); return c && c.dataset.lbEstado !== 'cargando'; }, null, { timeout: 60000 }).catch(() => {});
  return p.evaluate(() => {
    const e = document.querySelector('[data-docs-encabezado]'), c = document.querySelector('#lbCuerpo');
    return { sha: e ? (e.dataset.sha || '') : '', encabezado: e ? e.textContent.trim() : '', estado: c ? c.dataset.lbEstado : '', vacio: (document.querySelector('#lbVacio') || {}).textContent || '' };
  });
}
// Texto visible dentro del iframe del explorador (frame hijo de #lbMarco). Solo lee.
async function textoMarco(h, buscar, ms) {
  const fr = h.page.frameLocator('#lbMarco');
  const ok = await fr.locator('text=' + buscar).first().waitFor({ state: 'attached', timeout: ms }).then(() => true, () => false);
  return ok;
}

module.exports = {
  req: 'LM-82',
  zona: ['PRJ'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['PRJ', 'REL-24'], pagina: '/str-linea-base.html',
      que: 'El admin ve el encabezado del commit y, dentro del iframe, el explorador de ese commit: «STR Manager» y la tabla «Línea objetivo»',
      async prueba(h) {
        const p = h.page;
        const e = await cargada(h);
        h.espera(/^Datos de/.test(e.encabezado) && /^[0-9a-f]{40}$/.test(e.sha), 'encabezado: «' + e.encabezado + '» · sha ' + (e.sha || 'ninguno'));
        h.espera(e.estado === 'ok', 'estado de la página: ' + e.estado + (e.vacio ? ' · ' + e.vacio.trim().slice(0, 160) : ''));
        const r = await p.request.get(RAW + (e.sha || 'main') + '/interno/linea-base/linea-base.html');
        h.espera(r.status() === 200, 'explorador publicado en ' + (e.sha || 'main').slice(0, 7) + ': HTTP ' + r.status());
        const sandbox = await p.$eval('#lbMarco', (f) => f.getAttribute('sandbox')).catch(() => null);
        h.espera(sandbox === 'allow-scripts allow-popups', 'sandbox del iframe: «' + sandbox + '»');
        const titulo = await textoMarco(h, 'STR Manager', 30000);
        h.espera(titulo, 'dentro del iframe: «STR Manager» ' + (titulo ? 'visible' : 'NO'));
        const tabla = await textoMarco(h, 'Línea objetivo', 30000);
        h.espera(tabla, 'dentro del iframe: tabla «Línea objetivo» ' + (tabla ? 'visible' : 'NO'));
        // El explorador no ve la sesión del STR: su documento es de origen opaco (sin allow-same-origin).
        const fr = p.frames().find((f) => f.parentFrame() === p.mainFrame() && /^about:srcdoc/.test(f.url()));
        const origen = fr ? await fr.evaluate(() => String(self.origin)).catch(() => 'error') : 'sin frame';
        h.espera(origen === 'null', 'origen del documento del iframe: ' + origen);
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['PRJ', 'REL-24'], pagina: '/str-linea-base.html',
      que: '⟳ Actualizar vuelve a pedir el commit y deja el explorador cargado, con el encabezado del commit',
      async prueba(h) {
        const p = h.page;
        const e0 = await cargada(h);
        await p.click('#btnDocsAct');
        await hasta(() => p.$eval('#btnDocsAct', (b) => !b.disabled).catch(() => false), 60000);
        const e1 = await cargada(h);
        h.espera(e1.estado === 'ok' && /^[0-9a-f]{40}$/.test(e1.sha), 'tras Actualizar: estado ' + e1.estado + ' · sha ' + (e1.sha || 'ninguno').slice(0, 7) + ' (antes ' + (e0.sha || 'ninguno').slice(0, 7) + ')');
        const tabla = await textoMarco(h, 'Línea objetivo', 30000);
        h.espera(tabla, 'dentro del iframe tras Actualizar: «Línea objetivo» ' + (tabla ? 'visible' : 'NO'));
      },
    },
    {
      c: 'f', nivel: 'N3', perfil: 'admin', cubre: ['PRJ'], pagina: '/str-linea-base.html',
      que: 'El explorador ocupa toda el área bajo el encabezado (escritorio y 390 px), sin doble barra de desplazamiento de la página',
      async prueba(h) {
        await cargada(h);
        await textoMarco(h, 'Línea objetivo', 30000);
        await h.captura('escritorio', { completa: false });
        await h.captura('movil', { ancho: 390, completa: false });
      },
    },
    {
      c: 'd', perfil: 'oper', tec: 'decisión', cubre: ['PRJ', 'SH'], pagina: '/str-app-shell.html',
      que: 'El operador no ve «Línea base» en el menú y, si abre la página a mano, vuelve al STR sin ver el explorador',
      async prueba(h) {
        const p = h.page;
        await p.waitForSelector('.sidebar .nav-group', { timeout: 20000 });
        const entrada = await p.$$eval('[data-fav-url="str-linea-base.html"]', (els) => els.filter((e) => e.offsetParent !== null).length).catch(() => -1);
        h.espera(entrada === 0, 'entradas «Línea base» visibles para el operador: ' + entrada);
        await p.goto(base(h) + '/str-linea-base.html', { waitUntil: 'load' }).catch(() => null);
        await hasta(() => !/\/str-linea-base\.html/.test(p.url()), 10000);
        const marco = await p.locator('#lbMarco').count().catch(() => 0);
        h.espera(!/\/str-linea-base\.html/.test(p.url()) && marco === 0, 'str-linea-base.html como operador → ' + p.url().replace(base(h), '') + ' · iframe del explorador: ' + marco);
      },
    },
    {
      c: 'g', perfil: 'colab', tec: 'decisión', cubre: ['PRJ'], pagina: '/portal.html',
      que: 'El colaborador que abre la página a mano vuelve a su inicio sin ver el explorador',
      async prueba(h) {
        const p = h.page;
        await p.goto(base(h) + '/str-linea-base.html', { waitUntil: 'load' }).catch(() => null);
        await hasta(() => !/\/str-linea-base\.html/.test(p.url()), 10000);
        const marco = await p.locator('#lbMarco').count().catch(() => 0);
        h.espera(!/\/str-linea-base\.html/.test(p.url()) && marco === 0, 'str-linea-base.html como colaborador → ' + p.url().replace(base(h), '') + ' · iframe del explorador: ' + marco);
      },
    },
  ],
};
```

## 6. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-165 · LM-82 · Casos de uso: CU-PRJ-1.1, CU-SH-1.1, CU-SH-1.2, CU-SH-3.1, CU-SH-3.2, CU-SH-3.3, CU-SH-5.1, CU-SH-5.2, CU-SH-5.3, CU-SH-6.1, CU-SH-7.1, CU-SH-8.1, CU-KN-6.1, CU-OP-4.1, CU-U-2.5
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por punto (P1, P2, versión, C1–C3, D1–D6, T1–T3, G2, guion) · archivos declarados vs tocados (toda diferencia explicada) · versión `?v=` p5c113 (salida de `grep -rn "p5c112" *.html *.js`: vacía) · hash del commit · tests: n/n · «Reproduce: linea-base-pagina.test.js falla en HEAD» · «mapa del área / CLAUDE.md actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
