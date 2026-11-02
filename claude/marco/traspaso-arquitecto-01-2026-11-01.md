# Traspaso del Arquitecto - 01 · 1-nov-2026 (cierre de la noche, 20:13: pasa al Arquitecto - 02)

**Sesión:** `session_01So4JYdwNaGBiXJtPfsUwnF` (enlazada a LENOVO, registrada en `interno/destinatarios.json`). **Por qué existe:** Carlos (18:56): «ya que no tenemos metodología implementada aún, ¿cómo vas a mantener el contexto de este chat? Es mejor que lo vayas guardando ahora mismo». Este archivo es la memoria del rol: quien siga lo lee y no necesita el chat.

## 0. Orden de lectura para retomar
1. `interno/instrucciones.json` › `rol-arquitecto` y `reglas-comunes`.
2. **Este traspaso.**
3. `claude/marco/estructura-universo-v2.md` §§ 1–7: todas las decisiones de Carlos del 31-oct y del 1-nov.
4. `claude/marco/modelo-objetivo-roles-procesos.md`: el diseño objetivo, en borrador.
5. `interno/planes/plan-estructura-universo.json` (EU-2) y `python3 -I herramientas/oficina/lo-que-me-toca.py . "Chat Arquitecto"`.
6. Consultoría COBIT (privada, **no está en el repo**): `C:\Users\ktcol\Downloads\normas-fabrica\consultoria\` en LENOVO. Ahí están la guía del consultor, las respuestas 1–3, las fichas de los 4 grupos (corregidas), las verificaciones 1, 2A y 2B, la consolidación, la plantilla y el contexto. Normas en PDF: `Descargas\normas-fabrica\` (LEEME.md).

## 1. Prioridad y forma de trabajar (Carlos)
- **Único objetivo activo: organizar el universo y hacerlo funcional (EU-2).** Todo lo demás está en pausa (11:21), LM-91 y LM-93 incluidos.
- Prioridad dentro de eso: **la fábrica**. Gestión de proyectos básica, sin entrar en metodología.
- No eliminar ni modificar piezas sin contexto. Antes de clasificar, reconstruir con evidencia. Consultar a otros agentes, pero verificar lo que dicen («te podrían estar diciendo cosas que no son»).
- Nada queda como deuda: un «revisó 90 de 231» se cierra al 100 % (18:17).
- **No pensar en los chats actuales** (colapsados por contexto); diseñar lo que debería ser (18:48).
- Responder breve, en tablas, una pregunta a la vez y con opción recomendada.

## 2. Lo decidido hoy (detalle en estructura-universo-v2 §§ 6–7)
| Hora | Decisión |
|---|---|
| 10:52–10:55 | Elementos de paso o no definidos: se conservan; sin proceso si no tienen función clara; estado «cumplido» para lo que terminó su función |
| 11:21 | Solo EU-2; lo demás en pausa |
| 16:59–17:10 | Alcance: gestionar proyectos (cualquier naturaleza, sobre todo software); la fábrica recibe **peticiones**; el proyecto gestiona sus requerimientos de proyecto y la fábrica es la experta en requisitos de diseño de software; GP = rol del proyecto (hoy Carlos) |
| 17:19 | «Jefe de proyecto» pasa a llamarse **Gestor del plan de trabajo** (rol de la fábrica). El renombre en encargos y buzón va en un lote aparte, no hecho |
| 17:34 | Carlos delegó en el Arquitecto los factores de diseño (tabla en consultoría, respuesta-2) |
| 17:46 | Plan de consultores: 4 por dominio, verificador, consolidador |
| 18:41 | **Catálogo de procesos v1 aprobado** (punto 6) |
| 18:45 | Puntos 1–5 quedan pendientes |

## 3. Estado de EU-2
- **Hecho:** e0-1, e0-2, e1-1, e1-2, e2-1 (reclasificación v6: 348 piezas, 282 vivas asignadas, 16 de paso, 0 sin objetivo, 0 compartidas entre procesos), e2-2, e3-2 (11 roles como piezas), e3-5.
- **En curso:** e3-3 y e3-1 (los cubre LM-94); e3-6 (medida de costo por lote acordada con el Gestor del plan, M-1377; se instala tras EU-2).
- **Pendiente:** e3-4 ambientes (estándar APO11 + instancia P01); fase 4 (ficha única con estado de formalización y de operación, «cumplido», «de paso», catálogo; diseño objetivo en borrador); fase 5 (inventarios separados: avisar al Gestor del plan antes de partir `proyecto.json`); fase 6 (revisión de Carlos); e9-1 continuidad (lo cubre el diseño objetivo).
- **LM-94 preparado, no instalado:** catálogo v1 en `cobit.json` (`interno/respaldos/LM-94/`). Probado en copia: validar 0, paquete sin error. Espera el sí de Carlos. Fase B (después): reescribir las prácticas adoptadas con las fichas (niveles invertidos en APO01, APO03 y APO06; errata APO07.01; métricas pegadas).

## 3b. Plataforma (19:03–19:2x)
- Informe del consultor de plataforma: `claude/marco/informe-plataforma-claude-code-2026-11.md` (fuentes oficiales al 1-nov). Hallazgo: ya trabajamos casi todo en Claude Code (los chats son sesiones en la nube; el despertador usa `claude -p --cloud`); la decisión es cambiar el pegamento hecho a mano por funciones nativas. Recomienda un camino mixto por etapas y un piloto reversible (Verificador en la nube disparado por PR, tras pasar el repo a privado).
- Propuesta del Arquitecto, sin respuesta aún: la cadena la garantiza un **motor determinista** (máquina de estados que lanza las sesiones), con guardias, vigilancia que escala y Carlos solo con decisiones y escalamientos; cada paso del proceso declara si lo hace el principal, un subagente o una herramienta.
- Carlos (19:16) aprobó el reparto: motor determinista, guardias, vigilancia y él solo con decisiones y escalamientos. Recordó que no es técnico; si el Arquitecto no está convencido, investiga más con un subagente.
- Segunda ronda: `claude/marco/informe-motor-cadena-2026-11.md`. El motor es un script sin modelo; la recomendación es correrlo en GitHub Actions, que lanza los roles con `claude-code-action`, deja la guardia como paso aparte y funciona con LENOVO apagado. El estado es un registro de eventos con un solo escritor. Los escalamientos van como issue asignado a Carlos (correo y GitHub Mobile). Primer paso reversible: «motor en sombra» (`lo-que-me-toca.py` cada 15 min, sin Claude ni secretos), 7 días comparado con el despertador v12.
- Lo que Carlos vería (19:19): una sola conversación (el interlocutor), un panel de la cadena y avisos al teléfono.
- Dónde se crean los roles (19:26 → `claude/marco/informe-integracion-roles-2026-11.md`). Los chats de rol de hoy son sesiones de Claude Code en la nube unidas al proyecto de claude.ai, no Cowork. Propuesta mixta:
  - el Interlocutor, en la aplicación, dentro del proyecto;
  - Requisitos, en una sesión de Claude Code en la nube lanzada por el motor;
  - Desarrollo y el Verificador, en GitHub Actions, sin conversación.
  
  Lo lanzado desde GitHub no ve los documentos ni la memoria del proyecto de claude.ai; la aplicación no ejecuta los agentes ni las guardias del repo. Projects de Claude Code (beta) es otro producto. Para no partir el sistema, el repo (privado) es la única fuente: instrucciones, memoria y la skill de requerimientos pasan al repo, y el proyecto de claude.ai queda como ventana. Primer paso: copiar las instrucciones del proyecto a `CLAUDE.md`.
- Revisión directa en la cuenta (19:4x) → `claude/marco/decision-plataforma-motor-2026-11.md`. Plan Ultra; 100 % del uso cuenta como Cowork; sin gasto extra. Las tareas de Claude Code tienen activadores por horario, GitHub (PR e incidencias, sin push) y API. Posible sobrecosto: la CLI de la cola quizá use `ANTHROPIC_API_KEY` (verificación pendiente de Carlos). Recomendación: motor Python en LENOVO (costo 0), movible a GitHub después. La decisión se toma con esos datos.
- Validación directa con Claude Code (19:5x, § 6 de decision-plataforma-motor): **viable con 4 ajustes** (lanzar con `--agent`, `--strict-mcp-config`, `--allowedTools` y JSON; solo el token del plan; `.claude/` y CLAUDE.md en cada repo, hoy ausentes en str-manager-docs; el motor no escribe en el chat del Interlocutor). Carlos corrió `echo $env:ANTHROPIC_API_KEY` en LENOVO y no devolvió nada: no hay clave de API en su usuario. Queda por comprobar el entorno de la tarea programada de la cola cuando se construya el motor.

## 3c. Noche (19:58–20:13): quién garantiza el sistema → diseño objetivo § 6b
- Visual validado (versión final): a la izquierda, **quién garantiza** (Arquitecto diseña, Motor mantiene vivos a los agentes y hace cumplir, Auditor comprueba e informa, latido en GitHub vigila al motor); a la derecha, **lo que se garantiza** (Interlocutor como puerta única → Proyectos, Fábrica e Infraestructura; Repositorio con la memoria de cada rol y la plantilla de agentes); arriba, Carlos dirige y decide. Carlos se perdía con los visuales técnicos (dónde corre cada cosa): mostrar primero esta capa y la de plataforma después, por separado.
- **Operador de infraestructura**, rol propio (Carlos: «básicamente él mantenía la infraestructura», más configuraciones en Hostinger, Supabase, etc., «todo lo que necesite el navegador»). Se separa del Arquitecto porque mezclar las dos cargas saturó al Arquitecto saliente. Carlos no respondió la pregunta formal, pero agregó el alcance y siguió adelante: tomarlo como aceptado y confirmarlo al presentar el diseño.
- **Norma del navegador** (DSS05), en § 6b. Pendiente: cuándo se permite usar el perfil de Chrome de Carlos. La regla común 9 lo prohíbe, y el Arquitecto - 01 lo usó con la extensión por pedido suyo; Carlos fue avisado.
- **Interlocutor y Operador:** puerta única; la única excepción es el momento de las claves o del doble factor.
- **Auditor del marco** (MEA01/MEA02): **Carlos: «agrégalo»** (20:08).
- **Gran duda de Carlos** (20:08): ¿quién garantiza que los chats y agentes estén creados y se renueven, en todos los niveles y no solo en la fábrica? Respuesta: el motor, con `roles/plantilla.json` (por crear). Lanza él mismo los roles de LENOVO; los de la aplicación se los pide a Carlos con el mensaje de arranque listo, y ese es el único paso manual. Al motor lo vigilan el latido y el Auditor. Carlos lo entendió con el visual.
- **Siguiente paso propuesto, sin respuesta:** aprobar el diseño objetivo y arrancar el «motor en sombra» en LENOVO (Python, sin IA, cada 15 min, comparado 7 días con el despertador v12). Una pregunta a la vez, con la opción recomendada.

## 4. Pendientes de Carlos (no insistir; prioridad EU-2)
1. Vencen el **3-nov** el plan Premium de Hostinger (no renovar; antes exportar la base `_hospedaje` y desconectar GitHub del sitio viejo) y el dominio bucaramangastays.com (recomendado: soltarlo). El **9-nov** vencen tres tokens.
2. Pruebas contra producción (`herramientas/pw/comun.js` apunta a `app.`): ejecutar la ADR-007 o aceptar el riesgo por escrito.
3. Repo de documentos público: pasarlo a privado (condición del diseño objetivo).
4. DA-62 (metas y apetito de riesgo): sin ella, MEA01 no llega a nivel 2.
5. Ensayo de restauración con «negocio» antes del corte del 30-nov. Hasta hoy solo se probó con la cuenta de pruebas (19-oct, en verde); faltan «negocio», los usuarios y `api/uploads/`.
6. Sí a LM-94. Punto de entrada al sistema: A, un interlocutor único, recomendado; en la práctica, Carlos ya trabaja con él en § 6b. Aprobar el diseño objetivo y arrancar el motor en sombra. ¿Separar al Interlocutor del ingeniero de requisitos? (preguntado, sin respuesta). Perfil de Chrome.

## 5. Buzón (último M-1382)
- M-1376 y M-1377 (Gestor del plan): hechos.
- M-1378 (Arquitecto saliente): hecho.
- M-1379 (Desarrollo, aviso falso de la CLI con guiones): LM-93 preparado y en pausa; M-1380 avisó la pausa.
- M-1381 y M-1382 (dueños de piezas compartidas): hechos, incorporados en la reclasificación v5.
- Abierto de antes: M-858 (Diseño → Carlos, alcance del sistema).

## 6. Hallazgos que quedaron registrados (consolidación § 5)
- Pruebas contra producción.
- Repo público.
- LENOVO es un punto único de falla.
- La restauración no está probada con «negocio».
- Los incidentes de la fábrica se mezclan con los de P01 (130 de 144 sin «contra»).
- Riesgos sin fecha de evaluación y un registro viejo duplicado en `seguimiento.json`.
- El despertador muestra «verificando L-79» colgado.
- `vencimientos.json` V-7 y V-8 sin fecha.

## 7. Cómo trabaja el rol (herramientas)
- **Repo:** clon en `/home/claude/work/str-manager-docs` (el contenedor es efímero; si no existe, clonar `thcure/str-manager-docs`).
- **Relevo al Arquitecto - 02:** registrar su sesión en `interno/destinatarios.json` (entrada «Chat Arquitecto», hoy `session_01So4JYdwNaGBiXJtPfsUwnF`), cambiar el trailer de su copia de `subir.sh` y avisar del relevo al Gestor del plan por el buzón.
- **Subida:** copia local de `herramientas/arquitecto/subir.sh` en `/home/claude/work/scripts/` con `R=/home/claude/work/str-manager-docs`, `buzon-merge.py` copiado al lado y el trailer de la sesión actual. Antes de cada subida, `device_stage_files` de `C:\Users\ktcol\Downloads\str-instr-cola\claves\arquitecto.txt`: el script lo lee y lo borra; nunca se imprime.
- **Destinatario nuevo** «Arquitecto saliente» (`session_011PAjxLN9fTuZ3PSA1XAPxf`) y su rol en `esquema.json`, para consultarle (5023dc9).
- **Agentes de apoyo:** los subagentes no tienen la herramienta del proyecto de Claude. Lo privado se guarda en LENOVO con `device_commit_files`.
- **Reclasificación:** `python3 -I herramientas/arquitecto/eu2-reclasificar.py .` regenera `claude/marco/eu2-reclasificacion.json` (versiones v1–v6 documentadas en el script).

## 8. Errores que evitar (aprendidos hoy)
- Clasificar por nombre o por defecto (las 10 vistas «generar o superar», el BAI11 por defecto de P01) sin revisar cada pieza.
- Presentar como cierta la versión de un agente sin contrastarla. El Arquitecto saliente y el repo diferían en 5 de 10 vistas.
- Dejar una verificación parcial como si fuera completa.
- «Aprobado» no significa que el proceso opere: hay que mostrar las dos cosas por separado.
- Citar los 100 dólares al mes como presupuesto general: son solo del agente de comunicaciones.
- Mezclar en un mismo visual lo que se hace, quién lo garantiza y dónde corre: Carlos se pierde. Una capa por visual.
