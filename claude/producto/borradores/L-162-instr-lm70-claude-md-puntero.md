# instr — L-162 · LM-70: `CLAUDE.md` § 1 pasa a ser un puntero a `docs/claude/reglas-fijas.md` (ya las inyecta `ctx.js`); `tests/claude-md.test.js` v2 lo comprueba; CLAUDE.md baja de 11 981 a ~9 800 caracteres
Categoría: **crítico** (toca `tests/claude-md.test.js`, prueba de la fábrica, y la sección de reglas de `CLAUDE.md`; lote del modelo LM-70; cruce previo con Carlos: 21-oct-2026 12:46, chat del Arquitecto, «ok» a CONOCIMIENTO-v1 v2 con la poda de § 1 vía LM-70; datos y vía de Desarrollo en M-1044)
Commit: la CLI (el Alcance no toca `.claude/` ni `tests/hooks.test.js`) · fuente única del test: `str-manager-docs/herramientas/hooks-cli/claude-md.test.js` (md5 `3b365d147bd3d0c0123d7fb6dad93912`, 3791 bytes) · revisión previa: Desarrollo (M-1053, 17/23 → corregida; segunda pasada pendiente) y revisión del Jefe de proyecto por ser crítico
Alcance: `CLAUDE.md` (§ 0: una viñeta; § 1: el apartado entero, § 1) · `tests/claude-md.test.js` (archivo completo, § 2) · `?v=` igual · `schema_version` igual · sin cambios de base de datos (lo que no se toca, en § 0)
Versión: `?v=` igual · `schema_version` igual
Impacto: la CLI deja de cargar dos veces las 13 reglas fijas (una en `CLAUDE.md` § 1 y otra inyectada por `ctx.js`): ahorra ~2 200 caracteres de contexto por lote y deja `CLAUDE.md` en ~9 800 (tope 12 000; meta 9 000 con el lote estándar de docs que viene después). Nada cambia para el usuario del STR ni para la cola: `ctx.js` sigue inyectando `reglas-fijas.md` al arrancar y tras compactar, y `reglas-fijas.md` no se toca.
Reglas transversales que toca: RT-20 (versión igual, declarada) · RT-23 (crítico = cruce con Carlos, citado)
Mapa: módulos y relaciones que cambia: ninguna (documentación de la CLI y prueba de la fábrica)
Casos de uso: técnico, sin caso de uso
Riesgo: bajo (R-1): si `ctx.js` dejara de inyectar las reglas, la CLI quedaría sin ellas; mitigación: `ctx.js` no se toca, `hooks.test.js` (38) las cubre, y el cierre de este lote cita la primera línea inyectada («Reglas fijas recibidas al arrancar: sí»).
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no (lote del modelo LM-70, cruce de Carlos citado; solo toca `CLAUDE.md` y `tests/` de este repositorio)
Reversión: `git revert <hash>` (vuelve § 1 completo y el test v1).
Origen: `claude/marco/plan-conocimiento.md` Cn2 (Arquitecto). Requerimiento: `interno/lotes-modelo/LM-70.md`. Decisión: ninguna (lote del modelo LM-70: solo documentación de la CLI y su test; no cambia ADR ni DA; cruce de Carlos 21-oct 12:46).
Depende de: nada (L-160 y L-161 ya están en `main`; el hook v5 rige: el commit lleva la línea de trazabilidad, § 4).
Precondiciones para verificar: ninguna (sin guion N2; la cola corre humo-pw por ser lote de solo documentación y tests).
¿Quién más depende de lo que cambia?: toda sesión de la CLI (lee `CLAUDE.md` al arrancar); `tests/run.js` corre `claude-md.test.js`; el lote estándar de docs que viene después (§ 0, § 3, § 5, cabeceras «Al día hasta L-n») parte de este estado; `herramientas/hooks-cli/claude-md.test.js` del repo de documentos queda como fuente (escritor: Arquitecto).

