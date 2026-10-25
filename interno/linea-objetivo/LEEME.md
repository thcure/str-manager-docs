# Línea objetivo del STR (LM-80)

Lo que el STR **debe** hacer según el alcance que Carlos cierra con Diseño, guardado como **diferencias** sobre la línea de producto (`interno/linea-base/`, lo construido). Escribe Diseño (`<MOD>.json`); el esquema es del Arquitecto (`esquema.json`).

- Una diferencia `D-<MOD>-n` = un caso de uso nuevo, que cambia o que sale, con la decisión de Carlos (fecha, hora, ref).
- Capacidades: `en revisión` → `cerrada` (Carlos confirma capacidad por capacidad); módulo: `borrador` → `confirmado vN`.
- Brecha: `python3 -I herramientas/modelo/objetivo.py . --brecha [MOD]`. Validación: dentro de `validar.py`.
- Al aceptarse un lote con la línea «Diferencias:», el Arquitecto pasa esas diferencias a la línea de producto y las marca `construida`.
