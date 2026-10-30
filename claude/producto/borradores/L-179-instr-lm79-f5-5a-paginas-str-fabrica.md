# instr — L-179 · LM-79 fase 5.5 A (paridad de páginas, orden de Carlos 30-oct): Marco de trabajo, Instrucciones y COBIT del STR se ven iguales en herramienta-fabrica., dentro del visor aislado
Categoría: **crítico** (trae a un sitio de la fábrica código de páginas del STR y un adaptador que corre dentro del visor; DA: LM-79 · cruce previo con Carlos: PENDIENTE (lo da el Arquitecto por delegación: dentro del plan, sin secretos ni roles nuevos, M-1176))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · AAAA-MM-DD HH:MM
Decisión: ADR-009 (v5, § 4b y 4c, aceptada; contrato de la fase 5, regla 8 «paridad de páginas») y DA: LM-79; orden de Carlos del 30-oct 11:08 (M-1250; excepción de pausas M-1251, tanda T-6)
Alcance: en str-manager, `tests/e2e/LM-79-paridad-a.spec.js` (nuevo) · `docs/claude/modelo.md` (puntero) · en la carpeta hermana C:\Users\ktcol\fabrica-servicio-l179 (clon de fabrica-servicio, **no** es str-manager): la carpeta nueva sitios/fabrica/str/ con las tres páginas del STR (marco de trabajo, instrucciones y COBIT, copiadas con `git show` de str-manager 73d5aa9~1 y comprobadas por hash) y, con el script de A2, sitios/comun/puro.js, sitios/comun/paginas.js, sitios/comun/estilo.css, sitios/fabrica/fabrica.js, tests/sitios-str.test.js (nuevo) y docs/claude/modelo.md · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques nada más de str-manager
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Origen: orden de Carlos (30-oct 11:08): en 5.4 vio datos como tablas y no las páginas del STR; pidió traerlas iguales. M-1250 (fase 5.5, tres lotes; este es A), M-1252 (lectura de A; html en el repo, adaptador y tres pedidos), M-1253 (dato de ins-005). Requerimiento: LM-79 fase 5.5 en `interno/lotes-modelo/LM-79.md`
Impacto: en herramienta-fabrica., arriba de Modelo de trabajo, «Abrir el marco de trabajo» y «Abrir las instrucciones», y arriba de Gobierno, «Abrir COBIT» (los tres «como en el STR»): cada uno abre la página del STR igual, con los datos del servicio, en el visor aislado de L-174; las tablas de siempre quedan debajo. Dentro del visor la página no guarda nada: arranca en su tema oscuro y COBIT en su primera pestaña; el enlace a un objetivo (#código) sí funciona. «Copiar» de Instrucciones copia, y si el navegador no lo deja dentro del visor, selecciona el texto para copiarlo a mano: eso es lo esperado, no un fallo. Nada cambia en proyectos. ni en el STR.
Reglas transversales que toca: RT-14 (el permiso lo sigue dando el servicio a la sesión del sitio: sin sesión de admin no hay datos que pasar; el adaptador no decide nada) · RT-18 (el visor sigue sin allow-same-origin: origen opaco, sin token ni almacenamiento; el adaptador no tiene red ni acceso afuera) · RT-19 (ninguna lectura nueva al servicio: los datos son las filas que la Fábrica ya lee; la página se lee del propio sitio al abrirla)
Mapa: módulos y relaciones que cambia: MOD (sitio herramienta-fabrica.: páginas del STR en el visor, sitios/fabrica/fabrica.js); ninguna relación nueva ni del STR
Casos de uso: CU-MOD-3.1
Riesgo: medio por tamaño (tres html del STR, unos 49 KB, entran a fabrica-servicio) y bajo en código (una función pura, un adaptador de 20 líneas y tres botones). R-1 del lote; MOD tiene riesgo 1, no hace falta R-n. Puede salir mal: que un texto de los datos cierre el script del adaptador (no: «<» va como \u003c; T2 y la simulación con un «</script>» adrede); que la página use de STRApi algo que el adaptador no da (T1 lo revisa en las tres copias); que la copia no sea la del STR (A2 compara el hash de git de cada una con 73d5aa9~1). Conexiones a MySQL (RT-19): las mismas de siempre. Sin limpieza manual: no retira nada.
¿Datos personales o dinero?: no (precondición de f: ins-005 sin el correo real de Carlos, M-1253) · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce delegado)
Reversión: fabrica-servicio: `git revert` del commit de A3 (se van los botones y las copias; las tablas siguen). str-manager: `git revert <hash>` (el guion y la nota).
Depende de: L-178 aceptado (fabrica-servicio a2226f3, desplegado; str-manager 0af2935) · Precondiciones para verificar: perfil zz-verif-admin (en MODELO_ADMIN_UIDS); servicio cargado con ins-005 sin el correo real (M-1253); sin datos que crear
¿Quién más depende de lo que cambia?: LM-79-sitios y LM-79-paginas siguen igual: el visor, su CSP y la nomenclatura no cambian (mostrarPagina usa ahora mostrarHtml, el mismo código movido; V1–V4 en verde). L-180 (Elementos, Base de conocimiento y Nomenclatura) usará paginaStr y ofrecerHtml. La foto interno/arquitectura/guiones-e2e.json no trae aún los LM-79-*, por eso la ruta impresa no los lista aunque pw los corre.

## 0. Contexto y reglas de este lote
- Dos partes, en este orden: **A** (A1–A3) en una carpeta hermana, clon de `thcure/fabrica-servicio`: copias del git de str-manager las tres páginas del STR, aplicas con un script de Node el adaptador, los botones y sus tests, corres sus tests y lo subes. **B** (B1–B2) en str-manager: dos pares del puntero `modelo.md` y el guion N2 nuevo. **Si A no termina en verde, no hagas B.**
- **La consola no guarda variables entre llamadas.** Cada bloque de A empieza con `H=/c/Users/ktcol/fabrica-servicio-l179` y su guardia: córrelo entero en una sola llamada. No hagas `cd` a la carpeta hermana. Nunca `push --force` ni reescribir historia.
- Las tres páginas se copian con `git show` (A2) y no se tocan: ni a mano ni con el script. El script de A2 escribe los seis archivos: **no los edites a mano** ni los reescribas. Si dice FAIL, para.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.
- En LENOVO hay `C:\php` (PHP 8.3) sin `openssl.cnf`: la parte B de `modelo-google.test.js` sale «OMITIDA» (INC-211); `modelo-lectura.test.js` F3 corre o sale «F3 OMITIDA» según traiga `pdo_sqlite`. Las dos cosas valen.

