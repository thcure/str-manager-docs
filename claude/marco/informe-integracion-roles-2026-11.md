# Dónde corren las sesiones de rol y cómo se unen al proyecto de claude.ai · Consultor de plataforma · 1-nov-2026

Etiquetas: **[fuente]** = documentación oficial consultada hoy (enlaces al final). **[análisis]** = inferencia mía. Solo lectura.

## 0. Aclaración previa
- [fuente] «Cowork» es otra cosa: un espacio de trabajo dentro de la aplicación de escritorio que trabaja con carpetas del computador. Un proyecto de Cowork **no es** un proyecto de claude.ai. Se le puede **vincular** uno para usar sus conocimientos, pero vincularlo no los fusiona (cowork/projects). Ojo: el artículo de soporte dice que los proyectos de Cowork se guardan en la cuenta; la guía dice que viven solo en el computador. Las dos fuentes se contradicen.
- [análisis] Los «chats de rol» de Carlos son, en realidad, **sesiones de Claude Code en la nube** adjuntas al proyecto de claude.ai: sus ids `session_`/`cse_` están en `destinatarios.json`, y el despertador les escribe con `claude -p --cloud`. Esta misma sesión es así: tiene adjunto el proyecto «Diseño y Desarrollo» y lee sus documentos. **No encontré página oficial** que documente ese adjunto.

## 1. Dónde crear cada rol
| Rol | Dónde | Por qué |
|---|---|---|
| **Interlocutor** | (a) Conversación en la aplicación, dentro del proyecto de claude.ai | [análisis] Habla con Carlos todo el tiempo y necesita los documentos, las instrucciones y la memoria del proyecto, que solo existen ahí. Deja la petición escrita en el repo, y eso enciende el motor |
| **Requisitos** | (b) Sesión de Claude Code **en la nube** que el motor lanza con `/fire` (tarea programada con disparador de API) | [fuente] Una sesión en la nube carga del repo `CLAUDE.md`, `.claude/agents`, `.claude/skills`, `.claude/rules` y los hooks (si tiene un solo repo), **y además** las skills activadas en la cuenta de claude.ai (cloud-environments). [análisis] Así tiene la skill de requerimientos de Carlos y el agente del repo. Carlos puede abrirla y contestar desde el móvil cuando haya que validar |
| **Desarrollo** (y Constructor) | (b) `claude-code-action` en GitHub Actions con `--agent desarrollo` | [análisis] No conversa con Carlos; conviene que sea repetible, con guardias como pasos del workflow y con identidad de bot. [fuente] El workflow acepta cualquier argumento de la CLI y carga las skills del repo después del checkout (github-actions) |
| **Verificador** | (b) `claude-code-action`, en una ejecución aparte y de solo lectura | [análisis] Así queda separado de quien construye («quien hace no aprueba»). Su veredicto queda como comentario en el PR |

Resultado: **(c) mixto**. Un rol conversacional en la aplicación y tres en Claude Code. Los une el **repo**.

## 2. Qué ve cada lado
| Elemento | Sesión de la aplicación en el proyecto de claude.ai | Sesión en la nube (`/fire`, claude.ai/code) | `claude-code-action` (Actions) |
|---|---|---|---|
| Repo `thcure/str-manager-docs` | Sí, como **fuente sincronizada** (copia para leer) [observado] | Sí, un clon fresco en cada ejecución [fuente] | Sí, el checkout [fuente] |
| Los 169 documentos del proyecto | Sí | **No** [análisis: ninguna página lo ofrece], salvo lo que ya esté en el repo | **No** |
| Instrucciones del proyecto | Sí | **No** | **No** |
| Memoria del proyecto de claude.ai | Sí | **No** | **No** |
| `.claude/agents`, hooks y skills del repo | **No** [análisis: la aplicación carga lo de «Customize», no el `.claude` del repo (cowork/overview)] | Sí [fuente] | Skills, sí; hooks, con la entrada `settings` [fuente]. Que lea `.claude/settings.json` sola no está verificado |
| Skills de la cuenta (Customize) | Sí | Sí [fuente] | No |
| Conectores (Gmail, Drive…) | Sí | Sí: son de la cuenta y en las tareas se eligen una por una [fuente: routines] | No; solo los servidores MCP que declare el workflow |
| Historial | Cada chat, por separado | Cada ejecución es una sesión nueva | El registro de la ejecución y los comentarios del PR |

