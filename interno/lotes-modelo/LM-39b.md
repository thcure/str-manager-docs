# LM-39b · Regresión según el riesgo y el mapa, con centinelas (MJ-2)

Categoría: crítico (cambia qué prueba la cola)
Alcance: interno/mapa-modulos.json (ya existe desde LM-40; escritor: Arquitecto) · herramientas/modelo/ruta.js (copiado a pw\ruta.js por la cola; la misma función que usa mapa.py --ruta y el mapa gráfico, LM-41) · herramientas/pw/probar-lote.js · herramientas/pw/centinelas.json (nuevo) · herramientas/pw/pruebas-v1.test.js · herramientas/pw/package.json · herramientas/pw/LEEME.md · herramientas/plantillas/instruccion.md (línea «Regresión») · herramientas/plantillas/revisor-previo.md (punto 14) · interno/proceso.json (l. 958: regresión por módulos) · interno/conocimiento.json (ficha BAI07.05-p) · interno/mejoras.json (MJ-2) · claude/arquitectura/mapa-str.md (apunta a mapa-modulos.json) · claude/arquitectura/reglas-transversales.md (RT-24 y fila de historial) · interno/lotes-modelo/LM-39b.md · copia en LENOVO (pw). Estimado: ~10 archivos, sin .ps1 (la regresión diaria va en LM-39d)
Reglas transversales que toca: RT-24 (cambia: la regresión deja de ser la zona entera) · RT-23 · RT-4 (mapa-modulos.json es la fuente; mapa-str.md lo explica) · RT-2
Mapa: módulos y relaciones que cambia: ninguno del producto; las vistas 1 y 3 pasan a ser **entrada de la cola** por mapa-modulos.json (ids normalizados: «SH → todos» y «INC1 / M3» se separan)
Riesgo: medio · R-1 (que la selección deje fuera un efecto lateral: REQ-INV2-4-2 c atrapó INC-133 en lotes de K3 que no tocaban inventario). Mitigación: centinelas, páginas visitadas, capa común completa, regresión diaria (LM-39d).
Reversión: pw y cola anteriores (v7.9) y `git revert`.
Origen: Carlos 15-oct-2026; LM-38. Requerimiento: interno/mejoras.json › MJ-2. Revisión previa: Desarrollo, M-515.
Depende de: LM-40 y LM-41 instalados (mapa-modulos.json, ruta.js); LM-39a aceptado. El campo `cubre` de los casos lo anota Desarrollo en un lote de solo guiones (antes o después); sin `cubre`, ruta.js usa los módulos del guion (anclaje por REQ, M-520, o por página); un guion sin módulos corre siempre (cae a su zona, como hoy). `zona` admite lista de ids de módulo; «sesiones» sigue como zona especial.
¿Quién más depende?: el revisor previo (punto 14), Desarrollo al escribir la línea «Mapa:», el juez (lista de guiones no corridos), el vigía (aviso).

## Qué hace
1. **interno/mapa-modulos.json**: módulos (id, nombre), página → módulo, vecinos (vista 3, ids normalizados). Un solo escritor: el Arquitecto, que lo actualiza al aceptarse un lote con «Mapa:» distinto de «ninguno».
2. **Selección** = `ruta.js` (LM-41): módulos del lote (archivos del Alcance por `archivoModulo`, línea «Mapa:», REQ) → relaciones y reglas de la ruta → corren los casos cuyo `cubre` (o los módulos del guion) cae en la ruta; el informe trae la ruta y los huecos. Siempre además: **centinelas** (`pw\centinelas.json`: guiones que atraparon un INC real de la app en los últimos 30 días; hoy REQ-INV2-4-2 y REQ-INV2-7-1-hk-turno) en todo lote crítico o que toque la capa común (la misma lista de abajo, incluidos `database.php` y `secrets.php`). Escritor único de centinelas.json: el Arquitecto; entra un guion cuando un INC de la app lo atrapa (lo informa el juez o Desarrollo) y sale a los 30 días sin atrapar otro (lo revisa en la revisión semanal). Capa común (`api/` entero, `str-api.js`, `database.php`, `str-cola-subida.js`, `secrets.php`, shell, portal) → todos. Solo `tests/e2e/` o `herramientas/` → su guion y el humo. «Regresión:» explícita sigue mandando.
3. El informe lista **los guiones no corridos y por qué**.
4. La regresión completa diaria va en **LM-39d** (cola y vigía), para no mezclar dos .ps1 con este cambio de pw.

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | pruebas-v1: selección por módulos y vecinos, centinelas (lote crítico, capa común con database.php y secrets.php), solo herramientas, guion sin módulos cae a su zona, lista de no corridos | N1 | Arquitecto · consola | Detener |
| a2 | Sin guion nuevo: `humo-pw.spec.js` (zona sesiones; perfiles admin, oper, colab) en verde tras instalar | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas | Volver atrás |
| b | Reprueba de L-117 (K3, ya aceptado) con 0.6.x: corre REQ-INV2-4-2 (centinela) y el informe lista los no corridos | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas, limpiar-zz | Volver atrás |