## A1. Clonar fabrica-servicio a la carpeta hermana
```bash
H=/c/Users/ktcol/fabrica-servicio-l179
test ! -e "$H" || { echo "ya existe $H: para"; exit 1; }
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || { echo "str-manager no está en main limpio: para"; exit 1; }
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || { echo "main local distinto de origin/main: para"; exit 1; }
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git clone --no-tags --single-branch --branch main https://github.com/thcure/fabrica-servicio.git "$H"
test "$(git -C "$H" rev-parse HEAD)" = a2226f3bca175a08d02ced3ba9a3215f17ff9ef3 || { echo "fabrica-servicio no está en a2226f3: para"; exit 1; }
node "$H/tests/run.js"      # 10/10 antes de tocar nada
```

## A2. Copiar las tres páginas del STR y aplicar los cambios con el script
Guarda el bloque siguiente como `aplicar-l179.js` en `C:\Users\ktcol\` (fuera de los dos repos; **no se commitea**). El bloque bash de abajo primero copia las tres páginas desde el git de str-manager (`git show 73d5aa9~1:<página>`, desde str-manager, que es donde corres) y compara el hash de git de cada copia con el de ese commit; después corre el script. El script valida todo en memoria (cada texto a cambiar aparece una sola vez; el test que crea todavía no existe); si algo no cuadra no escribe nada. Después escribe y compara el hash de git de los seis archivos con el esperado: debe terminar en «Todo igual: 6 archivos.».
```js
// L-179 (LM-79 5.5 A): aplica en la carpeta hermana de fabrica-servicio el adaptador y los botones de las páginas del STR, y sus tests.
// Uso: node aplicar-l179.js <carpeta de fabrica-servicio>. Primero lo valida todo en memoria (cada «busca» aparece una
// sola vez; los archivos nuevos no existen); si algo no cuadra, no escribe nada y sale con 1. Después escribe (LF) y
// compara el hash de git de cada archivo con el esperado.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const H = process.argv[2];
if (!H || !fs.existsSync(path.join(H, '.git'))) { console.log('FAIL carpeta sin .git: ' + H); process.exit(1); }
const OPS = [{"tipo": "par", "ruta": "sitios/fabrica/fabrica.js", "busca": "// y el plan de P01, que no son de esta sección), suma marco de trabajo y COBIT, y la nomenclatura en el visor aislado.\nimport { iniciarSitio } from '/sitios/comun/sesion.js';", "pon": "// y el plan de P01, que no son de esta sección), suma marco de trabajo y COBIT, y la nomenclatura en el visor aislado.\n// L-179 (5.5, regla 8): Marco de trabajo, Instrucciones y COBIT del STR, iguales, en el visor, encima de las tablas.\nimport { iniciarSitio } from '/sitios/comun/sesion.js';"}, {"tipo": "par", "ruta": "sitios/fabrica/fabrica.js", "busca": "import { iniciarSitio } from '/sitios/comun/sesion.js';\nimport { ofrecerPagina } from '/sitios/comun/paginas.js';\n", "pon": "import { iniciarSitio } from '/sitios/comun/sesion.js';\nimport { ofrecerPagina, ofrecerHtml } from '/sitios/comun/paginas.js';\n"}, {"tipo": "par", "ruta": "sitios/fabrica/fabrica.js", "busca": "};\n", "pon": "};\n\n// Páginas del STR (copia de str-manager 73d5aa9~1 en /sitios/fabrica/str/): parte, archivo del servicio que les da los datos\n// (las mismas filas que ya se leyeron para las tablas: ninguna lectura nueva al servicio), página y título del botón\nconst PAGINAS_STR = [\n  ['modelo', 'fabrica/marco-trabajo', 'str-marco-trabajo', 'el marco de trabajo (como en el STR)'],\n  ['modelo', 'fabrica/instrucciones', 'str-instrucciones', 'las instrucciones (como en el STR)'],\n  ['gobierno', 'fabrica/cobit', 'str-cobit', 'COBIT (como en el STR)']\n];\n"}, {"tipo": "par", "ruta": "sitios/fabrica/fabrica.js", "busca": "  }\n  const nom = document.createElement('div');", "pon": "  }\n  // Botones de las páginas del STR, arriba de cada parte; la página (html estático del propio sitio) se lee al abrirla\n  const version = { texto: P.versionTexto(s), sha: s && s.sha ? String(s.sha) : '' };\n  const arriba = {};\n  for (const [parte, archivo, pagina, titulo] of PAGINAS_STR) {\n    if (!grupos[archivo]) continue;\n    const cuerpo = document.querySelector('#' + parte + ' .cuerpo');\n    if (!arriba[parte]) { arriba[parte] = document.createElement('div'); arriba[parte].className = 'paginas-str'; cuerpo.insertBefore(arriba[parte], cuerpo.firstChild); }\n    const c = document.createElement('div');\n    c.className = 'pagina-str';\n    arriba[parte].appendChild(c);\n    ofrecerHtml(c, pagina, titulo, async () => {\n      const r = await fetch('/sitios/fabrica/str/' + pagina + '.html', { cache: 'no-cache', credentials: 'omit' });\n      if (r.status !== 200) throw new Error('No se pudo leer la página (' + P.textoEstado(r.status) + ').');\n      return P.paginaStr({ html: await r.text(), datos: P.datosArchivo(grupos[archivo]), version });\n    });\n  }\n  const nom = document.createElement('div');"}, {"tipo": "par", "ruta": "sitios/comun/puro.js", "busca": "\n  raiz.FabricaPuro = { SERVICIO: SERVICIO, esc: esc, urlServicio: urlServicio, estadoPorRespuesta: estadoPorRespuesta, textoEstado: textoEstado, versionTexto: versionTexto, md: md, valorHtml: valorHtml, porArchivo: porArchivo, paginaHtml: paginaHtml };\n})(typeof window !== 'undefined' ? window : this);", "pon": "\n  // L-179 (LM-79 5.5, regla 8 del contrato): páginas del STR (copia byte a byte de str-manager 73d5aa9~1, en\n  // sitios/fabrica/str/) dentro del visor aislado. La página no se toca: solo su <script src=\"str-api.js…\"> se cambia por el\n  // adaptador, con los datos dentro. El JSON de la página se rearma de las filas del complemento: {clave: valor} en su orden.\n  var STR_API_TAG = '<script src=\"str-api.js?v=p5c113\"></script>';\n  function datosArchivo(filas) {\n    var o = {};\n    (Array.isArray(filas) ? filas : []).filter(function (f) { return f && typeof f.clave === 'string'; })\n      .slice().sort(function (a, b) { return (Number(a.orden) || 0) - (Number(b.orden) || 0); })\n      .forEach(function (f) { o[f.clave] = f.valor; });\n    return o;\n  }\n  // El adaptador corre DENTRO de la página, en el visor (origen opaco). Da a la página lo único que usa de STRApi\n  // (requireSession, user, rutaInicio y docs.commit/url/encabezado) y un fetch que responde solo la URL interna de los\n  // datos y rechaza cualquier otra. Ni token, ni red, ni acceso a la página que lo contiene. Se inyecta con toString().\n  function adaptadorStr(D) {\n    var URL_DATO = 'fabrica-dato:plano';\n    window.STRApi = {\n      requireSession: function () { return true; },\n      user: function () { return { user: { rol: 'admin' } }; },\n      rutaInicio: function () { return ''; },\n      docs: {\n        commit: function () { return Promise.resolve(D.sha ? { sha: D.sha } : null); },\n        url: function () { return URL_DATO; },\n        encabezado: function () { return D.texto; }\n      }\n    };\n    window.fetch = function (url) {\n      if (String(url) === URL_DATO) {\n        return Promise.resolve(new Response(JSON.stringify(D.datos), { status: 200, headers: { 'Content-Type': 'application/json' } }));\n      }\n      return Promise.reject(new TypeError('el visor solo da los datos de esta página: ' + String(url).slice(0, 80)));\n    };\n  }\n  // {html, datos, version: {texto, sha}} → html con el adaptador en lugar de str-api.js; null si la página no trae la\n  // etiqueta exactamente una vez o no hay datos. «<» va como \\u003c: ningún texto de los datos cierra el <script>.\n  function paginaStr(op) {\n    var html = op && typeof op.html === 'string' ? op.html : '';\n    if (html.split(STR_API_TAG).length !== 2) return null;\n    if (!op.datos || typeof op.datos !== 'object' || Array.isArray(op.datos)) return null;\n    var v = op.version && typeof op.version === 'object' ? op.version : {};\n    var json = JSON.stringify({ datos: op.datos, texto: String(v.texto == null ? '' : v.texto), sha: String(v.sha == null ? '' : v.sha) })\n      .replace(/</g, '\\\\u003c').replace(/\\u2028/g, '\\\\u2028').replace(/\\u2029/g, '\\\\u2029');\n    var js = '(' + adaptadorStr.toString() + ')(' + json + ');';\n    return html.replace(STR_API_TAG, function () { return '<script>' + js + '</script>'; });\n  }\n\n  raiz.FabricaPuro = { SERVICIO: SERVICIO, esc: esc, urlServicio: urlServicio, estadoPorRespuesta: estadoPorRespuesta, textoEstado: textoEstado, versionTexto: versionTexto, md: md, valorHtml: valorHtml, porArchivo: porArchivo, paginaHtml: paginaHtml, datosArchivo: datosArchivo, adaptadorStr: adaptadorStr, paginaStr: paginaStr, STR_API_TAG: STR_API_TAG };\n})(typeof window !== 'undefined' ? window : this);"}, {"tipo": "par", "ruta": "sitios/comun/paginas.js", "busca": "// CSP. Al visor solo le llega el html, por postMessage; nunca el token.\nconst P = window.FabricaPuro;", "pon": "// CSP. Al visor solo le llega el html, por postMessage; nunca el token.\n// L-179 (LM-79 5.5): el mismo visor muestra las páginas del STR (ofrecerHtml: el html lo arma quien llama, con los datos dentro).\nconst P = window.FabricaPuro;"}, {"tipo": "par", "ruta": "sitios/comun/paginas.js", "busca": "  }\n  const f = document.createElement('iframe');", "pon": "  }\n  mostrarHtml(cont, html, titulo, nombre);\n  return true;\n}\n\n// Pone en cont el visor aislado y le pasa el html (solo eso) cuando avisa que está listo\nfunction mostrarHtml(cont, html, titulo, nombre) {\n  const f = document.createElement('iframe');"}, {"tipo": "par", "ruta": "sitios/comun/paginas.js", "busca": "  cont.appendChild(f);\n  return true;\n}", "pon": "  cont.appendChild(f);\n}"}, {"tipo": "par", "ruta": "sitios/comun/paginas.js", "busca": "  });\n}\n", "pon": "  });\n}\n\n// L-179: botón «Abrir …» para una página del STR; armar() devuelve su html (con el adaptador y los datos) o null\nexport function ofrecerHtml(cont, nombre, titulo, armar) {\n  cont.innerHTML = '<button type=\"button\" class=\"abrir-pagina-str\" data-pagina=\"' + P.esc(nombre) + '\">Abrir ' + P.esc(titulo) + '</button>';\n  cont.querySelector('button').addEventListener('click', async (ev) => {\n    ev.target.disabled = true;\n    try {\n      const html = await armar();\n      if (typeof html !== 'string' || !html) { cont.innerHTML = '<p class=\"vacio\">La página no se pudo armar.</p>'; return; }\n      mostrarHtml(cont, html, titulo, nombre);\n    } catch (e) { cont.innerHTML = '<p class=\"vacio\">' + P.esc(String(e && e.message || e)) + '</p>'; }\n  });\n}\n"}, {"tipo": "par", "ruta": "sitios/comun/estilo.css", "busca": ".pagina-generada { margin-top: 12px; }\n/* L-176: aviso de una lectura fallida */", "pon": ".pagina-generada { margin-top: 12px; }\n/* L-179: las páginas del STR, arriba de cada parte */\n.paginas-str { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }\n/* L-176: aviso de una lectura fallida */"}, {"tipo": "nuevo", "ruta": "tests/sitios-str.test.js", "texto": "// LM-79 fase 5.5 (L-179, regla 8 del contrato): páginas del STR en el visor aislado. T1: las copias de sitios/fabrica/str/\n// traen la etiqueta de str-api.js una sola vez y no usan de STRApi nada que el adaptador no dé. T2: paginaStr (puro.js) en\n// un vm: cambia solo esa etiqueta, rechaza lo que no cuadra y escapa los datos (un «</script>» adrede no cierra el script).\n// T3: el adaptador corrido en un vm: da los datos solo por su URL interna y rechaza cualquier otra; no toca ni red, ni token,\n// ni la página que lo contiene. T4: datosArchivo rearma el JSON. T5: la Fábrica las ofrece en su parte, sin lecturas nuevas.\nconst path = require('path');\nconst vm = require('vm');\nconst { leerTexto } = require('./lib/leer-texto.js');\n\nlet ok = 0, fail = 0;\nfunction eq(nombre, real, esperado) {\n  const pasa = JSON.stringify(real) === JSON.stringify(esperado);\n  pasa ? ok++ : fail++;\n  console.log((pasa ? 'OK   ' : 'FAIL ') + nombre + ' → ' + JSON.stringify(real) + (pasa ? '' : ' (esperado ' + JSON.stringify(esperado) + ')'));\n}\nconst raiz = path.join(__dirname, '..');\nconst leer = (r) => leerTexto(path.join(raiz, r));\nconst sb = {}; vm.createContext(sb); vm.runInContext(leer('sitios/comun/puro.js'), sb);\nconst P = sb.FabricaPuro;\nconst PAGINAS = ['str-marco-trabajo', 'str-instrucciones', 'str-cobit'];\nconst html = Object.fromEntries(PAGINAS.map((p) => [p, leer('sitios/fabrica/str/' + p + '.html')]));\nconst fab = leer('sitios/fabrica/fabrica.js'), cli = leer('sitios/comun/paginas.js');\n\n// ── T1: las copias del STR ──\neq('T1: cada página trae <script src=\"str-api.js?v=p5c113\"></script> una sola vez', PAGINAS.map((p) => html[p].split(P.STR_API_TAG).length - 1), [1, 1, 1]);\nconst USO = ['requireSession', 'user', 'rutaInicio', 'docs', 'docs.commit', 'docs.url', 'docs.encabezado']; // «docs» suelto: los comentarios «(STRApi.docs)»\neq('T1: de STRApi solo usan requireSession, user, rutaInicio y docs.commit/url/encabezado', PAGINAS.map((p) => [...new Set([...html[p].matchAll(/STRApi\\.((?:docs\\.)?[A-Za-z]+)/g)].map((m) => m[1]))].filter((x) => !USO.includes(x))), [[], [], []]);\neq('T1: su único fetch es el de STRApi.docs.url (los datos de la página)', PAGINAS.map((p) => [...html[p].matchAll(/fetch\\(([^,)]*)/g)].map((m) => m[1].trim())), [['STRApi.docs.url(PLANO_RUTA'], ['STRApi.docs.url(PLANO_RUTA'], ['STRApi.docs.url(PLANO_RUTA']]);\neq('T1: sin otros scripts externos ni XMLHttpRequest, WebSocket o postMessage', PAGINAS.map((p) => (html[p].match(/<script[^>]+src=/g) || []).length === 1 && !/XMLHttpRequest|WebSocket|postMessage|sendBeacon|EventSource/.test(html[p])), [true, true, true]);\n\n// ── T2: paginaStr ──\nconst V = { texto: 'Datos de 2946747 · cargados el 2026-10-30 09:00 (Bogotá)', sha: '2946747aaaabbbbccccddddeeeeffff0000111122' };\nconst base = '<html><head><title>t</title></head><body><p id=\"x\"></p>' + P.STR_API_TAG + '<script>var y = 1;</script></body></html>';\nconst r = P.paginaStr({ html: base, datos: { titulo: 'a' }, version: V });\neq('T2: cambia solo la etiqueta de str-api.js (lo de antes y lo de después, igual)', [r.startsWith(base.split(P.STR_API_TAG)[0] + '<script>(function adaptadorStr(D) {'), r.endsWith('</script><script>var y = 1;</script></body></html>'), r.includes('str-api.js')], [true, true, false]);\neq('T2: sin la etiqueta, con dos, sin datos o con datos que no son objeto → null', [P.paginaStr({ html: '<p></p>', datos: {} }), P.paginaStr({ html: P.STR_API_TAG + P.STR_API_TAG, datos: {} }), P.paginaStr({ html: base }), P.paginaStr({ html: base, datos: [1] }), P.paginaStr(null)], [null, null, null, null, null]);\nconst trampa = { titulo: 'X</script><script>alert(1)</script><!-- y \\u2028 z', items: ['</SCRIPT>', '<b>'] };\nconst rt = P.paginaStr({ html: base, datos: trampa, version: V });\nconst iny = rt.slice(rt.indexOf('<script>(function adaptadorStr'), rt.indexOf('</script><script>var y'));\neq('T2: los datos no cierran el script: dentro del adaptador no hay «<» de los datos ni separadores de línea crudos', [/<\\/?script|<!--|<b>/i.test(iny.slice(8)), /[\\u2028\\u2029]/.test(iny), (rt.match(/<\\/script>/gi) || []).length], [false, false, 2]);\nconst json = /\\)\\((\\{[\\s\\S]*\\})\\);$/.exec(iny)[1];\neq('T2: y llegan intactos (el JSON del adaptador devuelve el texto adrede tal cual)', JSON.parse(json).datos, trampa);\neq('T2: la versión va como texto y sha', [JSON.parse(json).texto, JSON.parse(json).sha], [V.texto, V.sha]);\n\n// ── T3: el adaptador ──\nconst fuente = P.adaptadorStr.toString();\neq('T3: el adaptador no toca red, token, almacenamiento ni la página de afuera', /parent|top\\b|opener|localStorage|sessionStorage|cookie|indexedDB|postMessage|XMLHttpRequest|WebSocket|import|eval|Function\\(|Authorization|getIdToken|location/.test(fuente), false);\nasync function correr(datos) {\n  const w = { Response, Promise, String, JSON, TypeError };\n  w.window = w; vm.createContext(w);\n  vm.runInContext('(' + fuente + ')(' + JSON.stringify({ datos, texto: V.texto, sha: V.sha }) + ');', w);\n  const S = w.STRApi;\n  const commit = await S.docs.commit({ forzar: true });\n  const url = S.docs.url('interno/marco-trabajo.json', commit);\n  const leido = await (await w.fetch(url, { cache: 'no-store' })).json();\n  const ajenas = [];\n  for (const u of ['/modelo/api/salud', 'https://raw.githubusercontent.com/thcure/str-manager-docs/main/interno/x.json', 'https://herramienta-fabrica.apartamentosbucaramanga.com/modelo/api/estado']) {\n    ajenas.push(await w.fetch(u).then(() => 'respondió', (e) => e instanceof w.TypeError || e.name === 'TypeError' ? 'rechazada' : 'otro error'));\n  }\n  return { sesion: S.requireSession('str-marco-trabajo.html'), rol: S.user().user.rol, commit, encabezado: S.docs.encabezado(commit), leido, ajenas, claves: Object.keys(S).sort(), docs: Object.keys(S.docs).sort() };\n}\n(async () => {\n  const x = await correr({ pasos: [{ codigo: 'P1' }], notas: ['n'] });\n  eq('T3: STRApi con lo que usan las páginas y nada más', [x.claves, x.docs], [['docs', 'requireSession', 'rutaInicio', 'user'], ['commit', 'encabezado', 'url']]);\n  eq('T3: sesión y rol de admin (el permiso ya lo dio el servicio a la sesión del sitio, RT-14)', [x.sesion, x.rol], [true, 'admin']);\n  eq('T3: la versión de los datos en el encabezado', [x.commit, x.encabezado], [{ sha: V.sha }, V.texto]);\n  eq('T3: fetch de la URL interna → los datos de la página', x.leido, { pasos: [{ codigo: 'P1' }], notas: ['n'] });\n  eq('T3: fetch de cualquier otra URL → rechazado, sin red', x.ajenas, ['rechazada', 'rechazada', 'rechazada']);\n})().catch((e) => { fail++; console.log('FAIL T3: ' + String(e && e.message || e)); }).finally(() => {\n  // ── T4: datosArchivo ──\n  const filas = [{ archivo: 'fabrica/marco-trabajo', clave: 'pasos', orden: 4, valor: [1] }, { archivo: 'fabrica/marco-trabajo', clave: 'version', orden: 0, valor: 1 }, { clave: 'titulo', orden: 2, valor: 't' }, null, { orden: 9, valor: 'sin clave' }];\n  eq('T4: datosArchivo: {clave: valor} en su orden; ignora filas sin clave', [Object.keys(P.datosArchivo(filas)), P.datosArchivo(filas)], [['version', 'titulo', 'pasos'], { version: 1, titulo: 't', pasos: [1] }]);\n  eq('T4: sin filas → objeto vacío', [P.datosArchivo(null), P.datosArchivo([])], [{}, {}]);\n\n  // ── T5: la Fábrica las ofrece ──\n  const lista = (/const PAGINAS_STR = \\[([\\s\\S]*?)\\n\\];/.exec(fab) || [])[1] || '';\n  eq('T5: Marco e Instrucciones en Modelo de trabajo, COBIT en Gobierno, cada una con su archivo del servicio', [...lista.matchAll(/\\['(\\w+)', '([^']+)', '([^']+)'/g)].map((m) => m.slice(1).join(' ')), ['modelo fabrica/marco-trabajo str-marco-trabajo', 'modelo fabrica/instrucciones str-instrucciones', 'gobierno fabrica/cobit str-cobit']);\n  eq('T5: los datos son las filas ya leídas (sin lecturas nuevas al servicio) y la página se lee del propio sitio al abrirla', [fab.includes('P.datosArchivo(grupos[archivo])'), fab.includes(\"fetch('/sitios/fabrica/str/' + pagina + '.html', { cache: 'no-cache', credentials: 'omit' })\"), (fab.match(/fetch\\(/g) || []).length, [...fab.matchAll(/leer\\('([^']+)'\\)/g)].length], [true, true, 1, 0]);\n  eq('T5: la página va al visor por ofrecerHtml (mismo iframe sandbox de L-174, sin allow-same-origin)', [fab.includes('ofrecerHtml(c, pagina, titulo, async () => {'), cli.includes('export function ofrecerHtml(cont, nombre, titulo, armar)'), /mostrarHtml\\(cont, html, titulo, nombre\\);\\s*\\} catch/.test(cli), (cli.match(/setAttribute\\('sandbox'/g) || []).length, /allow-same-origin|allow-top-navigation/.test(cli.replace(/^\\/\\/.*$/gm, ''))], [true, true, true, 1, false]);\n  eq('T5: los botones van arriba de cada parte; las tablas de siempre se quedan debajo', [fab.includes('cuerpo.insertBefore(arriba[parte], cuerpo.firstChild)'), fab.includes(\"document.querySelector('#' + parte + ' .cuerpo').innerHTML = nombres.length\")], [true, true]);\n  console.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);\n  process.exit(fail ? 1 : 0);\n});\n"}, {"tipo": "par", "ruta": "docs/claude/modelo.md", "busca": "- Lo vigila además el guion \u0060tests/e2e/INC-214.spec.js\u0060 del STR.\n", "pon": "- Lo vigila además el guion \u0060tests/e2e/INC-214.spec.js\u0060 del STR.\n\n## Páginas del STR en la Fábrica (LM-79 fase 5.5, L-179; regla 8 del contrato)\n- **Qué:** Marco de trabajo, Instrucciones (Modelo de trabajo) y COBIT (Gobierno) se ven iguales que en el STR, encima de las tablas de siempre. Los html están en \u0060sitios/fabrica/str/\u0060, copiados byte a byte de str-manager \u006073d5aa9~1\u0060 (el lote comprobó el hash de git de cada uno contra ese commit): no se editan aquí.\n- **Cómo:** al pulsar «Abrir …» el sitio lee el html del propio origen, \u0060paginaStr\u0060 (\u0060puro.js\u0060) cambia su \u0060<script src=\"str-api.js?v=p5c113\"></script>\u0060 por el adaptador con los datos dentro (escapados: \u0060<\u0060 como \u0060\\u003c\u0060) y \u0060ofrecerHtml\u0060 (\u0060paginas.js\u0060) lo pasa al visor aislado de L-174. El adaptador (\u0060adaptadorStr\u0060) da a la página solo \u0060STRApi.requireSession\u0060, \u0060user\u0060, \u0060rutaInicio\u0060 y \u0060docs.commit/url/encabezado\u0060, y un \u0060fetch\u0060 que responde solo la URL interna de los datos; cualquier otra se rechaza. Ni token, ni red, ni acceso a la página de afuera.\n- **Datos:** \u0060datosArchivo\u0060 rearma el JSON de la página con las filas que la Fábrica ya leyó (\u0060fabrica/marco-trabajo\u0060, \u0060fabrica/instrucciones\u0060, \u0060fabrica/cobit\u0060): ninguna lectura nueva al servicio (RT-19).\n- **En el visor:** sin almacenamiento, la página arranca con su tema oscuro y COBIT en su primera pestaña; «Copiar» de Instrucciones puede quedar en seleccionar el texto.\n- Lo vigilan \u0060tests/sitios-str.test.js\u0060 (T1–T5) y el guion \u0060tests/e2e/LM-79-paridad-a.spec.js\u0060 del STR.\n"}];
const HASHES = {"docs/claude/modelo.md": "50da294686141834ada7ad5068a2d69382fdf192", "sitios/comun/estilo.css": "384284e09f4c70e712ae468e62d088dbe4325330", "sitios/comun/paginas.js": "6a3808757f1f4167b065e0e4f8e4503276cad669", "sitios/comun/puro.js": "34b0a31235d51ab04e2d80eaa249ae3887097577", "sitios/fabrica/fabrica.js": "670e8e531884cbb5fbb6fab09a3f75b516c7ba53", "tests/sitios-str.test.js": "19dcf34b89cc6288d5cb16d4c7c0e3eb6a3a7a96"};
const mem = {}; let mal = 0;
const leer = (r) => { if (!(r in mem)) mem[r] = fs.existsSync(path.join(H, r)) ? fs.readFileSync(path.join(H, r), 'utf8').replace(/\r\n/g, '\n') : null; return mem[r]; };
OPS.forEach((o, i) => {
  const t = leer(o.ruta);
  if (o.tipo === 'nuevo') { if (t !== null) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': ya existe'); } else mem[o.ruta] = o.texto; return; }
  if (t === null) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': no existe'); return; }
  const n = t.split(o.busca).length - 1;
  if (n !== 1) { mal++; console.log('FAIL ' + (i + 1) + ' ' + o.ruta + ': «busca» aparece ' + n + ' veces'); return; }
  mem[o.ruta] = t.replace(o.busca, () => o.pon);
});
if (mal) { console.log('No escribí nada: ' + mal + ' fallo(s).'); process.exit(1); }
for (const r of Object.keys(mem)) { fs.mkdirSync(path.dirname(path.join(H, r)), { recursive: true }); fs.writeFileSync(path.join(H, r), mem[r]); }
for (const [r, esp] of Object.entries(HASHES)) {
  const real = execFileSync('git', ['-C', H, 'hash-object', r], { encoding: 'utf8' }).trim();
  if (real !== esp) mal++;
  console.log((real === esp ? 'OK   ' : 'FAIL ') + r + ' ' + real + (real === esp ? '' : ' (esperado ' + esp + ')'));
}
console.log(mal ? 'Hash distinto en ' + mal + ' archivo(s).' : 'Todo igual: ' + Object.keys(HASHES).length + ' archivos.');
process.exit(mal ? 1 : 0);
```
```bash
H=/c/Users/ktcol/fabrica-servicio-l179
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
A=73d5aa905bb9567707cf76342b17623f0387cdfd~1
mkdir -p "$H/sitios/fabrica/str"
for p in str-marco-trabajo str-instrucciones str-cobit; do
  test ! -e "$H/sitios/fabrica/str/$p.html" || { echo "ya existe $p.html: para"; exit 1; }
  git show "$A:$p.html" > "$H/sitios/fabrica/str/$p.html" || { echo "no pude sacar $p.html de 73d5aa9~1: para"; exit 1; }
  test "$(git -C "$H" hash-object "sitios/fabrica/str/$p.html")" = "$(git rev-parse "$A:$p.html")" || { echo "$p.html distinto de 73d5aa9~1: para"; exit 1; }
  echo "copia igual a 73d5aa9~1: $p.html $(git rev-parse "$A:$p.html")"
