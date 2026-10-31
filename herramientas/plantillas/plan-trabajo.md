# Plantilla · Plan de trabajo (forma estándar, MJ-25 / MJ-26)

Todo plan de la fábrica o de un proyecto tiene la misma forma, lo escriba quien lo escriba. Fuente única: un JSON en `interno/planes/<plan>.json` (el líder lo escribe); el documento narrativo en `claude/marco/` o `claude/producto/` explica, no duplica; la vista es el artefacto o página «Plan …» que lee del JSON y de su registro (`pasos`, `meta`).

## Cabecera
`id` (MJ-n, LM-n, PT-n) · `nombre` · `lider` (un chat) · `origen` (quién lo pidió, cuándo, con qué palabras) · `participantes` · `documento` (el .md que lo explica) · `estados` (lista fija: pendiente · en curso · hecho · bloqueado).

## Fases
`n` · `nombre` · `salida` (criterio de salida en una frase comprobable). Las fases se numeran desde 0 y van en orden; una fase puede estar en curso mientras otra espera.

## Pasos
`id` (fN-k) · `fase` · `orden` · `que` (una frase con verbo) · `quien` (lista; «Carlos» cuando solo él puede) · `comprobacion` (cómo se sabe que está hecho) · `estado` · `evidencia` (referencia: commit, M-n, archivo, hora) · opcional `dependeDe` (ids) y `plan` (si el paso es otro plan).

## Reglas
- Sin fechas de ejecución: un paso se dispara al cerrar el anterior; lo que tiene fecha límite externa (vencimientos) se dice en `evidencia` y en `meta.nota`.
- «Te toca, Carlos»: la vista lista los pasos pendientes cuyo `quien` incluye a Carlos en la fase actual y la siguiente; nada más se le pide por fuera.
- Cada cambio de estado deja evidencia; el líder actualiza el JSON y el registro del artefacto en el mismo turno.
- Un paso bloqueado dice por quién y desde cuándo.