## 0. Contexto
- **No toques** `docs/claude/reglas-fijas.md`, `.claude/hooks/*`, `tests/hooks.test.js` ni ningún otro archivo.
- La regla 7 de `reglas-fijas.md` dice que `CLAUDE.md` § 1 es «estas reglas»: desde este lote § 1 **apunta** a `reglas-fijas.md` y no las copia; la inyección de `ctx.js` es la que vale (ya lo era).

## 1. `CLAUDE.md` — § 0 y § 1
**P0 · viñeta de § 0.** Busca:
```md
- Lee **siempre** `docs/claude/reglas-fijas.md` (es el mismo texto de § 1) y, **antes de editar**, el mapa del área que vas a tocar (índice en § 2).
```
Pon:
```md
- Las reglas fijas (`docs/claude/reglas-fijas.md`) te las inyecta `ctx.js`; § 1 solo apunta a ellas. **Antes de editar**, lee el mapa del área que vas a tocar (índice en § 2).
```

**P1 · `CLAUDE.md` § 1 entero** (el apartado completo, desde el título hasta la regla 13 inclusive). Busca:
```md
## 1. Reglas fijas

1. **Cabecera primero.** Categoría crítica sin cruce previo con Carlos, o «¿Toca el modelo?: sí» → terminar sin commit y explicar por qué. Excepción: lotes `LM-n` que citen la DA y el cruce de Carlos y solo toquen archivos de este repo (los redacta el Arquitecto y llevan «no» en ese campo con la aclaración).
2. **Ediciones quirúrgicas** por búsqueda de texto exacto; no reescribir archivos completos. No inventar funciones: buscar la existente antes de crear otra.
3. **Migración al leer:** todo campo nuevo trae default y los datos viejos del usuario siguen funcionando.
4. **Versión:** si cambia un HTML o JS de la aplicación, suben a la vez `?v=` (en todos los lugares) y `STR_API_VERSION` (INC-37, CLAUDE.md § 3).
5. **Tests en verde:** `node tests/run.js` antes del commit; si falla, no hay commit y se reporta. Si cambias lógica cubierta, agrega casos (los ports de PHP viven en `tests/lib/port-col.js`).
6. **Un solo commit a `main`** por lote (rama `claude/*` → `merge --ff-only` a `main` y `git push origin main`; nunca PR). Mensaje `feat(...)`/`fix(...)` en español con los REQ/INC, la categoría, «Hecho / No hecho» por punto y «declarados vs tocados» (explica cualquier diferencia).
7. **Mapa del área** (`docs/claude/<área>.md`, o `CLAUDE.md` si es del índice o de estas reglas) actualizado en el mismo commit; es criterio de cierre.
8. **Nunca datos reales** (huéspedes, teléfonos, correos, claves, tokens) en código, tests, docs ni commits.
9. **Un bloqueo del modo automático no se rodea:** va en «No hecho» con la causa. Un punto que no se puede cumplir tal cual, igual: «No hecho» con la causa, sin improvisar. Si el hook bloquea un comando, no lo rodees con otro que haga lo mismo (`git show … > archivo`, `cp`, `cat …`): usa la vía permitida (`git restore <archivo del Alcance>`) o dilo en el cierre y para.
10. **Prefijo `modelo:`** en el commit solo para la capa Marco.
11. Prohibido `alert()`, `confirm()`, `prompt()`: reutilizar el modal del archivo. Verificar la sintaxis de cada `<script>` sin `src` con `new Function(...)` (el bloque con `import` de Firebase falla: esperado).
12. Al terminar: hash de `main` + resumen corto. No preguntar; decidir con estas reglas.
13. **El mensaje del commit lleva la línea de trazabilidad** `Lote: L-n · <REQ-X-n | INC-n | DT-n | LM-n> [· DA-n] · Casos de uso: <CU-… | técnico, sin caso de uso>`, copiada de la cabecera de la instrucción (lote del nombre del archivo, id del título, DA y línea «Casos de uso:»), en un `-m` propio, el último; si va `Co-Authored-By`, en ese mismo `-m`, en la línea siguiente; el hook la exige dentro de la cola (K5, LM-64).
```
Pon:
```md
## 1. Reglas fijas

Las reglas fijas viven en `docs/claude/reglas-fijas.md` (fuente única, tope 3 000 caracteres, 13 reglas): el hook `ctx.js` te las inyecta completas al arrancar y después de cada compactación, así que ya las tienes en el contexto; léelas ahí si te hace falta volver a verlas. Este apartado no las copia (LM-70, CONOCIMIENTO-v1): `tests/claude-md.test.js` comprueba que apunte a ese archivo y que no lo duplique.
```

## 2. El test de la fábrica, archivo completo (v2.1)
Es el mismo test v1 con el check de § 1 cambiado: ya no exige que § 1 sea igual a las reglas, sino que § 1 apunte al archivo de reglas y a `ctx.js` y que la regla 2 no esté copiada; añade una línea informativa con el tamaño. Reemplaza el archivo entero. **Archivo:** `tests/claude-md.test.js`. Contenido completo:
```js
// REQ-MOD-5 / A7a (lote 70): CLAUDE.md podado + mapas por área en docs/claude/.
// Vigila tamaños, que el índice nombre cada archivo/carpeta y que no se haya perdido contenido al mover.
// v2.1 (LM-70, 21-oct-2026; revisión previa de Desarrollo M-1053): § 1 es un puntero a reglas-fijas.md, no una copia; fuente: str-manager-docs/herramientas/hooks-cli/claude-md.test.js.
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');
const path = require('path');

const raiz = path.join(__dirname, '..');
const ANTES = 239539; // caracteres de CLAUDE.md antes del lote 70 (9fa6948)

let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}
const leer = f => leerTexto(path.join(raiz, f));

const claude = leer('CLAUDE.md');
check('CLAUDE.md ≤ 12 000 caracteres', claude.length <= 12000, claude.length);

const dirDocs = path.join(raiz, 'docs', 'claude');
const reglasPath = path.join(dirDocs, 'reglas-fijas.md');
check('docs/claude/reglas-fijas.md existe', fs.existsSync(reglasPath));
const reglas = fs.existsSync(reglasPath) ? leerTexto(reglasPath) : '';
check('reglas-fijas.md ≤ 3 000 caracteres', reglas.length > 0 && reglas.length <= 3000, reglas.length);
// LM-70 (CONOCIMIENTO-v1 Cn2): § 1 ya no copia las reglas (ctx.js las inyecta al arrancar y tras compactar); solo apunta a ellas.
const i1 = claude.indexOf('## 1.');
const sec1 = i1 >= 0 ? claude.slice(i1, claude.indexOf('\n## ', i1 + 5)) : '';
check('CLAUDE.md tiene § 1', sec1.length > 0);
check('§ 0 dice que ctx.js inyecta las reglas (P0)', claude.includes('te las inyecta `ctx.js`'));
check('§ 1 apunta a docs/claude/reglas-fijas.md y a ctx.js (P1)', sec1.includes('docs/claude/reglas-fijas.md') && sec1.includes('ctx.js'));
const lineasReglas = reglas.split('\n').filter(l => /^\d+\. .{20,}/.test(l)).map(l => l.trim());
check('§ 1 no copia las reglas: ninguna de las 13 está en CLAUDE.md (P1)', lineasReglas.length >= 13 && lineasReglas.every(l => !claude.includes(l)), lineasReglas.filter(l => claude.includes(l)).length);
check('CLAUDE.md: ' + claude.length + ' caracteres (meta Cn2 ≤ 9 000; informativo hasta el lote estándar de docs)', true);

const idx = claude.indexOf('## 2.');
const indice = idx >= 0 ? claude.slice(idx, claude.indexOf('\n## ', idx + 5)) : '';
check('CLAUDE.md tiene § 2 índice', indice.length > 0);

const raizArchivos = fs.readdirSync(raiz);
for (const f of raizArchivos.filter(f => /^str-.*\.html$/.test(f) || /\.js$/.test(f))) {
  check('índice nombra ' + f, indice.includes('`' + f + '`'));
}
const api = path.join(raiz, 'api');
for (const d of fs.readdirSync(api).filter(d => fs.statSync(path.join(api, d)).isDirectory())) {
  check('índice nombra api/' + d + '/', indice.includes('`api/' + d + '/`'));
}
check('índice nombra tests/', indice.includes('`tests/`'));

const mapas = fs.readdirSync(dirDocs).filter(f => f.endsWith('.md'));
let total = claude.length;
for (const m of mapas) {
  const s = leerTexto(path.join(dirDocs, m));
  total += s.length;
  if (m !== 'reglas-fijas.md') {
    check(m + ' ≤ 60 000 caracteres', s.length <= 60000, s.length);
    check(m + ' enlazado desde el índice', indice.includes('`' + m + '`'));
  }
}
const esperados = ['shell-y-api', 'calendario', 'propiedades', 'flujos', 'housekeeping', 'inventario',
  'usuarios-y-roles', 'proyecto', 'servidor-php', 'tests-y-despliegue', 'historial'];
for (const e of esperados) check('existe docs/claude/' + e + '.md', mapas.includes(e + '.md'));
check('conservación ≥ 98 % (' + total + ' / ' + ANTES + ')', total >= ANTES * 0.98, total);

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

## 4. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-162 · LM-70 · Casos de uso: técnico, sin caso de uso
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Tests en `tests/`
`node tests/run.js` en verde; `claude-md.test.js` con sus checks nuevos en OK («§ 0 dice que ctx.js inyecta las reglas (P0)», «§ 1 apunta a docs/claude/reglas-fijas.md y a ctx.js (P1)», «§ 1 no copia las reglas: ninguna de las 13 está en CLAUDE.md (P1)») y «conservación ≥ 98 %» en OK (la poda quita ~2 200 de ~420 000 en total).

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos
- Lote de solo guiones o herramientas: corren herramientas/pw/humo-pw; nada más.
```

## Pruebas derivadas (juez; verificador estándar)
```
- a. `node tests/run.js` en verde con `claude-md.test.js` OK · nivel: N1 · perfil: tests/ · precondición: ninguna · espera: `claude-md.test.js` n OK, 0 FAIL en la salida de `run.js` · **Detener**
- b. `CLAUDE.md` § 1 es el puntero y § 0 trae la viñeta nueva · nivel: N1 · perfil: tests/ · precondición: a en verde · espera: `aplicar.js` K1 3/3 (P0, P1, `tests/claude-md.test.js`) y K2 igual; el tamaño de `CLAUDE.md` lo da el cierre (no se juzga) · **Detener**
- c. El commit lleva «Lote: L-162 · LM-70 · Casos de uso: técnico, sin caso de uso» · nivel: N1 · perfil: tests/ · precondición: a y b · espera: `git log -1 --format=%B` la contiene · **Detener**
- d. La CLI y la cola siguen andando · nivel: N2 (humo de la cola, sin guion propio: lote de solo docs y tests) · perfil: cola · precondición: commit hecho · espera: `herramientas/pw/humo-pw` en verde · **Revertir**
- Datos de prueba: ninguno nuevo.
```

## Cierre (en español, al final de tu respuesta)
Hecho / No hecho por apartado (P0, P1, § 2, § 4) · tamaño de `CLAUDE.md` antes y después (caracteres) · tests: n/n · archivos declarados vs tocados · hash del commit · la línea de trazabilidad tal como quedó · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó `ctx.js`: es la prueba de que el puntero basta).
