# LM-39d · Regresión completa diaria (MJ-2, parte 2)

Categoría: crítico (script que corre solo: la cola)
Alcance: herramientas/ejecutar-cola.ps1 (v7.10) · herramientas/vigilar-buzon.ps1 (relevar «REGRESION-DIARIA | rojo nuevo» a Desarrollo) · herramientas/pw/probar-lote.js (`--solo-regresion todas`, «rojo nuevo» contra la diaria anterior) · herramientas/pw/pruebas-v1.test.js · herramientas/pw/package.json · herramientas/pw/LEEME.md · interno/proceso.json · interno/conocimiento.json (ficha APO01.10-a) · interno/mejoras.json (MJ-2) · claude/arquitectura/reglas-transversales.md (RT-24) · interno/lotes-modelo/LM-39d.md · copia en LENOVO (cola, buzón, pw). Estimado: 2 .ps1 + 3 de pw; una sesión.
Reglas transversales que toca: RT-24 · RT-23 · RT-22 (no llama rutas programadas) · RT-2
Mapa: módulos y relaciones que cambia: ninguno
Riesgo: medio · R-1. Mitigación: sin juez y sin rechazar nada; solo informa y avisa.
Reversión: ejecutar-cola.ps1 v7.9 y vigilar-buzon.ps1 anterior (respaldo en la cola) y `git revert`.
Origen: LM-39b (separado por la revisión de Desarrollo, M-518). Requerimiento: interno/mejoras.json › MJ-2.
Depende de: LM-39b aceptado.
¿Quién más depende?: Desarrollo (recibe el aviso y abre INC), la cuarentena (LM-39a) y las métricas (LM-39c).

## Qué hace
Cuando la cola queda libre y la última diaria tiene más de 24 h (tope: si no hubo hueco, corre antes del siguiente lote): `limpiar-zz` → `sesiones` → `probar-lote --solo-regresion todas` sobre `main`, sin juez → `log\REGRESION-DIARIA.json`. pw clasifica lo obvio (login, ERR_CONNECTION, firma en cuarentena) y marca **«rojo nuevo»** contra la diaria anterior; la cola escribe «REGRESION-DIARIA | rojo nuevo | <guion> <caso>» en _resumen y el vigía lo lleva a Desarrollo (nadie espera en silencio), que abre el INC.

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | pruebas-v1: «rojo nuevo» contra la anterior; orden limpiar-zz → sesiones → regresión; tope de 24 h (corre antes del siguiente lote) | N1 | Arquitecto · consola | Detener |
| b | Sin guion nuevo: `humo-pw.spec.js` (zona sesiones; perfiles admin, oper, colab) en verde tras instalar | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas | Volver atrás |
| c | Primera diaria: corre sola con la cola libre, sin juez, deja log\REGRESION-DIARIA.json y, si hay rojo nuevo, el aviso llega a Desarrollo | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html (todas las zonas) · precondición: cola libre, sesiones vivas, limpiar-zz corrido | Corregir |
