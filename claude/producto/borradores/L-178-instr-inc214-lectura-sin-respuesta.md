# instr — L-178 · INC-214 (LM-79 fase 5, ajuste): proyectos. ya no corta la carga cuando una lectura del servicio no tiene respuesta — leer() devuelve «sin respuesta» (status 0) en vez de lanzar, y dos correcciones de documentación del STR
Categoría: **crítico** (toca la lectura del servicio en los dos sitios de la fábrica; DA: LM-79 · cruce previo con Carlos: PENDIENTE (lo da el Arquitecto por delegación: dentro del plan, sin secretos ni roles nuevos, M-1176))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · AAAA-MM-DD HH:MM
Decisión: ADR-009 (v5, § 4b y 4c, aceptada; contrato de la fase 5) y DA: LM-79; INC-214 con decisión «lote: ajuste después de 5.3, aceptado antes de 5.4» (JP, M-1221)
Alcance: en str-manager, `tests/e2e/INC-214.spec.js` (nuevo) · `docs/claude/modelo.md` (puntero) · `docs/claude/tests-y-despliegue.md` (encabezado y una frase) · en la carpeta hermana C:\Users\ktcol\fabrica-servicio-l178 (clon de fabrica-servicio, **no** es str-manager), con el script de A2: sitios/comun/sesion.js, sitios/comun/puro.js, sitios/comun/paginas.js, sitios/proyectos/proyectos.js, sitios/proyectos/vistas.js, sitios/fabrica/fabrica.js, tests/sitios-comun.test.js, tests/sitios-proyectos.test.js y docs/claude/modelo.md · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques nada más de str-manager
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Origen: INC-214 (M-1219, Arquitecto 22:50: a las 22:47, mientras el servicio cargaba datos, la 8.ª lectura de proyectos. dio 503 sin cabecera CORS, fetch lanzó y la carga se cortó: 8 lecturas de 17, sesión «error», solo el portafolio y ningún aviso); M-1221 (JP: ajuste después de 5.3, aceptado antes de 5.4); M-1236 y M-1238 (dos notas de documentación que dejó la CLI en L-177). Requerimiento: INC-214 en `interno/seguimiento.json`
Impacto: si una lectura del servicio no llega a tener respuesta (red caída, o el hosting responde 503 sin CORS mientras el servicio carga datos), proyectos. ya no se queda a medias: pinta todo, la parte que usa esa lectura dice «No se pudo leer: <qué> (sin respuesta)» y la sesión queda en «error» con el motivo, igual que con un HTTP de error desde L-176. Si la que no responde es la lectura de prueba de la sesión, el sitio dice «No se pudo leer el servicio (sin respuesta).» en vez del error del navegador. La Fábrica y el visor de páginas dicen «sin respuesta» en el mismo caso (la Fábrica sigue sin pintar sus partes si falla una lectura: no cambia aquí). Nada cambia cuando el servicio responde. En el STR solo cambian dos documentos y entra un guion; nada para el usuario del STR.
Reglas transversales que toca: RT-14 (el permiso lo sigue decidiendo el servicio: «sin respuesta» nunca es «lista» ni «denegada») · RT-19 (sin lecturas nuevas: las mismas 17 en serie por visita; una sin respuesta no se repite) · RT-18 (nada guarda el token; el guion corta la lectura solo en el navegador del perfil de prueba)
Mapa: módulos y relaciones que cambia: MOD (lectura de los sitios con el servicio: sitios/comun/sesion.js); ninguna relación nueva ni del STR
Casos de uso: CU-MOD-3.1
Riesgo: bajo (R-1 del lote; MOD tiene riesgo 1, no hace falta R-n): un `try/catch` en la lectura y un texto. Puede salir mal: que un error del programa (no de la red) quede tapado como «sin respuesta» (no: solo se atrapa lo que lanza `fetch`/`getIdToken` dentro de la petición; una ruta no válida sigue lanzando, S4); que algún guion espere el texto «HTTP 0» (ninguno: lo buscan por «HTTP 4xx/5xx» o por la marca). Conexiones a MySQL (RT-19): las mismas 17 en serie. Sin limpieza manual: no retira nada.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (arreglo de un lote del modelo LM-79, DA: LM-79 y cruce delegado)
Reversión: fabrica-servicio: `git revert` del commit de A3 (vuelve L-176: una lectura sin respuesta corta la carga otra vez; pasajero, sin exposición). str-manager: `git revert <hash>` (el guion y los dos documentos).
Depende de: L-176 aceptado (fabrica-servicio 03ee336, desplegado) y L-177 aceptado (73d5aa9) · Precondiciones para verificar: perfil zz-verif-admin (en MODELO_ADMIN_UIDS); sin datos que crear
¿Quién más depende de lo que cambia?: LM-79-proyectos, LM-79-paginas, LM-79-sitios, LM-79-seguimiento e INC-213 siguen igual y no pierden sensibilidad: una lectura sin respuesta sigue dejando la sesión en «error» (ahora con la página pintada y el motivo «… (sin respuesta)»), así que sus casos se ponen rojos como antes. El ok de 5.4 (Carlos ve los sitios) espera a que este lote esté aceptado (JP, M-1221). La foto interno/arquitectura/guiones-e2e.json no trae aún los LM-79-* ni los INC-21x, por eso la ruta impresa no los lista aunque pw los corre (la actualiza el Arquitecto en la fase 6).

