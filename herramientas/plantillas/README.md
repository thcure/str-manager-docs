# Plantillas del modelo (LM-4, 11-oct-2026)

| Archivo | Quién la usa | Para qué |
|---|---|---|
| `instruccion.md` | Chat Desarrollo | Cada lote: cabecera que lee la guardia de la cola, dependencias, precondiciones, «quién más depende», pruebas derivadas con nivel N1/N2/N3, perfil y página, guion N2, cierre |
| `verificar.json` | Chat Desarrollo | Lanzar al verificador (v2 de LM-1): páginas, criterios con perfil y precondiciones, pruebas de API, lista cerrada de resultados |
| `pregunta-a-carlos.md` | Todos los chats | Una decisión por mensaje: contexto, opciones con consecuencia, recomendación, qué pasa si no responde |
| `secretos.md` | Todos los chats y la CLI | Pasos que tocan un token o contraseña sin que el valor pase por el chat; prueba con petición real |
| `revisor-previo.md` | Chat Desarrollo (siempre) · Chat Diseño (críticos) | 16 preguntas antes de encolar; cada una viene de una situación real |
| `aviso-produccion.md` | Carlos o un usuario → Chat Desarrollo | Tres campos (qué, dónde, cuándo) cuando algo se ve en producción; Desarrollo registra el INC con prioridad en ≤ 1 h (I2, LM-65) |
| `revision-incidente.md` | Desarrollo · Arquitecto · Diseño (según la causa) | Revisión de incidente en 48 h, sin culpables: qué vimos, impacto, línea de tiempo, causas, qué cambia; dentro del INC (I5, LM-65) |
| `como-vamos.md` | Chat Jefe de proyecto | Tabla de seis filas para Carlos, generada por `ficha-semanal.py --como-vamos` (FLUJO-v1, LM-66): lo que espera a Carlos primero, tanda, cola, aceptado, pausas, semáforo |
| `guion-e2e.js` | Chat Desarrollo | Guion N2 de Playwright (PRUEBAS-v1, LM-18): va dentro de la instrucción, la CLI lo copia a `tests/e2e/` y la cola lo corre tras el despliegue y como regresión |

Las plantillas son la fuente; los encargos (`interno/instrucciones.json`) solo apuntan a ellas. Cambios: solo el Arquitecto, con prefijo `modelo:`.