done
node /c/Users/ktcol/aplicar-l179.js "$H"
git -C "$H" status --short
node "$H/tests/run.js"      # 11/11 archivos OK
```
Para (§ 0) si alguna copia no da «copia igual a 73d5aa9~1», si el script no termina en «Todo igual: 6 archivos.» o si `run.js` no da 11/11. `status --short` debe listar los cinco archivos modificados, `?? sitios/fabrica/str/` y `?? tests/sitios-str.test.js`, y nada más.

## A3. Commit y push del repo nuevo
```bash
H=/c/Users/ktcol/fabrica-servicio-l179
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
git -C "$H" add -A
git -C "$H" commit -m "fabrica-servicio: Marco de trabajo, Instrucciones y COBIT del STR, iguales, en el visor de la Fábrica (LM-79 5.5 A)" -m "Lote: L-179 · LM-79 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push falla: **para** sin B y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre `git -C /c/Users/ktcol/fabrica-servicio-l179 push origin main` y el lote se repite solo desde B. Borra `C:\Users\ktcol\aplicar-l179.js` al terminar A3.

## B1. `docs/claude/modelo.md` (puntero; cada «Busca» aparece una sola vez)
**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-178 · dueño: MOD
```
Pon:
```md
Al día hasta L-179 · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
y que sin respuesta en la lectura de prueba no muestra nada y dice «sin respuesta».
```
Pon:
```md
y que sin respuesta en la lectura de prueba no muestra nada y dice «sin respuesta». `tests/e2e/LM-79-paridad-a.spec.js` (L-179, fase 5.5) comprueba que Marco de trabajo, Instrucciones y COBIT se ven en herramienta-fabrica. como en el STR (mismos conteos y un dato de muestra que el servicio), dentro del visor aislado, sin acceso afuera, con un fetch ajeno rechazado y sin correos ni teléfonos.
```

## B2. Guion nuevo
Copia el bloque de *Guion N2* a `tests/e2e/LM-79-paridad-a.spec.js` sin cambiar nada; no lo corras. `node tests/run.js` en verde (84/84: el lote no añade tests en str-manager; `e2e-esquema` carga el guion nuevo).

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

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): la vía con `X-Modelo-Token` no cambia. El inicio con Google lo ejercen c–f con h.entrarSitio.

## Pruebas derivadas (juez; verificador crítico)
```
- a. fabrica-servicio trae las tres copias del STR, el adaptador y sus tests en verde · nivel: N1 · perfil: verificación cruzada del Arquitecto (fuera del juez) · precondición: ninguna · tec: escenario · espera: en el cierre, A2 con las tres «copia igual a 73d5aa9~1», «Todo igual: 6 archivos.» y run.js 11/11 (sitios-str T1–T5, sitios-visor V1–V4), A3 con ls-remote igual al HEAD de la hermana · **Detener**
- c. Marco de trabajo como en el STR, en Modelo de trabajo: tantas filas como pasos del servicio, el primer paso y el subtítulo iguales (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: escenario · espera: caso c del guion en verde · **Revertir**
- d. Instrucciones como en el STR, en Modelo de trabajo: tantas como el servicio y con sus mismos títulos · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: escenario · espera: caso d del guion en verde · **Revertir**
- e. COBIT como en el STR, en Gobierno: una tarjeta por objetivo del servicio y la ficha del primero al pulsarlo · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: escenario · espera: caso e del guion en verde · **Revertir**
- f. Las tres páginas quedan aisladas: sandbox «allow-scripts allow-popups» (sin allow-same-origin), origen opaco, sin acceso afuera ni al almacenamiento, un fetch ajeno (/modelo/api/salud) rechazado por el adaptador, ningún bloqueo de la CSP y ni correos ni teléfonos en su texto (RT-14, RT-18) · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado y servicio cargado con ins-005 sin el correo real (M-1253) · tec: decisión · espera: caso f del guion en verde · **Revertir**
- g. str-manager solo suma el guion y la nota, y sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (D1, D2); la cola compara el guion · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Sin letra b: las letras siguen las de los casos del guion (c–f); a y g no tienen caso.
- Resultado esperado del juez: «parcial», con a en criteriosPendientes; la cierra el Arquitecto por evidencia cruzada.
```

### Guion N2 → `tests/e2e/LM-79-paridad-a.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// LM-79 fase 5.5 A (L-179, regla 8 del contrato): Marco de trabajo, Instrucciones y COBIT del STR se ven iguales en
// herramienta-fabrica., dentro del visor aislado (iframe sandbox «allow-scripts allow-popups», sin allow-same-origin). Cada
// página muestra lo mismo que el servicio tiene para ella (un dato de muestra y el conteo) y su adaptador no deja salir nada:
// cualquier fetch que no sea el de sus datos se rechaza. Solo lectura: lee el DOM y, dentro del visor, prueba un fetch ajeno.
const FAB = 'https://herramienta-fabrica.apartamentosbucaramanga.com';

function vigilarCsp(p) {
  const vistos = [];
  p.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to (load|execute|connect|frame|apply)/i.test(t) && !/Report Only/i.test(t)) vistos.push(t.slice(0, 160)); });
  return vistos;
}
// JSON de la página según el servicio: {clave: valor} de las filas del archivo, en su orden
async function datosDe(h, archivo) {
  const r = await h.leerModelo('complemento?archivo=' + archivo);
  if (!r || r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) return null;
  const o = {};
  r.cuerpo.filas.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0)).forEach((f) => { o[f.clave] = f.valor; });
  return o;
}
// Pulsa «Abrir …» de la página y espera su visor y la página de adentro con el selector dado (hasta 25 s)
async function abrir(h, pagina, selector) {
  const p = h.page;
  await p.click('.abrir-pagina-str[data-pagina="' + pagina + '"]', { timeout: 15000 });
  let interno = null, n = 0;
  for (let i = 0; i < 50 && !n; i++) {
    await p.waitForTimeout(500);
    const el = await p.$('.pagina-str iframe.visor[data-pagina="' + pagina + '"]');
    const visor = el ? await el.contentFrame() : null;
    interno = visor ? visor.childFrames()[0] || null : null;
    n = interno ? await interno.evaluate((s) => document.querySelectorAll(s).length, selector).catch(() => 0) : 0;
  }
  const sandbox = await p.evaluate((pg) => { const f = document.querySelector('.pagina-str iframe.visor[data-pagina="' + pg + '"]'); return f ? f.getAttribute('sandbox') : null; }, pagina).catch(() => null);
  return { interno, n, sandbox };
}
async function entrar(h) {
  const r = await h.entrarSitio(FAB + '/');
  h.espera(r.ok && r.estado === 'lista', 'entrar a la Fábrica como admin → ' + r.observado);
  return r.estado === 'lista';
}

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Marco de trabajo como en el STR, en Modelo de trabajo: tantas filas como pasos tiene el servicio, el primer paso y el subtítulo iguales',
      async prueba(h) {
        const d = await datosDe(h, 'fabrica/marco-trabajo');
        h.espera(!!d && Array.isArray(d.pasos) && d.pasos.length > 0, 'marco de trabajo en el servicio: ' + (d && Array.isArray(d.pasos) ? d.pasos.length + ' pasos' : 'sin datos'));
        if (!d || !(await entrar(h))) return;
        const en = await h.page.$eval('.abrir-pagina-str[data-pagina="str-marco-trabajo"]', (b) => b.closest('section').id).catch(() => null);
        h.espera(en === 'modelo', 'botón en la parte: ' + en);
        const a = await abrir(h, 'str-marco-trabajo', 'table.marco tbody tr');
        const v = a.interno ? await a.interno.evaluate(() => ({ titulo: document.title, sub: (document.getElementById('subtitulo') || {}).textContent || '', primero: (document.querySelector('table.marco tbody tr .paso-cod') || {}).textContent || '' })).catch(() => null) : null;
        h.espera(a.n === d.pasos.length, 'filas del marco: ' + a.n + ' de ' + d.pasos.length);
        h.espera(!!v && /Marco de Trabajo/.test(v.titulo) && v.sub === (d.titulo || '') && v.primero === String(d.pasos[0].codigo || ''), 'página «' + (v && v.titulo) + '» · subtítulo «' + (v && v.sub) + '» · primer paso ' + (v && v.primero) + ' (servicio: ' + d.pasos[0].codigo + ')');
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Instrucciones como en el STR, en Modelo de trabajo: tantas como el servicio y con sus mismos títulos',
      async prueba(h) {
        const d = await datosDe(h, 'fabrica/instrucciones');
        h.espera(!!d && Array.isArray(d.items) && d.items.length > 0, 'instrucciones en el servicio: ' + (d && Array.isArray(d.items) ? d.items.length : 'sin datos'));
        if (!d || !(await entrar(h))) return;
        const a = await abrir(h, 'str-instrucciones', 'article.ins');
        // la página las ordena a su manera: se comparan los títulos como conjunto
        const vistos = a.interno ? await a.interno.evaluate(() => [...document.querySelectorAll('article.ins .ins-titulo')].map((x) => x.textContent)).catch(() => []) : [];
        const faltan = d.items.map((x) => String(x.titulo || '')).filter((x) => !vistos.includes(x));
        h.espera(a.n === d.items.length && faltan.length === 0, 'instrucciones: ' + a.n + ' de ' + d.items.length + ' · títulos del servicio que no se ven: ' + (faltan.map((x) => x.slice(0, 40)).join(' | ') || 'ninguno'));
      },
    },
    {
      c: 'e', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'COBIT como en el STR, en Gobierno: una tarjeta por objetivo del servicio, y al pulsar la primera se abre su ficha',
      async prueba(h) {
        const d = await datosDe(h, 'fabrica/cobit');
        h.espera(!!d && Array.isArray(d.objetivos) && d.objetivos.length > 0, 'objetivos COBIT en el servicio: ' + (d && Array.isArray(d.objetivos) ? d.objetivos.length : 'sin datos'));
        if (!d || !(await entrar(h))) return;
        const en = await h.page.$eval('.abrir-pagina-str[data-pagina="str-cobit"]', (b) => b.closest('section').id).catch(() => null);
        const a = await abrir(h, 'str-cobit', 'button.card[data-cod]');
        h.espera(en === 'gobierno' && a.n === d.objetivos.length, 'botón en ' + en + ' · tarjetas: ' + a.n + ' de ' + d.objetivos.length);
        if (!a.interno) return;
        const cod = await a.interno.evaluate(() => (document.querySelector('button.card[data-cod]') || {}).dataset.cod || '').catch(() => '');
        await a.interno.click('button.card[data-cod="' + cod + '"]').catch(() => {});
        await h.page.waitForTimeout(500);
        const ficha = await a.interno.evaluate(() => { const x = document.getElementById('panel'); return x && !x.hidden ? (x.querySelector('.p-cod') || {}).textContent || '' : ''; }).catch(() => '');
        h.espera(!!cod && ficha.startsWith(cod + ' · '), 'ficha de ' + cod + ': «' + ficha.slice(0, 60) + '»');
      },
    },
    {
      c: 'f', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-14', 'RT-18'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Las tres páginas quedan aisladas: iframe sin allow-same-origin, origen opaco, sin acceso a la página de afuera ni a su almacenamiento, un fetch ajeno (/modelo/api/salud) rechazado, ningún bloqueo de la CSP y, en su texto, ni correos ni teléfonos',
      async prueba(h) {
        const csp = vigilarCsp(h.page);
        if (!(await entrar(h))) return;
        for (const [pagina, sel] of [['str-marco-trabajo', 'table.marco tbody tr'], ['str-instrucciones', 'article.ins'], ['str-cobit', 'button.card[data-cod]']]) {
          const a = await abrir(h, pagina, sel);
          h.espera(a.sandbox === 'allow-scripts allow-popups', pagina + ' · sandbox del visor: ' + a.sandbox);
          if (!a.interno) { h.espera(false, pagina + ': no se abrió'); continue; }
          const v = await a.interno.evaluate(async () => ({
            origen: self.origin,
            padre: (() => { try { return typeof parent.document; } catch (e) { return 'aislado'; } })(),
            almacen: (() => { try { return typeof localStorage.length; } catch (e) { return 'sin acceso'; } })(),
            ajeno: await fetch('/modelo/api/salud').then(() => 'respondió', (e) => 'rechazado'),
            texto: document.body.innerText,
          })).catch(() => null);
          const correos = v ? v.texto.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) || [] : ['?'];
          const tels = v ? v.texto.match(/(\+57\s?)?(?<!\d)3\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g) || [] : ['?'];
          h.espera(!!v && v.origen === 'null' && v.padre === 'aislado' && v.almacen === 'sin acceso' && v.ajeno === 'rechazado', pagina + ' · origen ' + (v && v.origen) + ' · afuera ' + (v && v.padre) + ' · almacenamiento ' + (v && v.almacen) + ' · fetch ajeno ' + (v && v.ajeno));
          h.espera(correos.length === 0 && tels.length === 0, pagina + ' · correos: ' + correos.length + ' · teléfonos: ' + tels.length);
        }
        h.espera(csp.length === 0, 'bloqueos de la CSP en la consola: ' + (csp.join(' | ') || 'ninguno'));
      },
    },
  ],
};
```

## B3. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por paso, declarados vs tocados, el hash de main de fabrica-servicio) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-179 · LM-79 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (A1–A3, B1–B3) · salidas de A2 (las tres líneas «copia igual a 73d5aa9~1», las seis líneas de hash, `status --short`, run.js con las líneas de modelo-google parte B y de modelo-lectura F3: cada una «OMITIDA» o en verde) y A3 (ls-remote) tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y de main de fabrica-servicio · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
