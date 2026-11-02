# ¿Montar todo el sistema en Claude Code? · Consultor de plataforma · 1-nov-2026

Etiquetas: **[fuente]** = lo dice la documentación oficial (enlace en § 7). **[análisis]** = inferencia mía. Fuentes oficiales consultadas hoy. La investigación del 11-oct (`fuentes-oficiales-2026-10.md`) no está en el repo y no se usó.

## 1. Respuesta corta

1. [análisis] Ya trabajan casi todo en Claude Code: los «chats» son sesiones en la nube (ids `session_`/`cse_` en `interno/destinatarios.json`), el despertador les escribe con `claude -p --cloud <id>` y la cola usa la CLI con hooks y modo auto. La pregunta real es otra: **¿cambiamos el pegamento hecho a mano (buzón + despertador + cambiar de chat a mano) por funciones nativas?**
2. [fuente] Claude Code tiene hoy casi todas las piezas del diseño objetivo: subagentes definidos por archivo con memoria propia, hooks, tareas programadas en la nube con disparadores de GitHub o API, mensajería entre sesiones y **Projects** (un coordinador que lanza hilos desechables con instrucciones y memoria compartidas).
3. [fuente] Pero Projects está en beta pública, se reparte por etapas, solo existe en Pro y Max, y sus hilos **no cargan** las skills, los hooks ni los permisos del repo.
4. [análisis] Pasar todo de golpe es arriesgado: perdemos las guardias como controles obligatorios, la memoria se va a un lugar fuera del repo y todo depende de una beta.
5. **Recomendación: mixto, por etapas.** El repo sigue siendo la única fuente de verdad. Los roles pasan a ser archivos de Claude Code (agente + skill + hook) y el despertador se reemplaza poco a poco por disparadores en la nube. Primero, un piloto con el Verificador (§ 4).

## 2. Principios del diseño objetivo frente a Claude Code

| Principio | Cómo lo resolvería Claude Code [fuente] | Cómo se resuelve hoy | Ventaja o desventaja [análisis] |
|---|---|---|---|
| El rol es permanente y el agente desechable | Subagente en `.claude/agents/<rol>.md` con `tools`, `model`, `permissionMode`, `hooks` y `skills`; `claude --agent <rol>` arranca una sesión entera con ese rol (sub-agents). Projects: cada tarea va en un hilo nuevo (claude-projects) | Encargo en `instrucciones.json`; chats largos que se agotan y se cambian a mano | **Ventaja grande:** el encargo pasa a ser un archivo que se ejecuta, con herramientas limitadas por rol |
| Unidad de trabajo corta | Hilos de Projects y ejecuciones de tareas programadas: cada ejecución es una sesión nueva (routines). Las sesiones en la nube se compactan solas | Chats eternos | **Ventaja**, siempre que el estado se escriba antes de cerrar |
| La memoria vive fuera del agente | (a) `CLAUDE.md` en el repo (memory). (b) `memory: project` de un subagente → `.claude/agent-memory/<rol>/` **dentro del repo** (sub-agents). (c) La memoria de Projects (`MEMORY.md`) vive en la cuenta de Anthropic, no en el repo (claude-projects). (d) La auto memory local vive en `~/.claude/projects/…` de cada equipo (memory) | Repo + memoria de claude.ai + lo que quedó en cada chat | (b) encaja con «un dato, una fuente». (c) y (d) **chocan** con esa regla: hay que limitarlas a punteros |
| Arranque estándar | Hook `SessionStart` (ya lo usan con `ctx.js`); `skills` precargadas en el subagente; instrucciones de proyecto de hasta 16 000 caracteres por hilo (claude-projects) | `paquete.py`, `lo-que-me-toca.py`, mensaje de arranque manual | **Ventaja:** el paquete se inyecta solo. En hilos de Projects no corren hooks del repo, así que allí iría en las instrucciones del proyecto |
| Quien hace no aprueba | Subagentes o sesiones distintos con herramientas de solo lectura; tareas con disparador de GitHub (`pull_request.opened`); GitHub Actions con `@claude` o automatizado (github-actions); hooks `TaskCompleted` y `Stop` que bloquean con salida 2 (hooks) | Juez local en LENOVO (`claude -p` con `--allowedTools` limitado) | **Ventaja:** el verificador corre en la nube sin LENOVO, como sesión independiente |
| Coordinación por eventos | Disparadores de tareas en la nube: horario (mínimo 1 h), API (`/fire` con token) y GitHub (solo PR, release e issue, **no push**) (routines). Mensajería entre sesiones (`SendMessage`), en texto plano, sin poder aprobar nada (cross-session-messaging). Agent teams con buzón JSON y lista de tareas, pero experimental y dentro de una sola sesión (agent-teams) | `mensajes.json` + despertador PowerShell en LENOVO + `destinatarios.json` | **Ventaja parcial:** los disparadores reemplazan al despertador. **Desventaja:** un cambio en `mensajes.json` no dispara nada; habría que llevar el evento a un issue o un PR, o llamar a `/fire` |
| Consultores a pedido | Subagentes (hasta 20 a la vez, anidables), dynamic workflows (muchos subagentes que se verifican entre sí) y agent teams (agents) | Subagentes lanzados a mano (prueba COBIT del 1-nov) | **Neutra o ventaja:** ya funciona así. Los workflows añaden la verificación cruzada |
| Controles y guardias | Hooks en `.claude/settings.json` (33 eventos; tipos `command`, `http`, `mcp_tool`, `prompt` y `agent`), que sí se leen en sesiones en la nube **de un solo repo** (settings) | `guard-bash.js`, `stop-check.js` y `validar.py`; cola con hooks | **Desventaja en Projects:** sus hilos ignoran los hooks y permisos del repo; ahí solo cuentan el modo auto y las aprobaciones (claude-projects) |

