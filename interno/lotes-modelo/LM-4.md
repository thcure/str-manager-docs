# LM-4 · Plantillas, revisor previo al encolado y ficha del modo automático

**Lote del modelo** · REQ-MOD-5 · ítems del plan A8 + A10 · **Categoría: normal** (documentos y reglas de encargo; no cambia scripts ni tareas) · Cruce: no requiere (Carlos aprobó el plan y «retoma el plan de trabajo») · Riesgo: bajo (si una plantilla sobra, se ignora) · ¿Toca el modelo? Sí (`modelo:`) · Fecha: 11-oct-2026 · Redacta y construye: Chat Arquitecto · Acepta: Chat Arquitecto, con la primera instrucción real escrita con la plantilla y revisada (la cita «Revisión previa: n/12») · Reversión: borrar la carpeta y los tres párrafos añadidos a los encargos.

## 1. Qué entrega
| Pieza | Ruta | Resuelve |
|---|---|---|
| Plantilla de instrucción (cabecera para la guardia, Depende de, Precondiciones, «quién más depende», pruebas con perfil y página completa, cierre declarados vs tocados; anchos/móvil y 403 a `tests/`) | `herramientas/plantillas/instruccion.md` | G-8, G-25, G-35, G-5, G-22, G-26 |
| Plantilla `verificar.json` v2 con notas | `herramientas/plantillas/verificar.json` | G-5, G-22, G-36 |
| Pregunta a Carlos (una decisión, opciones con consecuencia, recomendación, «si no respondes») | `herramientas/plantillas/pregunta-a-carlos.md` | G-18, G-27, G-2 |
| Pasos para secretos (advertencia fija, dónde vive cada secreto, prueba con petición real, lo que nunca) | `herramientas/plantillas/secretos.md` | G-34, G-1, G-30 |
| Revisor previo: 12 preguntas, siempre por Desarrollo (subagente), críticos además por Diseño («ok» por el buzón) | `herramientas/plantillas/revisor-previo.md` | G-7, G-8, G-9, G-10, G-13, G-16, G-18, G-34, G-35 |
| Ficha «modo automático: qué bloquea y la alternativa» (8 reglas con alternativa; flujo cuando algo se bloquea; infraestructura de confianza pendiente en A7) | `interno/conocimiento.json › APO01.10-k` | G-10 |
| Reglas en los encargos (tres párrafos: Desarrollo, Diseño, Arquitecto) | `interno/instrucciones.json` | — |
| Índice | `herramientas/plantillas/README.md` | — |

## 2. Decisiones tomadas al redactar
- El borrador de la instrucción va sin número; el número lo da el encolado (G-26).
- El revisor previo es obligatorio para Desarrollo en todos los lotes y añade a Diseño solo en críticos: dos minutos por lote frente a 45 min de retrabajo medidos en G-35.
- Las plantillas son la fuente; los encargos apuntan a ellas (A9 los acortará a ≤ 3 000 caracteres apoyándose en esto).
- Criterios de ancho/móvil van a `tests/` como los 403: el verificador no puede cambiar el viewport (M-126, lote 69).

## 3. Criterios de aceptación
| # | Criterio | Cómo |
|---|---|---|
| 1 | Las cinco plantillas existen y cada una cita un ejemplo real | Carpeta `herramientas/plantillas/` |
| 2 | La próxima instrucción de Desarrollo se escribe con la plantilla y trae «Revisión previa: n/12» | Cabecera del siguiente lote |
| 3 | El próximo crítico trae el «ok» de Diseño citado en la cabecera | Cabecera + mensaje del buzón |
| 4 | Ficha APO01.10-k en `conocimiento.json`; la página Base de conocimiento la muestra cuando se regenere | `conocimiento.json` |
| 5 | Registro: `cambios[]` tipo modelo; tablero PT-M1: A8 y A10 en «hecho» | — |

## 4. Pendiente que no entra aquí
- Declarar infraestructura de confianza del clasificador (`auto-mode-config`) y hooks: A7.
- Prueba de aceptación por herramienta (G-30): entra con el modelo de datos (B1) como campo de cada herramienta.
