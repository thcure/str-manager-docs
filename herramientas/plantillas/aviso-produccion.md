# Plantilla · Aviso desde producción (I2, INCIDENTES-v1, LM-65)

Cuándo: Carlos o un usuario ve algo raro en el STR real (un error, un dato que no cuadra, una pantalla que no carga, algo que no debería verse). Carlos **no clasifica** ni busca la causa: escribe tres campos en el chat de Desarrollo (o se los dicta a cualquier chat, que los reenvía por el buzón a Desarrollo) y sigue con lo suyo. Lo que pase después es de la fábrica.

```
Qué pasó: <lo que viste, en una frase, con el texto del error si lo hubo>
Dónde: <pantalla o módulo y quién estaba (yo como admin / un colaborador / un huésped en el portal)>
Cuándo: <hora aproximada, hoy o la fecha>
```

Ejemplo (datos de la forma real, no reales): «Qué pasó: al marcar el conteo de inventario salió «Base de datos no disponible» · Dónde: portal del colaborador, en el celular, tarea de limpieza de la unidad 3 · Cuándo: hoy a las 14:20».

Qué hace Desarrollo (≤ 1 h desde el aviso): registra el INC en `seguimiento.json › incs[]` con `originador: "uso real"` (o `"Carlos"`), `contexto {pantalla, hora, quienLoVio}`, `casoUso`, `severidad`, **`prioridad` P1–P4** (huésped o tercero > colaborador en turno > operador o admin > fábrica; área crítica de K4 ≥ P2; sobreventa o pérdida de datos en curso P1), `causaRaiz` y `debioDetectarse` provisionales, y **confirma por el buzón** a quien avisó con el id. Si sale P1 o P2: `solucionTemporal` («cómo opera mientras tanto» o «ninguna») y, si hace falta, el camino de emergencia (K8: línea del Jefe de proyecto, DA en 24 h). La decisión tiene plazo: P1 30 min, P2 1 día, P3 una tanda, P4 un mes.

Reglas: sin captura obligatoria (si la hay, se queda en LENOVO: nunca al repo ni al chat); sin nombres, teléfonos ni correos reales en el INC (describe el dato por su forma); el aviso no es una orden de arreglar: la prioridad y la decisión salen del proceso.