## 0. Contexto y reglas de este lote
- Dos partes, en este orden: **A** (A1–A3) en una carpeta hermana, clon de `thcure/fabrica-servicio`: aplicas con un script de Node el arreglo de la lectura de los sitios y sus tests, corres sus tests y lo subes. **B** (B1–B2) en str-manager: cuatro pares en dos documentos y el guion N2 nuevo. **Si A no termina en verde, no hagas B.**
- **La consola no guarda variables entre llamadas.** Cada bloque de A empieza con `H=/c/Users/ktcol/fabrica-servicio-l178` y su guardia: córrelo entero en una sola llamada. No hagas `cd` a la carpeta hermana. Nunca `push --force` ni reescribir historia.
- El script de A2 escribe los nueve archivos: **no los edites a mano** ni los reescribas. Si dice FAIL, para.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.
- En LENOVO hay `C:\php` (PHP 8.3) sin `openssl.cnf`: la parte B de `modelo-google.test.js` sale «OMITIDA» (INC-211); `modelo-lectura.test.js` F3 corre o sale «F3 OMITIDA» según traiga `pdo_sqlite`. Las dos cosas valen.

## A1. Clonar fabrica-servicio a la carpeta hermana
```bash
H=/c/Users/ktcol/fabrica-servicio-l178
test ! -e "$H" || { echo "ya existe $H: para"; exit 1; }
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || { echo "str-manager no está en main limpio: para"; exit 1; }
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || { echo "main local distinto de origin/main: para"; exit 1; }
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git clone --no-tags --single-branch --branch main https://github.com/thcure/fabrica-servicio.git "$H"
test "$(git -C "$H" rev-parse HEAD)" = 03ee33616f89ad8ecc37e69e3296497c9ab39b7f || { echo "fabrica-servicio no está en 03ee336: para"; exit 1; }
node "$H/tests/run.js"      # 10/10 antes de tocar nada
```

