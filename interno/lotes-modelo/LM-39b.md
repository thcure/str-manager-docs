# LM-39b · Regresión según el riesgo y el mapa, con centinelas y regresión diaria (MJ-2)

Categoría: crítico (cambia qué prueba la cola y añade una corrida que corre sola)
Alcance: interno/mapa-modulos.json (nuevo; escritor: Arquitecto) · herramientas/pw/probar-lote.js · herramientas/pw/centinelas.json (nuevo) · herramientas/pw/pruebas-v1.test.js · herramientas/pw/package.json · herramientas/pw/LEEME.md · herramientas/ejecutar-cola.ps1 (v7.10: regresión diaria) · herramientas/vigilar-buzon.ps1 (si hace falta para el aviso de «rojo nuevo») · herramientas/plantillas/instruccion.md (línea «Regresión») · herramientas/plantillas/revisor-previo.md (punto 14) · interno/proceso.json (l. 958: regresión por módulos) · interno/conocimiento.json (ficha BAI07.05-p) · interno/mejoras.json (MJ-2) · claude/arquitectura/mapa-str.md (apunta a mapa-modulos.json) · interno/lotes-modelo/LM-39b.md · copia en LENOVO (pw, cola)
Reglas transversales que toca: RT-24 (cambia: la regresión deja de ser la zona entera) · RT-23 · RT-4 (mapa-modulos.json es la fuente; mapa-str.md lo explica) · RT-2
Mapa: módulos y relaciones que cambia: ninguno del producto; las vistas 1 y 3 pasan a ser **entrada de la cola** por mapa-modulos.json (ids normalizados: «SH → todos» y «INC1 / M3» se separan)
Riesgo: medio · R-1 (que la selección deje fuera un efecto lateral: REQ-INV2-4-2 c atrapó INC-133 en lotes de K3 que no tocaban inventario). Mitigación: centinelas, páginas visitadas, api/ como capa común, regresión diaria.
Reversión: pw y cola anteriores (v7.9) y `git revert`.
Origen: Carlos 15-oct-2026; LM-38. Requerimiento: interno/mejoras.json › MJ-2. Revisión previa: Desarrollo, M-515.
Depende de: LM-39a aceptado (la diaria usa la cuarentena). El campo `modulos` de los guiones lo fija Desarrollo en un lote de solo guiones **posterior**; mientras tanto pw los **infiere** de las páginas que visita cada caso (tabla página → módulo de mapa-modulos.json) y del nombre; un guion sin módulos inferibles corre siempre (cae a su zona, como hoy).
¿Quién más depende?: el revisor previo (punto 14), Desarrollo al escribir la línea «Mapa:», el juez (lista de guiones no corridos), el vigía (aviso).

## Qué hace
1. **interno/mapa-modulos.json**: módulos (id, nombre), página → módulo, vecinos (vista 3, ids normalizados). Un solo escritor: el Arquitecto, que lo actualiza al aceptarse un lote con «Mapa:» distinto de «ninguno».
2. **Selección**: módulos del lote (línea «Mapa:») + sus vecinos → guiones cuyos `modulos` (declarados ∪ inferidos) los cruzan. Siempre además: **centinelas** (`pw\centinelas.json`: guiones que atraparon un INC real en los últimos 30 días; hoy REQ-INV2-4-2 y REQ-INV2-7-1-hk-turno) en todo lote crítico o que toque `api/`. Capa común (`api/` entero, `str-api.js`, `database.php`, `str-cola-subida.js`, `secrets.php`, shell, portal) → todos. Solo `tests/e2e/` o `herramientas/` → su guion y el humo. «Regresión:» explícita sigue mandando.
3. El informe lista **los guiones no corridos y por qué**.
4. **Regresión diaria** (cola v7.10): cuando la cola quede libre, con tope de 24 h (si no encontró hueco, corre antes del siguiente lote); antes, `limpiar-zz` y `sesiones`; `probar-lote --solo-regresion todas` sobre `main`, sin juez → `log\REGRESION-DIARIA.json`. pw clasifica lo obvio (login, ERR_CONNECTION, firma en cuarentena) y marca **«rojo nuevo»** contra la diaria anterior; la línea de _resumen «REGRESION-DIARIA | rojo nuevo | …» la lleva el vigía a Desarrollo (nadie espera en silencio), que abre INC.

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | pruebas-v1: selección por módulos y vecinos, centinelas, capa común, solo herramientas, guion sin módulos cae a su zona, lista de no corridos, «rojo nuevo» | N1 | Arquitecto · consola | Detener |
| b | Reprueba de L-117 (K3, ya aceptado) con 0.6.x: corre REQ-INV2-4-2 (centinela) y el informe lista los no corridos | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas, limpiar-zz | Volver atrás |
| c | Primera regresión diaria: corre sola, sin juez, y su línea llega por el vigía | N2 | Cola · LENOVO | Corregir |