## 3. Qué ganaríamos y qué perderíamos

| Tema | Ganamos | Perdemos o arriesgamos |
|---|---|---|
| **Dónde vive la memoria** | [fuente] Memoria por rol versionable en el repo (`agent-memory`, alcance `project`). | [fuente] La memoria de Projects queda en la cuenta, no en git. Si se borra el proyecto, se pierden hilos, memoria y archivos sin vuelta atrás. [análisis] Regla necesaria: la memoria de Projects solo guarda punteros a archivos del repo. |
| **Continuidad de roles** | [análisis] Ningún chat «es» el rol; cualquier sesión toma el rol desde el archivo. Se acaba el traspaso a mano y desaparece `destinatarios.json`. | [fuente] Un hilo de Projects pertenece a un solo proyecto y no se mueve. [análisis] Hay que disciplinar el cierre: escribir el estado del rol antes de terminar. |
| **Coordinación** | [fuente] Las tareas en la nube corren con LENOVO apagado; la mensajería avisa a una sesión inactiva iniciando un turno nuevo. | [fuente] Los disparadores de GitHub no incluyen `push`; las sesiones en la nube solo aparecen en la mensajería desde una sesión conectada a Remote Control, y la app de escritorio no ve sesiones en la nube. [análisis] El buzón JSON sigue como registro, pero su «timbre» cambia. |
| **Interfaz para Carlos** | [fuente] Una sola conversación de proyecto con un panel **Overview** (en curso, te espera, listo para revisar), avisos en escritorio y móvil, y uso del teléfono. Encaja con la opción A (un interlocutor único). | [fuente] Projects no existe en la CLI ni en VS Code. [análisis] Cambia la costumbre de «un chat por rol». |
| **Dependencia de LENOVO** | [fuente] La nube no necesita el equipo; los entornos tienen script de instalación y secretos de red (cloud environments). | [análisis] Siguen atados a LENOVO las pruebas Playwright y las rutas privadas (`Descargas\normas-fabrica`), salvo que se suban a la Library del proyecto o al repo privado. El acceso a `app.` exige una red **Custom** en el entorno. |
| **Costo y límites** | [fuente] No hay cargo aparte por la máquina virtual; todo sale del plan. | [fuente] El paralelo multiplica el consumo; Projects consume más rápido (Opus con esfuerzo alto por defecto, máximo 200 hilos al día); agent teams usan unas 7 veces más tokens en modo plan; las tareas tienen tope de 100 ejecuciones por hora. Las tareas cuentan contra la cuenta personal. |
| **Seguridad y permisos** | [fuente] En la nube, las credenciales de GitHub nunca entran a la VM (pasan por un proxy). El modo auto bloquea despliegues y force-push por defecto. Un mensaje de otra sesión no puede aprobar nada. | [fuente] Lo que haga una tarea aparece como Carlos (su usuario de GitHub). Requiere la Claude GitHub App con permisos amplios (Actions, Workflows, Contents: escritura). En la nube no existe el modo bypass. [análisis] Con el repo **público**, primero hay que pasarlo a privado. Los tokens por rol pierden sentido: la identidad es única. |
| **Gestión del conocimiento** | [fuente] `CLAUDE.md` con imports `@ruta`, reglas por ruta en `.claude/rules/` y skills que cargan bajo demanda (bajan el contexto). | [análisis] Hay que partir `instrucciones.json` en archivos (`agents/`, `skills/`, `rules/`). Es trabajo, pero aplica «un dato, una fuente». |
| **Proyecto de claude.ai que se usa hoy** (169 documentos, fuente de GitHub sincronizada) | [fuente] Projects de Claude Code admite archivos, carpetas de Drive y repos como contexto. | [fuente] El despliegue empezó con cuentas que **no** tienen proyectos en claude.ai o Cowork; los proyectos existentes siguen como están y no se describe cómo migrarán. [análisis] Es probable que Carlos aún no tenga acceso, y que los documentos del proyecto actual no pasen solos. |

