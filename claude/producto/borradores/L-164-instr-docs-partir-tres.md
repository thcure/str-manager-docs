# instr — L-164 · LM-69: partir `housekeeping.md`, `servidor-php.md` y `tests-y-despliegue.md` (al tope de 60 000) moviendo secciones enteras a tres docs nuevos (CONOCIMIENTO-v1 Cn2)
Categoría: **estándar** (solo documentación de la CLI y un test N1 nuevo que solo lee `docs/claude/`; no toca código ni hooks; orden del Jefe de proyecto M-1064 y M-1066, tanda T-2, segundo tras L-163)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 23/23 · subagente de Desarrollo · 2026-10-21 14:17
Alcance: `docs/claude/housekeeping.md` · `docs/claude/servidor-php.md` · `docs/claude/tests-y-despliegue.md` · `docs/claude/housekeeping-datos.md` (nuevo) · `docs/claude/servidor-php-datos.md` (nuevo) · `docs/claude/modelo.md` (nuevo) · `CLAUDE.md` (§ 2, cinco filas del índice) · `tests/docs-partidos.test.js` (nuevo) · `?v=` igual · `schema_version` igual · sin cambios de base de datos · no toques `tests/claude-md.test.js`
Versión: `?v=` igual · `schema_version` igual
Impacto: los tres docs bajan de ~58–60 mil a 38–42 mil caracteres (tope 60 000 de `claude-md.test.js`), así que el lote que toque su área vuelve a tener sitio; nada se pierde: cada sección movida llega byte a byte (md5 en el N1). Nada cambia para el usuario del STR.
Reglas transversales que toca: ninguna (solo documentación; no toca datos, permisos, archivos, retención ni conexiones)
Mapa: módulos y relaciones que cambia: ninguna (documentación de la CLI)
Casos de uso: técnico, sin caso de uso
Riesgo: bajo (R-1 del lote; no toca ningún módulo del mapa). Mitigación: las secciones se mueven con un script que no reescribe texto y `tests/docs-partidos.test.js` compara su md5.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (vuelven los tres docs enteros y se van los tres nuevos y el test).
Origen: M-1064 y M-1066 (Jefe de proyecto). Requerimiento: `claude/marco/plan-conocimiento.md` Cn2 (paso 4: partir los tres docs de 60 KB con el índice de § 2). Decisión: ninguna (solo documentación; el Alcance no toca áreas de A6).
Depende de: L-163 aceptado (4da4ed2; cabeceras «Al día hasta L-163» que este lote sube a L-164 en los tres docs partidos). Precondiciones para verificar: ninguna (sin guion N2; la cola corre el humo).
¿Quién más depende de lo que cambia?: toda sesión de la CLI (índice de § 2); `tests/claude-md.test.js` (cada doc ≤ 60 000 y enlazado; los tres originales siguen existiendo); `herramientas/modelo/esquema.json › conocimiento.docsCodigo.areas` necesita los tres docs nuevos (HK, SRV, MOD): lo añade el Arquitecto (aviso por el buzón al encolar).

## 0. Contexto
- Lote **solo de documentación** más un test N1 que solo lee `docs/claude/`. No toques código, `tests/claude-md.test.js`, los hooks ni ningún archivo fuera del Alcance.
- Las secciones se mueven **con el script de § 1**, no a mano: no copies, resumas ni reescribas texto de las secciones; el N1 compara el md5 de cada una con el que tenía en `main` 4da4ed2.
- Orden: primero § 1 (script), después los pares de § 2 y § 3, después el test de § 4 y `node tests/run.js`.

