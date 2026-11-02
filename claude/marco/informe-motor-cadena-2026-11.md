# Motor determinista de la cadena: dónde corre · Consultor de plataforma, 2.ª ronda · 1-nov-2026

Etiquetas: **[fuente]** = documentación oficial consultada hoy (§ 7). **[análisis]** = inferencia mía. Solo lectura: no cambié nada.

## 1. Respuesta corta
1. [análisis] El motor (máquina de estados, guardias y vigilancia) **no debe ser una sesión de Claude**: es un script sin modelo. Claude solo trabaja dentro de cada estado.
2. **Recomendación: el motor corre en GitHub Actions** (script Python, sin tokens de Claude). Las sesiones de rol se lanzan desde el mismo workflow con la acción oficial `claude-code-action` y `--agent <rol>`. LENOVO deja de ser el motor y pasa a ser un **trabajador** más, solo para lo que exige el equipo (Playwright, PHP).
3. Las rutinas (tareas programadas en la nube) quedan como **segunda línea**: vigilan que el motor siga vivo, con otra plataforma.
4. Primer paso: **motor en sombra**, solo cálculo, sin Claude y sin escribir en el repo (§ 5).

## 2. Lo que hay hoy [análisis]
La cola (`schtasks` cada 15 min, candado `.corriendo`, `claude -p` con hooks y juez), el despertador v12 (`claude -p --cloud <sesión>`, quietud, aviso de Windows) y `lo-que-me-toca.py` (AHORA, DESPUÉS y ESPERO por rol, **el núcleo del motor**, hoy corre a mano) ya forman un motor a medias: repartido en tres piezas y atado a LENOVO encendido.

## 3. Comparación de opciones
| Criterio | (a) Extender la cola de LENOVO | (b) GitHub Actions + `claude-code-action` | (b′) Actions de reloj + `/fire` de rutinas | (c) Rutina como motor | (d) PHP y cron en Hostinger |
|---|---|---|---|---|---|
| Cómo lanza un rol | `claude -p --agent <rol>` [fuente: cli-reference] | `claude_args: --agent <rol>`; `claude_args` acepta cualquier argumento de la CLI [fuente: github-actions]. No lo probé | POST a `/fire` de la rutina del rol, con `text` [fuente: routines]. Una rutina no recibe opciones de la CLI: el prompt invoca `@agent-<rol>` [fuente: sub-agents] | Lo mismo que (b′), pero quien decide es un modelo | Llama a `/fire` o a `workflow_dispatch`; Claude Code no corre ahí [análisis] |
| Hooks y permisos del repo | Sí, todos | Las skills de `.claude/skills` cargan tras el checkout, y la entrada `settings` acepta hooks [fuente]. **No verifiqué** que lea `.claude/settings.json` por sí sola. Además la guardia corre como **paso aparte del workflow**, fuera del modelo | Sí: en sesión de un solo repo se lee `.claude/settings.json` [fuente: settings]; los hooks del agente aplican mientras corre [fuente: sub-agents] | Igual que (b′) | No aplica |
| Con LENOVO apagado | **No** | Sí | Sí | Sí | Sí |
| Costo | Plan de Claude | Minutos de Actions: gratis en repo público; en privado, USD 12 al mes incluidos (≈2 000 min en Linux, cálculo mío) [fuente: billing]. Claude: token `setup-token` (un año) = consumo del plan, o clave de API [fuente: authentication] | Minutos de Actions (pocos) + plan de Claude | Plan de Claude en **cada** tic | Hosting ya pagado + plan de Claude |
| Límites | Los de Windows | Cron cada 5 min como mínimo, puede retrasarse o perder corridas con carga alta, solo en la rama principal [fuente: events]. Concurrencia: un run activo por grupo y cola de hasta 100 con `queue: max` [fuente: concurrency] | `/fire`: 30 por hora por rutina y 100 por hora por cuenta; cabecera beta experimental [fuente: routines] | Horario: **mínimo 1 h**; los disparadores de GitHub cubren PR, release e issue, **no push** [fuente: routines] | Intervalo del cron **no verificado** |
| Identidad en GitHub | Credenciales de LENOVO | **Claude GitHub App (bot)** si no se pasa `github_token` [fuente] | **Carlos**: commits y PR salen con su usuario [fuente: routines] | Carlos | El token que se guarde en el hosting |
| Fragilidad [análisis] | Alta: un solo equipo, PowerShell 5.1, sesión de claude.ai que vence | Media-baja: YAML visible y versionado. Ojo: lo que se hace con `GITHUB_TOKEN` no dispara workflows, y los bots se rechazan salvo con `allowed_bots` [fuente] | Media: API beta; el `text` llega como dato no confiable y el prompt tiene que aceptarlo [fuente] | Alta: motor no determinista y lento | Alta: secretos en el hosting de producción; otra pieza que mantener |