## 4. Opciones

| Opción | Qué es | Riesgos [análisis] | Esfuerzo |
|---|---|---|---|
| **A. Todo en Claude Code Projects** | Un proyecto con coordinador (Interlocutor), hilos por tarea, tareas programadas dentro del proyecto y hilos locales en LENOVO por Remote Control para lo que exige el equipo | Beta y acceso incierto; sin hooks ni permisos del repo en los hilos (los controles dejan de ser obligatorios); memoria fuera de git; proyecto de un solo usuario y sin controles de organización; más consumo | Alto: rehacer cola, juez y despertador; reubicar conocimiento; reentrenar el hábito |
| **B. Mixto (recomendada)** | El repo sigue de fuente. Roles como `.claude/agents/*.md` + skills + hooks en el repo. Sesiones de rol en la nube **de un solo repo** (sí leen `.claude/settings.json`). Eventos con tareas en la nube (disparador de GitHub en issues/PR o `/fire`). La cola local queda para lo que necesita LENOVO. Projects se prueba aparte cuando esté disponible | Convivencia temporal de dos timbres; el diseño de eventos con issues necesita reglas | Medio y por etapas; cada etapa se puede revertir |
| **C. Quedarse** | Seguir con chats, buzón y despertador | Sigue el problema mayor (chats que se agotan) y LENOVO como punto único de falla | Bajo ahora; alto a la larga (mantenimiento del pegamento) |