## 1. Mover las secciones (script, una sola vez)
Guarda el bloque siguiente como mover-secciones.js en una carpeta l164 dentro de la carpeta temporal del sistema (fuera del repositorio; **no se commitea**) y córrelo desde la raíz del repositorio: `node "$env:TEMP\l164\mover-secciones.js" .` (PowerShell). Primero valida las tres partes y solo después escribe. Debe imprimir tres líneas: housekeeping.md → housekeeping-datos.md con 3 secciones, servidor-php.md → servidor-php-datos.md con 1 y tests-y-despliegue.md → modelo.md con 1. Si lanza un error, no sigas: «No hecho» con el mensaje (no habrá escrito nada; si aun así quedara algo a medias, `git restore` de los tres docs del Alcance y borra los docs nuevos que haya creado). Bórralo al terminar.
```js
// L-164 (CONOCIMIENTO-v1 Cn2): mueve secciones «## …» enteras de un doc de docs/claude/ a un doc nuevo, sin cambiar un byte.
// Uso: node mover-secciones.js <raíz del repositorio>. Sección = desde su línea «## Título» hasta antes de la siguiente «## » (o el final), sin los saltos de línea finales.
'use strict';
const fs = require('fs'), path = require('path');
const raiz = process.argv[2] || '.';
const PARTES = [
  { origen: 'housekeeping.md', destino: 'housekeeping-datos.md',
    cabecera: '# Mapa — Housekeeping: datos del turno\nAl día hasta L-164 · dueño: HK\n\n> Partido de `housekeeping.md` en L-164 (CONOCIMIENTO-v1 Cn2): secciones movidas enteras y literales; las comprueba `tests/docs-partidos.test.js`.',
    titulos: ['## Datos (localStorage) y reglas del turno', '## Movimientos de inventario rechazados (REQ-INV2-4-1, lote L-85)', '## Pendientes del turno (REQ-INV2-3-4 2/2, L-103, DA-33)'] },
  { origen: 'servidor-php.md', destino: 'servidor-php-datos.md',
    cabecera: '# Mapa — Servidor PHP: base de datos, migraciones y crons\nAl día hasta L-164 · dueño: SRV\n\n> Partido de `servidor-php.md` en L-164 (CONOCIMIENTO-v1 Cn2): sección movida entera y literal; la comprueba `tests/docs-partidos.test.js`.',
    titulos: ['## Base de datos, migraciones y crons'] },
  { origen: 'tests-y-despliegue.md', destino: 'modelo.md',
    cabecera: '# Mapa — Servicio del modelo (`modelo/api`)\nAl día hasta L-164 · dueño: MOD\n\n> Partido de `tests-y-despliegue.md` en L-164 (CONOCIMIENTO-v1 Cn2): sección movida entera y literal; la comprueba `tests/docs-partidos.test.js`.',
    titulos: ['## Servicio del modelo (`modelo/api`, REQ-MOD-6 / B7-1 lote L-78 · B7-2 lote L-84 · B7-3 lote L-87 · B7-4 lote L-88 · B7-5a lote L-91 · B7-5b lote L-92 · B7-6 lote L-97)'] },
];
function seccion(t, titulo) {
  const lineas = t.split('\n');
  const i = lineas.indexOf(titulo);
  if (i < 0 || lineas.indexOf(titulo, i + 1) >= 0) throw new Error('título no está una sola vez: ' + titulo);
  let j = i + 1;
  while (j < lineas.length && !lineas[j].startsWith('## ')) j++;
  return { ini: i, fin: j, texto: lineas.slice(i, j).join('\n').replace(/\n+$/, '') };
}
const dir = path.join(raiz, 'docs', 'claude');
// 1) calcula y valida las tres partes sin escribir nada (si algo no cuadra, para antes de tocar un archivo)
const plan = PARTES.map((p) => {
  const ro = path.join(dir, p.origen), rd = path.join(dir, p.destino);
  if (fs.existsSync(rd)) throw new Error('ya existe ' + p.destino);
  let t = fs.readFileSync(ro, 'utf8').replace(/\r\n/g, '\n');
  const movidas = p.titulos.map((ti) => seccion(t, ti).texto);
  for (const ti of p.titulos) {               // quita cada sección con sus líneas en blanco finales
    const lineas = t.split('\n'); const s = seccion(t, ti);
    lineas.splice(s.ini, s.fin - s.ini); t = lineas.join('\n');
  }
  return { p, ro, rd, origen: t.replace(/\n+$/, '') + '\n', destino: p.cabecera + '\n\n' + movidas.join('\n\n') + '\n', movidas };
});
// 2) escribe
for (const x of plan) {
  fs.writeFileSync(x.ro, x.origen);
  fs.writeFileSync(x.rd, x.destino);
  console.log(x.p.origen + ' → ' + x.p.destino + ': ' + x.movidas.length + ' sección(es), ' + x.movidas.reduce((a, s) => a + s.length, 0) + ' caracteres');
}
```

