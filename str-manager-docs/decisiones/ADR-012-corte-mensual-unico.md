# ADR-012 — Corte mensual único de archivos (fotos, videos, evidencia) con copia previa a Drive

**Fecha:** 2026-10-21 (registra DA-32 del 10-oct y su precisión del 15-oct) · **Estado:** aceptada · **Decisor:** Carlos (DA-32, cruce 10-oct 12:28–12:45 en el Chat Diseño; M-470, 15-oct 09:47) · **Capa:** producto · **Autor:** Chat Arquitecto
**Cambia:** RT-8, RT-10 (con excepción), RT-11 · datos: fotos de tarea, videos, evidencia de incidentes, guías (ciclo de vida) · módulo K3 · tarea programada `drive/corte` (T-12, por crear)
**Revisar cuando:** el primer corte real (30-nov-2026) y su ensayo de restauración (DT-42); si un reclamo necesita evidencia ya borrada
**Origen:** DA-32; DA-25 (plazos derogados); conflicto S2.1 / DA-32 resuelto el 15-oct (`reglas-transversales.md › Conflictos`)

## Contexto
El hosting tiene 50 GB y `api/uploads/` crecía sin límite; DA-25 había fijado plazos por tipo (30 días; abiertos + 90) y «solo se borra lo confirmado en Drive». Al redactar K3-3, la regla S2.1 («la evidencia de incidentes no se borra») chocó con DA-32 («el día de corte se borra todo») y nadie lo había visto.

## Opciones
| Opción | Qué | Consecuencia |
|---|---|---|
| a | Plazos por tipo y nunca borrar sin copia (DA-25) | lógica por tipo, varias fechas, acumulación si Drive falla |
| b | Corte único mensual: copia a Drive si está conectado y borrado de todo lo anterior al corte, con o sin Drive, con aviso previo (DA-32) | una sola fecha, disco acotado; pierde evidencia de incidentes abiertos |
| c | b, excluyendo la evidencia de incidentes abiertos (recomendación del Arquitecto, propuesta de arquitectura viva § 5) | conserva la prueba mientras el incidente vive; algo más de lógica |

## Decisión
b: Carlos (15-oct, M-470): el corte borra también la evidencia de incidentes, abiertos o cerrados. S2.1 queda sustituida; RT-10 lleva la excepción RT-8; de DA-25 siguen la compresión, «confirmado» = tamaño + huella y el aviso previo (RT-11).

## Consecuencias
Un dato una fuente: `datos-ciclo-vida.md` es la vista; la copia a Drive corre cada 15 min (`drive/cron`); el corte seguro (INC-175, 176, 177) está en pausa con el producto y la tarea T-12 no se crea hasta que esté aceptado; el primer corte real no corre sin el ensayo de restauración (DT-42, L-131). Guardia: RT-11 (aviso) y el respaldo diario de Hostinger; sin guardia automática del borrado (riesgo aceptado por Carlos en DA-32).
