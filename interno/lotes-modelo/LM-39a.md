# LM-39a · Cuarentena de rojos conocidos de la regresión (MJ-1)

Categoría: crítico (cambia lo que rechaza un lote: cola y juez)
Alcance: herramientas/pw/probar-lote.js · herramientas/pw/cuarentena.json (nuevo, vacío al instalar) · herramientas/pw/pruebas-v1.test.js · herramientas/pw/package.json · herramientas/pw/LEEME.md · herramientas/juez/texto-juez.md (l. 15 «Regresión» y l. 21 «resultado») · herramientas/plantillas/revisor-previo.md (nada: la cuarentena no se declara en la instrucción) · interno/proceso.json (estado «probado»: regla de cuarentena) · interno/conocimiento.json (ficha BAI07.05-p) · interno/mejoras.json (MJ-1) · claude/arquitectura/reglas-transversales.md (RT-24 y fila de historial) · interno/lotes-modelo/LM-39a.md · copia en LENOVO (pw, juez)
Reglas transversales que toca: RT-24 (cambia: un rojo de regresión en cuarentena no rechaza) · RT-23 (crítico con cruce) · RT-4 (el estado del INC se lee de seguimiento.json, no se copia) · RT-2 (sin datos reales)
Mapa: módulos y relaciones que cambia: ninguno del producto; fábrica: pw → juez (el informe trae `cuarentena[]` aparte de `regresion[]`)
Riesgo: medio · R-1 (esconder un fallo real, como pudo pasar con INC-133). Mitigación: salvaguardas de abajo.
Reversión: pw y juez anteriores (pw\anterior\, juez\anterior\) y `git revert`.
Origen: Carlos 15-oct-2026; LM-38. Requerimiento: interno/mejoras.json › MJ-1. Revisión previa: Desarrollo, M-515 (corregir antes; correcciones incorporadas).
Depende de: nada. Precondiciones para verificar: para la prueba b, el Arquitecto pone en cuarentena.json una entrada sobre REQ-INV2-4-2 c con INC-133 (cerrado) antes de la corrida y la vacía al terminar; la prueba comprueba justamente que una entrada con INC cerrado se ignora.
¿Quién más depende?: texto-juez.md (regla de regresión), métricas (MJ-8), Seg. Proyecto (no lee pruebas.json hoy: nadie).

## Qué hace
`pw\cuarentena.json`: `[{ guion, caso, modulo, inc, firma, dueno, desde }]`. La escribe **solo el Arquitecto**, a pedido de Desarrollo o del juez.
En probar-lote, un caso de **regresión** en rojo que coincide con una entrada **y** con su `firma` (texto o patrón del fallo, p. ej. «sin respuesta de /api/upload») sale en `cuarentena[]` (no en `regresion[]`), con «falló n de m corridas»; no pone el lote en rojo. El caso sigue corriendo siempre.

## Salvaguardas (Desarrollo, M-515)
1. Entrada válida solo con un **INC de la app abierto en seguimiento.json** y dueño; el estado se lee del INC en cada corrida (RT-4): INC cerrado → la entrada no vale.
2. **Firma**: si el caso falla distinto (otra causa, pantalla de login, ERR_CONNECTION) es rojo normal.
3. Topes: 1 caso por guion y 5 en total; si hay más, ninguna vale y el informe lo dice.
4. Nunca para fallas del arnés (datos residuales, sesión: van por P4 y el campo `herramienta`) ni del guion (orden de perfiles: regla M-487).
5. Nunca para el guion **propio** del lote ni para un lote que toque el `modulo` de la entrada. `modulo` usa los ids de la vista 1 de `claude/arquitectura/mapa-str.md` (SH, API, U, PR, CAL, FL, HK, POR, INV, KN, K3, M2, INC1, PG, CMP, PC1, M6, PRJ, MOD). Hasta que exista `interno/mapa-modulos.json` (LM-39b), «el lote toca el módulo» = la línea «Mapa:» del lote nombra ese id, o el Alcance nombra una página o ruta de ese módulo según la vista 1; si hay duda, la entrada no vale.
6. Un caso en cuarentena que sale **verde**: aviso «INC-n posiblemente resuelto» en el informe.

## Juez
Regla nueva: `cuarentena[]` no cuenta para `resultado`; se nombra en `notas` con su INC y «falló n de m».

## Pruebas
| # | Qué | Nivel | Ejecutor · página | Consecuencia |
|---|---|---|---|---|
| a | pruebas-v1: entrada válida no rechaza; INC cerrado, firma distinta, login, guion propio, módulo tocado, más de 5 → rechaza; verde avisa | N1 | Arquitecto · consola | Detener |
| b | Sin guion nuevo: `humo-pw.spec.js` (zona sesiones; perfiles admin, oper, colab) en verde tras instalar; y una reprueba de L-126 con la entrada de prueba sobre INC-133 cerrado → la entrada se ignora y el caso, si falla, cuenta como rojo normal | N2 | Cola · https://app.apartamentosbucaramanga.com/str-app-shell.html · precondición: sesiones vivas, entrada de prueba puesta por el Arquitecto | Volver atrás |
