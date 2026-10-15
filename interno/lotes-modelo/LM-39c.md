# LM-39c · Métricas de calidad de las pruebas (MJ-8)

Categoría: normal (solo lee logs; no cambia qué se prueba ni qué se acepta)
Alcance: herramientas/pw/metricas.js (nuevo) · herramientas/pw/package.json · herramientas/pw/LEEME.md · interno/proceso.json (revisionSemanal: las métricas) · interno/mejoras.json (MJ-8) · interno/lotes-modelo/LM-39c.md · copia en LENOVO (pw)
Reglas transversales que toca: RT-4 (las métricas se calculan de los logs, no se copian a mano) · RT-2
Mapa: módulos y relaciones que cambia: ninguno
Riesgo: bajo. Reversión: borrar metricas.js.
Origen: Carlos 15-oct-2026; LM-38. Requerimiento: interno/mejoras.json › MJ-8. Revisión previa: Desarrollo, M-515.
Depende de: nada (puede ir antes que 39a y 39b para tener la línea base medida por la herramienta).
¿Quién más depende?: la revisión semanal; Seg. Proyecto si Diseño lo pide (REQ aparte).

## Qué hace
`correr\metricas.txt` → `pw\metricas.js` lee `log\*-pruebas.json`, `log\*-veredicto*.json` y `log\_resumen.txt` y escribe `log\METRICAS.json` por semana: lotes, corridas de pruebas, repruebas por lote, minutos de cola por corrida (inicio → fin), % de rojos ajenos al lote (cuarentena o campo `herramienta`), **tasa de fallo por caso** con alerta (p. ej., 2 de 5 corridas) y guiones no corridos por la selección.

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | pruebas-v1 con logs de ejemplo: cuenta repruebas, minutos y tasa por caso | N1 | Arquitecto · consola | Detener |
| b | `correr\metricas.txt` sobre los logs reales de la semana del 13-oct: reproduce la línea base (30 lotes, 52 corridas, 23 repruebas) | N2 | Cola · LENOVO (sin navegador) | Corregir |