**Piloto pequeño y reversible (opción B): «Verificador en la nube».**
1. Condición previa: el repo de documentos pasa a privado (decisión pendiente de Carlos) y se instala la Claude GitHub App solo en ese repo.
2. Rama `piloto/verificador` con `.claude/agents/verificador.md` (herramientas Read, Grep y Glob; escribir solo el veredicto), una skill con los criterios V1–V11 y un hook `Stop` que exija el archivo de veredicto.
3. Una tarea en la nube con disparador de GitHub `pull_request.opened`, filtrado por la etiqueta `verificar`, en Sonnet. Escribe el veredicto como comentario en el PR. **No toca main ni datos de Carlos.**
4. Correr 3 lotes reales en paralelo con el juez local y comparar veredictos, tiempo y consumo (`/usage` y la página de uso de claude.ai).
5. Vuelta atrás: apagar o borrar la tarea y borrar la rama. Nada más cambia.
6. Criterio de éxito: 3 de 3 veredictos coinciden con el juez local, sin LENOVO, y con un consumo aceptable para Carlos.
- Piloto paralelo de solo lectura (opcional): si **Projects** aparece en la barra lateral de Carlos, crear un proyecto de prueba sin repo y medir una tarea de consultoría. No meter ahí datos reales.

## 5. Lo que no pude verificar

- **El plan de Carlos** (Pro, Max o Team). Decide si tiene Projects, Dispatch y uso de computador; Projects no está en Team ni Enterprise.
- Si Projects ya aparece en su cuenta: depende del despliegue, que empezó por cuentas sin proyectos en claude.ai o Cowork.
- Cómo y cuándo migrarán los proyectos de claude.ai y Cowork (con sus documentos e instrucciones). El anuncio del 17-sep no lo describe.
- La diferencia práctica entre los ids `cse_` y `session_`. La documentación los acepta a los dos en `--cloud`.
- Que esta misma sesión en la nube tenga adjunto el proyecto de claude.ai: lo observé, pero no encontré la página oficial que lo documente.
- Los requisitos de Remote Control en Windows nativo. La mensajería entre sesiones exige la v2.1.234 o posterior en Windows.
- Las cifras exactas de límites por plan (están en claude.com/pricing, que no consulté) y cuánto consumiría de verdad el flujo de la fábrica.
- Si las pruebas Playwright contra `app.` y PHP corren bien en un entorno de la nube (red Custom y script de instalación); no lo probé.

## 6. Notas de método
- [análisis] Leí `modelo-objetivo-roles-procesos.md`, `traspaso-arquitecto-01-2026-11-01.md`, `estructura-universo-v2.md`, `destinatarios.json`, `ejecutar-cola.ps1` (cabecera e invocaciones), `vigilar-buzon-v12.ps1` (función Avisar) y `hooks-cli/settings.json`. No modifiqué nada.

## 7. Fuentes (consultadas el 1-nov-2026)
- claude-projects: https://code.claude.com/docs/en/claude-projects
- agents (comparación de formas de trabajo en paralelo): https://code.claude.com/docs/en/agents
- sub-agents: https://code.claude.com/docs/en/sub-agents
- agent-teams: https://code.claude.com/docs/en/agent-teams
- cross-session-messaging: https://code.claude.com/docs/en/cross-session-messaging
- routines (tareas programadas en la nube): https://code.claude.com/docs/en/routines
- scheduled-tasks (comparación nube / escritorio / `/loop`): https://code.claude.com/docs/en/scheduled-tasks
- claude-code-on-the-web (sesiones en la nube, `--cloud`, seguridad, límites): https://code.claude.com/docs/en/claude-code-on-the-web
- desktop: https://code.claude.com/docs/en/desktop
- settings (qué se lee en sesiones en la nube): https://code.claude.com/docs/en/settings
- permission-modes: https://code.claude.com/docs/en/permission-modes
- hooks: https://code.claude.com/docs/en/hooks
- memory: https://code.claude.com/docs/en/memory
- costs: https://code.claude.com/docs/en/costs
- github-actions: https://code.claude.com/docs/en/github-actions
- remote-control: https://code.claude.com/docs/en/remote-control
- whats-new (novedades semanales hasta la semana 37): https://code.claude.com/docs/en/whats-new
- Anuncio «Projects redesigned» (17-sep-2026): https://claude.com/resources/articles/projects-redesigned
