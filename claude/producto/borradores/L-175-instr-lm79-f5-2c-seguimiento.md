# instr — L-175 · LM-79 fase 5.2c (2 de 2): proyectos. suma lo que mostraba Seg. Proyecto del STR (objetivos, planes, quién tiene qué, plan del proyecto, bolsa, pedidos y cambios), criterios por cerrar, fase/salud/hito y Pruebas, con la regla de datos
Categoría: **crítico** (amplía lo que un sitio con inicio de sesión lee y muestra del servicio; DA: LM-79 · cruce previo con Carlos: delegado en el Arquitecto, 29-oct 22:07 (M-1206))
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-29 22:06 · ok Jefe de proyecto M-1204
Decisión: ADR-009 (v5, § 4b y 4c, aceptada; contrato de la fase 5) y DA: LM-79; brechas y carga del Arquitecto (respuesta a M-1195, 21:09)
Alcance: en str-manager, `tests/e2e/LM-79-seguimiento.spec.js` (nuevo) · `tests/e2e/LM-79-proyectos.spec.js` (casos c y d, para lo que ahora se ve y se lee) · `docs/claude/modelo.md` (puntero) · en la carpeta hermana C:\Users\ktcol\fabrica-servicio-l175 (clon de fabrica-servicio, **no** es str-manager), con el script de A2: sitios/proyectos/proyectos.js, sitios/proyectos/vistas.js, tests/sitios-proyectos.test.js y docs/claude/modelo.md · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques nada más de str-manager
Versión: `?v=` igual · `schema_version` igual (el del modelo, 3, también)
Origen: M-1194 (Arquitecto: 5.2c antes de 5.3), M-1195 (brechas; respuesta del Arquitecto 21:09 con la carga de fabrica/proyecto/P01 y fase, salud y próximo hito en proyectos.json), M-1201 (JP: lo nuevo pasa por la regla de datos con su caso y el plan de P01 solo para administradores); `claude/marco/plan-sitios-fase5-contrato.md` (regla 7). Requerimiento: `interno/lotes-modelo/LM-79.md` (fase 5)
Impacto: en `proyectos.`, «Lo que te toca» suma «Criterios por cerrar»; el portafolio, fase, salud y próximo hito; Resumen, objetivos, planes de trabajo, «Quién tiene qué» y el plan del proyecto (trabajo, tandas, pausas y prioridades); Alcance, la bolsa entera y los pedidos; Construcción, los cambios; Pruebas deja de estar pendiente. Con esto las ocho páginas del grupo Proyecto del STR tienen reemplazo (regla 7 del contrato) y 5.3 puede arrancar. Nada cambia para el usuario del STR.
Fuera de 5.2c: la cola de LENOVO (el servicio no la sirve; la «cola» de Seg. Proyecto era la del buzón y está en «Quién tiene qué»), vencimientos (ningún dato los trae) y la revisión con calma del aspecto (después del plan, M-1194).
Reglas transversales que toca: RT-14 (todo lo nuevo se lee con el token de un administrador: sin sesión, 403; operador, «denegada») · RT-18 (la página no guarda el token; de cada fila solo muestra columnas con nombre: de los cambios, ni la observación ni la aceptación salvo letra y motivo de criteriosPendientes, con el texto tapado; del plan, ni riesgos, traspaso ni lecciones) · RT-19 (17 lecturas en serie por visita, antes 13)
Mapa: módulos y relaciones que cambia: MOD; relación ampliada: sitio Proyectos → MOD también por GET cambio, pedido, plan_trabajo y complemento?archivo=fabrica/proyecto/<id>; ninguna relación del STR
Casos de uso: CU-MOD-3.1, CU-MOD-3.2
Riesgo: medio (R-1 del lote; MOD tiene riesgo 1, no hace falta R-n). Puede salir mal: que lo nuevo muestre un dato personal o del negocio (d lo busca en todo el texto; las vistas tapan correos y teléfonos del texto libre); que el plan del proyecto (órdenes y pausas de Carlos) quede a la vista de quien no es administrador (e y f); que la carga de la página se haga lenta (cambio son unos 1,2 MB). Conexiones a MySQL (RT-19): 17 en serie por visita de un admin (salud, prueba, portafolio, 13 lecturas del proyecto y estado), ninguna en paralelo; «Ver» en el portafolio relee 14. La guardia P1 de `sitios-proyectos.test.js` pasa de prohibir la palabra «criterios» a prohibir `.criterios` (las vistas leen `criteriosPendientes`, no los criterios). Sin limpieza manual: no retira nada (INC-210).
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-79, DA: LM-79 y cruce delegado)
Reversión: fabrica-servicio: `git revert` del commit de A3 (proyectos. vuelve a L-174). str-manager: `git revert <hash>` (el guion nuevo, el ajuste de LM-79-proyectos y la nota).
Depende de: L-174 aceptado (64cb845; fabrica-servicio 8c7b980) · carga de `fabrica/proyecto/P01` y de fase, salud y próximo hito en `fabrica/proyectos` (Arquitecto, M-1195) · Precondiciones para verificar: perfiles zz-verif-admin (en MODELO_ADMIN_UIDS) y zz-verif-oper con su cuenta de Google; sin datos que crear
«Quién tiene qué» no cuenta los lotes «no aceptado» (como Criterios por cerrar). ¿Quién más depende de lo que cambia?: el guion LM-79-proyectos (L-173), que corre en regresión: su caso c espera cinco bloques en «Lo que te toca» y una «pendiente» en Pruebas, y su caso d una lista de rutas sin cambio, pedido ni plan_trabajo; B2 los ajusta. LM-79-paginas y LM-79-sitios siguen igual. 5.3 arranca al aceptarse este lote.

## 0. Contexto y reglas de este lote
- Dos partes, en este orden: **A** (A1–A3) en una carpeta hermana, clon de `thcure/fabrica-servicio`: aplicas con un script de Node el sitio de proyectos. y sus tests, corres sus tests y lo subes. **B** (B1–B3) en str-manager: dos líneas del puntero `modelo.md`, tres ajustes del guion de L-173 y el guion N2 nuevo. **Si A no termina en verde, no hagas B.**
- **La consola no guarda variables entre llamadas.** Cada bloque de A empieza con `H=/c/Users/ktcol/fabrica-servicio-l175` y su guardia: córrelo entero en una sola llamada. No hagas `cd` a la carpeta hermana. Nunca `push --force` ni reescribir historia.
- El script de A2 escribe los cuatro archivos: **no los edites a mano** ni los reescribas. Si dice FAIL, para.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.
- En LENOVO hay `C:\php` (PHP 8.3) sin `openssl.cnf`: la parte B de `modelo-google.test.js` sale «OMITIDA» (INC-211); `modelo-lectura.test.js` F3 corre o sale «F3 OMITIDA» según traiga `pdo_sqlite`. Las dos cosas valen.