## 2. Cabeceras de los tres docs partidos (L-163 → L-164 y dónde quedó lo movido)

**D1 · línea 2 de housekeeping.md y puntero** (`docs/claude/housekeeping.md`). Busca:
```md
# Mapa — Housekeeping
Al día hasta L-163 · dueño: HK
```
Pon:
```md
# Mapa — Housekeeping
Al día hasta L-164 · dueño: HK

> Partido en L-164 (CONOCIMIENTO-v1 Cn2): «Datos (localStorage) y reglas del turno», «Movimientos de inventario rechazados» y «Pendientes del turno» están en `housekeeping-datos.md`, enteras y literales (`tests/docs-partidos.test.js`).
```

**D2 · línea 2 de servidor-php.md y puntero** (`docs/claude/servidor-php.md`). Busca:
```md
# Mapa — Servidor PHP
Al día hasta L-163 · dueño: SRV
```
Pon:
```md
# Mapa — Servidor PHP
Al día hasta L-164 · dueño: SRV

> Partido en L-164 (CONOCIMIENTO-v1 Cn2): «Base de datos, migraciones y crons» está en `servidor-php-datos.md`, entera y literal (`tests/docs-partidos.test.js`).
```

**D3 · línea 2 de tests-y-despliegue.md y puntero** (`docs/claude/tests-y-despliegue.md`). Busca:
```md
# Mapa — Tests y despliegue
Al día hasta L-163 · dueño: tests/
```
Pon:
```md
# Mapa — Tests y despliegue
Al día hasta L-164 · dueño: tests/

> Partido en L-164 (CONOCIMIENTO-v1 Cn2): «Servicio del modelo» está en `modelo.md`, entera y literal (`tests/docs-partidos.test.js`).
```

## 3. `CLAUDE.md` § 2 (índice)

**P1 · fila de `str-m1-housekeeping.html`** (`CLAUDE.md`). Busca:
```md
| `str-m1-housekeeping.html` | `housekeeping.md` (+ `housekeeping-2.md`:
```
Pon:
```md
| `str-m1-housekeeping.html` | `housekeeping.md` (+ `housekeeping-datos.md`: datos del turno en localStorage, movimientos rechazados, pendientes del turno, L-164; + `housekeeping-2.md`:
```

**P2 · fila de `api/`** (`CLAUDE.md`). Busca:
```md
| `api/` (router `index.php`) · `.htaccess` · base MySQL | `servidor-php.md` |
```
Pon:
```md
| `api/` (router `index.php`) · `.htaccess` · base MySQL | `servidor-php.md` (+ `servidor-php-datos.md`: base de datos, migraciones y crons, L-164) |
```

**P3 · fila de `api/col/` (el merge de turnos y tickets está en «Datos», que se va)** (`CLAUDE.md`). Busca:
```md
| `api/col/` | `servidor-php.md` (+ `housekeeping.md`: merge de turnos/tickets) |
```
Pon:
```md
| `api/col/` | `servidor-php.md` (+ `housekeeping-datos.md`: merge de turnos/tickets) |
```

**P4 · fila de `api/config/` (las migraciones se van con «Base de datos»)** (`CLAUDE.md`). Busca:
```md
| `api/config/` | `servidor-php.md` (migraciones, secretos) |
```
Pon:
```md
| `api/config/` | `servidor-php.md` (secretos) + `servidor-php-datos.md` (migraciones) |
```

