# instr — L-183b · INC-216: el guion LM-79-proyectos h busca los documentos de gobierno de la Fábrica en Proceso de cambios (#cambios), donde los dejó L-183
Categoría: **estándar** (solo un guion del STR; no cambia código de ningún sitio ni del servicio)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: 24/24 · subagente de Desarrollo · 2026-10-30 22:15
Decisión: ninguna (arreglo de guion por INC-216; decisión A del Arquitecto en M-1323 y del Jefe de proyecto en M-1324: lote estándar dentro de la excepción M-1264)
Alcance: en str-manager, `tests/e2e/LM-79-proyectos.spec.js` (caso h, dos pares) y `docs/claude/modelo.md` (puntero, dos pares) · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual · `schema_version` igual · los sitios siguen en `?v=s183`
Origen: INC-216 (veredicto de L-183, 22:04: su único rojo). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`
Impacto: ninguno en lo que se ve: el caso h vuelve a mirar los documentos de gobierno donde están desde L-183 (entrada Proceso de cambios). Con L-183b aceptado, la cola repite pruebas y juez de L-183 (reprobar).
Reglas transversales que toca: ninguna
Mapa: módulos y relaciones que cambia: MOD (solo su guion); ninguna relación nueva
Casos de uso: CU-MOD-3.1, CU-MOD-3.2 (los casos c y d del guion, que corren con el guion entero)
Riesgo: bajo: 4 líneas de un guion, sin código; no puede romper nada que se vea. Conexiones a MySQL (RT-19): las mismas lecturas que ya hace el caso h.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (vuelve el guion a buscar #gobierno).
Paridad (punto 24): (1) código: sin cambios de código (las páginas y el marco quedan como en L-183); (2) no aplica: no traslada nada; h cuenta los documentos fabrica/doc/ en #cambios, más de 0 y todos con texto; (3) nada se ve distinto
Depende de: L-183 construido (str-manager 3909419; fabrica-servicio c0ce17a) · Precondiciones para verificar: perfil zz-verif-admin; sin datos que crear
¿Quién más depende de lo que cambia?: nadie: solo cambia el caso h. Al aceptarse, Desarrollo deja reprobar\L-183.txt para repetir las pruebas y el juez de L-183 con este guion. L-184a ya no trae este par (PR2).

## 0. Contexto
- Dos archivos: dos pares en `tests/e2e/LM-79-proyectos.spec.js` y dos en `docs/claude/modelo.md`. Cada «Busca» aparece una sola vez.
- No abras `database.php`, `credenciales.php` ni ningún `secrets.php`.

## B1. El guion (dos pares)
**PR1 · título del caso h** (`tests/e2e/LM-79-proyectos.spec.js`). Busca:
```js
      que: 'Con la CSP puesta el admin sigue entrando a la Fábrica, y los documentos de gobierno se ven con su título (INC-212)',
      async prueba(h) {
```
Pon:
```js
      que: 'Con la CSP puesta el admin sigue entrando a la Fábrica, y los documentos de gobierno se ven con su título (INC-212; desde L-183 en la entrada Proceso de cambios, INC-216)',
      async prueba(h) {
```

**PR2 · dónde están los documentos** (`tests/e2e/LM-79-proyectos.spec.js`). Busca:
```js
          docs: [...document.querySelectorAll('#gobierno .archivo[data-archivo^="fabrica/doc/"]')].length,
          conMd: [...document.querySelectorAll('#gobierno .archivo[data-archivo^="fabrica/doc/"] .md')].length,
          titulos: [...document.querySelectorAll('#gobierno .archivo > summary')].slice(0, 3).map((s) => s.textContent),
```
Pon:
```js
          docs: [...document.querySelectorAll('#cambios .archivo[data-archivo^="fabrica/doc/"]')].length,
          conMd: [...document.querySelectorAll('#cambios .archivo[data-archivo^="fabrica/doc/"] .md')].length,
          titulos: [...document.querySelectorAll('#cambios .archivo > summary')].slice(0, 3).map((s) => s.textContent),
```

## B2. Mapa del área (docs/claude/modelo.md), dos pares

**D1 · cabecera** (`docs/claude/modelo.md`). Busca:
```md
Al día hasta L-183 · dueño: MOD
```
Pon:
```md
Al día hasta L-183b · dueño: MOD
```

**D2 · guiones** (`docs/claude/modelo.md`). Busca:
```md
desde L-183 paridad-a/b, paginas, sitios y marco abren las páginas de la Fábrica por su entrada.
```
Pon:
```md
desde L-183 paridad-a/b, paginas, sitios y marco abren las páginas de la Fábrica por su entrada, y desde L-183b LM-79-proyectos h mira los documentos de gobierno en Proceso de cambios (#cambios, INC-216).
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

Deuda de cobertura de la ruta: REL-29 (cola-arquitecto→MOD): no aplica, el lote no cambia la carga del Arquitecto; solo dónde el guion busca lo cargado.

## Pruebas derivadas (juez)
```
- h. Con la CSP puesta el admin entra a la Fábrica y los documentos de gobierno se ven con su título, ahora en Proceso de cambios (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: escenario · espera: caso h de tests/e2e/LM-79-proyectos.spec.js en verde · **Revertir**
- c. El admin entra a proyectos. y ve «Lo que te toca», el portafolio y sus partes; la CSP no bloquea nada (CU-MOD-3.2) (siguen en verde: el lote no los toca) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: escenario · espera: caso c del guion en verde · **Detener**
- d. Regla de datos: proyectos. no pide nada al STR y su texto no trae correos ni teléfonos (CU-MOD-3.2) (siguen en verde: el lote no los toca) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: decisión · espera: caso d del guion en verde · **Detener**
- e. El operador queda en «denegada» sin ver el contenido (siguen en verde: el lote no los toca) · nivel: N2 · perfil: zz-verif-oper · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: decisión · espera: caso e del guion en verde · **Detener**
- f. El colaborador queda en «denegada» (siguen en verde: el lote no los toca) · nivel: N2 · perfil: zz-verif-colab · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: decisión · espera: caso f del guion en verde · **Detener**
- g. CSP, nosniff y Referrer-Policy en los dos sitios; proyectos. niega la Fábrica, el servicio y secrets.php (siguen en verde: el lote no los toca) · nivel: N2 · perfil: zz-verif-admin · página: https://proyectos.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: decisión · espera: caso g del guion en verde · **Detener**
- t. str-manager sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (PR1–PR2, D1–D2) · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Resultado esperado del juez: «aceptado».
```

### Guion N2 → `tests/e2e/LM-79-proyectos.spec.js` (la CLI no lo copia: es el archivo como queda tras PR1–PR2; la cola lo compara byte a byte y corre el guion entero)
```js
// LM-79 fase 5.2b (L-173): proyectos. publica Inicio «Lo que te toca» y Proyectos desde fabrica-servicio, y los dos sitios
// llevan CSP, nosniff y Referrer-Policy. El admin de la fábrica entra con Google (h.entrarSitio, pw 0.15.0) y ve las diez
// partes; la página no muestra nada del negocio (M-1186: ni huéspedes ni pagos, ni correos ni teléfonos) y solo lee del
// servicio las tablas de la fábrica; operador y colaborador quedan en «denegada» (RT-14); la Fábrica sigue entrando con
// la CSP puesta. Solo lectura.
const PRO = 'https://proyectos.apartamentosbucaramanga.com';
const FAB = 'https://herramienta-fabrica.apartamentosbucaramanga.com';
const PARTES = 'inicio,proyectos,resumen,alcance,decisiones,construccion,buzon,arquitectura,pruebas,lineabase';
const RUTAS = ['salud', 'decision', 'requisito', 'lote', 'veredicto', 'incidente', 'mensaje', 'riesgo', 'complemento', 'estado', 'cambio', 'pedido', 'plan_trabajo'];

// Avisos de la consola que delatan un bloqueo de la CSP (Chromium: «Refused to … Content Security Policy»)
function vigilarCsp(p) {
  const vistos = [];
  p.on('console', (m) => { const t = m.text(); if (/Content Security Policy|Refused to (load|execute|connect|frame|apply)/i.test(t) && !/Report Only/i.test(t)) vistos.push(t.slice(0, 160)); });
  return vistos;
}

module.exports = {
  req: 'LM-79',
  zona: ['MOD'],
  casos: [
    {
      c: 'c', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'RT-14', 'CU-MOD-3.2'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'El admin de la fábrica entra a proyectos. con Google y ve «Lo que te toca», el portafolio con P01 y las diez partes; la CSP no bloquea nada',
      async prueba(h) {
        const p = h.page;
        const csp = vigilarCsp(p);
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.ok && r.estado === 'lista', 'entrar como admin → ' + r.observado);
        const v = await p.evaluate(() => ({
          partes: [...document.querySelectorAll('section.parte')].map((s) => s.dataset.parte),
          contenido: !(document.getElementById('contenido') || { hidden: true }).hidden,
          proyecto: (document.getElementById('proyecto-activo') || {}).textContent || '',
          inicio: (document.querySelector('#inicio .resumen-inicio') || {}).textContent || '',
          bloques: [...document.querySelectorAll('#inicio .bloque')].map((b) => b.dataset.bloque),
          ver: [...document.querySelectorAll('#proyectos button.ver-proyecto')].map((b) => b.dataset.proyecto),
          pendientes: document.querySelectorAll('#arquitectura .pendiente, #pruebas .pendiente, #lineabase .pendiente').length,
          botones: document.querySelectorAll('#arquitectura .abrir-pagina, #lineabase .abrir-pagina').length,
        })).catch(() => ({ partes: [], contenido: false, proyecto: '', inicio: '', bloques: [], ver: [], pendientes: 0 }));
        h.espera(v.contenido && v.partes.join(',') === PARTES, 'partes visibles: ' + (v.partes.join(', ') || 'ninguna'));
        h.espera(v.proyecto.startsWith('P01 · ') && v.ver.includes('P01'), 'proyecto activo «' + v.proyecto + '» · Ver: ' + (v.ver.join(', ') || 'ninguno'));
        h.espera(/(cosa|cosas) te esperan?\.|Nada te espera\./.test(v.inicio) && v.bloques.join(',') === 'mensajes,decisiones,tareas,lotes,riesgos,criterios', 'Lo que te toca: «' + v.inicio + '» · bloques: ' + v.bloques.join(', '));
        h.espera(v.pendientes === 0 && v.botones === 2, 'nada dice «pendiente» (L-175: Pruebas lleno) y arquitectura y línea base ofrecen su página (L-174): ' + v.pendientes + ' pendiente, ' + v.botones + ' botones');
        h.espera(csp.length === 0, 'bloqueos de la CSP en la consola: ' + (csp.join(' | ') || 'ninguno'));
      },
    },
    {
      c: 'd', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-18', 'CU-MOD-3.2'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Regla de datos: proyectos. no pide nada al STR (app.: ni huéspedes ni pagos), solo lee del servicio las tablas de la fábrica y su texto no trae correos ni teléfonos',
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
        const t = await p.evaluate(() => {
          const x = document.getElementById('contenido');
          return x ? x.textContent : '';
        }).catch(() => '');
        const correos = t.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/gi) || [];
        const tels = t.match(/(\+57\s?)?(?<!\d)3\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g) || [];
        h.espera(t.length > 1000, 'la página trae contenido para revisar: ' + t.length + ' caracteres');
        h.espera(correos.length === 0 && tels.length === 0, 'correos: ' + correos.length + ' · teléfonos: ' + tels.length);
        const ajenos = [...hosts].filter((x) => /(^|\.)(app|pruebas|fabrica)\.apartamentosbucaramanga\.com$|githubusercontent|github\.com$/.test(x));
        h.espera(ajenos.length === 0, 'la página no pide al STR ni a GitHub: ' + (ajenos.join(', ') || 'ninguno') + ' · hosts: ' + [...hosts].sort().join(', '));
        const fuera = [...rutas].filter((x) => !RUTAS.includes(x));
        h.espera(rutas.size > 0 && fuera.length === 0, 'rutas del servicio: ' + [...rutas].sort().join(', ') + ' · fuera de la lista: ' + (fuera.join(', ') || 'ninguna'));
      },
    },
    {
      c: 'e', perfil: 'oper', tec: 'decisión', cubre: ['MOD', 'RT-14'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'El operador del STR entra a proyectos. con Google y queda en «denegada», sin ver el contenido',
      async prueba(h) {
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.estado === 'denegada', 'entrar como operador → ' + r.observado);
        const visto = await h.page.evaluate(() => !(document.getElementById('contenido') || { hidden: true }).hidden).catch(() => null);
        h.espera(visto === false, 'contenido visible para el operador: ' + visto);
      },
    },
    {
      c: 'f', perfil: 'colab', tec: 'decisión', cubre: ['MOD', 'RT-14'], modulos: ['MOD'], pagina: '/portal.html',
      que: 'El colaborador entra a proyectos. con Google y queda en «denegada»',
      async prueba(h) {
        const r = await h.entrarSitio(PRO + '/');
        h.espera(r.estado === 'denegada', 'entrar como colaborador → ' + r.observado);
      },
    },
    {
      c: 'g', perfil: 'admin', tec: 'decisión', cubre: ['MOD', 'RT-18'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Los dos sitios mandan CSP, nosniff y Referrer-Policy; proyectos. abre su sitio en la raíz y niega la Fábrica, el servicio y secrets.php',
      async prueba(h) {
        const p = h.page;
        for (const host of [PRO, FAB]) {
          const r = await p.request.get(host + '/', { maxRedirects: 0 }).catch(() => null);
          const c = r ? r.headers() : {};
          const csp = c['content-security-policy'] || '';
          h.espera(!!r && r.status() === 200 && /script-src 'self' https:\/\/www\.gstatic\.com https:\/\/apis\.google\.com;/.test(csp) && /frame-ancestors 'none'/.test(csp) && !/unsafe-eval/.test(csp),
            host + '/ → ' + (r ? r.status() : 'sin respuesta') + ' · CSP: ' + (csp ? csp.slice(0, 90) + '…' : 'falta'));
          h.espera(c['x-content-type-options'] === 'nosniff' && c['referrer-policy'] === 'strict-origin-when-cross-origin', host + ' nosniff «' + (c['x-content-type-options'] || '') + '» · Referrer-Policy «' + (c['referrer-policy'] || '') + '»');
        }
        const raiz = await p.request.get(PRO + '/', { maxRedirects: 0 }).catch(() => null);
        const html = raiz ? await raiz.text() : '';
        h.espera(html.includes('<title>Proyectos</title>') && html.includes('id="entrar-google"'), 'proyectos./ abre Proyectos: ' + (html.includes('<title>Proyectos</title>') ? 'sí' : 'no'));
        for (const ruta of ['/sitios/fabrica/index.html', '/modelo/api/salud', '/modelo/secrets.php', '/docs/claude/modelo.md', '/tests/run.js']) {
          const r = await p.request.get(PRO + ruta, { maxRedirects: 0 }).catch(() => null);
          h.espera(!!r && r.status() === 403, 'proyectos.' + ruta + ' → ' + (r ? r.status() : 'sin respuesta'));
        }
      },
    },
    {
      c: 'h', perfil: 'admin', tec: 'escenario', cubre: ['MOD', 'CU-MOD-3.1'], modulos: ['MOD'], pagina: '/str-app-shell.html',
      que: 'Con la CSP puesta el admin sigue entrando a la Fábrica, y los documentos de gobierno se ven con su título (INC-212; desde L-183 en la entrada Proceso de cambios, INC-216)',
      async prueba(h) {
        const p = h.page;
        const csp = vigilarCsp(p);
        const r = await h.entrarSitio(FAB + '/');
        h.espera(r.ok && r.estado === 'lista', 'entrar a la Fábrica como admin → ' + r.observado);
        const v = await p.evaluate(() => ({
          docs: [...document.querySelectorAll('#cambios .archivo[data-archivo^="fabrica/doc/"]')].length,
          conMd: [...document.querySelectorAll('#cambios .archivo[data-archivo^="fabrica/doc/"] .md')].length,
          titulos: [...document.querySelectorAll('#cambios .archivo > summary')].slice(0, 3).map((s) => s.textContent),
        })).catch(() => ({ docs: 0, conMd: 0, titulos: [] }));
        h.espera(v.docs > 0 && v.conMd === v.docs, 'gobierno: ' + v.docs + ' documentos, ' + v.conMd + ' con texto · ' + v.titulos.join(' | '));
        h.espera(csp.length === 0, 'bloqueos de la CSP en la consola: ' + (csp.join(' | ') || 'ninguno'));
      },
    },
  ],
};
```

## B3. El commit
Mensaje con lo de siempre y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-183b · INC-216 · Casos de uso: CU-MOD-3.1, CU-MOD-3.2
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre
Hecho / No hecho por paso (B1–B3) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
