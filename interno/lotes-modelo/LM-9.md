# LM-9 · B1: esquema del modelo de datos y validador

**Lote del modelo** · REQ-MOD-1 · ítem del plan B1 · **Categoría: normal** (solo lectura de los archivos; no cambia datos) · Cruce: no requiere · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: el validador corre sobre el repo y su informe se usa como lista de trabajo de B3 · Reversión: borrar `herramientas/modelo/`.

## Qué entrega
- `herramientas/modelo/esquema.json`: patrones de id (con `REQ_legado` tolerado hasta B3), listas cerradas de estados por entidad, roles y alias, límites (encargo ≤ 3 000, mensaje pendiente ≤ 60 min, 1 lote en curso) y el mapa de migración archivo → entidad.
- `herramientas/modelo/validar.py`: aplica R1 (ids), R2 (claves foráneas y roles), R3 (estados), R4 (crítico con cruce), R5 (aceptado con veredicto), R7 (REQ entregado con M-n), R8 (encargo ≤ 3 000), duplicados entre archivos (un dato, una fuente), mensajes pendientes vencidos y lotes en curso. Salida Markdown o `--json`; código 1 si hay errores.
- `interno/validacion/AAAA-MM-DD.md`: informe por corrida.

## Supuestos (las 5 preguntas de la revisión, con la opción propuesta aplicada)
1. `L-n` solo en el modelo; la cola sigue con `NN-instr`. 2. REQ sin `-n` o con punto (`REQ-P1.1`) = legado: aviso, no error, hasta la pasada B3. 3. Estado del REQ desde `construido` lo deriva el sistema. 4. `cambio` solo para el modelo y para aprobación/costo. 5. Carlos es `rol-dueno`. Si Carlos decide distinto, cambia `esquema.json` y se vuelve a correr.

## Primer informe (11-oct 15:07)
22 errores: 4 ids mal tipados (`REQ-INV2-PLANTILLAS`; `DA-20`/`DA-21` en items como REQ; `DT-27` como INC), 2 FK rotas (lotes 53 y 55 → `REQ-INV2-1/2` no existen), 3 REQ entregados sin `M-n`, 4 mensajes a «Chat de desarrollo anterior/nuevo» (roles históricos), 8 estados fuera de lista (`cerrado` en lotes, `desplegado` en cambio, `abierto/cerrado` en DT), 1 crítico sin cruce visible. 228 avisos: 108 duplicados REQ/DA entre `seguimiento.items` y `diseno`, 70 ids legado, 19 estados con texto extra, 15 FK blandas, 12 aceptados sin rastro de veredicto, 1 encargo > 3 000 (CLI), 2 mensajes pendientes > 60 min.

## Siguiente
B3: pasada de normalización coordinada (Diseño y Desarrollo escriben; el Arquitecto da la lista) hasta 0 errores; después el validador corre en cada commit (hook) y en el tablero.