## A2. Aplicar los cambios con el script
Guarda el bloque siguiente como `aplicar-l178.js` en `C:\Users\ktcol\` (fuera de los dos repos; **no se commitea**) y córrelo. Primero valida todo en memoria (cada texto a cambiar aparece una sola vez); si algo no cuadra no escribe nada. Después escribe y compara el hash de git de los nueve archivos con el esperado: debe terminar en «Todo igual: 9 archivos.».
```js
// L-178 (INC-214): aplica en la carpeta hermana de fabrica-servicio la lectura sin respuesta (status 0) de los sitios y sus tests.
// Uso: node aplicar-l178.js <carpeta de fabrica-servicio>. Primero lo valida todo en memoria (cada «busca» aparece una
// sola vez; los archivos nuevos no existen); si algo no cuadra, no escribe nada y sale con 1. Después escribe (LF) y
// compara el hash de git de cada archivo con el esperado.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const H = process.argv[2];
if (!H || !fs.existsSync(path.join(H, '.git'))) { console.log('FAIL carpeta sin .git: ' + H); process.exit(1); }
const OPS = [{"tipo": "par", "ruta": "sitios/fabrica/fabrica.js", "busca": "    const r = await leer(ruta);\n    if (r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) throw new Error('complemento: HTTP ' + r.status);\n    filas = filas.concat(r.cuerpo.filas);", "pon": "    const r = await leer(ruta);\n    if (r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) throw new Error('complemento: ' + P.textoEstado(r.status));\n    filas = filas.concat(r.cuerpo.filas);"}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "    if (!fs.length) return '';\n    return '<p class=\"aviso-lectura\" data-fallas=\"' + fs.length + '\">No se pudo leer: ' + fs.map(function (x) { return esc(txt(x[0]) + ' (HTTP ' + txt(x[1]) + ')'); }).join(', ') + '. Lo demás de esta parte sí está.</p>';\n  }", "pon": "    if (!fs.length) return '';\n    return '<p class=\"aviso-lectura\" data-fallas=\"' + fs.length + '\">No se pudo leer: ' + fs.map(function (x) { return esc(txt(x[0]) + ' (' + (x[1] === 0 ? 'sin respuesta' : 'HTTP ' + txt(x[1])) + ')'); }).join(', ') + '. Lo demás de esta parte sí está.</p>';\n  }"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "// después la sesión queda en «error» con lo que falló (el contenido sigue a la vista), para que nada lo dé por bueno en silencio.\nimport { iniciarSitio } from '/sitios/comun/sesion.js';", "pon": "// después la sesión queda en «error» con lo que falló (el contenido sigue a la vista), para que nada lo dé por bueno en silencio.\n// L-178 (INC-214): también si la lectura no llega a tener respuesta (leer devuelve status 0: «sin respuesta»).\nimport { iniciarSitio } from '/sitios/comun/sesion.js';"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "function filasDe(r, que) {\n  if (r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) throw new Error(que + ': HTTP ' + r.status);\n  return r.cuerpo.filas;", "pon": "function filasDe(r, que) {\n  if (r.status !== 200 || !r.cuerpo || !Array.isArray(r.cuerpo.filas)) throw new Error(que + ': ' + P.textoEstado(r.status));\n  return r.cuerpo.filas;"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  };\n  // Una lectura tras otra: cada una abre una conexión a MySQL en la cuenta compartida (RT-19); nunca en paralelo\n  const d = {}, fallas = {};", "pon": "  };\n  // Una lectura tras otra: cada una abre una conexión a MySQL en la cuenta compartida (RT-19); nunca en paralelo.\n  // L-178 (INC-214): si una lectura lanza en vez de responder, cuenta como «sin respuesta» (status 0) y se sigue.\n  const leerUna = async (ruta) => { try { return await leer(ruta); } catch (e) { return { status: 0, cuerpo: null }; } };\n  const d = {}, fallas = {};"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  for (const k of Object.keys(rutas)) {\n    const r = await leer(rutas[k]);\n    if (r.status === 200 && r.cuerpo && Array.isArray(r.cuerpo.filas)) d[k] = r.cuerpo.filas;", "pon": "  for (const k of Object.keys(rutas)) {\n    const r = await leerUna(rutas[k]);\n    if (r.status === 200 && r.cuerpo && Array.isArray(r.cuerpo.filas)) d[k] = r.cuerpo.filas;"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  }\n  const est = await leer('estado');\n  if (!(est.status === 200 && est.cuerpo)) fallas.estado = est.status;", "pon": "  }\n  const est = await leerUna('estado');\n  if (!(est.status === 200 && est.cuerpo)) fallas.estado = est.status;"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  poner('proyectos', V.portafolio(portafolio, p.id));\n  return Object.keys(fallas).map((k) => NOMBRES[k] + ' (HTTP ' + fallas[k] + ')');\n}", "pon": "  poner('proyectos', V.portafolio(portafolio, p.id));\n  return Object.keys(fallas).map((k) => NOMBRES[k] + ' (' + P.textoEstado(fallas[k]) + ')');\n}"}, {"tipo": "par", "ruta": "sitios/comun/puro.js", "busca": "    return 'error';\n  }", "pon": "    return 'error';\n  }\n\n  // L-178 (INC-214): cómo se nombra el estado de una lectura en avisos y motivos: 0 (sin respuesta del servicio) o «HTTP n»\n  function textoEstado(status) {\n    return status === 0 ? 'sin respuesta' : 'HTTP ' + status;\n  }"}, {"tipo": "par", "ruta": "sitios/comun/puro.js", "busca": "\n  raiz.FabricaPuro = { SERVICIO: SERVICIO, esc: esc, urlServicio: urlServicio, estadoPorRespuesta: estadoPorRespuesta, versionTexto: versionTexto, md: md, valorHtml: valorHtml, porArchivo: porArchivo, paginaHtml: paginaHtml };\n})(typeof window !== 'undefined' ? window : this);", "pon": "\n  raiz.FabricaPuro = { SERVICIO: SERVICIO, esc: esc, urlServicio: urlServicio, estadoPorRespuesta: estadoPorRespuesta, textoEstado: textoEstado, versionTexto: versionTexto, md: md, valorHtml: valorHtml, porArchivo: porArchivo, paginaHtml: paginaHtml };\n})(typeof window !== 'undefined' ? window : this);"}, {"tipo": "par", "ruta": "sitios/comun/paginas.js", "busca": "  if (html === null) {\n    cont.innerHTML = '<p class=\"vacio\">' + P.esc(r.status === 200 ? 'Todavía no hay datos de esta página en el servicio.' : 'No se pudo leer la página (HTTP ' + r.status + ').') + '</p>';\n    return false;", "pon": "  if (html === null) {\n    cont.innerHTML = '<p class=\"vacio\">' + P.esc(r.status === 200 ? 'Todavía no hay datos de esta página en el servicio.' : 'No se pudo leer la página (' + P.textoEstado(r.status) + ').') + '</p>';\n    return false;"}, {"tipo": "par", "ruta": "sitios/comun/sesion.js", "busca": "// GET al servicio con el token de Google del usuario (Bearer). Un 401 reintenta una vez con el token renovado.\nasync function leer(ruta) {", "pon": "// GET al servicio con el token de Google del usuario (Bearer). Un 401 reintenta una vez con el token renovado.\n// L-178 (INC-214): si la petición no llega a tener respuesta (fetch lanza: red caída, o un 503 del hosting sin cabecera CORS\n// mientras el servicio carga datos), devuelve status 0 en vez de lanzar: quien lee lo trata como una lectura fallida más.\nasync function leer(ruta) {"}, {"tipo": "par", "ruta": "sitios/comun/sesion.js", "busca": "  };\n  let r = await pedir(false);\n  if (r.status === 401 && auth.currentUser) r = await pedir(true);\n  let cuerpo = null;", "pon": "  };\n  let r;\n  try {\n    r = await pedir(false);\n    if (r.status === 401 && auth.currentUser) r = await pedir(true);\n  } catch (e) { return { status: 0, cuerpo: null }; }\n  let cuerpo = null;"}, {"tipo": "par", "ruta": "sitios/comun/sesion.js", "busca": "      contenido.hidden = true; entrar.hidden = false; boton.hidden = true;\n      aviso.textContent = estado === 'denegada' ? 'Tu cuenta no tiene acceso a este sitio (solo administradores de la fábrica).' : 'No se pudo leer el servicio (HTTP ' + r.status + ').';\n      marcar(estado, estado === 'error' ? 'HTTP ' + r.status : null);\n      document.getElementById('salir').hidden = false;", "pon": "      contenido.hidden = true; entrar.hidden = false; boton.hidden = true;\n      aviso.textContent = estado === 'denegada' ? 'Tu cuenta no tiene acceso a este sitio (solo administradores de la fábrica).' : 'No se pudo leer el servicio (' + P.textoEstado(r.status) + ').';\n      marcar(estado, estado === 'error' ? P.textoEstado(r.status) : null);\n      document.getElementById('salir').hidden = false;"}, {"tipo": "par", "ruta": "tests/sitios-comun.test.js", "busca": "// token sin guardar). S3: la sección Fábrica lee solo del servicio y nada de los proyectos ni del negocio.\nconst fs = require('fs');", "pon": "// token sin guardar). S3: la sección Fábrica lee solo del servicio y nada de los proyectos ni del negocio.\n// S4 (L-178, INC-214): leer() de sesion.js, corrido en un vm: si fetch lanza (sin respuesta) devuelve status 0, no lanza.\nconst fs = require('fs');"}, {"tipo": "par", "ruta": "tests/sitios-comun.test.js", "busca": "\nconsole.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);\nprocess.exit(fail ? 1 : 0);\n", "pon": "\n// ── S4 (L-178, INC-214) ──\neq('S4: textoEstado: 0 → «sin respuesta»; otro → «HTTP n»', [0, 200, 403, 503].map(P.textoEstado), ['sin respuesta', 'HTTP 200', 'HTTP 403', 'HTTP 503']);\nconst fnLeer = (/async function leer\\(ruta\\) \\{[\\s\\S]*?\\n\\}/.exec(sesion) || [])[0] || '';\n// respuestas: lista de lo que hace cada fetch, en orden: 'lanza' o un status; usuario con token\nasync function correrLeer(respuestas) {\n  const pedidas = [];\n  const ctx = { P, auth: { currentUser: { getIdToken: async (f) => (f ? 'nuevo' : 'viejo') } }, fetch: async (url, op) => {\n    const x = respuestas[pedidas.length]; pedidas.push(op.headers.Authorization);\n    if (x === 'lanza') throw new TypeError('Failed to fetch');\n    return { status: x, json: async () => (x === 200 ? { filas: [] } : Promise.reject(new Error('sin json'))) };\n  } };\n  vm.createContext(ctx); vm.runInContext(fnLeer + '\\nglobalThis.__leer = leer;', ctx);\n  let r, lanzo = null;\n  try { r = await ctx.__leer('decision?limite=1'); } catch (e) { lanzo = String(e && e.message || e); }\n  return { r: r ? { status: r.status, cuerpo: r.cuerpo } : null, lanzo, pedidas };\n}\n(async () => {\n  eq('S4: fetch lanza → { status: 0, cuerpo: null } (no lanza)', await correrLeer(['lanza']), { r: { status: 0, cuerpo: null }, lanzo: null, pedidas: ['Bearer viejo'] });\n  eq('S4: 401 y el reintento lanza → status 0', await correrLeer([401, 'lanza']), { r: { status: 0, cuerpo: null }, lanzo: null, pedidas: ['Bearer viejo', 'Bearer nuevo'] });\n  eq('S4: 503 sin json → status 503, cuerpo null', await correrLeer([503]), { r: { status: 503, cuerpo: null }, lanzo: null, pedidas: ['Bearer viejo'] });\n  eq('S4: 401 y luego 200 → 200 con su cuerpo (un solo reintento, token renovado)', await correrLeer([401, 200]), { r: { status: 200, cuerpo: { filas: [] } }, lanzo: null, pedidas: ['Bearer viejo', 'Bearer nuevo'] });\n  eq('S4: una ruta no válida sigue lanzando (error del programa, no de la red)', (await correrLeer([200])).lanzo === null && /throw new Error\\('ruta no válida: ' \\+ ruta\\)/.test(fnLeer), true);\n  eq('S4: avisos y motivos de la sesión con textoEstado (sin «HTTP 0»)', [sesion.includes(\"'No se pudo leer el servicio (' + P.textoEstado(r.status) + ').'\"), sesion.includes(\"marcar(estado, estado === 'error' ? P.textoEstado(r.status) : null);\"), /'HTTP ' \\+/.test(sesion + fab + leer('sitios/comun/paginas.js'))], [true, true, false]);\n})().catch((e) => { fail++; console.log('FAIL S4: ' + String(e && e.message || e)); }).finally(() => {\n  console.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);\n  process.exit(fail ? 1 : 0);\n});\n"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "// P6 (L-176, INC-213): una lectura que falla no deja la página en blanco.\nconst path = require('path');", "pon": "// P6 (L-176, INC-213): una lectura que falla no deja la página en blanco.\n// P7 (L-178, INC-214): tampoco si la lectura no llega a tener respuesta (status 0, «sin respuesta»): se corre cargarProyecto.\nconst path = require('path');"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "const fnProy = (/async function cargarProyecto\\(leer, p\\) \\{([\\s\\S]*?)\\n\\}/.exec(js) || [])[1] || '';\neq('P6: cargarProyecto no corta en una lectura fallida (sin filasDe ni throw; guarda la falla, sigue y devuelve lo que falló)', [/filasDe\\(|throw /.test(fnProy) || !fnProy.includes(\"return Object.keys(fallas).map((k) => NOMBRES[k] + ' (HTTP ' + fallas[k] + ')');\"), fnProy.includes('else { d[k] = []; fallas[k] = r.status; }'), fnProy.includes('if (!(est.status === 200 && est.cuerpo)) fallas.estado = est.status;')], [false, true, true]);\nconst fnCargar = (/async function cargar\\(leer\\) \\{([\\s\\S]*?)\\n\\}/.exec(js) || [])[1] || '';", "pon": "const fnProy = (/async function cargarProyecto\\(leer, p\\) \\{([\\s\\S]*?)\\n\\}/.exec(js) || [])[1] || '';\neq('P6: cargarProyecto no corta en una lectura fallida (sin filasDe ni throw; guarda la falla, sigue y devuelve lo que falló)', [/filasDe\\(|throw /.test(fnProy) || !fnProy.includes(\"return Object.keys(fallas).map((k) => NOMBRES[k] + ' (' + P.textoEstado(fallas[k]) + ')');\"), fnProy.includes('else { d[k] = []; fallas[k] = r.status; }'), fnProy.includes('if (!(est.status === 200 && est.cuerpo)) fallas.estado = est.status;')], [false, true, true]);\nconst fnCargar = (/async function cargar\\(leer\\) \\{([\\s\\S]*?)\\n\\}/.exec(js) || [])[1] || '';"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "\nconsole.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);\nprocess.exit(fail ? 1 : 0);\n", "pon": "\n// ── P7 (L-178, INC-214) ──\neq('P7: avisoLectura nombra «sin respuesta» el status 0 y «HTTP n» los demás', V.avisoLectura([['incidentes', 0], ['plan del proyecto', 503]]), '<p class=\"aviso-lectura\" data-fallas=\"2\">No se pudo leer: incidentes (sin respuesta), plan del proyecto (HTTP 503). Lo demás de esta parte sí está.</p>');\n// cargarProyecto de verdad, en un vm con un documento mínimo: la 8.ª lectura (incidente) no tiene respuesta, como el 22:47 de INC-214\n// falla(ruta): 'lanza' (fetch sin respuesta, como antes de L-178), true (status 0, como leer de L-178) o false (200)\nasync function correrCargarProyecto(falla) {\n  const partes = {}, txt = {};\n  const el = (id) => ({ set innerHTML(v) { partes[id] = v; }, get innerHTML() { return partes[id] || ''; }, set textContent(v) { txt[id] = v; }, appendChild() { }, scrollIntoView() { } });\n  const leidas = [];\n  const leerFalso = async (ruta) => { leidas.push(ruta.split('?')[0] + (/archivo=/.test(ruta) ? ':' + /archivo=([^&]*)/.exec(ruta)[1] : '')); const f = falla(ruta); if (f === 'lanza') throw new TypeError('Failed to fetch'); return f ? { status: 0, cuerpo: null } : { status: 200, cuerpo: /^estado/.test(ruta) ? { proyecto: 'str' } : { filas: [] } }; };\n  const ctx = { document: { querySelector: (s) => el(s.split(' ')[0].slice(1)), getElementById: (id) => Object.assign(el(id), { addEventListener() { } }) }, console };\n  ctx.window = ctx; vm.createContext(ctx);\n  vm.runInContext(leer('sitios/comun/puro.js'), ctx); vm.runInContext(leer('sitios/proyectos/vistas.js'), ctx);\n  const src = js.replace(/^import .*$/gm, '').replace(/^iniciarSitio\\(.*$/m, '') + '\\nglobalThis.__cp = cargarProyecto;';\n  ctx.ofrecerPagina = () => { }; ctx.iniciarSitio = () => { };\n  vm.runInContext(src, ctx);\n  const fallas = await ctx.__cp(leerFalso, { id: 'P01', nombre: 'STR Manager', idServicio: 'str' });\n  return { fallas, partes, leidas };\n}\n(async () => {\n  const r = await correrCargarProyecto((ruta) => /^incidente\\?/.test(ruta) && 'lanza');\n  eq('P7: la lectura de incidentes lanza (sin respuesta): no corta, sigue con sus 14 lecturas en serie (13 tablas y estado) y devuelve «incidentes (sin respuesta)»', [r.leidas.length, r.fallas], [14, ['incidentes (sin respuesta)']]);\n  eq('P7: Construcción avisa «incidentes (sin respuesta)» y las demás partes se pintan sin aviso', [/aviso-lectura[^>]*>No se pudo leer: incidentes \\(sin respuesta\\)/.test(r.partes.construccion || ''), ['inicio', 'resumen', 'alcance', 'decisiones', 'buzon'].filter((x) => !r.partes[x] || /aviso-lectura/.test(r.partes[x])), ['pruebas', 'proyectos'].filter((x) => !r.partes[x])], [true, [], []]);\n  const t = await correrCargarProyecto(() => true);\n  eq('P7: si ninguna lectura responde, se pintan todas las partes con su aviso y devuelve las 14 fallas', [t.fallas.length, ['inicio', 'resumen', 'alcance', 'decisiones', 'construccion', 'buzon'].filter((x) => !/aviso-lectura/.test(t.partes[x] || ''))], [14, []]);\n  const s = await correrCargarProyecto(() => false);\n  eq('P7: con todo en 200, ninguna falla ni aviso', [s.fallas, Object.values(s.partes).some((x) => /aviso-lectura/.test(x))], [[], false]);\n})().catch((e) => { fail++; console.log('FAIL P7: cargarProyecto lanzó → ' + String(e && e.message || e)); }).finally(() => {\n  console.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);\n  process.exit(fail ? 1 : 0);\n});\n"}, {"tipo": "par", "ruta": "docs/claude/modelo.md", "busca": "- Lo vigila además el guion \u0060tests/e2e/INC-213.spec.js\u0060 del STR.\n", "pon": "- Lo vigila además el guion \u0060tests/e2e/INC-213.spec.js\u0060 del STR.\n\n## Arreglo de INC-214 (L-178)\n- **Lectura sin respuesta:** \u0060leer()\u0060 de \u0060sesion.js\u0060 ya no lanza cuando la petición no llega a tener respuesta (red caída, o un 503 del hosting sin cabecera CORS mientras el servicio carga datos): devuelve \u0060status: 0\u0060, y quien lee lo trata como una lectura fallida más (S4). \u0060cargarProyecto\u0060 además atrapa cualquier lectura que lance (P7).\n- **Cómo se nombra:** \u0060textoEstado\u0060 de \u0060puro.js\u0060 da «sin respuesta» para 0 y «HTTP n» para lo demás; lo usan los avisos de lectura, el motivo de la sesión, la Fábrica y el visor de páginas.\n- Lo vigila además el guion \u0060tests/e2e/INC-214.spec.js\u0060 del STR.\n"}];
const HASHES = {"docs/claude/modelo.md": "2e6321f446bd6713a3a90d46254da774b8f232a3", "sitios/comun/paginas.js": "56432ab3813d897f6f08bef7994bf404b38899c1", "sitios/comun/puro.js": "7ecc93000499a3349359ef6304eaf50d1a14dafe", "sitios/comun/sesion.js": "a811d4298f9568e1e0e40696a8ef0ace19070fc6", "sitios/fabrica/fabrica.js": "0a121aed18d4b397bb93becb797eb48e52ed1987", "sitios/proyectos/proyectos.js": "43c024a54d7fcaa67520a946b45e82d9369f9c7c", "sitios/proyectos/vistas.js": "033a20d6473a92801700f4f3c6437a45ddac42aa", "tests/sitios-comun.test.js": "32f425e32173bba8ac2ad1bef6c3f23fa6b594e1", "tests/sitios-proyectos.test.js": "116778c2ef23ea0d9cb7565134725269cd929254"};
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
H=/c/Users/ktcol/fabrica-servicio-l178
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
node /c/Users/ktcol/aplicar-l178.js "$H"
git -C "$H" status --short
node "$H/tests/run.js"      # 10/10 archivos OK
```
Para (§ 0) si el script no termina en «Todo igual: 9 archivos.» o si `run.js` no da 10/10. `status --short` debe listar solo los nueve archivos, todos modificados (ninguno nuevo).

## A3. Commit y push del repo nuevo
```bash
H=/c/Users/ktcol/fabrica-servicio-l178
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
git -C "$H" add -A
git -C "$H" commit -m "fabrica-servicio: una lectura sin respuesta del servicio ya no corta la carga de proyectos.; avisos con «sin respuesta» (INC-214)" -m "Lote: L-178 · INC-214 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push falla: **para** sin B y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre `git -C /c/Users/ktcol/fabrica-servicio-l178 push origin main` y el lote se repite solo desde B. Borra `C:\Users\ktcol\aplicar-l178.js` al terminar A3.

