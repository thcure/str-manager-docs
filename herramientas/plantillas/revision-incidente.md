# Plantilla · Revisión de incidente (I5, INCIDENTES-v1, LM-65; Google SRE, «Postmortem Culture»)

Cuándo (disparadores fijos, no se discuten en el momento): INC **P1** · pérdida o alteración de **datos reales** · **revert** o restauración · INC que tardó más de su plazo en decidirse · INC que **vio Carlos** (uso real) y debió detectarlo una prueba (`debioDetectarse` tests, revisión previa o verificación). Plazo: **48 h** desde que se abre el INC. Sin culpables: se escriben hechos, horas y causas de proceso; «error humano» no es una causa.

Quién la escribe, por la causa: construcción, tests o guion → **Desarrollo** · entorno o herramienta → **Arquitecto** · REQ o producto → **Diseño** · mezclada → los tres (Diseño: impacto en quién lo sufrió y qué cambia en el REQ o la bolsa; Desarrollo: lo técnico; Arquitecto: la causa de proceso). Va dentro del INC, campo `revision`; la escribe Desarrollo en `seguimiento.json` con el texto que le pasan los otros por el buzón. **Sin revisar por los otros dos chats no cuenta** (`revisadaPor: ["M-n", "M-n"]`).

```json
"revision": {
  "fecha": "AAAA-MM-DD",
  "autor": "<Desarrollo | Arquitecto | Diseño | los tres>",
  "queVimos": "<el síntoma tal como se vio, sin interpretar: qué pantalla, qué error, quién>",
  "impacto": "<quién lo sufrió (huésped, colaborador, operador, fábrica), cuánto tiempo, qué datos; «ninguno» si no salió de la fábrica>",
  "lineaDeTiempo": [{"hora": "AAAA-MM-DD HH:MM", "que": "primera señal (quién la vio y dónde)"}, {"hora": "…", "que": "aviso / registro del INC"}, {"hora": "…", "que": "decisión (lote, revert, solución temporal)"}, {"hora": "…", "que": "cierre o estado actual"}],
  "causas": "<causa técnica y causa de proceso: qué dejó pasar esto (qué prueba, revisión o guardia faltaba o no cubría el caso)>",
  "queCambia": [{"tipo": "punto | guardia | REQ | LM | riesgo", "ref": "<punto n del revisor · nombre de la guardia · REQ-X-n · LM-n · «riesgo aceptado» con quién>", "quien": "<chat>"}],
  "revisadaPor": ["M-n", "M-n"]
}
```

Reglas: la línea de tiempo lleva horas reales (del buzón, la cola o `seguimiento.json`), no estimadas · cada `queCambia` es una cosa que se puede comprobar después (un punto del revisor previo, una guardia en el hook, `--lote`, `validar.py` o pw, un REQ en Diseño, un LM del Arquitecto, o un riesgo aceptado con quién lo aceptó); «tener más cuidado» no vale · si el INC pertenece a un PRB, la revisión apunta a él y el PRB recoge el `queCambia` · el Arquitecto convierte los `queCambia` de proceso en puntos del revisor o guardias (ficha semanal) · se publica en el INC, no en un documento aparte; la ficha semanal cuenta las revisiones pendientes.