[análisis] Se descartan como motor: (c), porque un tic por hora no alcanza y un modelo no garantiza transiciones; (d), porque pone secretos en el servidor del negocio sin ventaja sobre (b); y (a), que queda solo como trabajador local.

**Elegir entre (b) y (b′) para lanzar roles** [análisis]: (b) da el bot como identidad (se distingue de Carlos y los avisos le llegan), guardias como pasos del workflow y un solo secreto. (b′) da una sesión que Carlos puede abrir y contestar desde el móvil, pero todo sale a su nombre. **Recomiendo (b) por defecto** y (b′) solo para roles conversacionales (Interlocutor), cuando se decida la opción A del modelo objetivo.

## 4. Diseño recomendado

### 4.1 Dónde vive el estado y cómo se evita la doble escritura
| Opción | Ventaja | Problema [análisis] |
|---|---|---|
| **Registro de eventos en el repo** (`eventos/AAAA-MM.jsonl`, solo se agrega) + estado derivado `fabrica/estado.json` | Un dato, una fuente; se audita en git; `lo-que-me-toca.py` ya lee JSON | Hay que serializar las escrituras |
| Issues o PR como estados (etiquetas) | Notifican a Carlos de forma nativa | Son un estado fuera de git; las etiquetas se pueden tocar a mano sin guardia |
| Base de datos en Hostinger | Transacciones | Otra fuente, en producción, y nada en la nube la ve |

**Recomendación [análisis]:** el estado vive en el repo. Hay **un solo escritor, el motor**, en un grupo de concurrencia `motor` con `queue: max`: nunca corren dos a la vez y los eventos esperan en orden [fuente: concurrency]. Las sesiones de rol **no escriben estado**: entregan en su rama o PR, y el motor valida la entrega y hace la transición. Segunda barrera: si el push del motor es rechazado porque la rama avanzó, el motor relee y reintenta. Los issues son solo **espejo** para Carlos: decisiones y escalamientos.

### 4.2 Ciclo del motor (un tic)
1. **Disparadores:** `push` a main (lo emite el bot de Claude, no `GITHUB_TOKEN`), `issues` (Carlos responde), `workflow_dispatch` y `schedule` cada 15 min para la vigilancia [fuente: events].
2. **Leer** eventos → **calcular** el estado con la lógica de `lo-que-me-toca.py` → elegir transiciones permitidas (tabla en `proceso.json`).
3. **Guardia de salida** (Python: `validar.py` y los criterios del proceso). Si no pasa, el ítem vuelve con su motivo; no avanza.
4. **Lanzar** el rol siguiente: job con `claude-code-action`, `--agent <rol>`, `--max-turns` y `timeout-minutes` [fuente]. Lo que necesita LENOVO queda en estado `espera-local` y la cola local lo toma.
5. **Escribir** el evento y el estado, y publicar `estado-operacion.json`.