## A1. Clonar fabrica-servicio a la carpeta hermana
```bash
H=/c/Users/ktcol/fabrica-servicio-l175
test ! -e "$H" || { echo "ya existe $H: para"; exit 1; }
test "$(git symbolic-ref --short HEAD)" = main && test -z "$(git status --porcelain)" || { echo "str-manager no está en main limpio: para"; exit 1; }
git fetch -q origin main && test "$(git rev-parse HEAD)" = "$(git rev-parse origin/main)" || { echo "main local distinto de origin/main: para"; exit 1; }
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git clone --no-tags --single-branch --branch main https://github.com/thcure/fabrica-servicio.git "$H"
test "$(git -C "$H" rev-parse HEAD)" = 8c7b980bc1562c07460a097f20590526739a21ce || { echo "fabrica-servicio no está en 8c7b980: para"; exit 1; }
node "$H/tests/run.js"      # 10/10 antes de tocar nada
```

## A2. Aplicar los cambios con el script
Guarda el bloque siguiente como `aplicar-l175.js` en `C:\Users\ktcol\` (fuera de los dos repos; **no se commitea**) y córrelo. Primero valida todo en memoria (cada texto a cambiar aparece una sola vez; los archivos nuevos no existen); si algo no cuadra no escribe nada. Después escribe y compara el hash de git de los cuatro archivos con el esperado: debe terminar en «Todo igual: 4 archivos.».
```js
// L-175 (LM-79 fase 5.2c 2 de 2): aplica en la carpeta hermana de fabrica-servicio el sitio de proyectos. ampliado y sus tests.
// Uso: node aplicar-l175.js <carpeta de fabrica-servicio>. Primero lo valida todo en memoria (cada «busca» aparece una
// sola vez; los archivos nuevos no existen); si algo no cuadra, no escribe nada y sale con 1. Después escribe (LF) y
// compara el hash de git de cada archivo con el esperado.
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const H = process.argv[2];
if (!H || !fs.existsSync(path.join(H, '.git'))) { console.log('FAIL carpeta sin .git: ' + H); process.exit(1); }
const OPS = [{"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "// Sin red ni DOM: las prueba tests/sitios-proyectos.test.js en un vm. Regla de datos (M-1186): solo columnas elegidas de\n// las tablas de la fábrica (nunca extra completo, cambios ni criterios), nada del negocio: ni huéspedes ni pagos, ni\n// correos ni teléfonos. Todo texto pasa por esc().", "pon": "// Sin red ni DOM: las prueba tests/sitios-proyectos.test.js en un vm. Regla de datos (M-1186): solo columnas elegidas de\n// las tablas de la fábrica (nunca extra completo ni el detalle de criterios u observaciones), nada del negocio: ni huéspedes ni pagos, ni\n// correos ni teléfonos. Todo texto pasa por esc()."}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "    var riesgos = filas(d.riesgos).filter(function (r) { return r.estado === 'propuesto'; }).sort(porId);\n    var n = men.length + das.length + tareas.length + lotes.length + riesgos.length;\n    return '<p class=\"resumen-inicio\" data-total=\"' + n + '\">' + (n ? esc(n + (n === 1 ? ' cosa te espera.' : ' cosas te esperan.')) : 'Nada te espera.') + '</p>' +", "pon": "    var riesgos = filas(d.riesgos).filter(function (r) { return r.estado === 'propuesto'; }).sort(porId);\n    var crits = criteriosPendientes(d.cambios);\n    var n = men.length + das.length + tareas.length + lotes.length + riesgos.length + crits.length;\n    return '<p class=\"resumen-inicio\" data-total=\"' + n + '\">' + (n ? esc(n + (n === 1 ? ' cosa te espera.' : ' cosas te esperan.')) : 'Nada te espera.') + '</p>' +"}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "      bloque('lotes', 'Lotes que te esperan', lotes, [['Lote', function (l) { return l.id; }], ['Estado', function (l) { return l.estado; }], ['Qué', function (l) { return corto(l.resumen || o(l).titulo, 160); }], ['Desde', function (l) { return l.desde; }]]) +\n      bloque('riesgos', 'Riesgos por aceptar', riesgos, [['Riesgo', function (r) { return r.id; }], ['Nombre', function (r) { return corto(r.nombre, 160); }]]);\n  }", "pon": "      bloque('lotes', 'Lotes que te esperan', lotes, [['Lote', function (l) { return l.id; }], ['Estado', function (l) { return l.estado; }], ['Qué', function (l) { return corto(l.resumen || o(l).titulo, 160); }], ['Desde', function (l) { return l.desde; }]]) +\n      bloque('riesgos', 'Riesgos por aceptar', riesgos, [['Riesgo', function (r) { return r.id; }], ['Nombre', function (r) { return corto(r.nombre, 160); }]]) +\n      bloque('criterios', 'Criterios por cerrar', crits, [['Lote', function (x) { return x.lote; }], ['Criterio', function (x) { return x.c; }], ['Por qué sigue abierto', function (x) { return corto(x.motivo, 200); }]]);\n  }\n\n  // L-175: criterios pendientes de los lotes que aún no se aceptan (cambio.extra.o.aceptacion.criteriosPendientes; solo letra y motivo)\n  function criteriosPendientes(cambios) {\n    var out = [];\n    filas(cambios).filter(function (c) { return ['aceptado', 'cerrado', 'superado', 'no aceptado'].indexOf(c.estado) < 0; }).sort(function (a, b) { return num(a.lote) - num(b.lote); }).forEach(function (c) {\n      var ac = o(c).aceptacion;\n      filas(ac && typeof ac === 'object' ? ac.criteriosPendientes : null).forEach(function (p) { out.push({ lote: txt(c.lote), c: txt(p.c), motivo: txt(p.motivo) }); });\n    });\n    return out;\n  }"}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "    var url = function (u) { return typeof u === 'string' && /^https:\\/\\/[^\\s\"'<>]+$/.test(u) ? '<a href=\"' + esc(u) + '\" rel=\"noopener noreferrer\" target=\"_blank\">' + esc(u.replace(/^https:\\/\\//, '')) + '</a>' : '—'; };\n    return '<table><tr><th>Proyecto</th><th>Estado</th><th>Qué es</th><th>Producción</th><th></th></tr>' + ps.map(function (p) {\n      var prod = p.ambientes && typeof p.ambientes === 'object' ? p.ambientes.produccion : null;", "pon": "    var url = function (u) { return typeof u === 'string' && /^https:\\/\\/[^\\s\"'<>]+$/.test(u) ? '<a href=\"' + esc(u) + '\" rel=\"noopener noreferrer\" target=\"_blank\">' + esc(u.replace(/^https:\\/\\//, '')) + '</a>' : '—'; };\n    return '<table><tr><th>Proyecto</th><th>Estado</th><th>Qué es</th><th>Fase</th><th>Salud</th><th>Próximo hito</th><th>Producción</th><th></th></tr>' + ps.map(function (p) {\n      var prod = p.ambientes && typeof p.ambientes === 'object' ? p.ambientes.produccion : null;"}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "      var ver = p.idServicio ? '<button type=\"button\" class=\"ver-proyecto\" data-proyecto=\"' + esc(p.id) + '\"' + (p.id === activo ? ' aria-pressed=\"true\"' : '') + '>Ver</button>' : '<span class=\"vacio\">sin datos en el servicio</span>';\n      return '<tr data-proyecto=\"' + esc(p.id) + '\"><td>' + esc(txt(p.id) + ' · ' + txt(p.nombre)) + '</td><td>' + esc(p.estado) + '</td><td>' + esc(corto(p.que, 240)) + '</td><td>' + url(prod) + '</td><td>' + ver + '</td></tr>';\n    }).join('') + '</table>';", "pon": "      var ver = p.idServicio ? '<button type=\"button\" class=\"ver-proyecto\" data-proyecto=\"' + esc(p.id) + '\"' + (p.id === activo ? ' aria-pressed=\"true\"' : '') + '>Ver</button>' : '<span class=\"vacio\">sin datos en el servicio</span>';\n      return '<tr data-proyecto=\"' + esc(p.id) + '\"><td>' + esc(txt(p.id) + ' · ' + txt(p.nombre)) + '</td><td>' + esc(p.estado) + '</td><td>' + esc(corto(p.que, 240)) + '</td><td>' + esc(corto(p.fase, 160)) + '</td><td>' + esc(corto(p.salud, 160)) + '</td><td>' + esc(corto(p.proximoHito, 200)) + '</td><td>' + url(prod) + '</td><td>' + ver + '</td></tr>';\n    }).join('') + '</table>';"}, {"tipo": "par", "ruta": "sitios/proyectos/vistas.js", "busca": "\n  raiz.ProyectosVistas = { loQueTeToca: loQueTeToca, portafolio: portafolio, resumen: resumen, alcance: alcance, decisiones: decisiones, construccion: construccion, buzon: buzon, pendiente: pendiente };\n})(typeof window !== 'undefined' ? window : this);", "pon": "\n  // ── L-175 (5.2c 2 de 2): lo que mostraba Seg. Proyecto del STR ──\n  // Seguimiento: objetivos (diseno.objetivos), planes de trabajo (tabla plan_trabajo) y los chats con su cola (mensajes sin\n  // cerrar por destinatario y lotes abiertos por esperaA)\n  function seguimiento(d) {\n    d = d || {};\n    var obj = filas(d.objetivos);\n    var planes = filas(d.planes).sort(porId);\n    var men = filas(d.mensajes).filter(function (m) { return ['hecho', 'superado'].indexOf(m.estado) < 0; });\n    var lotes = filas(d.lotes).filter(function (l) { return CERRADOS.concat(['previsto', 'pospuesto', 'no aceptado']).indexOf(l.estado) < 0; });\n    var quien = Object.create(null);\n    men.forEach(function (m) { var k = txt(m.para) || '(sin destinatario)'; (quien[k] = quien[k] || { m: [], l: [] }).m.push(m); });\n    lotes.forEach(function (l) { var k = txt(o(l).esperaA) || '(nadie)'; (quien[k] = quien[k] || { m: [], l: [] }).l.push(l); });\n    var chats = Object.keys(quien).sort().map(function (k) { return { quien: k, m: quien[k].m.sort(porId), l: quien[k].l.sort(porId) }; });\n    return bloque('objetivos', 'Objetivos', obj, [['Objetivo', function (x) { return x.id; }], ['Nombre', function (x) { return corto(x.nombre, 120); }], ['Estado', function (x) { return x.estado; }], ['Qué', function (x) { return corto(x.descripcion, 240); }]]) +\n      bloque('planes', 'Planes de trabajo', planes, [['Plan', function (x) { return x.id; }], ['Nombre', function (x) { return corto(x.nombre, 120); }], ['Estado', function (x) { return x.estado; }], ['Objetivo', function (x) { return corto(x.objetivo, 200); }]]) +\n      bloque('chats', 'Quién tiene qué', chats, [['Quién', function (x) { return x.quien; }], ['Mensajes sin cerrar', function (x) { return x.m.map(function (m) { return txt(m.id); }).join(', '); }], ['Lotes que le esperan', function (x) { return x.l.map(function (l) { return txt(l.id) + ' (' + txt(l.estado) + ')'; }).join(', '); }]]);\n  }\n\n  // Plan del proyecto (fabrica/proyecto/<id>: proyecto.json del Jefe de proyecto): trabajo, tandas, pausas y prioridades\n  function planProyecto(fs) {\n    var v = function (clave) { var f = filas(fs).filter(function (x) { return x.clave === clave; })[0]; return f ? f.valor : null; };\n    var trabajo = filas(v('trabajo')), tandas = filas(v('tandas')), pausas = filas(v('pausas'));\n    var prio = Array.isArray(v('prioridades')) ? v('prioridades') : [];\n    if (!trabajo.length && !tandas.length && !pausas.length && !prio.length) return '<p class=\"vacio\">Todavía no hay plan del proyecto en el servicio.</p>';\n    return bloque('trabajo', 'Trabajo', trabajo, [['Ref.', function (x) { return x.ref; }], ['Clase', function (x) { return x.clase; }], ['Estado', function (x) { return x.estado; }], ['Desde', function (x) { return x.desde; }], ['Nota', function (x) { return corto(x.nota, 240); }]]) +\n      bloque('tandas', 'Tandas', tandas, [['Tanda', function (x) { return x.id; }], ['Desde', function (x) { return x.desde; }], ['Entra', function (x) { return (Array.isArray(x.entra) ? x.entra : []).map(txt).join(', '); }], ['Nota', function (x) { return corto(x.nota, 200); }]]) +\n      bloque('pausas', 'Pausas', pausas, [['Desde', function (x) { return x.desde; }], ['Alcance', function (x) { return x.alcance; }], ['Motivo', function (x) { return corto(x.motivo, 240); }]]) +\n      '<div class=\"bloque\" data-bloque=\"prioridades\"><h3>Prioridades <span class=\"cuenta\">(' + prio.length + ')</span></h3><p>' + esc(corto(prio.map(txt).join(' · '), 2000)) + '</p></div>';\n  }\n\n  // Bolsa entera (diseno.bolsa) y pedidos (tabla pedido), para Alcance\n  function bolsaYPedidos(bolsa, pedidos) {\n    var b = filas(bolsa), p = filas(pedidos).sort(porId);\n    return bloque('bolsa', 'Bolsa', b, [['Ref.', function (x) { return x.ref; }], ['Tipo', function (x) { return x.tipo; }], ['Módulo', function (x) { return x.modulo; }], ['Prioridad', function (x) { return x.prioridad; }], ['Tamaño', function (x) { return x.tamano; }], ['Estado', function (x) { return x.estado; }], ['Nota', function (x) { return corto(x.nota, 200); }]]) +\n      bloque('pedidos', 'Pedidos', p, [['Pedido', function (x) { return x.id; }], ['Estado', function (x) { return x.estado; }], ['Fecha', function (x) { return o(x).fecha; }], ['Texto', function (x) { return corto(x.texto, 300); }]]);\n  }\n\n  // Cambios (tabla cambio): lote, fecha, estado, resumen, versión y commit; nunca la observación ni la aceptación\n  function cambios(cs) {\n    var fs = filas(cs).sort(function (a, b) { return num(b.lote) - num(a.lote) || String(b.lote).localeCompare(String(a.lote)); });\n    var cols = [['Lote', function (c) { return c.lote; }], ['Fecha', function (c) { return o(c).fecha; }], ['Estado', function (c) { return c.estado; }], ['Versión', function (c) { return c.version; }], ['Commit', function (c) { return c.hash; }], ['Qué', function (c) { return corto(c.resumen, 200); }]];\n    return bloque('cambios', 'Últimos cambios', fs.slice(0, 30), cols) +\n      (fs.length > 30 ? '<details class=\"bloque\" data-bloque=\"cambios-todos\"><summary>Todos los cambios (' + fs.length + ')</summary>' + tabla(cols, fs) + '</details>' : '');\n  }\n\n  // Pruebas del proyecto (proyectos.json › pruebas): cuenta, prefijo, perfiles, semilla y registro\n  function pruebas(p) {\n    var x = p && p.pruebas && typeof p.pruebas === 'object' ? p.pruebas : null;\n    if (!x) return '<p class=\"vacio\">El proyecto no declara sus pruebas.</p>';\n    var filasP = [['Cuenta de pruebas', x.cuenta], ['Prefijo de los datos de prueba', x.prefijo], ['Perfiles', Array.isArray(x.perfiles) ? x.perfiles.map(txt).join(', ') : x.perfiles], ['Semilla', x.semilla], ['Registro de perfiles', x.registro]];\n    return '<table>' + filasP.map(function (r) { return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(corto(r[1], 400)) + '</td></tr>'; }).join('') + '</table>' +\n      '<p class=\"nota\">Los veredictos y la regresión de cada lote están en Construcción.</p>';\n  }\n\n  raiz.ProyectosVistas = { loQueTeToca: loQueTeToca, portafolio: portafolio, resumen: resumen, alcance: alcance, decisiones: decisiones, construccion: construccion, buzon: buzon, pendiente: pendiente, seguimiento: seguimiento, planProyecto: planProyecto, bolsaYPedidos: bolsaYPedidos, cambios: cambios, pruebas: pruebas, criteriosPendientes: criteriosPendientes };\n})(typeof window !== 'undefined' ? window : this);"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "// tablas de la fábrica del proyecto activo (proyecto=<idServicio>). Nada del negocio (M-1186): ni huéspedes ni pagos.\n// L-174 (5.2c): la línea base y el mapa (páginas generadas) se abren en el visor aislado; pruebas y lo que falta de Seg. Proyecto, L-175.\nimport { iniciarSitio } from '/sitios/comun/sesion.js';", "pon": "// tablas de la fábrica del proyecto activo (proyecto=<idServicio>). Nada del negocio (M-1186): ni huéspedes ni pagos.\n// L-174 (5.2c): la línea base y el mapa (páginas generadas) se abren en el visor aislado. L-175 (5.2c 2 de 2): lo que mostraba\n// Seg. Proyecto del STR (cambios, pedidos, bolsa, objetivos, planes, quién tiene qué y el plan del proyecto), criterios por cerrar y pruebas.\nimport { iniciarSitio } from '/sitios/comun/sesion.js';"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "    riesgos: 'riesgo?' + q + '&limite=500',\n    diseno: 'complemento?' + q + '&archivo=diseno'\n  };", "pon": "    riesgos: 'riesgo?' + q + '&limite=500',\n    diseno: 'complemento?' + q + '&archivo=diseno',\n    cambios: 'cambio?' + q + '&limite=2000',\n    pedidos: 'pedido?' + q + '&limite=500',\n    planes: 'plan_trabajo?' + q + '&limite=500',\n    plan: 'complemento?archivo=fabrica/proyecto/' + encodeURIComponent(p.id)\n  };"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  const bolsa = valorDe(d.diseno, 'bolsa');\n", "pon": "  const bolsa = valorDe(d.diseno, 'bolsa');\n  const objetivos = valorDe(d.diseno, 'objetivos');\n"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  document.getElementById('proyecto-activo').textContent = p.id + ' · ' + p.nombre;\n  poner('inicio', V.loQueTeToca({ mensajes, decisiones: d.decisiones, bolsa: Array.isArray(bolsa) ? bolsa : [], lotes: d.lotes, riesgos: d.riesgos }));\n  poner('resumen', V.resumen(est.cuerpo));\n  poner('alcance', V.alcance(d.reqs));\n  poner('decisiones', V.decisiones(d.decisiones));", "pon": "  document.getElementById('proyecto-activo').textContent = p.id + ' · ' + p.nombre;\n  poner('inicio', V.loQueTeToca({ mensajes, decisiones: d.decisiones, bolsa: Array.isArray(bolsa) ? bolsa : [], lotes: d.lotes, riesgos: d.riesgos, cambios: d.cambios }));\n  poner('resumen', V.resumen(est.cuerpo) + V.seguimiento({ objetivos: Array.isArray(objetivos) ? objetivos : [], planes: d.planes, mensajes, lotes: d.lotes }) +\n    '<h3>Plan del proyecto</h3>' + V.planProyecto(d.plan));\n  poner('alcance', V.alcance(d.reqs) + V.bolsaYPedidos(Array.isArray(bolsa) ? bolsa : [], d.pedidos));\n  poner('decisiones', V.decisiones(d.decisiones));"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  poner('decisiones', V.decisiones(d.decisiones));\n  poner('construccion', V.construccion(d.lotes, d.veredictos, d.incs));\n  poner('buzon', V.buzon(mensajes));", "pon": "  poner('decisiones', V.decisiones(d.decisiones));\n  poner('construccion', V.construccion(d.lotes, d.veredictos, d.incs) + V.cambios(d.cambios));\n  poner('buzon', V.buzon(mensajes));"}, {"tipo": "par", "ruta": "sitios/proyectos/proyectos.js", "busca": "  ofrecerPagina(document.querySelector('#arquitectura .cuerpo'), leer, 'mapa', 'el mapa del proyecto');\n  poner('pruebas', V.pendiente('Pruebas del proyecto'));\n  ofrecerPagina(document.querySelector('#lineabase .cuerpo'), leer, 'linea-base', 'la línea base');", "pon": "  ofrecerPagina(document.querySelector('#arquitectura .cuerpo'), leer, 'mapa', 'el mapa del proyecto');\n  poner('pruebas', V.pruebas(p));\n  ofrecerPagina(document.querySelector('#lineabase .cuerpo'), leer, 'linea-base', 'la línea base');"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "// P4: la Fábrica muestra los documentos que la carga trae como {ruta, titulo, texto} (INC-212).\nconst path = require('path');", "pon": "// P4: la Fábrica muestra los documentos que la carga trae como {ruta, titulo, texto} (INC-212).\n// P5 (L-175): lo que mostraba Seg. Proyecto del STR, con la misma regla de datos.\nconst path = require('path');"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "eq('P1: lo pendiente lo dice (5.2c)', V.pendiente('Mapa del proyecto'), '<p class=\"pendiente\">Mapa del proyecto: pendiente (5.2c).</p>');\neq('P1: vistas.js no usa extra completo ni valorHtml sobre filas (solo campos con nombre)', [/valorHtml\\((f|x|m|l|r|v)\\)/.test(vistas), /\\.extra\\)/.test(vistas), /criterios|\\.notas|\\.detalle|\\.por\\b/.test(vistas.replace(/^\\s*\\/\\/.*$/gm, ''))], [false, false, false]);\n", "pon": "eq('P1: lo pendiente lo dice (5.2c)', V.pendiente('Mapa del proyecto'), '<p class=\"pendiente\">Mapa del proyecto: pendiente (5.2c).</p>');\neq('P1: vistas.js no usa extra completo ni valorHtml sobre filas (solo campos con nombre)', [/valorHtml\\((f|x|m|l|r|v)\\)/.test(vistas), /\\.extra\\)/.test(vistas), /\\.criterios\\b|\\.notas|\\.detalle|\\.por\\b|\\.observacion/.test(vistas.replace(/^\\s*\\/\\/.*$/gm, ''))], [false, false, false]);\n"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "const rutas = [...js.matchAll(/'((?:decision|requisito|lote|veredicto|incidente|mensaje|riesgo|complemento|estado|export|deuda|cambio|evento|situacion|pedido|plan_trabajo|leccion)(?:\\?[^']*)?)'/g)].map((m) => m[1].replace(/\\?.*$/, ''));\neq('P2: lee solo decision, requisito, lote, veredicto, incidente, mensaje, riesgo, complemento y estado (nunca export, cambio ni evento)', [...new Set(rutas)].sort(), ['complemento', 'decision', 'estado', 'incidente', 'lote', 'mensaje', 'requisito', 'riesgo', 'veredicto']);\neq('P2: complemento solo fabrica/proyectos y diseno (la bolsa)', [...js.matchAll(/archivo=([a-z/]+)/g)].map((m) => m[1]).sort(), ['diseno', 'fabrica/proyectos']);\neq('P2: prueba de sesión decision?limite=1 y el proyecto por idServicio', [js.includes(\"prueba: 'decision?limite=1'\"), js.includes(\"'proyecto=' + encodeURIComponent(p.idServicio)\")], [true, true]);", "pon": "const rutas = [...js.matchAll(/'((?:decision|requisito|lote|veredicto|incidente|mensaje|riesgo|complemento|estado|export|deuda|cambio|evento|situacion|pedido|plan_trabajo|leccion)(?:\\?[^']*)?)'/g)].map((m) => m[1].replace(/\\?.*$/, ''));\neq('P2: lee solo tablas de la fábrica (L-175 suma cambio, pedido y plan_trabajo; nunca export, evento ni situacion)', [...new Set(rutas)].sort(), ['cambio', 'complemento', 'decision', 'estado', 'incidente', 'lote', 'mensaje', 'pedido', 'plan_trabajo', 'requisito', 'riesgo', 'veredicto']);\neq('P2: complemento solo fabrica/proyectos, diseno (bolsa y objetivos) y fabrica/proyecto/<id> (el plan del proyecto)', [...js.matchAll(/archivo=([a-z/]+)/g)].map((m) => m[1]).sort(), ['diseno', 'fabrica/proyecto/', 'fabrica/proyectos']);\neq('P2: prueba de sesión decision?limite=1 y el proyecto por idServicio', [js.includes(\"prueba: 'decision?limite=1'\"), js.includes(\"'proyecto=' + encodeURIComponent(p.idServicio)\")], [true, true]);"}, {"tipo": "par", "ruta": "tests/sitios-proyectos.test.js", "busca": "\nconsole.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);", "pon": "\n// ── P5 (L-175) ──\nconst cs = [\n  { lote: 'L-9', estado: 'instalado', resumen: 'r9', hash: 'abc', version: 'p1', extra: ex({ fecha: '2026-10-29', observacion: SECRETO.correo, aceptacion: { criteriosPendientes: [{ c: 'a', motivo: 'la cierra el Arquitecto' }], criterios: [{ observado: SECRETO.tel }], notas: SECRETO.nota } }) },\n  { lote: 'L-8', estado: 'aceptado', resumen: 'r8', extra: ex({ aceptacion: { criteriosPendientes: [{ c: 'a', motivo: 'ya cerrado' }] } }) }];\neq('P5: criterios por cerrar: solo de lotes no aceptados, con letra y motivo', V.criteriosPendientes(cs), [{ lote: 'L-9', c: 'a', motivo: 'la cierra el Arquitecto' }]);\nconst ini2 = V.loQueTeToca(Object.assign({}, d, { cambios: cs }));\neq('P5: «Lo que te toca» suma el bloque de criterios y lo cuenta', [/data-bloque=\"criterios\"/.test(ini2), /data-total=\"6\"/.test(ini2)], [true, true]);\nconst p5 = V.cambios(cs) + V.bolsaYPedidos(d.bolsa.concat([{ ref: 'F-9', tipo: 'funcionalidad', nota: 'escribe a ' + SECRETO.correo }]), [{ id: 'P-1', estado: 'nuevo', texto: 't', extra: ex({ fecha: '2026-09-29' }) }]) +\n  V.seguimiento({ objetivos: [{ id: 'OB-1', nombre: 'n', estado: 'aprobado', descripcion: 'd' }], planes: [{ id: 'PT-1', nombre: 'p', estado: 'activo', carril: 'c', objetivo: 'o', extra: ex({}) }], mensajes: d.mensajes, lotes: d.lotes }) +\n  V.planProyecto([{ clave: 'trabajo', valor: [{ ref: 'LM-79', clase: 'a', estado: 'en curso', nota: 'n' }] }, { clave: 'riesgos', valor: [{ escenario: SECRETO.nota }] }, { clave: 'pausas', valor: [{ desde: 'x', alcance: 'producto', motivo: 'm' }] }]) +\n  V.pruebas({ pruebas: { cuenta: 'zz-verif-pruebas', prefijo: 'zz-verif-', perfiles: ['admin', 'oper'], semilla: 's', registro: 'r' } });\neq('P5: cambios, bolsa, pedidos, seguimiento, plan y pruebas sin observación, aceptación ni riesgos del plan (ni correos, teléfonos, huéspedes ni pagos)', [/@/.test(p5), /300 000/.test(p5), /huésped|pago 123/.test(p5), p5.includes('[correo]')], [false, false, false, true]);\neq('P5: cada parte trae lo suyo', ['data-bloque=\"cambios\"', 'data-bloque=\"bolsa\"', 'data-bloque=\"pedidos\"', 'data-bloque=\"objetivos\"', 'data-bloque=\"planes\"', 'data-bloque=\"chats\"', 'data-bloque=\"trabajo\"', 'data-bloque=\"pausas\"', 'zz-verif-pruebas', 'admin, oper'].every((x) => p5.includes(x)), true);\neq('P5: quién tiene qué agrupa mensajes sin cerrar por destinatario y lotes abiertos por esperaA', (() => { const h = V.seguimiento({ mensajes: d.mensajes, lotes: d.lotes }); return [/<td>Carlos<\\/td><td>M-9<\\/td>/.test(h), /<td>CLI<\\/td><td><\\/td><td>L-7 \\(encolado\\)<\\/td>/.test(h), h.includes('M-11')]; })(), [true, true, false]);\neq('P5: quién tiene qué no cuenta lotes «no aceptado» ni planes con carril vacío', (() => { const h = V.seguimiento({ lotes: [{ id: 'L-5', estado: 'no aceptado', extra: ex({ esperaA: 'CD' }) }], planes: [{ id: 'PT-1', nombre: 'n', estado: 'activo' }] }); return [h.includes('L-5'), h.includes('<th>Carril</th>')]; })(), [false, false]);\neq('P5: el portafolio muestra fase, salud y próximo hito', (() => { const h = V.portafolio([{ id: 'P01', nombre: 'STR', idServicio: 'str', fase: 'en operación', salud: 'verde', proximoHito: 'cierre de LM-79' }], 'P01'); return ['<th>Fase</th>', '<td>en operación</td>', '<td>verde</td>', '<td>cierre de LM-79</td>'].every((x) => h.includes(x)); })(), true);\neq('P5: proyectos.js lee el plan del proyecto por su id y lo pone en Resumen; pruebas ya no está pendiente', [js.includes(\"plan: 'complemento?archivo=fabrica/proyecto/' + encodeURIComponent(p.id)\"), js.includes(\"V.planProyecto(d.plan)\"), js.includes(\"poner('pruebas', V.pruebas(p))\")], [true, true, true]);\n\nconsole.log(\u0060\\n${ok} OK, ${fail} FAIL\u0060);"}, {"tipo": "par", "ruta": "docs/claude/modelo.md", "busca": "- Lo vigilan \u0060tests/sitios-visor.test.js\u0060 (V1–V4), \u0060tests/sitios-htaccess.test.js\u0060 (R1–R6), \u0060tests/sitios-comun.test.js\u0060 (S3) y el guion \u0060tests/e2e/LM-79-paginas.spec.js\u0060 del STR.\n", "pon": "- Lo vigilan \u0060tests/sitios-visor.test.js\u0060 (V1–V4), \u0060tests/sitios-htaccess.test.js\u0060 (R1–R6), \u0060tests/sitios-comun.test.js\u0060 (S3) y el guion \u0060tests/e2e/LM-79-paginas.spec.js\u0060 del STR.\n\n## Seguimiento del proyecto en proyectos. (LM-79 fase 5.2c 2 de 2, L-175)\n- **Lo que mostraba Seg. Proyecto del STR:** Resumen suma objetivos (\u0060complemento diseno\u0060, clave \u0060objetivos\u0060), planes de trabajo (tabla \u0060plan_trabajo\u0060), «Quién tiene qué» (mensajes sin cerrar por destinatario y lotes abiertos por \u0060esperaA\u0060) y el plan del proyecto (\u0060complemento fabrica/proyecto/<id>\u0060: trabajo, tandas, pausas y prioridades; nunca sus riesgos, traspaso ni lecciones). Alcance suma la bolsa entera y los pedidos (tabla \u0060pedido\u0060). Construcción suma los cambios (tabla \u0060cambio\u0060: lote, fecha, estado, versión, commit y resumen; nunca la observación ni la aceptación). Pruebas muestra la cuenta, el prefijo, los perfiles, la semilla y el registro de \u0060proyectos.json\u0060.\n- **Lo que te toca:** suma «Criterios por cerrar» (letra y motivo de \u0060criteriosPendientes\u0060 de los lotes que aún no se aceptan). El portafolio suma fase, salud y próximo hito.\n- **Conexiones (RT-19):** proyectos. lee 17 rutas una tras otra por visita (antes 13).\n- Lo vigilan \u0060tests/sitios-proyectos.test.js\u0060 (P1–P5) y el guion \u0060tests/e2e/LM-79-seguimiento.spec.js\u0060 del STR.\n"}];
const HASHES = {"docs/claude/modelo.md": "cccbda34053b8f3162e63985c14349edcc76fd1b", "sitios/proyectos/proyectos.js": "938b14a57900aa6d3fba9c3e41786e525b0858fa", "sitios/proyectos/vistas.js": "f7779024f84964f97d85e64f5f91d6f8f46a6815", "tests/sitios-proyectos.test.js": "fc19cb064d48c3a2040f79975e5d5af0d721b678"};
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
H=/c/Users/ktcol/fabrica-servicio-l175
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
node /c/Users/ktcol/aplicar-l175.js "$H"
git -C "$H" status --short
node "$H/tests/run.js"      # 10/10 archivos OK
```
Para (§ 0) si el script no termina en «Todo igual: 4 archivos.» o si `run.js` no da 10/10. `status --short` debe listar solo los cuatro archivos, todos modificados (ninguno nuevo).

## A3. Commit y push del repo nuevo
```bash
H=/c/Users/ktcol/fabrica-servicio-l175
test -d "$H/.git" || { echo "no existe $H/.git: para"; exit 1; }
git -C "$H" add -A
git -C "$H" commit -m "fabrica-servicio: proyectos. suma lo que mostraba Seg. Proyecto del STR, criterios por cerrar, fase, salud y próximo hito, y Pruebas (LM-79 fase 5.2c, 2 de 2)" -m "Lote: L-175 · LM-79 · Casos de uso: CU-MOD-3.1, CU-MOD-3.2
Co-Authored-By: <como siempre>"
GIT_TERMINAL_PROMPT=0 GCM_INTERACTIVE=never git -C "$H" push origin main
git -C "$H" ls-remote origin refs/heads/main; git -C "$H" rev-parse HEAD     # el mismo hash
```
Si el push falla: **para** sin B y di «No hecho: push bloqueado» con la salida. Plan B: Carlos corre `git -C /c/Users/ktcol/fabrica-servicio-l175 push origin main` y el lote se repite solo desde B. Borra `C:\Users\ktcol\aplicar-l175.js` al terminar A3.

## B1. `docs/claude/modelo.md` (puntero)
**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-174 · dueño: MOD
```
Pon:
```md
Al día hasta L-175 · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
(origen opaco, con su propia CSP) y que sin sesión no se leen.
```
Pon:
```md
(origen opaco, con su propia CSP) y que sin sesión no se leen. `tests/e2e/LM-79-seguimiento.spec.js` (L-175) comprueba que proyectos. muestra lo que mostraba Seg. Proyecto (objetivos, planes, quién tiene qué, plan del proyecto, bolsa, pedidos y cambios), los criterios por cerrar, Pruebas y fase, salud y próximo hito, con la regla de datos y solo para administradores.
```

## B2. Guion de L-173 (`tests/e2e/LM-79-proyectos.spec.js`, ya ajustado por L-174)
**P1 · rutas que lee proyectos.** (`tests/e2e/LM-79-proyectos.spec.js`). Busca:
```js
const RUTAS = ['salud', 'decision', 'requisito', 'lote', 'veredicto', 'incidente', 'mensaje', 'riesgo', 'complemento', 'estado'];
```
Pon:
```js
const RUTAS = ['salud', 'decision', 'requisito', 'lote', 'veredicto', 'incidente', 'mensaje', 'riesgo', 'complemento', 'estado', 'cambio', 'pedido', 'plan_trabajo'];
```

**P2 · caso c: bloques de «Lo que te toca»** (`tests/e2e/LM-79-proyectos.spec.js`). Busca:
```js
v.bloques.join(',') === 'mensajes,decisiones,tareas,lotes,riesgos'
```
Pon:
```js
v.bloques.join(',') === 'mensajes,decisiones,tareas,lotes,riesgos,criterios'
```

**P3 · caso c: Pruebas ya no está pendiente** (`tests/e2e/LM-79-proyectos.spec.js`). Busca:
```js
        h.espera(v.pendientes === 1 && v.botones === 2, 'pruebas dice «pendiente (5.2c)» y arquitectura y línea base ofrecen su página (L-174): ' + v.pendientes + ' pendiente, ' + v.botones + ' botones');
```
Pon:
```js
        h.espera(v.pendientes === 0 && v.botones === 2, 'nada dice «pendiente» (L-175: Pruebas lleno) y arquitectura y línea base ofrecen su página (L-174): ' + v.pendientes + ' pendiente, ' + v.botones + ' botones');
```

## B3. Guion nuevo
Copia el bloque de *Guion N2* a `tests/e2e/LM-79-seguimiento.spec.js` sin cambiar nada; no lo corras. `node tests/run.js` en verde (93/93: el lote no añade tests en str-manager; `e2e-esquema` carga el guion nuevo).

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

Deuda de cobertura de la ruta (no la ejerce este lote): REL-29 (cola-arquitecto→MOD): la vía con `X-Modelo-Token` no cambia. El inicio con Google lo ejerce h.entrarSitio en c, d y e.

## Pruebas derivadas (juez; verificador crítico)
```
- a. fabrica-servicio trae el sitio de proyectos. ampliado con sus tests en verde · nivel: N1 · perfil: verificación cruzada del Arquitecto (fuera del juez) · precondición: ninguna · tec: escenario · espera: en el cierre, A2 «Todo igual: 4 archivos.» y run.js 10/10 (sitios-proyectos P1–P5), A3 con ls-remote igual al HEAD de la hermana · **Detener**
- c. El admin ve en proyectos. lo que mostraba Seg. Proyecto (objetivos, planes, quién tiene qué y plan del proyecto en Resumen; bolsa y pedidos en Alcance; cambios en Construcción), los criterios por cerrar, Pruebas sin «pendiente» y fase, salud y próximo hito de P01 (CU-MOD-3.1, CU-MOD-3.2) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado; carga de fabrica/proyecto/P01 activa · tec: escenario · espera: caso c del guion en verde; si entrarSitio no llega a un estado, Detener y avisar · **Revertir**
- d. Regla de datos con lo nuevo: proyectos. no pide nada al STR, solo lee tablas de la fábrica (también cambio, pedido y plan_trabajo) y su texto no trae correos ni teléfonos (CU-MOD-3.1, RT-18) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: la de c · tec: decisión · espera: caso d del guion en verde · **Revertir**
- e. El operador queda en «denegada» en proyectos. y no ve nada de lo nuevo (RT-14) · nivel: N2 · perfil: zz-verif-oper · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: commit de A3 desplegado · tec: decisión · espera: caso e del guion en verde; si entrarSitio no llega a un estado, Detener y avisar · **Revertir**
- f. Sin sesión, el plan del proyecto, los cambios, los pedidos y los planes de trabajo dan 403 (RT-14) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: ninguna (el servicio no cambia) · tec: decisión · espera: caso f del guion en verde · **Revertir**
- g. str-manager suma el guion, ajusta el de L-173 y la nota, y sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 93/93; `aplicar.js` K1 en verde (D1, D2, P1–P3); la cola compara el guion · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Sin letra b: las letras siguen las de los casos del guion (c–f); a y g no tienen caso.
- Resultado esperado del juez: «parcial», con a en criteriosPendientes; la cierra el Arquitecto por evidencia cruzada. Si c–f fallan todos a la vez justo después del push, puede faltar el despliegue: Detener y avisar, no Revertir.
```

### Guion N2 → `tests/e2e/LM-79-seguimiento.spec.js` (la CLI lo copia tal cual, sin cambiar un byte; no lo corras)
```js
// LM-79 fase 5.2c 2 de 2 (L-175): proyectos. suma lo que mostraba Seg. Proyecto del STR (objetivos, planes de trabajo, quién
// tiene qué, el plan del proyecto, bolsa, pedidos y cambios), los criterios por cerrar en «Lo que te toca», fase, salud y
// próximo hito en el portafolio, y Pruebas. Regla de datos (M-1186, M-1201): nada del negocio, ni correos ni teléfonos, y solo
// tablas de la fábrica; todo solo para administradores (RT-14). Solo lectura.
const PRO = 'https://proyectos.apartamentosbucaramanga.com';
const FAB = 'https://herramienta-fabrica.apartamentosbucaramanga.com';
const RUTAS = ['salud', 'decision', 'requisito', 'lote', 'veredicto', 'incidente', 'mensaje', 'riesgo', 'complemento', 'estado', 'cambio', 'pedido', 'plan_trabajo'];

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1', 'CU-MOD-3.2'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'El admin ve en proyectos. lo que mostraba Seg. Proyecto: objetivos, planes, quién tiene qué y el plan del proyecto en Resumen; bolsa y pedidos en Alcance; cambios en Construcción; pruebas; criterios por cerrar; fase, salud y próximo hito',
      async prueba(h) {
        const p = h.page;
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.ok && r.estado === 'lista', 'entrar como admin → ' + r.observado);
        if (r.estado !== 'lista') return;
        const v = await p.evaluate(() => {
          const b = (sel) => [...document.querySelectorAll(sel + ' [data-bloque]')].map((x) => x.dataset.bloque);
          const th = [...document.querySelectorAll('#proyectos th')].map((x) => x.textContent);
          return {
            inicio: b('#inicio'), resumen: b('#resumen'), alcance: b('#alcance'), construccion: b('#construccion'),
            pruebas: (document.querySelector('#pruebas .cuerpo') || {}).textContent || '',
            pendientes: document.querySelectorAll('#pruebas .pendiente').length,
            portafolio: ['Fase', 'Salud', 'Próximo hito'].every((x) => th.includes(x)),
            filaP01: [...document.querySelectorAll('#proyectos tr[data-proyecto="P01"] td')].slice(3, 6).map((x) => x.textContent),
          };
        }).catch(() => null);
        h.espera(!!v, 'lectura de la página');
        if (!v) return;
        h.espera(v.inicio.includes('criterios'), 'Lo que te toca con «Criterios por cerrar»: ' + v.inicio.join(', '));
        h.espera(['objetivos', 'planes', 'chats', 'trabajo', 'pausas', 'prioridades'].every((x) => v.resumen.includes(x)), 'Resumen: ' + v.resumen.join(', '));
        h.espera(['bolsa', 'pedidos'].every((x) => v.alcance.includes(x)) && v.construccion.includes('cambios'), 'Alcance: ' + v.alcance.join(', ') + ' · Construcción: ' + v.construccion.join(', '));
        h.espera(/zz-verif-/.test(v.pruebas) && v.pendientes === 0, 'Pruebas con la cuenta y el prefijo de prueba, sin «pendiente»: ' + v.pruebas.slice(0, 80));
        h.espera(v.portafolio && v.filaP01.length === 3 && v.filaP01.every((x) => x && x !== '—'), 'portafolio con fase, salud y próximo hito de P01: ' + v.filaP01.map((x) => x.slice(0, 30)).join(' | '));
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-18', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Regla de datos con lo nuevo: proyectos. no pide nada al STR (app.: ni huéspedes ni pagos), solo lee tablas de la fábrica (ahora también cambio, pedido y plan_trabajo) y su texto no trae correos ni teléfonos',
      async prueba(h) {
        const p = h.page;
        const hosts = new Set(), rutas = new Set();
        p.on('request', (q) => {
          try {
            if (new URL(q.frame().url()).hostname === 'app.apartamentosbucaramanga.com') return;
            const u = new URL(q.url()); hosts.add(u.hostname);
            if (u.origin === FAB && u.pathname.startsWith('/modelo/api/')) rutas.add(u.pathname.slice('/modelo/api/'.length).split('/')[0]);
          } catch (e) { }
        });
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.ok && r.estado === 'lista', 'entrar como admin → ' + r.observado);
        const t = await p.evaluate(() => { const x = document.getElementById('contenido'); return x ? x.textContent : ''; }).catch(() => '');
        const correos = t.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) || [];
        const tels = t.match(/(\+57\s?)?(?<!\d)3\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g) || [];
        h.espera(t.length > 1000, 'la página trae contenido para revisar: ' + t.length + ' caracteres');
        h.espera(correos.length === 0 && tels.length === 0, 'correos: ' + correos.length + ' · teléfonos: ' + tels.length);
        const ajenos = [...hosts].filter((x) => /(^|\.)(app|pruebas|fabrica)\.apartamentosbucaramanga\.com$|githubusercontent|github\.com$/.test(x));
        h.espera(ajenos.length === 0, 'la página no pide al STR ni a GitHub: ' + (ajenos.join(', ') || 'ninguno'));
        const fuera = [...rutas].filter((x) => !RUTAS.includes(x));
        h.espera(['cambio', 'pedido', 'plan_trabajo'].every((x) => rutas.has(x)) && fuera.length === 0, 'rutas del servicio: ' + [...rutas].sort().join(', ') + ' · fuera de la lista: ' + (fuera.join(', ') || 'ninguna'));
      },
    },
    {
      c: 'e', perfil: 'oper', tec: 'decisión', cubre: ['MOD', 'RT-14'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'El operador queda en «denegada» en proyectos. y no ve nada de lo nuevo',
      async prueba(h) {
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.estado === 'denegada', 'entrar como operador → ' + r.observado);
        const v = await h.page.evaluate(() => ({ oculto: !!(document.getElementById('contenido') || {}).hidden, n: document.querySelectorAll('#contenido [data-bloque]').length })).catch(() => null);
        h.espera(!!v && v.oculto && v.n === 0, 'contenido oculto para el operador: ' + (v && v.oculto) + ' · bloques: ' + (v && v.n));
      },
    },
    {
      c: 'f', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-14'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Sin sesión, el plan del proyecto, los cambios, los pedidos y los planes de trabajo dan 403',
      async prueba(h) {
        const p = h.page;
        for (const ruta of ['complemento?archivo=fabrica/proyecto/P01', 'cambio?limite=1', 'pedido?limite=1', 'plan_trabajo?limite=1']) {
          const r = await p.request.get(FAB + '/modelo/api/' + ruta, { maxRedirects: 0 }).catch(() => null);
          h.espera(!!r && r.status() === 403, 'sin sesión, ' + ruta + ' → ' + (r ? r.status() : 'sin respuesta'));
        }
      },
    },
  ],
};
```

## B4. El commit de este lote (str-manager)
Mensaje con lo de siempre (categoría, Hecho / No hecho por paso, declarados vs tocados, el hash de main de fabrica-servicio) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-175 · LM-79 · Casos de uso: CU-MOD-3.1, CU-MOD-3.2
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por paso (A1–A3, B1–B4) · salidas de A2 (las cuatro líneas de hash, `status --short`, run.js con las líneas de modelo-google parte B y de modelo-lectura F3: cada una «OMITIDA» o en verde) y A3 (ls-remote) tal cual · archivos declarados vs tocados en los dos repos · versión `?v=` igual · hash del commit de str-manager y de main de fabrica-servicio · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
No aceptado el 29-oct a las 22:35 por INC-213 (el plan de P01 daba 422 y la página no toleraba una lectura fallida); arreglado en L-176 y aceptado en la reprueba del 30-oct a las 08:05 (pw 0.15.1). Lecciones: (1) la prueba local tiene que simular el servicio con sus validaciones reales, no solo con sus datos (destino: INC-213); (2) una reprueba se juzga sobre el commit del lote, no sobre lo que vino después (pw 0.15.1, Arquitecto); (3) un lote que agranda una página suma lecturas: pensar desde el principio qué pasa si una falla. Destino: INC-213 y esta sección.
