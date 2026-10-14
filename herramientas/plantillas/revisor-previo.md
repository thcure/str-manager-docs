# Revisor previo al encolado · lista de 14 puntos

Quién: el Chat Desarrollo la pasa **siempre** antes de copiar la instrucción a la cola, en un subagente (Writer/Reviewer: quien redactó no revisa) o, si no tiene subagentes, en una segunda lectura con la lista a la vista. Para **críticos**, además la pasa el Chat Diseño por el buzón (asunto «Revisión previa: <lote>») y responde «ok» o los puntos que fallan; sin ese «ok» no se encola. Cuesta 2–3 min; cada punto viene de una situación real (G-n en `interno/situaciones/_consolidado.json`).

| # | Pregunta | Si falla | Origen |
|---|---|---|---|
| 1 | ¿La cabecera (15 primeras líneas) trae Categoría, Alcance, Riesgo, Reversión, Origen y Requerimiento con ruta? ¿Las etiquetas son exactas (`Alcance:` al inicio de línea, sin paréntesis: la leen la guardia de la cola y el hook `guard-bash.js`)? | Completar; la guardia de la cola y los hooks leen solo esas líneas | G-8 |
| 2 | Si es **crítico**: ¿cita `DA-n` y «cruce previo con Carlos: fecha, dónde»? ¿Existe esa DA en `diseno.json`? (Lote del modelo: en vez de DA-n cita `LM-n` de `interno/lotes-modelo/` y el cruce de Carlos; la decisión es del dueño, no de producto) | No se encola (la cola lo rechaza igual); pedir la DA a Diseño o el LM-n al Arquitecto | G-7, G-18 |
| 3 | ¿La categoría es coherente con lo que toca (roles, accesos, dinero, datos reales, base de datos, scripts que corren solos → crítico)? | Subir la categoría | G-9 |
| 4 | ¿Cada archivo que se va a tocar está en Alcance, incluidos `tests/`, `CLAUDE.md` y el `?v=` nuevo? | Añadir; «declarados vs tocados» se explica en el cierre | G-8, G-25 |
| 5 | ¿Dice **quién más depende** de lo que cambia (listas blancas, filtros, respaldos, páginas que leen el mismo dato)? | Buscar en el código antes de encolar; añadir a Alcance o justificar | G-35 |
| 6 | ¿Las pruebas derivadas traen perfil, **página completa** (nunca la raíz) y precondición, y una consecuencia (Seguir/Detener/Revertir)? | Completar; es lo que va a `verificar.json` | G-5, G-22 |
| 7 | ¿Los criterios de permisos y 403 están en `tests/` y marcados «cubierto por tests/»? | Moverlos; el verificador no prueba 403 en el navegador | G-5 |
| 8 | ¿Las precondiciones de datos (`zz-verif-`) dicen quién las crea y quién las borra? | Añadir; si necesita datos reales, el criterio es «no verificable» y se dice | G-5, R11 |
| 9 | ¿Hay algún paso que el modo automático bloquea (ver ficha APO01.10-k: `reset --hard`, `push --force`, borrar archivos previos, JavaScript sobre sesiones)? | Reescribir el paso con la alternativa de la ficha | G-10 |
| 10 | ¿Ningún secreto, correo ni valor de token en el texto? | Quitar; usar `plantillas/secretos.md` | G-34 |
| 11 | ¿Depende de un lote que aún no está **aceptado**? | Esperar o declararlo en «Depende de» y encolar después | G-13 |
| 12 | ¿Cabe en una sesión de la CLI (≤ 8 archivos grandes o ≤ 45 min estimados) y tiene un solo objetivo? | Partir en dos lotes | G-16 |
| 13 | ¿Cada prueba derivada lleva **nivel** (N1 / N2 / N3)? ¿Los N2 tienen su caso con la misma letra en «### Guion N2 → `tests/e2e/<REQ-o-INC>.spec.js`» (bloque ```js, `zona`, `h.espera` en cada caso, datos con `h.dato()` y `limpiar()`)? ¿Los N3 dicen qué mirar? ¿`tests/e2e/` está en Alcance? | Completar con `plantillas/guion-e2e.js`; sin nivel no se encola (PRUEBAS-v1) | LM-18, B6 |
| 14 | ¿El lote trae **al menos un guion N2 con su `zona`** (aunque sea mínimo, de salud), también si es del modelo o de herramientas? La cola elige la regresión por la zona del guion: sin guion, la regresión no corre | Añadir un guion mínimo con la zona del área que toca | S-cd-31, LM-33 |

Resultado: en el mensaje de encolado (o en el log del chat) una línea «Revisión previa: 14/14» o «Revisión previa: fallan 5 y 9, corregidos». Diseño, para críticos, deja su «ok» en la respuesta del buzón; Desarrollo lo cita en la cabecera junto al cruce.