**P5 · las tres filas de `modelo/`** (`CLAUDE.md`). Busca:
```md
| `modelo/` (servicio del modelo, `modelo/api`) | `tests-y-despliegue.md` § Servicio del modelo |
| `modelo/api/config/acceso.php` · `modelo/api/config/credenciales.php` | `tests-y-despliegue.md` § Servicio del modelo (roles, `POST credenciales`) |
| `modelo/sql/003_carga.sql` | `tests-y-despliegue.md` § Servicio del modelo (rol `carga`, última carga, esquema 3) |
```
Pon:
```md
| `modelo/` (servicio del modelo, `modelo/api`) | `modelo.md` |
| `modelo/api/config/acceso.php` · `modelo/api/config/credenciales.php` | `modelo.md` (roles, `POST credenciales`) |
| `modelo/sql/003_carga.sql` | `modelo.md` (rol `carga`, última carga, esquema 3) |
```

## 4. Tests en `tests/`
**T1 · archivo nuevo `tests/docs-partidos.test.js`** (N1 de los puntos E1, D1–D3; las filas P1–P5 las cubre `claude-md.test.js`, que exige cada doc enlazado desde el índice y ≤ 60 000). Falla en `HEAD` (las secciones siguen en su doc de origen: 0 OK) y pasa con el lote. Contenido completo:
```js
// L-164 (CONOCIMIENTO-v1 Cn2, LM-69): housekeeping.md, servidor-php.md y tests-y-despliegue.md se partieron moviendo secciones «## …»
// enteras a docs nuevos. Este test comprueba que cada sección llegó byte a byte (md5 tomado de main 4da4ed2, antes de partir),
// que ya no está en el doc de origen y que el doc nuevo abre con «Al día hasta L-n · dueño:» (Cn7). Puntos: E1, D1, D2, D3 aquí; P1, P2, P3, P4, P5 (filas del índice) en claude-md.test.js.
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { leerTexto } = require('./lib/leer-texto.js');

const dir = path.join(__dirname, '..', 'docs', 'claude');
const MOVIDAS = [
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Datos (localStorage) y reglas del turno", md5: 'd47573a81dfc1dc0e95370571a3d7ecb' },
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Movimientos de inventario rechazados (REQ-INV2-4-1, lote L-85)", md5: '466fb56a776777afa0684f534be642db' },
  { origen: "housekeeping.md", destino: "housekeeping-datos.md", titulo: "## Pendientes del turno (REQ-INV2-3-4 2/2, L-103, DA-33)", md5: 'b3a6ffa02a90fea6183f71011e98a9a8' },
  { origen: "servidor-php.md", destino: "servidor-php-datos.md", titulo: "## Base de datos, migraciones y crons", md5: '183bdff859927cf8e2597591742c7827' },
  { origen: "tests-y-despliegue.md", destino: "modelo.md", titulo: "## Servicio del modelo (`modelo/api`, REQ-MOD-6 / B7-1 lote L-78 · B7-2 lote L-84 · B7-3 lote L-87 · B7-4 lote L-88 · B7-5a lote L-91 · B7-5b lote L-92 · B7-6 lote L-97)", md5: 'e5fa1db5327bc665e8a21210b9d44c70' }
];

let ok = 0, fail = 0;
function check(nombre, cond, detalle) {
  cond ? ok++ : fail++;
  console.log((cond ? 'OK   ' : 'FAIL ') + nombre + (cond || detalle === undefined ? '' : ' → ' + JSON.stringify(detalle)));
}
// Sección = desde su línea de título hasta antes de la siguiente «## » (o el final), sin saltos de línea finales.
function seccion(t, titulo) {
  const l = t.split('\n'); const i = l.indexOf(titulo);
  if (i < 0) return null;
  let j = i + 1;
  while (j < l.length && !l[j].startsWith('## ')) j++;
  return l.slice(i, j).join('\n').replace(/\n+$/, '');
}
const leer = (f) => (fs.existsSync(path.join(dir, f)) ? leerTexto(path.join(dir, f)) : null);

for (const m of MOVIDAS) {
  const destino = leer(m.destino), origen = leer(m.origen);
  const corto = m.titulo.slice(3, 50);
  check(m.destino + ' existe', destino !== null);
  const s = destino === null ? null : seccion(destino, m.titulo);
  check(m.destino + ' trae «' + corto + '» (E1)', s !== null);
  check('«' + corto + '» llegó literal (md5)', s !== null && crypto.createHash('md5').update(s, 'utf8').digest('hex') === m.md5, s && crypto.createHash('md5').update(s, 'utf8').digest('hex'));
  check(m.origen + ' ya no trae «' + corto + '» (D)', origen !== null && origen.split('\n').indexOf(m.titulo) < 0);
}
for (const f of [...new Set(MOVIDAS.map((m) => m.destino))]) {
  const t = leer(f) || '';
  check(f + ' abre con título y «Al día hasta L-n · dueño:» (Cn7)', /^# .+\nAl día hasta L-\d+ · dueño: /.test(t));
}
for (const f of [...new Set(MOVIDAS.map((m) => m.origen))]) {
  const t = leer(f) || '';
  check(f + ' dice dónde quedó lo movido (D)', /Partido en L-164/.test(t));
}

console.log(`\n${ok} OK, ${fail} FAIL`);
process.exit(fail ? 1 : 0);
```

