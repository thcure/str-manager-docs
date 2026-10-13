# ADR-010 — El conocimiento vive fuera de Claude: arranque desde el servicio, agentes por proyecto, paralelismo y política de memoria

**Fecha:** 2026-10-13 · **Estado:** aceptada por Carlos el 13-oct-2026 · **Autor:** Chat Arquitecto · **COBIT:** BAI08 (pasa a ok), DSS04, APO12.
Análisis completo: `claude/marco/adr-conocimiento-y-agentes-2026-10.md` y `claude/marco/memoria-y-depuracion-2026-10.md`. Este archivo es el registro de la decisión.

## Contexto
Un chat tiene memoria finita y se compacta; un chat de Cowork lo abre una persona; el plan de Claude tiene cupo por cuenta (S-arq-21); la API cobra por uso y no recuerda; Hostinger no corre la CLI; hay una sola cola en LENOVO.

## Decisión
1. **Registro oficial = servicio del modelo; conocimiento = repos.** Claude, en cualquier forma (chat, CLI, tarea, agente por API), es un ejecutor sin memoria propia: arranca cargándose del servicio y termina escribiendo en él. Lo que no está en el servicio o en un repo es descartable. La memoria automática del proyecto de claude.ai es apoyo, no fuente.
2. **Paquete de arranque** `GET /fabrica/api/arranque?rol=…&proyecto=…` (≤ 15 000 caracteres): encargo, reglas, estado del proyecto, memoria de trabajo, mensajes pendientes, lecciones del rol. Lo usan chats (una línea de Carlos), la CLI (hook `SessionStart`) y agentes por API (primer mensaje).
3. **Memoria de trabajo por rol y proyecto** en el servicio (≤ 2 000 caracteres): cada chat la escribe al cerrar la jornada, en un relevo o antes de compactar.
4. **Roles de la fábrica, instancias por proyecto:** un chat o corrida nace atada a un proyecto; no hay un rol «para todos los proyectos». Comparten encargo, plantillas, lecciones, guardas y paquete de arranque.
5. **Agentes por API** desde cron de Hostinger solo para lo rutinario (revisor previo, informe de avance, mensajes simples, comunicaciones); nunca pasan puertas ni cruzan críticos; presupuesto por proyecto con contador. Primer agente: el revisor previo.
6. **Hostinger = oficina y archivo** (servicio, app, cron, despertador en PHP, webhooks, respaldo, correo, ambientes); **LENOVO = taller** (cola con la CLI, juez con navegador, perfiles).
7. **Paralelismo:** chats por proyecto en paralelo; construcción una a la vez por cola (dos colas con dos equipos); carriles por proyecto en la cola con un lote en vuelo por proyecto y prioridad del portafolio; el cupo del plan y el gasto de API se miden y avisan al 80 %.
8. **Política de memoria y depuración:** los chats son sesiones (relevo por tamaño: dos compactaciones o una semana); retención: buzón vivo + 30 días (lo demás al servicio), situaciones hasta la consolidación mensual, logs de la cola 60 días, capturas 14 días (si aceptado), `hechas\` 90 días, documentos superados a `claude/archivo/`, `evento` y proyectos cerrados permanentes. Métrica de salud de la memoria en el portafolio.

## Consecuencias
Lotes K1–K6 (memoria de trabajo y arranque; hook y plantilla de arranque; despertador en PHP; cola v8 con carriles; agente revisor previo; contador de cupo y gasto), después de la migración y de B7-6. Encargos: cada rol suma «arranca con el paquete de arranque» y «cierra escribiendo tu memoria de trabajo».
