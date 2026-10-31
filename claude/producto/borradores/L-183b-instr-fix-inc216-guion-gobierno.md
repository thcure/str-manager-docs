# instr — L-183b · INC-216: el guion LM-79-proyectos h busca los documentos de gobierno de la Fábrica en Proceso de cambios (#cambios), donde los dejó L-183
Categoría: **estándar** (solo un guion del STR; no cambia código de ningún sitio ni del servicio)
Commit: la CLI (el Alcance no nombra la carpeta de los hooks ni `tests/hooks.test.js`)
Revisión previa: pendiente
Decisión: ninguna (arreglo de guion por INC-216; decisión A del Arquitecto en M-1323 y del Jefe de proyecto en M-1324: lote estándar dentro de la excepción M-1264)
Alcance: en str-manager, `tests/e2e/LM-79-proyectos.spec.js` (caso h, dos pares) y `docs/claude/modelo.md` (puntero, dos pares) · `?v=` del STR igual · `schema_version` igual · no toques nada más de str-manager
Versión: `?v=` del STR igual · `schema_version` igual · los sitios siguen en `?v=s183`
Origen: INC-216 (veredicto de L-183, 22:04: su único rojo). Requerimiento: LM-79 fase 5.6 en `interno/lotes-modelo/LM-79.md`
Impacto: ninguno en lo que se ve: el caso h vuelve a mirar los documentos de gobierno donde están desde L-183 (entrada Proceso de cambios). Con L-183b aceptado, la cola repite pruebas y juez de L-183 (reprobar).
Reglas transversales que toca: ninguna
Mapa: módulos y relaciones que cambia: MOD (solo su guion); ninguna relación nueva
Casos de uso: CU-MOD-3.1
Riesgo: bajo: 4 líneas de un guion, sin código; no puede romper nada que se vea. Conexiones a MySQL (RT-19): las mismas lecturas que ya hace el caso h.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: no
Reversión: `git revert <hash>` (vuelve el guion a buscar #gobierno).
Paridad (punto 24): (1) código: sin cambios de código (las páginas y el marco quedan como en L-183); (2) el guion compara contra el origen leído del servicio: los documentos fabrica/doc/proceso-cambios* que carga el Arquitecto, con su texto; (3) nada se ve distinto
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

## B2. Tests
Mapa del área, dos pares más:

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

`node tests/run.js` en verde (84/84; `e2e-esquema` carga el guion ajustado).

## Pruebas derivadas (juez)
```
- h. Con la CSP puesta el admin entra a la Fábrica y los documentos de gobierno se ven con su título, ahora en Proceso de cambios (CU-MOD-3.1) · nivel: N2 · perfil: zz-verif-admin · página: https://herramienta-fabrica.apartamentosbucaramanga.com/ (el arnés arranca en https://app.apartamentosbucaramanga.com/str-app-shell.html) · precondición: L-183 desplegado · tec: escenario · espera: caso h de tests/e2e/LM-79-proyectos.spec.js en verde · **Revertir**
- t. str-manager sigue en verde · nivel: N1 · perfil: tests/ · precondición: ninguna · tec: escenario · espera: `node tests/run.js` 84/84; `aplicar.js` K1 en verde (PR1–PR2, D1–D2) · **Detener**
- Datos de prueba: ninguno (solo lectura)
- Resultado esperado del juez: «aceptado».
```

## B3. El commit
Mensaje con lo de siempre y la línea de trazabilidad en un `-m` propio, el último, con el Co-Authored-By en la línea siguiente (hook v5):
```
git commit -m "<mensaje de siempre>" -m "Lote: L-183b · INC-216 · Casos de uso: CU-MOD-3.1
Co-Authored-By: <como siempre>"
```
Sin comillas dobles, comillas invertidas ni `$` dentro del mensaje.

## Cierre
Hecho / No hecho por paso (B1–B3) · archivos declarados vs tocados · versión `?v=` igual · hash del commit · tests: n/n · «mapa del área / CLAUDE.md actualizado: sí (modelo.md)» · «Reglas fijas recibidas al arrancar: sí/no» (cita la primera línea que te inyectó el hook).

## Lección
(la llena Desarrollo al cerrar el lote)