## 5. El commit de este lote
Mensaje con lo de siempre (categoría, Hecho / No hecho por punto, declarados vs tocados) y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-164 · LM-69 · Casos de uso: técnico, sin caso de uso
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje. El script de § 1 no entra en el commit.

## Ruta de pruebas (mapa.py --ruta)
```
## Ruta de pruebas (mapa.py --ruta) · lote de solo guiones o herramientas (no toca el producto): corre su guion y el humo; sin ruta ni huecos
- Lote de solo guiones o herramientas: corren herramientas/pw/humo-pw; nada más.
```

## Pruebas derivadas (juez; verificador estándar)
```
- a. `node tests/run.js` en verde con `docs-partidos.test.js` y `claude-md.test.js` OK (cada sección movida con su md5, los tres docs nuevos enlazados desde el índice y ≤ 60 000, conservación ≥ 98 %) · nivel: N1 · perfil: tests/ · precondición: ninguna · espera: los dos tests con 0 FAIL en la salida de `run.js` · **Detener**
- b. Cada par se aplicó literal y el N1 es igual al de la instrucción · nivel: N1 · perfil: tests/ · precondición: a en verde · espera: `aplicar.js` K1 9/9 (D1–D3, P1–P5 y T1) y K2 `tests/docs-partidos.test.js` igual · **Detener**
- c. El commit lleva «Lote: L-164 · LM-69 · Casos de uso: técnico, sin caso de uso» · nivel: N1 · perfil: tests/ · precondición: a y b · espera: `git log -1 --format=%B` la contiene · **Detener**
- d. La CLI y la cola siguen andando · nivel: N2 (humo de la cola, sin guion propio: lote de solo docs y su test) · perfil: cola · precondición: commit hecho · espera: `herramientas/pw/humo-pw` en verde · **Revertir**
```

## Cierre (la CLI lo dice en español al final de su respuesta; la cola lo guarda en `log\NN-<nombre>.txt`, que la CLI no debe abrir)
Hecho / No hecho por punto (§ 1 script con sus tres líneas de salida, D1–D3, P1–P5, T1) · archivos declarados vs tocados (toda diferencia explicada) · versión `?v=` igual · hash del commit · tests: n/n · caracteres de los seis docs tocados · «mapa del área / CLAUDE.md actualizado: sí» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook) · «Reproduce: docs-partidos.test.js 0 OK en HEAD» si lo corriste antes del script.

## Lección
(la llena Desarrollo al cerrar el lote)
