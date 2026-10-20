# Auditorías físicas de la línea base (ISO 10007 §5.6 b · plan de configuración A.7)

Una auditoría física comprueba que la línea base describe el código real: rutas, colecciones, pantallas y relaciones de una muestra de casos de uso. No reemplaza las pruebas (la auditoría funcional es la regresión del juez).

**Cuándo:** a pedido de Carlos y antes de que un módulo pase a `verificado`; el corte mensual se suma cuando el corte seguro corra. **Quién:** un agente auxiliar coordinado por el Arquitecto; los hallazgos van a Diseño y Desarrollo por el buzón. **Escritor:** Arquitecto.

**Archivo:** `<MOD>-AAAA-MM-DD.json`
```json
{"modulo": "HK", "fecha": "2026-11-02", "por": "agente auxiliar (Sonnet), coordinado por el Arquitecto",
 "muestra": ["CU-HK-2.1", "CU-HK-4.1"], "resultado": "conforme | con hallazgos",
 "hallazgos": [{"casoUso": "CU-HK-4.1", "que": "la ruta api/x ya no existe", "accion": "corrección en la línea base | INC-n | ninguna"}]}
```
`linea-base.py` exige una con `resultado: conforme` para que el módulo suba a `verificado` (C9).