**¿Projects de Claude Code (beta) une los dos mundos?** [fuente] **No.** Es un producto distinto, en claude.ai/code: un coordinador con hilos, con memoria e instrucciones propias. Los proyectos de claude.ai y de Cowork existentes «siguen funcionando como hoy» hasta que el rediseño llegue a ellos (claude-projects). El anuncio del 17-sep promete actualizarlos más adelante, sin fecha ni detalle de migración. Además, sus hilos **no** cargan las skills, los hooks ni los permisos del repo. [análisis] Hoy añadiría un tercer mundo.

## 3. Dónde lo ve Carlos
| Cosa | Interlocutor (aplicación) | Requisitos (nube) | Desarrollo y Verificador (Actions) |
|---|---|---|---|
| Lista | El proyecto «Diseño y Desarrollo» en la barra lateral | claude.ai/code → Sesiones, y el **Historial** de cada tarea en claude.ai/code/routines; también la pestaña Code del móvil [fuente] | GitHub → pestaña Actions, y el PR [fuente] |
| Panel | Ninguno propio | La página de detalle de cada tarea (correcta, fallida o cancelada) [fuente] | Los PR con su veredicto. [análisis] El panel que arme el motor (por ejemplo, el Panel STR) |
| Avisos | Los de la aplicación | Notificaciones al móvil cuando algo termina o la sesión lo espera [fuente: whats-new sem. 16] | Correo o aplicación de GitHub. [análisis] Mejor: que el motor envíe **un solo** aviso resumido |

## 4. Recomendación para no partir el sistema en dos
1. **Un solo hogar de la verdad: el repo** (que primero pase a privado). Todo lo que hoy vive solo en el proyecto de claude.ai (instrucciones, memoria, documentos que no están en GitHub) **se pasa al repo**: `CLAUDE.md`, `.claude/agents/`, `.claude/skills/` y `claude/`.
2. El proyecto de claude.ai queda como **ventana de Carlos**. Sus instrucciones se reducen a «lee el repo» (la fuente sincronizada) y su memoria guarda solo punteros. Así la aplicación y Claude Code leen lo mismo.
3. La skill de requerimientos se copia también al repo, para que la tenga Actions.
4. Solo **un** rol vive en la aplicación (Interlocutor). Los demás los lanza el motor; ningún rol depende de un chat.
5. Por ahora no usar Projects de Claude Code (beta) ni proyectos de Cowork para la fábrica. Revisar cuando el rediseño llegue al proyecto de claude.ai.
6. Primer paso pequeño: copiar las instrucciones del proyecto a `CLAUDE.md` y comprobar que una sesión en la nube y una ejecución de Actions las cumplen igual.

**No pude verificar:**
- la página oficial del adjunto «proyecto de claude.ai ↔ sesión de Claude Code» (solo lo observé);
- si una tarea en la nube puede llevar adjunto ese proyecto;
- si la aplicación lee el `.claude` de una carpeta de repo conectada;
- si `claude-code-action` lee `.claude/settings.json` sin la entrada `settings`;
- la contradicción sobre dónde viven los proyectos de Cowork;
- el plan de Carlos y cuándo le llegará el rediseño de Projects.

## Fuentes (1-nov-2026)
- https://code.claude.com/docs/en/cloud-environments (qué se lleva una sesión en la nube)
- https://code.claude.com/docs/en/claude-projects
- https://code.claude.com/docs/en/routines
- https://code.claude.com/docs/en/github-actions
- https://code.claude.com/docs/en/settings
- https://code.claude.com/docs/en/whats-new
- https://claude.com/docs/cowork/overview
- https://claude.com/docs/cowork/guide/projects
- https://support.claude.com/en/articles/14116274-organize-your-tasks-with-projects-in-claude-cowork
- https://claude.com/resources/articles/projects-redesigned
- Contexto: `claude/marco/informe-motor-cadena-2026-11.md`, `interno/destinatarios.json`
