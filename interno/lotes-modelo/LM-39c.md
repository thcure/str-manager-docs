# LM-39c · Métricas de calidad de las pruebas (MJ-8)

Categoría: normal (solo lee logs; no cambia qué se prueba ni qué se acepta)
Alcance: herramientas/pw/metricas.js (nuevo) · herramientas/pw/metricas.spec.js (nuevo: envoltorio para correr\metricas.txt) · herramientas/pw/metricas.test.js (nuevo, 4 pruebas) · herramientas/pw/package.json (0.5.34) · herramientas/pw/LEEME.md · interno/proceso.json (revisionSemanal: las métricas) · interno/mejoras.json (MJ-8) · interno/lotes-modelo/LM-39c.md · copia en LENOVO (pw)
Reglas transversales que toca: RT-4 (las métricas se calculan de los logs, no se copian a mano) · RT-2
Mapa: módulos y relaciones que cambia: ninguno
Riesgo: bajo.
Reversión: `git revert` y volver a pw anterior (pw\anterior\: package.json y LEEME); metricas.js deja de correr.
Origen: Carlos 15-oct-2026; LM-38. Requerimiento: interno/mejoras.json › MJ-8. Revisión previa: Desarrollo, M-515.
Depende de: nada; va primero (orden 39c → 39a → 39b → 39d).
Estado: instalado (15-oct 18:20; aprobación: Carlos «dale», 18:00). Prueba b hecha: la cola corrió correr\metricas.txt a las 18:10 y dejó log\METRICAS.json; **línea base semana del 12-oct (LENOVO, todos los logs): 52 lotes con actividad, 80 corridas, 33 repruebas, 43 verdes / 26 rojos (73 % ajenos al lote) / 10 bloqueadas, cola 5,2 min y pw 4,7 min por corrida, 31 veredictos aceptados, 0,7 h construido → aceptado, 0 casos en alerta**. Prueba c: humo-pw verde 18:27. Las columnas de cuarentena y de no corridos salen «n.a.» hasta que existan 39a y 39b.
¿Quién más depende?: la revisión semanal; Seg. Proyecto si Diseño lo pide (REQ aparte).

## Qué hace
`correr\metricas.txt` → `pw\metricas.spec.js` → `metricas.js` lee `log\*-pruebas.json`, `log\*-veredicto*.json` y `log\_resumen.txt` y escribe `log\METRICAS.json` por semana: lotes, corridas de pruebas, repruebas por lote, minutos de cola por corrida (inicio → fin), % de rojos ajenos al lote (cuarentena o campo `herramienta`), **tasa de fallo por caso** con alerta (p. ej., 2 de 5 corridas) y guiones no corridos por la selección.

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | metricas.test.js con logs de ejemplo: cuenta repruebas, minutos y tasa por caso; salta la alerta con 2 fallos de 5 corridas; columnas «n.a.» sin 39a/39b | N1 | Arquitecto · consola | 4/4 (18:10) |
| b | `correr\metricas.txt` sobre los logs reales: **fija la línea base** de la semana del 13-oct (fuente: log\_resumen.txt y log\*-pruebas.json; el conteo a mano del Arquitecto, 30 lotes, 52 corridas, 23 repruebas, se contrasta con lo que salga) | N2 | Cola · LENOVO, sin navegador · precondición: ninguna | Corregir. Ensayo en la nube con la copia de log\ del 15-oct: semana del 12-oct = 52 lotes con actividad, 80 corridas, 33 repruebas, 26 rojos (73 % ajenos al lote), 10 bloqueadas, cola 5,2 min por corrida, 12 aceptados; alerta: REQ-INV2-7-1-hk-turno d falló 6 de 13 (INC-130 cerrado). El conteo a mano quedaba corto: la fuente es la herramienta |
| c | Sin guion nuevo: `humo-pw.spec.js` (zona sesiones; perfiles admin, oper, colab) en verde tras instalar | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas | Volver atrás |
