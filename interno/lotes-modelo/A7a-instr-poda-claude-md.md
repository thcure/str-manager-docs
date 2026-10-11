# instr — REQ-MOD-5 / A7a: CLAUDE.md podado con mapas por área
Categoría: **crítico** (reestructura el CLAUDE.md de 244 KB que lee la CLI en todos los lotes; DA-31 · cruce previo con Carlos: 11-oct-2026 13:58, chat del Arquitecto («a7 cruzado»); lote del modelo LM-7a; lo redacta el Arquitecto)
Alcance: `CLAUDE.md` · `docs/claude/` (carpeta nueva: `reglas-fijas.md` y un mapa por área) · `tests/claude-md.test.js` · `tests/run.js` (solo si registra tests por lista) · **sin cambio de `?v=`** (no se toca ningún HTML ni JS de la aplicación) · `schema_version` igual · sin cambios de base de datos ni de datos
Impacto: CLAUDE.md pasa de 244 KB a ≤ 12 000 caracteres (reglas fijas + índice + versión); el detalle vive en `docs/claude/` por área y la CLI lee solo el mapa del área que toca. Nada se resume ni se pierde: se mueve.
Riesgo: medio (R-A): perder una nota técnica al mover. Mitigación: copia literal por bloques, test de conservación (≥ 90 % de los caracteres), y `git revert` devuelve el archivo entero.
¿Datos personales o dinero?: no · ¿Normativa?: no · ¿Toca el modelo (capa Marco)?: sí: es un lote del modelo (LM-7); la CLI lo ejecuta porque los archivos viven en `str-manager`
Origen: PT-M1 ítem A7; situaciones G-8, G-9, G-16, G-17, G-25, G-29, G-35. Requerimiento: `claude/marco/requerimientos-modelo-2026-10.md` › REQ-MOD-5. Decisión: DA-31 (visto bueno a A7a/A7b) + LM-7 en `interno/lotes-modelo/LM-7.md` + cruce de Carlos.
¿Quién más depende de lo que cambia?: el Agente verificador lee `CLAUDE.md` («actualizado en el mismo commit») → desde A7a vale `CLAUDE.md` **o** `docs/claude/*.md` (nota en CLAUDE.md § 0; el Arquitecto lo lleva al texto de las tareas en la próxima edición agrupada). Antes de editar, busca en `tests/`, `ejecutar-cola.ps1` (en la cola) y `.github/` quién más lee `CLAUDE.md` por ruta y anótalo en el log; si algo lo parsea, no cambies lo que ese lector espera.
Reversión: `git revert <hash>`
Depende de: nada.
Precondiciones para verificar: ninguna en el navegador; todo se comprueba con archivos y tests.

## 1. `docs/claude/` — mover, no borrar
Mide y anota el tamaño actual de `CLAUDE.md` (caracteres). Crea `docs/claude/` y reparte el contenido actual en mapas por área, **copiando los bloques tal cual** (hazlo con un script de node de un solo uso que corte por títulos y escriba cada mapa: es literal y rápido; el script no se commitea) (sin resumir ni reescribir; se permite quitar duplicados exactos y cambiar niveles de título):
- `reglas-fijas.md` (≤ 3 000 caracteres): las reglas que valen para todo lote: ediciones quirúrgicas; migración al leer; `?v=` y `STR_API_VERSION` suben cuando cambia un HTML o JS; `node tests/run.js` en verde; un solo commit a `main` con «Hecho / No hecho» por punto y «declarados vs tocados»; mapa del área actualizado en el mismo commit; nunca datos reales; un bloqueo del modo automático no se rodea: «No hecho» con la causa; prefijo `modelo:` solo para la capa Marco.
- Un mapa por área, con estos nombres: `shell-y-api.md` (str-app-shell, str-api.js, login, invitacion, portal) · `calendario.md` · `propiedades.md` · `flujos.md` · `housekeeping.md` (str-m1-housekeeping, cola de subida, guía visor) · `inventario.md` · `usuarios-y-roles.md` · `proyecto.md` (seg-proyecto, elementos, cobit, conocimiento, base-conocimiento, marco-trabajo, instrucciones, nomenclatura) · `servidor-php.md` (api/, .htaccess, base de datos, despliegue) · `tests-y-despliegue.md` · `historial.md` (notas de lotes pasados, INC cerrados y decisiones técnicas que no son de ningún área).
- Cada mapa ≤ 60 000 caracteres; si un área no cabe, `<area>-2.md` enlazado desde el índice.

## 2. `CLAUDE.md` nuevo (≤ 12 000 caracteres)
En este orden: § 0 «Cómo usar este archivo» (lee `docs/claude/reglas-fijas.md` siempre y el mapa del área que vas a tocar antes de editar; el mapa se actualiza en el mismo commit; nota para el verificador: «CLAUDE.md actualizado» = CLAUDE.md o el mapa del área) · § 1 reglas fijas (el mismo texto que `reglas-fijas.md`) · § 2 índice: tabla archivo/carpeta → mapa (una fila por cada `*.html`, `*.js`, `api/<carpeta>/`, `tests/`) · § 3 versión actual (`?v=`, `STR_API_VERSION`, `schema_version`) y la línea de INC-37 · § 4 patrón del mensaje de commit. Nada más.

## 3. Test `tests/claude-md.test.js`
Comprueba: `CLAUDE.md` ≤ 12 000 caracteres; `docs/claude/reglas-fijas.md` existe y ≤ 3 000; cada `str-*.html`, cada `*.js` de la raíz y cada carpeta de `api/` aparece en el índice; cada mapa ≤ 60 000; conservación: caracteres de `CLAUDE.md` + `docs/claude/*.md` ≥ 90 % del tamaño medido en el punto 1 (`const ANTES = <n>` en el test).

## 4. Tests
`node tests/run.js` en verde con `claude-md.test.js` incluido.

## 5. Pruebas derivadas (verificador crítico; sin navegador)
- a. `node tests/run.js` en verde, incluido claude-md.test.js · perfil: tests/ · espera: log con n/n · **Detener**
- b. `CLAUDE.md` ≤ 12 000 caracteres; su índice nombra cada `str-*.html` del repo; existe `docs/claude/reglas-fijas.md` · perfil: archivos · **Detener**
- c. Ningún HTML ni JS de la aplicación cambió («declarados vs tocados» solo lista el Alcance) y `?v=` sigue igual · perfil: archivos · **Detener**
- d. Conservación: el log dice tamaño antes y después y la suma de `docs/claude/*.md` + `CLAUDE.md` es ≥ 90 % del tamaño anterior · perfil: archivos · **Detener**

## Cierre (lo escribe la CLI en `log\NN-poda-claude-md.txt`)
Hecho / No hecho por apartado · declarados vs tocados · tamaño de CLAUDE.md antes y después · mapas creados con su tamaño · quién más lee CLAUDE.md · tests n/n · hash.