## B1. Documentos (cuatro pares, cada «Busca» aparece una sola vez)
**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-176 · dueño: MOD
```
Pon:
```md
Al día hasta L-178 · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
y que los JS y CSS de los sitios llegan sin caché larga.
```
Pon:
```md
y que los JS y CSS de los sitios llegan sin caché larga. `tests/e2e/INC-214.spec.js` (L-178) comprueba que, si una lectura del servicio no tiene respuesta (se simula solo en el navegador), proyectos. se pinta entero con el aviso de esa parte y la sesión queda en «error» con el motivo, y que sin respuesta en la lectura de prueba no muestra nada y dice «sin respuesta».
```

**D3 · cabecera** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
Al día hasta L-170 · dueño: tests/
```
Pon:
```md
Al día hasta L-178 · dueño: tests/
```

**D4 · número de guiones (L-177 dejó 56; un dato, una fuente)** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
(56 guiones con `LM-79-str`)
```
Pon:
```md
(entra el guion `LM-79-str`; el número de guiones no se anota aquí: lo da `ls tests/e2e/*.spec.js`)
```

## B2. Guion nuevo
Copia el bloque de *Guion N2* a `tests/e2e/INC-214.spec.js` sin cambiar nada; no lo corras. `node tests/run.js` en verde (84/84: el lote no añade tests en str-manager; `e2e-esquema` carga el guion nuevo).

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

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): la vía con `X-Modelo-Token` no cambia. El inicio con Google lo ejercen c y d con h.entrarSitio.

## Pruebas derivadas (juez; verificador crítico)
```
- a. fabrica-servicio trae el arreglo con sus tests en verde · nivel: N1 · perfil: verificación cruzada del Arquitecto (fuera del juez) · precondición: ninguna · tec: escenario · espera: en el cierre, A2 «Todo igual: 9 archivos.» y run.js 10/10 (sitios-comun S4, sitios-proyectos P6 y P7), A3 con ls-remote igual al HEAD de la hermana · **Detener**
- c. Si la lectura de incidentes no tiene respuesta, proyectos. se pinta entero: Construcción avisa «incidentes (sin respuesta)», las demás partes sin aviso y la sesión queda en «error» con ese motivo (CU-MOD-3.1, INC-214) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: escenario · espera: caso c del guion en verde; si falla, Detener y avisar (revertir devuelve el corte de INC-214, que es pasajero) · **Detener**
- d. Si la lectura de prueba de la sesión no tiene respuesta, proyectos. no muestra contenido, dice «No se pudo leer el servicio (sin respuesta).» y queda en «error», nunca «lista» ni «denegada» (RT-14) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: decisión · espera: caso d del guion en verde · **Detener**
- g. str-manager solo suma el guion y los dos documentos, y sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (D1–D4); la cola compara el guion · **Detener**
- Datos de prueba: ninguno (solo lectura; el corte es del navegador del perfil de prueba y cada caso lo quita)
- Sin letras b, e ni f: las letras siguen las de los casos del guion (c y d); a y g no tienen caso.
- Resultado esperado del juez: «parcial», con a en criteriosPendientes; la cierra el Arquitecto por evidencia cruzada.
```

### Guion N2 → `tests/e2e/INC-214.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// INC-214 (L-178): proyectos. cortaba la carga si una lectura no llegaba a tener respuesta (fetch lanza: p. ej. un 503 del
// hosting sin cabecera CORS mientras el servicio carga datos). Aquí se simula esa falta de respuesta SOLO en el navegador del
// perfil de prueba (ctx.route + abort de una lectura GET del servicio; nada llega al servidor ni se escribe) y se mira que la
// página se pinte entera con el aviso de esa parte y que la sesión quede en «error» con el motivo. Cada caso quita su corte.
const PRO = 'https://proyectos.apartamentosbucaramanga.com';
const SERVICIO = 'herramienta-fabrica.apartamentosbucaramanga.com';

