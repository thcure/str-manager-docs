# Plantilla · «¿Cómo vamos?» (FLUJO-v1, LM-66; COBIT BAI11.07, APO08.01)

Cuándo: Carlos pregunta cómo va el proyecto, o el Jefe de proyecto cierra una tanda. Una sola fuente: la tabla la genera `python3 -I herramientas/modelo/ficha-semanal.py . --como-vamos [--anterior <json de la vez pasada>]` desde `proyecto.json` (trabajo, tandas, pausas), `seguimiento.json` (plan, incs) y el buzón (lo que espera a Carlos). **El Jefe de proyecto la pega, no la redacta**; si falta un dato, arregla la fuente, no la tabla. Guarda el JSON (`--como-vamos --json`) para que la próxima vez el semáforo diga solo lo que cambió.

```
| ¿Cómo vamos? · AAAA-MM-DD HH:MM | |
|---|---|
| 1. Espera a Carlos | <M-n (edad en días): asunto> · la pregunta que sigue: <una sola, la primera> |
| 2. Tanda | <T-n desde fecha (abierta por M-n): entra REQ…, INC…> | ninguna abierta |
| 3. En cola / construido | <L-n…> | cola vacía |
| 4. Aceptado en la tanda | <refs> | ninguno todavía |
| 5. Pausas | <orden (alcance, desde): condición de reanudación · revisar fecha · archivo PAUSA sí/no> | ninguna |
| 6. Semáforo | <n> filas en rojo · cambiaron: <las que entraron o salieron del rojo desde la última vez> |
```

Reglas: lo que espera a Carlos va primero y trae **una** pregunta (plantilla `pregunta-a-carlos.md`); breve: seis filas, sin párrafos; nada que no esté en una fuente; si Carlos pide detalle de una fila, se le da esa fila, no otra tabla; el semáforo completo vive en la ficha semanal (V8), aquí solo cuántas filas están en rojo y cuáles cambiaron.