### 4.3 Medir que la cadena opera y escalar a Carlos
- **Estado de operación** [análisis], calculado en cada tic desde los eventos: edad de cada ítem frente a su plazo (`proceso.json`), rechazos de guardia, ciclos por ítem, y tiempo de petición a aceptado. Semáforo verde, amarillo o rojo por rol y global.
- **Latido:** el motor escribe la hora de su último tic. Una **rutina horaria** (otra plataforma) comprueba que no tenga más de 1 h y, si la tiene, abre un issue de alarma. Así se vigila al vigilante.
- **Escalar:** issue asignado a Carlos con mención, etiquetas `decide-carlos` o `escala`. Llega a la bandeja, al correo y como aviso de GitHub Mobile [fuente: notifications]. [análisis] Debe crearlo el **bot**: si el actor es el propio Carlos (rutinas), no confirmé que GitHub le avise de sus propias acciones.
- Los avisos push de Claude al móvil exigen Remote Control o Dispatch, con el equipo encendido [fuente: mobile]: no sirven aquí.

### 4.4 Lo que Carlos haría con sus manos
| Opción | Una vez | Recurrente |
|---|---|---|
| (a) | Nada nuevo | Mantener LENOVO encendido y con sesión iniciada; renovar `/login` |
| **(b)** | Aprobar e instalar la Claude GitHub App en el repo; correr `claude setup-token` y pegar el token como secreto (`CLAUDE_CODE_OAUTH_TOKEN`); fusionar el PR del workflow | Renovar el token al año; responder issues `decide-carlos`; si el repo pasa a privado, vigilar los minutos |
| (b′) / (c) | Crear cada rutina en claude.ai/code/routines; copiar los tokens de `/fire` (se muestran **una sola vez**) | Reconectar GitHub si vence (la rutina se apaga a las 72 h) [fuente: routines] |

## 5. Primer paso pequeño y reversible: «motor en sombra»
1. Workflow `motor-sombra.yml` con `schedule` cada 15 min y `workflow_dispatch`. Solo Python, **sin Claude ni secretos**: corre `lo-que-me-toca.py todos --json` y un cálculo de semáforo.
2. Escribe solo en el resumen del run, nunca en el repo, y no avisa a nadie. Durante 7 días se compara con `buzon\v12\buzon.log`: ¿detecta lo mismo y a tiempo?
3. Vuelta atrás: borrar el archivo. Costo: cero con el repo público.
4. Si coincide: paso 2, el Verificador lanzado por el motor con un PR etiquetado `verificar`. Paso 3: el motor pasa a ser el único escritor del estado.
- Lo crítico (secreto de Claude, identidad del bot, repo privado) entra como DA-n con cruce con Carlos antes del paso 2.

## 6. Lo que no pude verificar
- Si `claude-code-action` carga sola `.claude/settings.json` (hooks), `.claude/agents` y `CLAUDE.md` del checkout. La documentación solo lo dice de las skills y de `.mcp.json`. Mitigación: pasar `settings` explícito y probarlo.
- Que `--agent` funcione dentro de `claude_args` (la documentación dice «cualquier argumento»; no lo probé).
- El plan de Carlos y cuánto consume una sesión de rol, en minutos de runner y en uso del plan.
- Si GitHub notifica a Carlos de acciones hechas con su propia identidad.
- El límite de sesiones en la nube simultáneas en Pro o Max (la documentación solo lo menciona para organizaciones).
- El cron de Hostinger: intervalo mínimo, límite de ejecución y salidas HTTPS. Su guía no lo dice.
- Si el repo sigue público.

## 7. Fuentes (consultadas el 1-nov-2026)
- routines: https://code.claude.com/docs/en/routines
- github-actions: https://code.claude.com/docs/en/github-actions
- cli-reference: https://code.claude.com/docs/en/cli-reference
- claude-code-on-the-web: https://code.claude.com/docs/en/claude-code-on-the-web
- settings (cloud sessions): https://code.claude.com/docs/en/settings
- authentication (setup-token): https://code.claude.com/docs/en/authentication
- sub-agents: https://code.claude.com/docs/en/sub-agents
- mobile: https://code.claude.com/docs/en/mobile
- configuración de claude-code-action: https://github.com/anthropics/claude-code-action/blob/main/docs/configuration.md
- events: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows
- concurrency: https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency
- billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
- notifications: https://docs.github.com/en/subscriptions-and-notifications/concepts/about-notifications
- Hostinger cron: https://www.hostinger.com/support/1583465-how-to-set-up-a-cron-job-at-hostinger/