// Corta (sin respuesta) las lecturas GET del servicio que cumplan «es»; corre fn y quita el corte pase lo que pase
async function conCorte(h, es, fn) {
  const ctx = h.page.context();
  const filtro = (u) => u.hostname === SERVICIO && es(u);
  const corte = (route) => (route.request().method() === 'GET' ? route.abort('failed') : route.fallback());
  await ctx.route(filtro, corte);
  try { return await fn(); } finally { await ctx.unroute(filtro, corte).catch(() => {}); }
}

module.exports = {
  req: 'INC-214',
  zona: ['MOD'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Si la lectura de incidentes no tiene respuesta, proyectos. se pinta entero: Construcción avisa «incidentes (sin respuesta)», las demás partes sin aviso, y la sesión queda en «error» con ese motivo',
      async prueba(h) {
        const r = await conCorte(h, (u) => u.pathname === '/modelo/api/incidente', () => h.entrarSitio(PRO + '/'));
        h.espera(r.estado === 'error' && /no se pudo leer: incidentes \(sin respuesta\)/.test(r.observado), 'entrar como admin sin respuesta en incidentes → ' + r.observado);
        const v = await h.page.evaluate(() => ({
          proyecto: (document.getElementById('proyecto-activo') || {}).textContent || '',
          avisos: [...document.querySelectorAll('.aviso-lectura')].map((x) => (x.closest('section.parte') || {}).id + ': ' + x.textContent),
          vacias: [...document.querySelectorAll('section.parte')].filter((s) => !(s.querySelector('.cuerpo') || {}).textContent).map((s) => s.id),
          oculto: !!(document.getElementById('contenido') || {}).hidden,
        })).catch(() => null);
        h.espera(!!v && v.proyecto.startsWith('P01 · ') && !v.oculto, 'proyecto activo: «' + (v && v.proyecto) + '» · contenido a la vista: ' + (v && !v.oculto));
        h.espera(!!v && v.avisos.length === 1 && /^construccion: No se pudo leer: incidentes \(sin respuesta\)/.test(v.avisos[0]), 'avisos de lectura: ' + (v ? (v.avisos.join(' | ') || 'ninguno') : '?'));
        h.espera(!!v && v.vacias.length === 0, 'partes vacías: ' + (v ? (v.vacias.join(', ') || 'ninguna') : '?'));
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-14'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Si la lectura de prueba de la sesión no tiene respuesta, proyectos. no muestra contenido, dice «No se pudo leer el servicio (sin respuesta).» y la sesión queda en «error» (no en «lista» ni en «denegada»)',
      async prueba(h) {
        const r = await conCorte(h, (u) => u.pathname === '/modelo/api/decision' && u.search === '?limite=1', () => h.entrarSitio(PRO + '/'));
        h.espera(r.estado === 'error' && /\(sin respuesta\)/.test(r.observado), 'entrar como admin sin respuesta en la lectura de prueba → ' + r.observado);
        const v = await h.page.evaluate(() => ({
          aviso: (document.getElementById('aviso') || {}).textContent || '',
          oculto: !!(document.getElementById('contenido') || {}).hidden,
          bloques: document.querySelectorAll('#contenido [data-bloque]').length,
        })).catch(() => null);
        h.espera(!!v && v.aviso === 'No se pudo leer el servicio (sin respuesta).' && v.oculto && v.bloques === 0, 'aviso: «' + (v && v.aviso) + '» · contenido oculto: ' + (v && v.oculto) + ' · bloques: ' + (v && v.bloques));
      },
    },
  ],
};
```

## B3. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por paso, declarados vs tocados, el hash de main de fabrica-servicio) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-178 · INC-214 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (A1–A3, B1–B3) · salidas de A2 (las nueve líneas de hash, `status --short`, run.js con las líneas de modelo-google parte B y de modelo-lectura F3: cada una «OMITIDA» o en verde) y A3 (ls-remote) tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y de main de fabrica-servicio · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md, tests-y-despliegue.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
