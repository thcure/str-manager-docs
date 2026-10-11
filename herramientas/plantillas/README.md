# Plantillas del modelo (LM-4, 11-oct-2026)

| Archivo | Quién la usa | Para qué |
|---|---|---|
| `instruccion.md` | Chat Desarrollo | Cada lote: cabecera que lee la guardia de la cola, dependencias, precondiciones, «quién más depende», pruebas derivadas con perfil y página, cierre |
| `verificar.json` | Chat Desarrollo | Lanzar al verificador (v2 de LM-1): páginas, criterios con perfil y precondiciones, pruebas de API, lista cerrada de resultados |
| `pregunta-a-carlos.md` | Todos los chats | Una decisión por mensaje: contexto, opciones con consecuencia, recomendación, qué pasa si no responde |
| `secretos.md` | Todos los chats y la CLI | Pasos que tocan un token o contraseña sin que el valor pase por el chat; prueba con petición real |
| `revisor-previo.md` | Chat Desarrollo (siempre) · Chat Diseño (críticos) | 12 preguntas antes de encolar; cada una viene de una situación real |

Las plantillas son la fuente; los encargos (`interno/instrucciones.json`) solo apuntan a ellas. Cambios: solo el Arquitecto, con prefijo `modelo:`.
